interface Identified {
  slug: string;
}
interface RecentTool extends Identified {
  category: { slug: string };
  createdAt: Date | string;
}

/** One shared daily seed keeps server rendering and hydration consistent. */
export function getEditorialDay(now = new Date()): number {
  return Math.floor((now.getTime() + 8 * 60 * 60 * 1000) / 86_400_000);
}

function unique<T extends Identified>(items: T[]): T[] {
  return [...new Map(items.map((item) => [item.slug, item])).values()];
}

function createdTime(value: Date | string): number | null {
  const time = new Date(value).getTime();
  return Number.isFinite(time) ? time : null;
}

/** Recent means the latest cohort, never older records added for variety. */
export function selectRecentPool<T extends RecentTool>(items: T[]): T[] {
  const itemsBySlug = unique(items);
  const dated = itemsBySlug.flatMap((item) => {
    const time = createdTime(item.createdAt);
    return time === null ? [] : [{ item, time }];
  });
  // A bad timestamp must not drop every other healthy listing.
  if (!dated.length) return itemsBySlug;
  dated.sort((a, b) => b.time - a.time);
  const newest = dated[0].time;
  return dated.filter((row) => row.time >= newest - 30 * 86_400_000).map((row) => row.item);
}

/** Circular batches fill trailing slots without repeating an item in a batch. */
export function selectBatch<T extends Identified>(
  items: T[],
  size: number,
  offset: number,
): T[] {
  const pool = unique(items);
  if (!pool.length || size <= 0) return [];
  const start = ((offset % pool.length) + pool.length) % pool.length;
  return Array.from(
    { length: Math.min(size, pool.length) },
    (_, index) => pool[(start + index) % pool.length],
  );
}

export function selectRecentBatch<T extends RecentTool>(
  items: T[],
  offset: number,
  size = 3,
): T[] {
  const pool = selectRecentPool(items);
  const rotated = selectBatch(pool, pool.length, offset);
  const selected = new Set<string>();
  const categories = new Map<string, number>();
  for (const tool of rotated) {
    if (selected.size >= size) break;
    const count = categories.get(tool.category.slug) ?? 0;
    if (count >= 2) continue;
    selected.add(tool.slug);
    categories.set(tool.category.slug, count + 1);
  }
  for (const tool of rotated) {
    if (selected.size >= size) break;
    selected.add(tool.slug);
  }
  // Within each selected batch, retain the actual newest-first ordering.
  return pool.filter((tool) => selected.has(tool.slug));
}

export function selectFeaturedBatch<T extends Identified>(
  featured: T[],
  recent: Identified[],
  offset: number,
  size = 4,
): T[] {
  const excluded = new Set(recent.map((tool) => tool.slug));
  return selectBatch(
    featured.filter((tool) => !excluded.has(tool.slug)),
    size,
    offset,
  );
}

/** Skip offsets producing the same set (e.g. category-variety constraints). */
export function nextBatchOffset<T extends Identified>(
  offset: number,
  size: number,
  poolSize: number,
  select: (offset: number) => T[],
): number | null {
  const signature = (items: T[]) =>
    items
      .map((item) => item.slug)
      .sort()
      .join("\0");
  const current = signature(select(offset));
  for (let step = 0; step < poolSize; step++) {
    const next = offset + size + step;
    if (signature(select(next)) !== current) return next;
  }
  return null;
}

/** Distinct daily sets even when category constraints collapse several offsets. */
export function getDailyBatchOffset<T extends Identified>(
  day: number,
  size: number,
  poolSize: number,
  select: (offset: number) => T[],
): number {
  if (!poolSize || size <= 0) return 0;
  const signatures = new Set<string>();
  const offsets: number[] = [];
  const add = (offset: number) => {
    const signature = select(offset)
      .map((item) => item.slug)
      .sort()
      .join("\0");
    if (signatures.has(signature)) return;
    signatures.add(signature);
    offsets.push(offset);
  };
  for (let index = 0; index < poolSize; index++) add((index * size) % poolSize);
  for (let index = 0; index < poolSize; index++) add(index);
  return offsets[((day % offsets.length) + offsets.length) % offsets.length];
}
