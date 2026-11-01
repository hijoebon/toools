import assert from "node:assert/strict";
import test from "node:test";
import { readFile, readdir } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { Client } from "pg";
import { CLOUD_RECOVERY_NOT_BEFORE, CLOUD_RECOVERY_TARGET } from "./cloud-recovery";
import { CloudDatabaseError, createCloudDatabase, type CloudDatabaseStage, type RecoveryDatabaseConnection } from "./cloud-database";

const production = `postgresql://neondb_owner:dummy-test-password@${CLOUD_RECOVERY_TARGET.pooledHostname}/neondb?sslmode=require`;
const branchName = "recovery-validation-dummy-run-123";
const branchId = "br-validation-owned";
const hostname = "ep-validation-owned.c-3.us-west-2.aws.neon.tech";
const isolated = `postgresql://neondb_owner:dummy-test-password@${hostname}/neondb?sslmode=require`;

function mockApi(options: { lostCreate?: boolean; wrongParent?: boolean; badUri?: boolean; failedOperation?: boolean; cleanupFail?: boolean; connectionUri?: string } = {}) {
  let created = false;
  let deleted = false;
  let deletes = 0;
  const mutations: { path: string; method: string; body: Record<string, unknown> }[] = [];
  const branch = () => ({ id: branchId, project_id: CLOUD_RECOVERY_TARGET.projectId,
    parent_id: options.wrongParent ? "br-other-parent" : CLOUD_RECOVERY_TARGET.branchId,
    name: branchName, default: false, protected: false });
  const response = (value: unknown, status = 200) => new Response(JSON.stringify(value), { status });
  const fetcher: typeof fetch = async (input, init) => {
    const url = new URL(String(input));
    assert.equal(url.hostname, "console.neon.tech");
    assert.ok(url.pathname.startsWith(`/api/v2/projects/${CLOUD_RECOVERY_TARGET.projectId}/`));
    const path = url.pathname.slice(`/api/v2/projects/${CLOUD_RECOVERY_TARGET.projectId}`.length);
    const method = init?.method ?? "GET";
    if (method !== "GET") mutations.push({ path, method, body: init?.body ? JSON.parse(String(init.body)) : {} });
    if (path === "/branches" && method === "POST") {
      created = true;
      if (options.lostCreate) throw new Error("dummy request failure containing private data");
      return response({ branch: branch(), endpoints: [{ id: "ep-validation-owned", project_id: CLOUD_RECOVERY_TARGET.projectId,
        branch_id: branchId, host: hostname, autoscaling_limit_min_cu: 0.25, autoscaling_limit_max_cu: 0.25, suspend_timeout_seconds: 0 }],
      operations: [{ id: "op-branch", status: options.failedOperation ? "failed" : "finished" }] });
    }
    if (path === "/branches" && method === "GET") return response({ branches: created && !deleted ? [branch()] : [] });
    if (path === `/branches/${branchId}` && method === "GET") return response({ branch: branch() });
    if (path === `/branches/${branchId}` && method === "DELETE") {
      deletes++;
      if (options.cleanupFail) return response({ error: "dummy private error" }, 500);
      deleted = true;
      return response({ operations: [] });
    }
    if (path === "/connection_uri") {
      assert.equal(url.searchParams.get("branch_id"), branchId);
      assert.equal(url.searchParams.get("endpoint_id"), "ep-validation-owned");
      assert.equal(url.searchParams.get("pooled"), "false");
      assert.equal(url.searchParams.get("role_name"), "neondb_owner");
      return response({ uri: options.badUri ? production : options.connectionUri ?? isolated });
    }
    throw new Error("unexpected mock request");
  };
  return { fetcher, mutations, state: () => ({ created, deleted, deletes }) };
}

