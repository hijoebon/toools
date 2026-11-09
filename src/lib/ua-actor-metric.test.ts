import assert from "node:assert/strict";
import test from "node:test";
import {
  createUaActorMetricRecorder,
  fingerprintUserAgent,
  normalizeUserAgent,
  previewUserAgent,
  utcDay,
  type UaActorMetricUpsertRow,
} from "./ua-actor-metric";

test("normalizeUserAgent trims, collapses whitespace, and lowercases", () => {
  assert.equal(normalizeUserAgent("  Foo   BAR  "), "foo bar");
  assert.equal(normalizeUserAgent(null), "");
});

test("fingerprintUserAgent is stable, truncated sha256 hex, and independent of case/spacing", () => {
  const a = fingerprintUserAgent("Mozilla/5.0 Chrome/120");
  const b = fingerprintUserAgent("  mozilla/5.0   chrome/120  ");
  assert.equal(a, b);
  assert.match(a, /^[0-9a-f]{32}$/);
  assert.notEqual(fingerprintUserAgent("Mozilla/5.0 Chrome/120"), fingerprintUserAgent("Mozilla/5.0 Chrome/121"));
  assert.equal(fingerprintUserAgent(null), fingerprintUserAgent(""));
});

test("previewUserAgent truncates long raw UAs without lowercasing", () => {
  const long = `Mozilla/5.0 ${"X".repeat(200)}`;
  const preview = previewUserAgent(long);
  assert.ok(preview.length <= 120);
  assert.ok(preview.endsWith("…"));
  assert.equal(previewUserAgent(null), "(missing)");
  assert.equal(previewUserAgent("  Short UA  "), "Short UA");
});

test("utcDay buckets to UTC midnight", () => {
  const day = utcDay(new Date("2026-11-08T15:30:00+08:00"));
  assert.equal(day.toISOString(), "2026-11-08T00:00:00.000Z");
});

function setup(mode: string | undefined) {
  const rows: UaActorMetricUpsertRow[] = [];
  const record = createUaActorMetricRecorder({
    mode: () => mode,
    upsert: async (row) => {
      rows.push(row);
    },
    now: () => new Date("2026-11-08T12:00:00Z"),
  });
  return { record, rows };
}

test("disabled mode creates no upsert side effects", async () => {
  const calls: string[] = [];
  const record = createUaActorMetricRecorder({
    mode: () => "disabled",
    upsert: async () => {
      calls.push("upsert");
    },
    now: () => {
      calls.push("now");
      return new Date();
    },
  });
  await record({ metric: "view", userAgent: "Mozilla/5.0" });
  assert.deepEqual(calls, []);
});

test("direct/default mode upserts a human view row for a browser UA", async () => {
  const state = setup(undefined);
  await state.record({
    metric: "view",
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X) Chrome/120.0.0.0 Safari/537.36",
  });
  assert.equal(state.rows.length, 1);
  assert.equal(state.rows[0].actorClass, "human");
  assert.equal(state.rows[0].botFamily, null);
  assert.equal(state.rows[0].metric, "view");
  assert.equal(state.rows[0].day.toISOString(), "2026-11-08T00:00:00.000Z");
  assert.match(state.rows[0].uaFingerprint, /^[0-9a-f]{32}$/);
});

test("known bot click records known_bot family", async () => {
  const state = setup("direct");
  await state.record({ metric: "click", userAgent: "PerplexityBot/1.0" });
  assert.equal(state.rows[0].actorClass, "known_bot");
  assert.equal(state.rows[0].botFamily, "perplexitybot");
  assert.equal(state.rows[0].metric, "click");
});

test("prefetch purpose records suspected_bot prefetch family", async () => {
  const state = setup("queue");
  await state.record({
    metric: "view",
    userAgent: "Mozilla/5.0 Chrome/120",
    purpose: "prefetch",
  });
  assert.equal(state.rows[0].actorClass, "suspected_bot");
  assert.equal(state.rows[0].botFamily, "prefetch");
});

test("invalid TOOL_METRICS_MODE fails before upsert", async () => {
  const record = createUaActorMetricRecorder({
    mode: () => "unexpected",
    upsert: async () => assert.fail("upsert should not be called"),
  });
  await assert.rejects(record({ metric: "view", userAgent: "x" }), /^Error: Invalid TOOL_METRICS_MODE$/);
});
