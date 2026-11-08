# UA actor daily metric (human vs bot side-path)

## Summary

Adds a **side-path** daily aggregate table `UaActorMetricDaily` so we can SQL trend **human vs bot** (and by `botFamily`) without changing `Tool.viewCount` / `clickCount`, `recordToolMetric`, public display, or sorting.

- Classification lives in `classifyRequestActor` (`src/lib/crawlers.ts`), extending the existing `HTML_METADATA_BOTS` allowlist.
- Write path: `recordUaActorMetric` beside existing `after(() => recordToolMetric(...))` call sites.
- Days are **UTC** `@db.Date` (documented for SQL simplicity).
- No IP storage. No crawler blocking. `robots.txt` untouched.
- When `TOOL_METRICS_MODE=disabled`, the bypass is skipped too (same local-preview behavior).

## Example SQL

### Daily human vs bot (views)

```sql
SELECT
  "day",
  "actorClass",
  SUM("count") AS events
FROM "UaActorMetricDaily"
WHERE "metric" = 'view'
  AND "day" >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY "day", "actorClass"
ORDER BY "day", "actorClass";
```

### Daily by botFamily (known + suspected)

```sql
SELECT
  "day",
  COALESCE("botFamily", '(human)') AS "botFamily",
  "actorClass",
  SUM("count") AS events
FROM "UaActorMetricDaily"
WHERE "metric" = 'view'
  AND "day" >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY "day", "botFamily", "actorClass"
ORDER BY "day", events DESC;
```

### Human share of views per day

```sql
SELECT
  "day",
  SUM("count") FILTER (WHERE "actorClass" = 'human') AS human_events,
  SUM("count") FILTER (WHERE "actorClass" <> 'human') AS non_human_events,
  ROUND(
    100.0 * SUM("count") FILTER (WHERE "actorClass" = 'human')
      / NULLIF(SUM("count"), 0),
    2
  ) AS human_pct
FROM "UaActorMetricDaily"
WHERE "metric" = 'view'
GROUP BY "day"
ORDER BY "day";
```

## Files changed

- `prisma/schema.prisma` — `UaActorMetricDaily` model
- `prisma/migrations/20261108100000_add_ua_actor_metric_daily/migration.sql`
- `src/lib/crawlers.ts` — `classifyRequestActor`
- `src/lib/crawlers.test.ts`
- `src/lib/ua-actor-metric.ts` — fingerprint / upsert helper
- `src/lib/ua-actor-metric.test.ts`
- `src/app/tools/[slug]/page.tsx` — capture UA via `headers()`, side-path view
- `src/app/api/tools/[slug]/out/route.ts` — side-path click

## Push / PR (parent; do not run until `gh` is logged in)

```bash
cd /workspace/toools
git push -u origin feat/ua-actor-metric-daily
gh pr create --repo korbinjoe/toools --base main --head feat/ua-actor-metric-daily \
  --title "feat: daily UA human/bot side-path metrics" \
  --body-file UA_METRIC_PR.md
```

After merge, deploy with Prisma migrate so `UaActorMetricDaily` exists before traffic writes.