async function pgFixture() {
  const postgres = new PGlite();
  const migrations = (await readdir("prisma/migrations", { withFileTypes: true })).filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort();
  // Populate the pre-receipt production-like schema first. The injected migrate
  // step below applies the actual pending receipt SQL, never a schema replica.
  for (const migration of migrations.filter((name) => !name.includes("add_metric_receipts"))) {
    await postgres.exec(await readFile(`prisma/migrations/${migration}/migration.sql`, "utf8"));
  }
  await postgres.exec(`
    INSERT INTO "Category" (id,name,slug) VALUES ('image-category','Image & Media','image-media');
    INSERT INTO "Tag" (id,name,slug) VALUES ('tag-ai','AI','ai'),('tag-image','Image Editing','image-editing');
    INSERT INTO "Tool" (id,name,slug,tagline,description,url,"categoryId","viewCount","clickCount","updatedAt")
      VALUES ('existing-manga','Existing','mangatranslate','Existing','Existing','https://www.mangatranslate.com/',
       'image-category',17,9,'2026-10-01');
  `);
  // PGlite currently lacks this server concurrency primitive. It remains in the
  // reviewed SQL and executes normally on the actual temporary Neon branch.
  await postgres.exec("CREATE OR REPLACE FUNCTION pg_advisory_xact_lock(bigint) RETURNS void LANGUAGE SQL AS 'SELECT';");
  let closed = 0;
  const connection: RecoveryDatabaseConnection = {
    query: async (sql, values = []) => {
      const result = await postgres.query<Record<string, unknown>>(sql, values);
      return { rows: result.rows, rowCount: result.affectedRows ?? null };
    },
    execute: async (sql) => { await postgres.exec(sql); },
    close: async () => { closed++; },
  };
  const migrated: string[] = [];
  const migrate = async (url: string) => {
    migrated.push(url);
    const pending = migrations.filter((name) => name.includes("add_metric_receipts"));
    for (const migration of pending) await postgres.exec(await readFile(`prisma/migrations/${migration}/migration.sql`, "utf8"));
  };
  return { postgres, connection, migrate, migrated, closed: () => closed };
}

function hasCode(code: string) {
  return (error: unknown) => error instanceof CloudDatabaseError && error.code === code && error.message === code;
}

test("the isolated branch runs the actual pending migration, repeats publication and deduplicates metric receipts", async () => {
  const fixture = await pgFixture();
  const api = mockApi();
  const stages: CloudDatabaseStage[] = [];
  try {
    await createCloudDatabase({ fetcher: api.fetcher, now: () => CLOUD_RECOVERY_NOT_BEFORE,
      connect: async (url) => { assert.equal(url, isolated); return fixture.connection; }, migrate: fixture.migrate,
      randomId: () => "dummy-event-run", report: (stage) => { stages.push(stage); },
    }).validateOnTemporaryBranch({ databaseUrl: production, neonApiKey: "dummy-neon-key", branchName });
    assert.deepEqual(fixture.migrated, [isolated]);
    assert.deepEqual(api.state(), { created: true, deleted: true, deletes: 1 });
    assert.equal(fixture.closed(), 1);
    assert.deepEqual((await fixture.postgres.query('SELECT "viewCount", "clickCount" FROM "Tool" WHERE id = $1', ["existing-manga"])).rows, [{ viewCount: 19, clickCount: 10 }]);
    assert.equal((await fixture.postgres.query<{ count: number }>('SELECT count(*)::integer AS count FROM "ToolMetricReceipt"')).rows[0].count, 3);
    assert.deepEqual(stages, ["validation_branch_created", "validation_migrations_complete", "validation_sql_idempotent", "validation_metrics_idempotent", "validation_branch_deleted"]);
    assert.deepEqual(api.mutations[0].body, { branch: { parent_id: CLOUD_RECOVERY_TARGET.branchId, name: branchName }, endpoints: [{
      type: "read_write", autoscaling_limit_min_cu: 0.25, autoscaling_limit_max_cu: 0.25, suspend_timeout_seconds: 0,
    }] });
    assert.ok(api.mutations.every((entry) => !entry.path.includes(CLOUD_RECOVERY_TARGET.branchId)));
  } finally { await fixture.postgres.close(); }
});

