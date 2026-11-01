import assert from "node:assert/strict";
import test from "node:test";
import { createMetricsCronHandler, createMetricsScheduleHandler } from "./handler";

const secret = "test-cron-secret-that-has-more-than-32-characters";

test("metric cron requires configured credentials and rejects missing or incorrect bearer tokens without work", async () => {
  let calls = 0;
  const flush = async () => { calls++; return { received: 0 }; };
  const unconfigured = createMetricsCronHandler(flush, () => undefined);
  assert.equal((await unconfigured(new Request("https://example.com/api/metrics/flush"))).status, 503);
  const handler = createMetricsCronHandler(flush, () => secret);
  for (const authorization of ["", "Bearer wrong", secret, `Basic ${secret}`, `Bearer ${secret}extra`]) {
    const response = await handler(new Request("https://example.com/api/metrics/flush", { headers: { authorization } }));
    assert.equal(response.status, 401);
    assert.equal(response.headers.get("Cache-Control"), "no-store");
  }
  assert.equal(calls, 0);
});

test("authorized metric cron invokes one drain and never exposes credentials", async () => {
  let calls = 0;
  const handler = createMetricsCronHandler(async () => { calls++; return { received: 0, acknowledged: 0, hasMore: false }; }, () => secret);
  const response = await handler(new Request("https://example.com/api/metrics/flush", { headers: { authorization: `Bearer ${secret}` } }));
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { received: 0, acknowledged: 0, hasMore: false });
  assert.equal(calls, 1);
});

test("failed metric cron returns a retryable response without publishing its error body", async () => {
  const handler = createMetricsCronHandler(async () => { throw new Error("private connection details"); }, () => secret);
  const response = await handler(new Request("https://example.com/api/metrics/flush", { headers: { authorization: `Bearer ${secret}` } }));
  assert.equal(response.status, 500);
  assert.equal((await response.text()).includes("private connection details"), false);
});

function postRequest(body?: string, path = "") {
  return new Request(`https://example.com/api/metrics/flush${path}`, {
    method: "POST", headers: { authorization: `Bearer ${secret}` }, ...(body !== undefined ? { body } : {}),
  });
}

test("metric wake scheduling rejects missing configuration and unauthorized callers before queue work", async () => {
  let calls = 0;
  const schedule = async () => { calls++; };
  for (const value of [undefined, "short-secret"]) {
    const handler = createMetricsScheduleHandler(schedule, () => value, () => "queue");
    assert.equal((await handler(postRequest())).status, 503);
  }
  const handler = createMetricsScheduleHandler(schedule, () => secret, () => "queue");
  for (const authorization of ["", "Bearer wrong", `Basic ${secret}`, `Bearer ${secret}extra`]) {
    const response = await handler(new Request("https://example.com/api/metrics/flush", { method: "POST", headers: { authorization } }));
    assert.equal(response.status, 401);
    assert.equal(response.headers.get("Cache-Control"), "no-store");
  }
  assert.equal(calls, 0);
});

test("the wake endpoint reads queue mode for each invocation and never schedules in direct mode", async () => {
  let mode: string | undefined;
  let calls = 0;
  const handler = createMetricsScheduleHandler(async () => { calls++; }, () => secret, () => mode);
  for (const value of [undefined, "direct", "invalid"]) {
    mode = value;
    assert.equal((await handler(postRequest())).status, 503);
  }
  assert.equal(calls, 0);
  mode = "queue";
  assert.equal((await handler(postRequest())).status, 202);
  assert.equal(calls, 1);
});

test("wake requests accept only an empty body and no caller-selected query parameters", async () => {
  let calls = 0;
  const handler = createMetricsScheduleHandler(async () => { calls++; }, () => secret, () => "queue");
  for (const request of [postRequest("{}"), postRequest(" "), postRequest("" , "?topic=other"), postRequest(undefined, "?idempotencyKey=chosen")]) {
    assert.equal((await handler(request)).status, 400);
  }
  assert.equal(calls, 0);
});

test("an empty stream POST schedules an immediate production wake with a fresh server-generated key", async () => {
  const scheduled: { delaySeconds: number; idempotencyKey: string }[] = [];
  const handler = createMetricsScheduleHandler(async (options) => { scheduled.push(options); return { privateProviderField: "not-public" }; }, () => secret, () => "queue");
  // A zero-byte body still creates a stream, matching Vercel's empty POST.
  const streamed = postRequest("");
  assert.ok(streamed.body);
  for (const request of [streamed, postRequest()]) {
    const response = await handler(request);
    assert.equal(response.status, 202);
    assert.equal(response.headers.get("Cache-Control"), "no-store");
    assert.deepEqual(await response.json(), { scheduled: true });
  }
  assert.equal(scheduled.length, 2);
  for (const options of scheduled) {
    assert.equal(options.delaySeconds, 0);
    assert.match(options.idempotencyKey, /^operator-[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/);
    assert.deepEqual(Object.keys(options).sort(), ["delaySeconds", "idempotencyKey"]);
  }
  assert.notEqual(scheduled[0].idempotencyKey, scheduled[1].idempotencyKey);
});

test("queue provider failure cannot expose credentials or report a scheduled wake", async (t) => {
  const messages: unknown[][] = [];
  t.mock.method(console, "error", (...values: unknown[]) => { messages.push(values); });
  const handler = createMetricsScheduleHandler(async () => { throw new Error(`private provider failure ${secret}`); }, () => secret, () => "queue");
  const response = await handler(postRequest());
  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), { error: "Metric wake scheduling failed" });
  assert.deepEqual(messages, [["MetricScheduleError"]]);
});
