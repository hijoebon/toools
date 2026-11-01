import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import test from "node:test";

const run = promisify(execFile);
const oldPassword = "offline-template-secret";
const currentPassword = "offline-current-secret";
const apiKey = "offline-management-key";
const template = `postgresql://neondb_owner:${oldPassword}@ep-weathered-shape-aky91jmc-pooler.c-3.us-west-2.aws.neon.tech/neondb`;

async function smoke(scenario: string, options: { api?: boolean; databaseUrl?: string } = {}) {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "toools-readonly-smoke-"));
  const mock = path.join(directory, "mock.cjs");
  await fs.writeFile(mock, `
const assert = require('node:assert/strict');
const { Client } = require(process.cwd() + '/node_modules/pg');
let managementCalls = 0;
global.fetch = async (input, init) => {
  const url = new URL(String(input));
  const method = init?.method ?? 'GET';
  console.log('test_management_method=' + method);
  assert.equal(method, 'GET', 'Catalog smoke attempted a management mutation');
  assert.equal(init?.redirect, 'error');
  assert.equal(url.origin, 'https://console.neon.tech');
  managementCalls++;
  if (url.pathname.endsWith('/reveal_password')) {
    assert.equal(managementCalls, 1, 'Resolve the current password before SQL');
    if (process.env.TEST_SMOKE_SCENARIO === 'reveal-failed') return Response.json({ message: 'private provider error' }, { status: 403 });
    return Response.json({ password: '${currentPassword}' });
  }
  assert.ok(url.pathname.endsWith('/endpoints/ep-weathered-shape-aky91jmc'));
  return Response.json({ endpoint: process.env.TEST_SMOKE_SCENARIO === 'unknown' ? {} : { disabled: process.env.TEST_SMOKE_SCENARIO === 'disabled' } });
};
Client.prototype.connect = async function () {
  console.log('test_sql_connect=true');
  assert.equal(this.connectionParameters.password, process.env.CLOUD_NEON_API_KEY ? '${currentPassword}' : '${oldPassword}');
  assert.equal(managementCalls, process.env.CLOUD_NEON_API_KEY ? 2 : 0);
  if (process.env.TEST_SMOKE_SCENARIO === 'connect-failed') throw Object.assign(new Error('private password ${currentPassword}'), { code: '28P01' });
};
Client.prototype.query = async function (text, values) {
  assert.match(text, /^SELECT name FROM "Tool"/);
  console.log('test_sql_query=' + values[0]);
  if (values[0] === 'chatgpt') return { rows: process.env.TEST_SMOKE_SCENARIO === 'known-missing' ? [] : [{ name: 'ChatGPT' }] };
  assert.equal(values[0], 'missing-xyz');
  return { rows: process.env.TEST_SMOKE_SCENARIO === 'missing-present' ? [{ name: 'Unexpected' }] : [] };
};
Client.prototype.end = async function () { console.log('test_sql_closed=true'); };
`);
  try {
    const environment = {
      PATH: process.env.PATH ?? "", NODE_ENV: "test" as const, DATABASE_URL: options.databaseUrl ?? template,
      TEST_SMOKE_SCENARIO: scenario,
      ...(options.api === false ? {} : { CLOUD_NEON_API_KEY: apiKey }),
      // A legacy environment must never restore the deleted management write.
      CATALOG_SMOKE_ENABLE_ENDPOINT: "true",
    };
    let result: { stdout: string; stderr: string; code: number };
    try {
      const output = await run(process.execPath, ["--require", mock, "--import", "tsx", "scripts/catalog-smoke.ts"], {
        cwd: process.cwd(), env: environment, timeout: 20_000, encoding: "utf8",
      });
      result = { ...output, code: 0 };
    } catch (error) {
      const output = error as { stdout: string; stderr: string; code: number };
      result = { stdout: output.stdout, stderr: output.stderr, code: output.code };
    }
    for (const secret of [oldPassword, currentPassword, apiKey]) assert.equal((result.stdout + result.stderr).includes(secret), false);
    assert.equal(result.stdout.includes("test_management_method=PATCH"), false);
    assert.equal(result.stdout.includes("test_management_method=POST"), false);
    return result;
  } finally { await fs.rm(directory, { recursive: true, force: true }); }
}

test("catalog CLI resolves current credentials before one read-only connection and closes it", async () => {
  const result = await smoke("pass");
  assert.equal(result.code, 0, result.stdout + result.stderr);
  assert.equal((result.stdout.match(/test_management_method=GET/g) ?? []).length, 2);
  assert.equal((result.stdout.match(/test_sql_connect=true/g) ?? []).length, 1);
  assert.match(result.stdout, /smoke_decision=pass/);
  assert.match(result.stdout, /test_sql_closed=true/);
});

test("disabled and unknown endpoints stay untouched and never receive a SQL connection", async () => {
  for (const state of ["disabled", "unknown"]) {
    const result = await smoke(state);
    assert.equal(result.code, 1, result.stdout + result.stderr);
    assert.match(result.stdout, new RegExp(`smoke_control_plane=endpoint_${state === "disabled" ? "disabled" : "state_unknown"}`));
    assert.equal(result.stdout.includes("test_sql_connect"), false);
  }
});

test("failed management authentication cannot fall back to the revoked template", async () => {
  const result = await smoke("reveal-failed");
  assert.equal(result.code, 1, result.stdout + result.stderr);
  assert.match(result.stdout, /reveal=http_403/);
  assert.equal(result.stdout.includes("test_sql_connect"), false);
});

test("current-password SQL failure does not retry the old credential or mutate the endpoint", async () => {
  const result = await smoke("connect-failed");
  assert.equal(result.code, 1, result.stdout + result.stderr);
  assert.match(result.stdout, /smoke_connect=28P01/);
  assert.equal((result.stdout.match(/test_sql_connect=true/g) ?? []).length, 1);
});

test("catalog read assertions keep known-present and missing-absent behavior", async () => {
  for (const scenario of ["known-missing", "missing-present"]) {
    const result = await smoke(scenario);
    assert.equal(result.code, 1, result.stdout + result.stderr);
    assert.match(result.stdout, new RegExp(`smoke_decision=${scenario}`));
    assert.match(result.stdout, /test_sql_closed=true/);
  }
  assert.equal((await smoke("pass", { api: false })).code, 0);
});

test("a mismatched template cannot receive the management password", async () => {
  const result = await smoke("pass", { databaseUrl: template.replace("ep-weathered-shape-aky91jmc-pooler.c-3.us-west-2.aws.neon.tech", "other.example") });
  assert.equal(result.code, 1, result.stdout + result.stderr);
  assert.match(result.stdout, /database_url=target_mismatch/);
  assert.equal(result.stdout.includes("test_management_method"), false);
  assert.equal(result.stdout.includes("test_sql_connect"), false);
});

test("catalog smoke workflow never opts into endpoint enablement or receives a Vercel write token", async () => {
  const workflow = await fs.readFile(".github/workflows/catalog-smoke.yml", "utf8");
  assert.doesNotMatch(workflow, /CATALOG_SMOKE_ENABLE_ENDPOINT|CLOUD_VERCEL_TOKEN/);
});