test("production uses direct migrate deploy and publication without synthetic metric writes", async () => {
  const fixture = await pgFixture();
  const stages: CloudDatabaseStage[] = [];
  try {
    const result = await createCloudDatabase({ now: () => CLOUD_RECOVERY_NOT_BEFORE,
      migrate: fixture.migrate, connect: async (url) => { assert.equal(new URL(url).hostname, CLOUD_RECOVERY_TARGET.hostname); return fixture.connection; },
      fetcher: async () => { throw new Error("production migration must not call the management API"); }, report: (stage) => { stages.push(stage); },
    }).migrateAndPublishProduction({ databaseUrl: production });
    assert.deepEqual(result, { toolId: "existing-manga", slug: "mangatranslate" });
    assert.deepEqual(stages, ["production_migrations_complete", "production_sql_published"]);
    assert.deepEqual((await fixture.postgres.query('SELECT "viewCount", "clickCount" FROM "Tool" WHERE id = $1', ["existing-manga"])).rows, [{ viewCount: 17, clickCount: 9 }]);
    assert.deepEqual((await fixture.postgres.query('SELECT count(*)::integer AS count FROM "ToolMetricReceipt"')).rows, [{ count: 0 }]);
    assert.equal(fixture.closed(), 1);
  } finally { await fixture.postgres.close(); }
});

test("the recovery connection enforces verified Neon TLS when the API URI has no sslmode", async (t) => {
  const api = mockApi({ connectionUri: isolated.replace("?sslmode=require", "") });
  let parameters: { ssl: unknown; host: string; connect_timeout: number; statement_timeout: number } | undefined;
  t.mock.method(Client.prototype, "connect", async function (this: Client) {
    parameters = (this as unknown as { connectionParameters: NonNullable<typeof parameters> }).connectionParameters;
    // No real socket is opened. Capture the driver's effective parsed options,
    // then exercise the normal safe failure and temporary-branch cleanup path.
    throw new Error("Offline connection test");
  });
  t.mock.method(Client.prototype, "end", async () => {});
  await assert.rejects(createCloudDatabase({ fetcher: api.fetcher, now: () => CLOUD_RECOVERY_NOT_BEFORE,
    migrate: async () => {},
  }).validateOnTemporaryBranch({ databaseUrl: production, neonApiKey: "dummy-neon-key", branchName }), hasCode("database_connection_failed"));
  assert.ok(parameters);
  assert.deepEqual(parameters.ssl, { rejectUnauthorized: true });
  assert.equal(parameters.host, hostname);
  assert.equal(parameters.connect_timeout, 20);
  assert.equal(parameters.statement_timeout, 120_000);
  assert.deepEqual(api.state(), { created: true, deleted: true, deletes: 1 });
});

test("a lost branch creation response is reconciled by the exact run-owned name and cleaned up", async () => {
  const api = mockApi({ lostCreate: true });
  let migrations = 0;
  await assert.rejects(createCloudDatabase({ fetcher: api.fetcher, now: () => CLOUD_RECOVERY_NOT_BEFORE,
    migrate: async () => { migrations++; },
  }).validateOnTemporaryBranch({ databaseUrl: production, neonApiKey: "dummy-neon-key", branchName }), hasCode("neon_request_outcome_unknown"));
  assert.deepEqual(api.state(), { created: true, deleted: true, deletes: 1 });
  assert.equal(migrations, 0);
});

