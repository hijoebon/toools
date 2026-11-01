# Catalog cache and publication

Public catalog queries share the `toools:catalog` Data Cache tag. The one-hour TTL is a fallback for edits made outside the publication workflow; normal publication expires it explicitly. The invalidation endpoint expires tagged reads immediately and invalidates the root layout, including the footer, category counts, sitemap, and cached tool-not-found results. The next request waits for current content. Browsers already displaying a page need a reload or subsequent navigation to receive the update.

## Configure once

Set `REVALIDATION_SECRET` to the same random value of at least 32 characters in the deployed Next.js server environment and the operator's environment. Set `CACHE_REVALIDATION_URL` in the operator environment to the deployment's exact HTTPS endpoint, for example `https://your-site.example/api/revalidate`. HTTP is allowed only for a local loopback server. Keep these values in environment variables or ignored `.env` files; never commit them or put the secret in a URL. The API accepts only authenticated `POST` requests with `{"catalog":true}` and does not accept caller-selected paths or tags.

The scripts use the existing `dotenv/config` loading of `.env` and process environment. They do not automatically read `.env.local`; use the shell's environment injection when your local credentials live there. Deployment and operator cache settings must point at the same environment as the database being changed. Do not target the production invalidation URL while writing a development database.

No extra hosted cache or paid service is required. Next.js manages the shared Data Cache on the deployment. A process-local variable or the function's temporary filesystem is not the publication cache.

## Restore and publish

After Neon's free allowance resets and the database is available:

1. Apply this change's Prisma migration using the existing deployment migration process (`npx prisma migrate deploy`). Do this before deploying or activating the new statistics consumer, which requires its receipt table. Do not rerun the full seed to apply a migration.
2. Configure the deployment and operator environments, then deploy/activate the new cache/invalidation and statistics code. Confirm that the deployed endpoint accepts `npm run cache:refresh` before publishing. Keep statistics on their existing write path until the migration, durable queue, and consumer are ready; follow the statistics activation instructions below.
3. Use the reviewed SQL file through the publication command. It runs the complete file in one PostgreSQL session and refreshes the catalog only after SQL returns successfully:

   ```bash
   npm run sql:publish -- --file scripts/approve-issue-9.sql
   ```

4. Verify the new tool detail page, its category, the homepage/search result, and `/sitemap.xml` before replying to and closing the GitHub issue.

`sql:publish` uses the existing PostgreSQL driver and `DATABASE_URL`. It does not rewrite SQL or split it on semicolons: the operator reviews the file's transaction boundaries (`BEGIN` / `COMMIT`) first. It never automatically retries writes. If a database/network error leaves the outcome uncertain, inspect the actual database state before replaying SQL. If SQL committed but refresh failed, the command exits with an error explaining the committed publication; retry **only**:

```bash
npm run cache:refresh
```

`cache:refresh` is idempotent and does not connect to the database. It rejects redirects, has a 15-second timeout, and reports authentication/configuration errors without logging the secret.

## Other write paths

`prisma/seed.ts`, `prisma/seed-stacks.ts`, `prisma/seed-tool-enrichments.ts`, `scripts/sync-categories.ts`, `scripts/recategorize.ts`, and `scripts/fix-icons.ts` mark successful public writes and perform one final refresh, including a run that partially committed and then failed. This covers stack descriptions, stages and recommendations, plus approved tools' use cases, pros and cons. Dry runs do not refresh. GitHub, directory, Product Hunt, and signal-backfill importers refresh once when public fields on an existing `APPROVED` tool change. A repeated discovery that updates only private provenance dates does not invalidate the catalog. New `PENDING` candidates and pending-only tool enrichments do not expire the public catalog. The existing moderation rules remain unchanged. If both the database operation and its refresh fail, both errors are reported and the database connection is closed.

Scripts preflight cache configuration before their first known public write. Missing/partial configuration on a remote database fails before that public write. The HTTPS import transaction also checks permission to modify public fields, so a candidate concurrently approved after the importer's snapshot cannot bypass this check; missing configuration rejects that transaction without changing the tool. A failed refresh after saved writes causes a nonzero exit, with a clear instruction to rerun `cache:refresh`; it is not reported as fully published. A pending-only import remains usable without cache credentials.

A loopback `DATABASE_URL` (`localhost`, `127.0.0.1`, or `::1`) with neither cache variable configured keeps normal local seed/import usage working. It explicitly reports that remote invalidation was skipped. Set both variables to a running local revalidation endpoint, or stop the local server, clear `.next/cache`, and restart. A restart alone may retain the filesystem cache. Configuring only one cache variable remains an error. Remote databases never silently skip invalidation, and a local database never implicitly receives production cache credentials.

For SQL executed manually through `psql`, the Neon console, an HTTPS transaction, or another moderation tool:

1. Run the reviewed content change as a transaction and confirm the commit.
2. Run `npm run cache:refresh` against the matching deployment.
3. Verify the affected pages. If refreshing fails, fix the endpoint/shared secret and repeat step 2 without replaying the database write.

