import assert from "node:assert/strict";
import test from "node:test";
import { createMetricRecorder } from "./metric-recording";
import type { ToolMetricEvent } from "./metric-event";

function setup(mode: string | undefined) {
  const direct: ToolMetricEvent[] = [];
  const persisted: ToolMetricEvent[] = [];
  const queued: ToolMetricEvent[] = [];
  const warnings: string[] = [];
  let failPublish = false;
  let failWake = false;
  let failDatabase = false;
  const record = createMetricRecorder({
    mode: () => mode,
    direct: async (event) => { direct.push(event); },
    persist: async (events) => { if (failDatabase) throw new Error("database unavailable"); persisted.push(...events); },
    enqueue: async (event) => {
      // A timeout can occur AFTER the queue accepts the event.
      queued.push(event);
      if (failPublish) throw new Error("response lost");
      return { accepted: true, wakeScheduled: !failWake };
    },
    warn: (message) => warnings.push(message),
    id: () => "fixed-event",
    now: () => Date.parse("2026-10-19T00:00:00Z"),
  });
  return { record, direct, persisted, queued, warnings, fail: (target: "publish" | "wake" | "database") => {
    if (target === "publish") failPublish = true;
    if (target === "wake") failWake = true;
    if (target === "database") failDatabase = true;
  } };
}

test("disabled recording creates no event or persistence, queue, or logging side effects", async () => {
  const calls: string[] = [];
  const record = createMetricRecorder({
    mode: () => "disabled",
    direct: async () => { calls.push("direct"); },
    enqueue: async () => { calls.push("enqueue"); return { accepted: true, wakeScheduled: true }; },
    persist: async () => { calls.push("persist"); },
    warn: () => { calls.push("warn"); },
    id: () => { calls.push("id"); return "unused-id"; },
    now: () => { calls.push("now"); return 0; },
  });
  await record("tool", "view");
  await record("tool", "click");
  assert.deepEqual(calls, []);
});

test("an unknown recording mode still fails before producing an event or changing data", async () => {
  const record = createMetricRecorder({
    mode: () => "unexpected",
    direct: async () => assert.fail("direct should not be called"),
    enqueue: async () => assert.fail("enqueue should not be called"),
    persist: async () => assert.fail("persist should not be called"),
    warn: () => assert.fail("warn should not be called"),
    id: () => assert.fail("id should not be called"),
    now: () => assert.fail("now should not be called"),
  });
  await assert.rejects(record("tool", "view"), /^Error: Invalid TOOL_METRICS_MODE$/);
});

test("queue mode records durably without a database write per visit", async () => {
  const state = setup("queue");
  await state.record("tool", "view");
  assert.equal(state.queued.length, 1);
  assert.equal(state.direct.length + state.persisted.length, 0);
});

test("an unknown publish outcome falls back with the identical event ID", async () => {
  const state = setup("queue"); state.fail("publish");
  await state.record("tool", "click");
  assert.deepEqual(state.persisted, state.queued);
  assert.equal(state.direct.length, 0);
});

test("a failed wake after acceptance never writes a duplicate fallback", async () => {
  const state = setup("queue"); state.fail("wake");
  await state.record("tool", "view");
  assert.equal(state.persisted.length + state.direct.length, 0);
  assert.equal(state.warnings.length, 1);
});

test("default/direct mode remains compatible before the migration", async () => {
  for (const mode of [undefined, "direct"]) {
    const state = setup(mode);
    await state.record("tool", "view");
    assert.equal(state.direct.length, 1);
    assert.equal(state.queued.length, 0);
  }
});

test("a failed durable enqueue and fallback surfaces failure to the caller", async () => {
  const state = setup("queue"); state.fail("publish"); state.fail("database");
  await assert.rejects(state.record("tool", "view"), /database unavailable/);
});