test("migration failure still deletes only the branch created by this run", async () => {
  const api = mockApi();
  await assert.rejects(createCloudDatabase({ fetcher: api.fetcher, now: () => CLOUD_RECOVERY_NOT_BEFORE,
    migrate: async () => { throw new Error("private driver message dummy-test-password"); },
  }).validateOnTemporaryBranch({ databaseUrl: production, neonApiKey: "dummy-neon-key", branchName }), hasCode("isolated_database_validation_failed"));
  assert.deepEqual(api.state(), { created: true, deleted: true, deletes: 1 });
});

test("a failed branch operation is not treated as a usable database", async () => {
  const api = mockApi({ failedOperation: true });
  await assert.rejects(createCloudDatabase({ fetcher: api.fetcher, now: () => CLOUD_RECOVERY_NOT_BEFORE,
    migrate: async () => { throw new Error("must not migrate"); },
  }).validateOnTemporaryBranch({ databaseUrl: production, neonApiKey: "dummy-neon-key", branchName }), hasCode("neon_operation_failed"));
  assert.equal(api.state().deleted, true);
});

test("a connection URI pointing back at production is rejected before any migration", async () => {
  const api = mockApi({ badUri: true });
  let migrations = 0;
  await assert.rejects(createCloudDatabase({ fetcher: api.fetcher, now: () => CLOUD_RECOVERY_NOT_BEFORE,
    migrate: async () => { migrations++; },
  }).validateOnTemporaryBranch({ databaseUrl: production, neonApiKey: "dummy-neon-key", branchName }), hasCode("validation_connection_uri_invalid"));
  assert.equal(api.state().deleted, true);
  assert.equal(migrations, 0);
});

test("cleanup refuses to delete an identically named branch with a different parent", async () => {
  const api = mockApi({ wrongParent: true });
  await assert.rejects(createCloudDatabase({ fetcher: api.fetcher, now: () => CLOUD_RECOVERY_NOT_BEFORE })
    .validateOnTemporaryBranch({ databaseUrl: production, neonApiKey: "dummy-neon-key", branchName }), hasCode("validation_cleanup_failed"));
  assert.equal(api.state().deletes, 0);
});

test("cleanup failure is reported rather than pretending the temporary branch was deleted", async () => {
  const api = mockApi({ failedOperation: true, cleanupFail: true });
  await assert.rejects(createCloudDatabase({ fetcher: api.fetcher, now: () => CLOUD_RECOVERY_NOT_BEFORE })
    .validateOnTemporaryBranch({ databaseUrl: production, neonApiKey: "dummy-neon-key", branchName }), hasCode("validation_cleanup_failed"));
  assert.equal(api.state().deleted, false);
});

test("all standalone database mutations are guarded before November 1", async () => {
  let requests = 0;
  let migrations = 0;
  const database = createCloudDatabase({ now: () => CLOUD_RECOVERY_NOT_BEFORE - 1,
    fetcher: async () => { requests++; throw new Error("must not call"); }, migrate: async () => { migrations++; },
  });
  await assert.rejects(database.validateOnTemporaryBranch({ databaseUrl: production, neonApiKey: "dummy-neon-key", branchName }), hasCode("recovery_not_due"));
  await assert.rejects(database.migrateAndPublishProduction({ databaseUrl: production }), hasCode("recovery_not_due"));
  await assert.rejects(database.cleanupTemporaryBranch({ neonApiKey: "dummy-neon-key", branchName }), hasCode("recovery_not_due"));
  assert.equal(requests, 0);
  assert.equal(migrations, 0);
});

test("invalid production targets cannot create branches or migrate another database", async () => {
  const database = createCloudDatabase({ now: () => CLOUD_RECOVERY_NOT_BEFORE,
    fetcher: async () => { throw new Error("must not call"); }, migrate: async () => { throw new Error("must not migrate"); },
  });
  await assert.rejects(database.validateOnTemporaryBranch({ databaseUrl: production.replace(CLOUD_RECOVERY_TARGET.pooledHostname, "other.example"), neonApiKey: "dummy-neon-key", branchName }), hasCode("database_target_mismatch"));
});
