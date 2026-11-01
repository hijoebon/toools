import { randomUUID } from "node:crypto";
import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { promisify } from "node:util";
import { Client } from "pg";
import type { Prisma } from "@prisma/client";
import { applyToolMetricBatch, type MetricDatabase } from "../../src/lib/tool-metric-batches";
import type { ToolMetricEvent } from "../../src/lib/metric-event";
import { pgPoolConfig } from "../../src/lib/database-url";
import { CLOUD_RECOVERY_NOT_BEFORE, CLOUD_RECOVERY_TARGET } from "./cloud-recovery";
import { verifyIssue9Database } from "./cloud-publication";

const executeFile = promisify(execFile);
type Json = Record<string, unknown>;
type Operation = { id: string; status: string };

export class CloudDatabaseError extends Error {
  constructor(readonly code: string, readonly httpStatus?: number) {
    super(code);
    this.name = "CloudDatabaseError";
  }
}

export interface RecoveryDatabaseConnection {
  query: (sql: string, values?: unknown[]) => Promise<{ rows: Json[]; rowCount: number | null }>;
  execute: (sql: string) => Promise<void>;
  close: () => Promise<void>;
}

export type CloudDatabaseStage = "validation_branch_created" | "validation_migrations_complete"
  | "validation_sql_idempotent" | "validation_metrics_idempotent" | "validation_branch_deleted"
  | "production_migrations_complete" | "production_sql_published";

export type CloudDatabaseReport = (stage: CloudDatabaseStage, details?: { branchId: string; branchName: string }) => void;

export interface CloudDatabaseDependencies {
  fetcher?: typeof fetch;
  connect?: (databaseUrl: string) => Promise<RecoveryDatabaseConnection>;
  migrate?: (directDatabaseUrl: string) => Promise<void>;
  loadPublicationSql?: () => Promise<string>;
  now?: () => number;
  randomId?: () => string;
  sleep?: (milliseconds: number) => Promise<void>;
  report?: CloudDatabaseReport;
  operationTimeoutMs?: number;
}

export interface TemporaryValidationInput {
  databaseUrl: string;
  neonApiKey: string;
  /** Optional deterministic name so an always() cloud step can clean up. */
  branchName?: string;
}

function object(value: unknown): Json {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new CloudDatabaseError("invalid_neon_response");
  return value as Json;
}

function productionUrl(value: string): URL {
  try {
    const url = new URL(value);
    if (!["postgres:", "postgresql:"].includes(url.protocol)
      || ![String(CLOUD_RECOVERY_TARGET.hostname), String(CLOUD_RECOVERY_TARGET.pooledHostname)].includes(url.hostname)
      || decodeURIComponent(url.username) !== CLOUD_RECOVERY_TARGET.role
      || url.pathname !== `/${CLOUD_RECOVERY_TARGET.database}` || !url.password
      || url.port && url.port !== "5432") throw new Error();
    url.hostname = CLOUD_RECOVERY_TARGET.hostname;
    return url;
  } catch { throw new CloudDatabaseError("database_target_mismatch"); }
}

function validationName(value: string) {
  if (!/^recovery-validation-[a-z0-9-]{1,100}$/.test(value)) throw new CloudDatabaseError("invalid_validation_branch_name");
  return value;
}

function ownedBranch(value: unknown, name: string): Json {
  const branch = object(value);
  if (typeof branch.id !== "string" || !/^br-[a-z0-9-]+$/.test(branch.id)
    || branch.id === CLOUD_RECOVERY_TARGET.branchId || branch.project_id !== CLOUD_RECOVERY_TARGET.projectId
    || branch.parent_id !== CLOUD_RECOVERY_TARGET.branchId || branch.name !== name
    || branch.default !== false || branch.protected !== false) throw new CloudDatabaseError("validation_branch_identity_mismatch");
  return branch;
}

async function connectPostgres(databaseUrl: string): Promise<RecoveryDatabaseConnection> {
  const client = new Client({ ...pgPoolConfig(databaseUrl), connectionTimeoutMillis: 20_000, statement_timeout: 120_000 });
  try { await client.connect(); } catch { await client.end().catch(() => {}); throw new CloudDatabaseError("database_connection_failed"); }
  return {
    query: async (sql, values = []) => {
      const result = await client.query(sql, values);
      return { rows: result.rows as Json[], rowCount: result.rowCount };
    },
    execute: async (sql) => { await client.query(sql); },
    close: async () => { await client.end(); },
  };
}

