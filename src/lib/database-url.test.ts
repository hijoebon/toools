import assert from "node:assert/strict";
import test from "node:test";
import { getDatabaseUrl, normalizePgSslMode, pgPoolConfig } from "./database-url";

const neon = "ep-weathered-shape-aky91jmc-pooler.c-3.us-west-2.aws.neon.tech";

test("legacy sslmode values become verify-full without rewriting the rest of the URL", () => {
  const raw = `postgresql://neondb_owner:p%40ss%2Fword@db.example:5432/toools?sslmode=require&channel_binding=require`;
  const next = normalizePgSslMode(raw);
  assert.equal(next, "postgresql://neondb_owner:p%40ss%2Fword@db.example:5432/toools?sslmode=verify-full&channel_binding=require");
  assert.equal(next.includes("p%40ss%2Fword"), true);
  assert.equal(normalizePgSslMode("postgresql://user:pass@db.example/toools?sslmode=prefer"), "postgresql://user:pass@db.example/toools?sslmode=verify-full");
  assert.equal(normalizePgSslMode("postgresql://user:pass@db.example/toools?sslmode=verify-ca"), "postgresql://user:pass@db.example/toools?sslmode=verify-full");
  assert.equal(normalizePgSslMode("postgresql://user:pass@db.example/toools?sslmode=verify-full"), "postgresql://user:pass@db.example/toools?sslmode=verify-full");
});

test("Neon URLs gain verify-full when sslmode is omitted or not verifying", () => {
  const password = "p%40ss%2Fword";
  const omitted = `postgresql://neondb_owner:${password}@${neon}/neondb?channel_binding=require`;
  const normalized = normalizePgSslMode(omitted);
  assert.equal(normalized, `${omitted}&sslmode=verify-full`);
  assert.equal(normalized.includes(password), true);
  assert.equal(new URL(normalized).searchParams.get("channel_binding"), "require");
  assert.equal(new URL(normalized).searchParams.get("sslmode"), "verify-full");

  assert.equal(
    normalizePgSslMode(`postgresql://neondb_owner:secret@${neon}/neondb`),
    `postgresql://neondb_owner:secret@${neon}/neondb?sslmode=verify-full`,
  );
  assert.equal(
    normalizePgSslMode(`postgresql://neondb_owner:secret@${neon}/neondb?sslmode=disable`),
    `postgresql://neondb_owner:secret@${neon}/neondb?sslmode=verify-full`,
  );
  assert.equal(
    normalizePgSslMode(`postgresql://neondb_owner:secret@${neon}/neondb?sslmode=require`),
    `postgresql://neondb_owner:secret@${neon}/neondb?sslmode=verify-full`,
  );
});

test("loopback URLs keep an explicit or absent sslmode", () => {
  for (const raw of [
    "postgresql://toools:toools@127.0.0.1:5432/toools",
    "postgresql://toools:toools@127.0.0.1:5432/toools?sslmode=disable",
    "postgresql://toools:toools@localhost:5432/toools",
    "postgresql://toools:toools@[::1]:5432/toools",
  ]) {
    assert.equal(normalizePgSslMode(raw), raw);
  }
});

test("Neon pool config forces TLS without leaving sslmode for pg to reinterpret", () => {
  const raw = `postgresql://neondb_owner:p%40ss%2Fword@${neon}/neondb?sslmode=require&channel_binding=require`;
  const config = pgPoolConfig(raw);
  assert.equal(config.ssl?.rejectUnauthorized, true);
  assert.equal(new URL(config.connectionString).searchParams.get("sslmode"), null);
  assert.equal(new URL(config.connectionString).searchParams.get("channel_binding"), "require");
  assert.equal(config.connectionString.includes("p%40ss%2Fword"), true);

  const duplicate = pgPoolConfig(`postgresql://neondb_owner:secret@${neon}/neondb?sslmode=require&sslmode=disable`);
  assert.equal(new URL(duplicate.connectionString).searchParams.get("sslmode"), null);
  assert.equal(duplicate.ssl?.rejectUnauthorized, true);

  const loopback = pgPoolConfig("postgresql://toools:toools@127.0.0.1:5432/toools?sslmode=disable");
  assert.equal(loopback.ssl, undefined);
  assert.equal(loopback.connectionString, "postgresql://toools:toools@127.0.0.1:5432/toools?sslmode=disable");
});

test("getDatabaseUrl reads DATABASE_URL and applies Neon TLS", () => {
  const previous = process.env.DATABASE_URL;
  try {
    delete process.env.DATABASE_URL;
    assert.throws(() => getDatabaseUrl(), /DATABASE_URL is not set/);
    process.env.DATABASE_URL = `postgresql://neondb_owner:secret@${neon}/neondb`;
    assert.equal(getDatabaseUrl(), `postgresql://neondb_owner:secret@${neon}/neondb?sslmode=verify-full`);
  } finally {
    if (previous === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = previous;
  }
});