Raw SQL cannot call Next.js invalidation automatically. The `approve-*.sql` files remain usable as reviewed SQL; `sql:publish` adds the necessary post-commit refresh. Browsing-counter batches use a separate metrics tag and must never invoke the publication endpoint.

## Batched statistics without a paid plan

Set these in the matching Vercel deployment environment:

| Variable | Value |
| --- | --- |
| `TOOL_METRICS_MODE` | `queue` after migration and successful queue validation |
| `METRICS_QUEUE_REGION` | `iad1` (or another supported region, identical for all producers and consumers) |
| `CRON_SECRET` | A random secret of at least 32 characters; Vercel supplies its Bearer authorization for Cron |
| `REVALIDATION_SECRET` | The shared publication secret described above |

The queue uses the existing Vercel project's OIDC identity. Do not add a Neon API key, queue token, Redis, or another paid service. Local development defaults to direct mode; local queue tests use injected offline transports. Queue mode is an explicit deployment setting. An unset value or `direct` preserves the existing counter write path and works before the receipt migration. Changing a deployment setting requires a new deployment.

Every existing detail render and valid outbound redirect still records one event with a unique server-generated ID; no sampling or visitor deduplication is added. Next.js `after()` awaits the durable enqueue after the response, with the detail page remaining dynamic so builds and cache refreshes do not create page views. Warm catalog reads and redirects use the shared Data Cache rather than querying Postgres on every request.

Events enter the deployment-independent `toools-metric-events-v1` queue. A second topic schedules one deduplicated wake for the next hour per deployment. The private worker gathers up to 100 events per database transaction, groups them by tool, inserts event receipts and increments both counters atomically. It acknowledges events only after commit. Repeated deliveries, lost acknowledgments, overlapping batches, and an enqueue timeout followed by direct fallback all use the same receipt IDs, so they do not increment twice. Counter updates do not change editorial `updatedAt`. Events for a tool deleted after enqueue are acknowledged without recreating the listing.

The normal display delay is up to about an hour plus processing time. Each successful worker write expires the statistics cache tag; content-only caches stay warm. Direct-mode and emergency fallback writes can remain invisible until the one-hour cache TTL. Accepted events are counted eventually within the queue retention window; the display is no longer an immediate live counter. A queue publish failure attempts a deduplicated database transaction with the same event ID. If neither service accepts the event, the request remains usable and logs a recording failure, matching the previous best-effort failure behavior.

The Hobby-compatible Cron runs once daily as a fallback, including for a failed wake or a deployment replaced before its wake runs. It does not connect to Neon when the queue is empty. Worker budgets schedule an immediate continuation when necessary. Database failure leaves events unacknowledged; wakes retry hourly. Daily nonempty drains also remove receipts older than 14 days. Events older than that window are rejected so receipt cleanup cannot make an old replay increment again.

Vercel Queues has a finite seven-day message retention and a free Hobby operations allowance. **Do not activate collection while Neon is paused until November 1:** that outage exceeds retention. An outage longer than seven days or exhaustion of the queue/platform free allowance can lose unpersisted events. Do not enable paid overages or change plans. Monitor queue failures and pending age in the existing Vercel dashboard; diagnose them before the oldest pending event reaches retention. No finite free queue can guarantee recovery from an unlimited outage.

Reference: [Queues pricing](https://vercel.com/docs/queues/pricing), [poll mode and retention](https://vercel.com/docs/queues/poll-mode), [Hobby Cron limits](https://vercel.com/docs/cron-jobs/usage-and-pricing).

## Validate a rollout

1. Run `npm test`, `npm run lint`, and `npm run build`. The receipt tests apply every actual migration to isolated PGlite Postgres, then exercise real transactions, rollback, duplicate delivery, conflicting IDs, concurrent overlap, receipt cleanup, and unchanged content timestamps. Queue/auth/cache tests use offline dependencies and do not write production events.
2. After Neon recovers, validate migrations, repeat publication and receipt replay on a temporary Neon branch, then delete that branch. The cloud recovery runner performs these checks without changing production counters. Do not use a preview with a different database against the normal project queue: preview and production intentionally share its deployment-independent topic and consumer, so either could consume the other's events.
3. Use authenticated `POST /api/metrics/check` with the deployed `CRON_SECRET` to test publishing, OIDC polling and acknowledgment. This uses a separate validation topic and in-memory callback, never the production topic or database. It validates the polling transport; it does not claim to exercise the hourly push callback. After migration and this canary pass, enable production queue mode, deploy, and call the authenticated drain. Publish the pending issue, refresh the cache, inspect the live catalog, and close the issue only after the listing is visible. Never send synthetic statistics to production to test retry behavior.

The receipt migration and production queue mode were activated on November 1 after real isolated-branch migration/replay checks and an independent queue canary. The code remains compatible with direct mode for local development or a deliberate rollback; the daily Cron returns without database activity in that mode. See the [recovery completion record](neon-recovery-2026-11-01.md).