async function deployMigrations(directDatabaseUrl: string): Promise<void> {
  try {
    // Prisma's deployment history is authoritative, including on the clone.
    // No reset, db push, baseline fabrication, or full seed is performed.
    await executeFile(process.execPath, [resolve("node_modules/prisma/build/index.js"), "migrate", "deploy"], {
      cwd: process.cwd(), env: { ...process.env, DATABASE_URL: directDatabaseUrl, DIRECT_URL: directDatabaseUrl, NO_COLOR: "1", PRISMA_HIDE_UPDATE_MESSAGE: "1" },
      timeout: 180_000, maxBuffer: 8 * 1024 * 1024,
    });
  } catch { throw new CloudDatabaseError("database_migration_failed"); }
}

function metricDatabase(connection: RecoveryDatabaseConnection): MetricDatabase {
  return {
    transaction: async (run) => {
      await connection.execute("BEGIN");
      try {
        const result = await run({
          query: async <T>(query: Prisma.Sql) => (await connection.query(query.text, query.values)).rows as T[],
          execute: async (query) => (await connection.query(query.text, query.values)).rowCount ?? 0,
        });
        await connection.execute("COMMIT");
        return result;
      } catch (error) {
        await connection.execute("ROLLBACK").catch(() => {});
        throw error;
      }
    },
  };
}

async function readToolCounters(connection: RecoveryDatabaseConnection) {
  const { rows } = await connection.query('SELECT id, "viewCount", "clickCount", "updatedAt" FROM "Tool" WHERE slug = $1', ["mangatranslate"]);
  if (rows.length > 1) throw new CloudDatabaseError("publication_counter_identity_mismatch");
  const row = rows[0];
  if (row && (typeof row.id !== "string" || !Number.isInteger(row.viewCount) || !Number.isInteger(row.clickCount))) {
    throw new CloudDatabaseError("publication_counter_response_invalid");
  }
  return row;
}

