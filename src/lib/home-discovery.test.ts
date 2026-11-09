import assert from "node:assert/strict";
import test from "node:test";
import {
  getDailyBatchOffset,
  getEditorialDay,
  nextBatchOffset,
  selectBatch,
  selectRecentBatch,
  selectRecentPool,
} from "./home-discovery";

const tool = (slug: string, category = "video", age = 0) => ({
  slug,
  category: { slug: category },
  createdAt: new Date(Date.UTC(2026, 9, 13) - age * 86_400_000),
});
const signature = (items: { slug: string }[]) =>
  items
    .map((item) => item.slug)
    .sort()
    .join(",");

test("the editorial day is stable until midnight in Shanghai", () => {
  const morning = getEditorialDay(new Date("2026-10-13T00:00:00+08:00"));
  const evening = getEditorialDay(new Date("2026-10-13T23:59:59+08:00"));
  const tomorrow = getEditorialDay(new Date("2026-10-14T00:00:00+08:00"));
  assert.equal(morning, evening);
  assert.equal(tomorrow, evening + 1);
});

test("unparseable added dates do not hide the rest of a healthy recent catalog", () => {
  const valid = tool("valid");
  const invalid = { slug: "bad", category: { slug: "ai" }, createdAt: "not-a-date" };
  assert.deepEqual(selectRecentPool([invalid, valid]).map((item) => item.slug), ["valid"]);
  assert.deepEqual(selectRecentPool([invalid, invalid]).map((item) => item.slug), ["bad"]);
});

test("recent candidates stay within 30 days of the newest approved entry", () => {
  const newest = tool("newest");
  const edge = tool("edge", "design", 30);
  const old = tool("old", "ai", 31);
  assert.deepEqual(selectRecentPool([old, edge, newest, newest]), [
    newest,
    edge,
  ]);
  assert.deepEqual(
    selectRecentPool([
      { ...newest, createdAt: newest.createdAt.toISOString() },
    ]).map((item) => item.slug),
    ["newest"],
  );
});

test("recent batches prefer category variety and retain actual date ordering", () => {
  const pool = [
    tool("a1"),
    tool("a2", "video", 1),
    tool("a3", "video", 2),
    tool("b1", "ai", 3),
    tool("b2", "ai", 4),
  ];
  assert.deepEqual(
    selectRecentBatch(pool, 0).map((item) => item.slug),
    ["a1", "a2", "b1"],
  );
  assert.deepEqual(
    selectRecentBatch(pool, 3).map((item) => item.slug),
    ["a1", "b1", "b2"],
  );
});

test("a single recent category still fills three slots without duplicates", () => {
  const pool = Array.from({ length: 7 }, (_, index) =>
    tool(String(index), "video", index),
  );
  assert.deepEqual(selectRecentBatch(pool, 0), pool.slice(0, 3));
  assert.deepEqual(
    selectRecentBatch(pool, 6).map((item) => item.slug),
    ["0", "1", "6"],
  );
});

test("circular batches wrap and handle negative offsets and sparse collections", () => {
  const pool = [tool("a"), tool("b"), tool("c")];
  assert.deepEqual(
    selectBatch(pool, 2, 2).map((item) => item.slug),
    ["c", "a"],
  );
  assert.deepEqual(
    selectBatch(pool, 2, -1).map((item) => item.slug),
    ["c", "a"],
  );
  assert.deepEqual(
    selectBatch([pool[0], pool[0], pool[1]], 4, 8),
    pool.slice(0, 2),
  );
  assert.deepEqual(selectRecentBatch([], 0), []);
  assert.deepEqual(selectBatch(pool, 0, 0), []);
});

test("daily batches differ even when category constraints collapse several offsets", () => {
  const pool = [tool("a1"), tool("a2"), tool("a3"), tool("b1", "ai")];
  const select = (offset: number) => selectRecentBatch(pool, offset);
  // Offsets 0 and 3 produce the same set, so simple day * batch-size is insufficient.
  assert.equal(signature(select(0)), signature(select(3)));
  const seen = new Set<string>();
  for (let day = 0; day < 12; day++) {
    const today = getDailyBatchOffset(day, 3, pool.length, select);
    const tomorrow = getDailyBatchOffset(day + 1, 3, pool.length, select);
    assert.notEqual(signature(select(today)), signature(select(tomorrow)));
    assert.equal(today, getDailyBatchOffset(day, 3, pool.length, select));
    seen.add(signature(select(today)));
  }
  assert.equal(seen.size, 3);
});

test("daily workflow and category rotation covers every candidate", () => {
  for (const [count, size] of [
    [9, 3],
    [17, 8],
  ]) {
    const pool = Array.from({ length: count }, (_, index) => ({
      slug: String(index),
    }));
    const select = (offset: number) => selectBatch(pool, size, offset);
    const seen = new Set<string>();
    for (let day = 0; day < count; day++) {
      const offset = getDailyBatchOffset(day, size, count, select);
      const nextOffset = getDailyBatchOffset(day + 1, size, count, select);
      assert.notEqual(signature(select(offset)), signature(select(nextOffset)));
      select(offset).forEach((item) => seen.add(item.slug));
    }
    assert.equal(seen.size, count);
  }
});

test("another batch skips identical selections and cycles through the pool", () => {
  const pool = [tool("a1"), tool("a2"), tool("a3"), tool("b1", "ai")];
  const select = (offset: number) => selectRecentBatch(pool, offset);
  let offset = 0;
  const seen = new Set<string>();
  for (let click = 0; click < 8; click++) {
    const next = nextBatchOffset(offset, 3, pool.length, select);
    assert.notEqual(next, null);
    assert.notEqual(signature(select(offset)), signature(select(next!)));
    select(next!).forEach((item) => seen.add(item.slug));
    offset = next!;
  }
  assert.equal(seen.size, pool.length);
});

test("empty and fully displayed collections have no pretend next batch", () => {
  for (const pool of [[], [tool("a")], [tool("a"), tool("a"), tool("b")]]) {
    const select = (offset: number) => selectBatch(pool, 4, offset);
    assert.equal(nextBatchOffset(0, 4, pool.length, select), null);
    assert.equal(getDailyBatchOffset(22, 4, pool.length, select), 0);
  }
});
