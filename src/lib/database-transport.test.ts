import assert from "node:assert/strict";
import test from "node:test";
import { PrismaNeonHttp } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import { neonHttpQueryOptions, resolveDatabaseTransport } from "./database-transport";

const databaseUrl = "postgresql://preview:test-secret@ep-preview.us-west-2.aws.neon.tech/neondb";

test("database transport remains PostgreSQL unless Neon HTTP is explicitly selected", () => {
  assert.equal(resolveDatabaseTransport(databaseUrl), "pg");
  assert.equal(resolveDatabaseTransport(databaseUrl, "pg"), "pg");
  assert.equal(resolveDatabaseTransport("postgresql://local@localhost/toools"), "pg");
  assert.equal(resolveDatabaseTransport(databaseUrl, "neon-http"), "neon-http");
  assert.equal(resolveDatabaseTransport("postgres://preview:test-secret@neon.tech/neondb", "neon-http"), "neon-http");
});

test("invalid HTTP destinations and unsupported transports fail without exposing a credential", () => {
  for (const url of [
    "not-a-url:test-secret", "postgresql://preview:test-secret@localhost/toools",
    "postgresql://preview:test-secret@neon.tech.evil.example/toools",
    "postgresql://preview:test-secret@not-neon.tech/toools",
    "https://preview:test-secret@ep-preview.neon.tech/neondb",
    "postgresql://ep-preview.neon.tech/neondb",
  ]) {
    assert.throws(() => resolveDatabaseTransport(url, "neon-http"), (error) => {
      assert(error instanceof Error);
      assert.match(error.message, /Neon HTTP requires/);
      assert.equal(error.message.includes("test-secret"), false);
      return true;
    });
  }
  assert.throws(() => resolveDatabaseTransport(databaseUrl, "other"), /DATABASE_TRANSPORT must be pg or neon-http/);
});

test("the real Neon HTTP adapter gets a fresh timeout signal for every request", async () => {
  const originalFetch = neonConfig.fetchFunction;
  const observedSignals: unknown[] = [];
  const createdSignals: AbortSignal[] = [];
  const adapter = new PrismaNeonHttp(databaseUrl, neonHttpQueryOptions(() => {
    const signal = AbortSignal.timeout(15_000);
    createdSignals.push(signal);
    return signal;
  }));
  neonConfig.fetchFunction = async (_url: Parameters<typeof fetch>[0], init?: Parameters<typeof fetch>[1]) => {
    observedSignals.push(init?.signal);
    return Response.json({ fields: [{ name: "answer", dataTypeID: 23 }], rows: [["1"]], rowCount: 1, command: "SELECT" });
  };
  const driver = await adapter.connect();
  try {
    const query = { sql: "SELECT 1 AS answer", args: [], argTypes: [] };
    assert.deepEqual((await driver.queryRaw(query)).rows, [[1]]);
    assert.deepEqual((await driver.queryRaw(query)).rows, [[1]]);
    assert.equal(observedSignals.length, 2);
    assert.notEqual(observedSignals[0], observedSignals[1]);
    assert.deepEqual(observedSignals, createdSignals);
    assert(createdSignals.every((signal) => !signal.aborted));
  } finally {
    await driver.dispose();
    neonConfig.fetchFunction = originalFetch;
  }
});