export function createCloudDatabase(dependencies: CloudDatabaseDependencies = {}) {
  const fetcher = dependencies.fetcher ?? fetch;
  const connect = dependencies.connect ?? connectPostgres;
  const migrate = dependencies.migrate ?? deployMigrations;
  const loadSql = dependencies.loadPublicationSql ?? (() => readFile(resolve("scripts/approve-issue-9.sql"), "utf8"));
  const now = dependencies.now ?? Date.now;
  const pause = dependencies.sleep ?? ((milliseconds) => new Promise<void>((resolve) => setTimeout(resolve, milliseconds)));
  const operationTimeout = dependencies.operationTimeoutMs ?? 180_000;
  const report = dependencies.report ?? (() => {});

  function requireDue() {
    if (now() < CLOUD_RECOVERY_NOT_BEFORE) throw new CloudDatabaseError("recovery_not_due");
  }

  async function api(apiKey: string, path: string, init: RequestInit = {}): Promise<Json> {
    let response: Response;
    try {
      response = await fetcher(`https://console.neon.tech/api/v2/projects/${CLOUD_RECOVERY_TARGET.projectId}${path}`, {
        ...init, headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        redirect: "error", signal: AbortSignal.timeout(30_000),
      });
    } catch { throw new CloudDatabaseError("neon_request_outcome_unknown"); }
    if (response.status === 204) return {};
    let data: unknown;
    try { data = await response.json(); } catch { throw new CloudDatabaseError("invalid_neon_response", response.status); }
    if (!response.ok) throw new CloudDatabaseError(response.status === 404 ? "neon_resource_not_found" : "neon_request_failed", response.status);
    return object(data);
  }

  async function waitOperations(apiKey: string, values: unknown): Promise<void> {
    if (!Array.isArray(values)) throw new CloudDatabaseError("invalid_neon_operation_response");
    let operations = values.map((entry) => object(entry) as Operation);
    const deadline = now() + operationTimeout;
    while (true) {
      if (operations.some((entry) => typeof entry.id !== "string" || typeof entry.status !== "string")) throw new CloudDatabaseError("invalid_neon_operation_response");
      if (operations.some((entry) => ["error", "failed", "cancelled"].includes(entry.status))) throw new CloudDatabaseError("neon_operation_failed");
      if (operations.every((entry) => ["finished", "skipped"].includes(entry.status))) return;
      if (now() >= deadline) throw new CloudDatabaseError("neon_operation_pending");
      await pause(3000);
      operations = await Promise.all(operations.map(async (entry) => {
        const response = await api(apiKey, `/operations/${encodeURIComponent(entry.id)}`);
        const updated = object(response.operation ?? response);
        if (updated.id !== entry.id) throw new CloudDatabaseError("invalid_neon_operation_response");
        return updated as Operation;
      }));
    }
  }

  async function findOwnedBranch(apiKey: string, name: string): Promise<Json | undefined> {
    let cursor: string | undefined;
    const visited = new Set<string>();
    let found: Json | undefined;
    do {
      const response = await api(apiKey, `/branches?limit=1000${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""}`);
      if (!Array.isArray(response.branches)) throw new CloudDatabaseError("invalid_neon_branch_list");
      for (const candidate of response.branches) {
        if (object(candidate).name !== name) continue;
        if (found) throw new CloudDatabaseError("ambiguous_validation_branch");
        found = ownedBranch(candidate, name);
      }
      const pagination = response.pagination ? object(response.pagination) : {};
      cursor = response.branches.length && typeof pagination.cursor === "string" && pagination.cursor ? pagination.cursor : undefined;
      if (cursor && visited.has(cursor)) throw new CloudDatabaseError("invalid_neon_branch_pagination");
      if (cursor) visited.add(cursor);
    } while (cursor);
    return found;
  }

  async function deleteOwnedBranch(apiKey: string, branch: Json, name: string) {
    const candidate = ownedBranch(branch, name);
    const id = String(candidate.id);
    // Re-read identity immediately before deletion, rather than trusting a
    // caller-provided ID or the old creation response.
    let current: Json;
    try { current = object((await api(apiKey, `/branches/${encodeURIComponent(id)}`)).branch); }
    catch (error) { if (error instanceof CloudDatabaseError && error.code === "neon_resource_not_found") return; throw error; }
    ownedBranch(current, name);
    const deleted = await api(apiKey, `/branches/${encodeURIComponent(id)}`, { method: "DELETE" });
    if (deleted.operations) await waitOperations(apiKey, deleted.operations);
    report("validation_branch_deleted", { branchId: id, branchName: name });
  }

  return {
    async cleanupTemporaryBranch({ neonApiKey, branchName }: { neonApiKey: string; branchName: string }): Promise<void> {
      requireDue();
      validationName(branchName);
      if (!neonApiKey) throw new CloudDatabaseError("missing_neon_api_key");
      try {
        const branch = await findOwnedBranch(neonApiKey, branchName);
        if (branch) await deleteOwnedBranch(neonApiKey, branch, branchName);
      } catch (error) { if (error instanceof CloudDatabaseError) throw error; throw new CloudDatabaseError("validation_cleanup_failed"); }
    },

    async validateOnTemporaryBranch(input: TemporaryValidationInput): Promise<void> {
      requireDue();
      productionUrl(input.databaseUrl);
      if (!input.neonApiKey) throw new CloudDatabaseError("missing_neon_api_key");
      const name = validationName(input.branchName ?? `recovery-validation-${(dependencies.randomId ?? randomUUID)().toLowerCase()}`);
      let created: Json | undefined;
      let creationAttempted = false;
      let connection: RecoveryDatabaseConnection | undefined;
      try {
        // No expiry field: Neon's expires_at is Early Access, not guaranteed on
        // Free. finally + the exported exact-name cleanup provide reclamation.
        creationAttempted = true;
        const response = await api(input.neonApiKey, "/branches", {
          method: "POST", body: JSON.stringify({
            branch: { parent_id: CLOUD_RECOVERY_TARGET.branchId, name },
            endpoints: [{ type: "read_write", autoscaling_limit_min_cu: 0.25, autoscaling_limit_max_cu: 0.25, suspend_timeout_seconds: 0 }],
          }),
        });
        created = ownedBranch(response.branch, name);
        report("validation_branch_created", { branchId: String(created.id), branchName: name });
        await waitOperations(input.neonApiKey, response.operations);
        if (!Array.isArray(response.endpoints) || response.endpoints.length !== 1) throw new CloudDatabaseError("validation_endpoint_identity_mismatch");
        const endpoint = object(response.endpoints[0]);
        if (endpoint.branch_id !== created.id || endpoint.project_id !== CLOUD_RECOVERY_TARGET.projectId
          || typeof endpoint.id !== "string" || typeof endpoint.host !== "string"
          || endpoint.host === CLOUD_RECOVERY_TARGET.hostname || !/^ep-[a-z0-9-]+\.[a-z0-9.-]+\.neon\.tech$/.test(endpoint.host)
          || endpoint.autoscaling_limit_min_cu !== 0.25 || endpoint.autoscaling_limit_max_cu !== 0.25
          || ![0, 300].includes(Number(endpoint.suspend_timeout_seconds))) throw new CloudDatabaseError("validation_endpoint_identity_mismatch");
        const query = new URLSearchParams({ branch_id: String(created.id), endpoint_id: endpoint.id,
          database_name: CLOUD_RECOVERY_TARGET.database, role_name: CLOUD_RECOVERY_TARGET.role, pooled: "false" });
        const connectionResponse = await api(input.neonApiKey, `/connection_uri?${query}`);
        if (typeof connectionResponse.uri !== "string") throw new CloudDatabaseError("validation_connection_uri_invalid");
        const url = new URL(connectionResponse.uri);
        if (!["postgres:", "postgresql:"].includes(url.protocol) || url.hostname !== endpoint.host
          || decodeURIComponent(url.username) !== CLOUD_RECOVERY_TARGET.role || url.pathname !== `/${CLOUD_RECOVERY_TARGET.database}` || !url.password) {
          throw new CloudDatabaseError("validation_connection_uri_invalid");
        }
        await migrate(url.toString());
        report("validation_migrations_complete");
        connection = await connect(url.toString());
        const sql = await loadSql();
        const original = await readToolCounters(connection);
        await connection.execute(sql);
        const first = await readToolCounters(connection);
        const published = await verifyIssue9Database(connection.query);
        await connection.execute(sql);
        const repeated = await readToolCounters(connection);
        if (!first || !repeated || first.id !== published.toolId || repeated.id !== first.id
          || first.viewCount !== repeated.viewCount || first.clickCount !== repeated.clickCount
          || original && (original.viewCount !== first.viewCount || original.clickCount !== first.clickCount)) {
          throw new CloudDatabaseError("validation_publication_counter_mismatch");
        }
        const { rows: discoveries } = await connection.query('SELECT count(*)::integer AS count FROM "ToolDiscovery" WHERE "toolId" = $1 AND method = $2 AND "sourceKey" = $3',
          [published.toolId, "issue", "korbinjoe/toools#9"]);
        if (discoveries[0]?.count !== 1) throw new CloudDatabaseError("validation_publication_not_idempotent");
        report("validation_sql_idempotent");

        const timestamp = new Date(now()).toISOString();
        const prefix = `recovery-${(dependencies.randomId ?? randomUUID)()}`;
        const event = (suffix: string, metric: "view" | "click"): ToolMetricEvent => ({ id: `${prefix}-${suffix}`, toolId: published.toolId, metric, occurredAt: timestamp });
        const batch = [event("view-1", "view"), event("view-2", "view"), event("click-1", "click")];
        const database = metricDatabase(connection);
        const applied = await applyToolMetricBatch(database, batch, now());
        const retry = await applyToolMetricBatch(database, [...batch, batch[0]], now());
        const after = await readToolCounters(connection);
        if (applied.applied !== 3 || applied.toolsUpdated !== 1 || retry.applied !== 0 || !after
          || after.viewCount !== Number(repeated.viewCount) + 2 || after.clickCount !== Number(repeated.clickCount) + 1
          || String(after.updatedAt) !== String(repeated.updatedAt)) throw new CloudDatabaseError("validation_metric_totals_mismatch");
        report("validation_metrics_idempotent");
      } catch (error) {
        if (error instanceof CloudDatabaseError) throw error;
        throw new CloudDatabaseError("isolated_database_validation_failed");
      } finally {
        try { await connection?.close(); } catch { /* Branch deletion remains required even after a broken socket. */ }
        if (creationAttempted) {
          try {
            // Reconcile a lost create response by its unique, run-owned name.
            const branch = created ?? await findOwnedBranch(input.neonApiKey, name);
            if (branch) await deleteOwnedBranch(input.neonApiKey, branch, name);
          } catch { throw new CloudDatabaseError("validation_cleanup_failed"); }
        }
      }
    },

    async migrateAndPublishProduction({ databaseUrl }: { databaseUrl: string }): Promise<{ toolId: string; slug: "mangatranslate" }> {
      requireDue();
      const url = productionUrl(databaseUrl);
      let connection: RecoveryDatabaseConnection | undefined;
      try {
        await migrate(url.toString());
        report("production_migrations_complete");
        connection = await connect(url.toString());
        const before = await readToolCounters(connection);
        await connection.execute(await loadSql());
        const published = await verifyIssue9Database(connection.query);
        const after = await readToolCounters(connection);
        // Live direct-mode requests may legitimately increment counters while
        // publication is running. Publication must never reduce those totals.
        if (!after || before && (Number(after.viewCount) < Number(before.viewCount) || Number(after.clickCount) < Number(before.clickCount))) {
          throw new CloudDatabaseError("production_publication_counter_mismatch");
        }
        report("production_sql_published");
        return published;
      } catch (error) {
        if (error instanceof CloudDatabaseError) throw error;
        throw new CloudDatabaseError("production_database_publication_failed");
      } finally { await connection?.close().catch(() => {}); }
    },
  };
}

export async function runRecoveryDatabaseValidation(databaseUrl: string, neonApiKey: string, report?: CloudDatabaseReport): Promise<void> {
  await createCloudDatabase({ report }).validateOnTemporaryBranch({ databaseUrl, neonApiKey });
}

export async function migrateAndPublishProduction(databaseUrl: string, report?: CloudDatabaseReport) {
  return createCloudDatabase({ report }).migrateAndPublishProduction({ databaseUrl });
}
