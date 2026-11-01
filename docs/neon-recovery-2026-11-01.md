# November 1 recovery completion

MangaTranslate was published by a cloud workflow and issue #9 was replied to and closed on November 1. The existing comment is the completion record; recovery checks must not post another completion reply. The later security and statistics completion preserved the current production source and the already approved listing.

## Verified production state

- The existing Neon organization remains on Free. The existing production endpoint now has a 0.25 CU minimum and maximum, with Free's default five-minute idle timeout. No new paid service, plan upgrade or paid overage was enabled.
- The exposed database password was reset, both Neon operations finished, and the replacement was synchronized to the ignored local `.env` with mode `0600` and the existing sensitive Vercel variable for production and preview. GitHub and Product Hunt credentials were preserved. A fresh direct connection with the old password was rejected with PostgreSQL `28P01`; the new credential passed a real query.
- Production was rebuilt from the current `main`, preserving subsequent submission and SEO changes. There were no open PR previews to replace at recovery time; future previews inherit the updated project environment. Old immutable deployment snapshots retain their old environment and are not restored with the exposed password.
- A temporary 0.25 CU Neon branch ran the actual migration, repeated the reviewed issue SQL without changing existing counters, and applied/replayed metric batches with exact totals and unchanged editorial timestamps. That branch was deleted. The production receipt migration was then applied with Prisma's existing migration history. No full seed, fabricated baseline, replay of the already committed production submission, or synthetic production counter update was used.
- `TOOL_METRICS_MODE=queue` is active. The isolated Queue producer/poll/ack canary passed. A real page verification event was received, committed and acknowledged once; an immediate repeated drain received/applied zero events. Shared catalog invalidation and the live detail, category, search and sitemap checks passed.

The authenticated `POST /api/metrics/flush` is an operator check for the push wake path. An empty POST in queue mode schedules an immediate wake with a server-generated ID; it cannot select a topic, tool, count or payload. `GET` retains the existing direct drain behavior. Diagnostics must never enable a disabled database endpoint.

## Retired recovery executors

The old `Neon recovery and publication` workflow lacked its dedicated Vercel token and did not complete recovery. It was disabled to prevent another restoration attempt. Its source no longer runs a database smoke test before credential rotation. Catalog smoke checks now perform management GETs only, resolve the current password before connecting, and fail if the endpoint is disabled. The local `neon-mangatranslate` heartbeat is paused.

The role password, API tokens and connection strings are deliberately absent from this record. Private operation metadata is under the user's local state directory; production secrets remain in the existing environment configuration. Statistics are eventually displayed, normally within about one hour, and the existing seven-day queue retention/free allowance still applies. See [catalog operations](catalog-operations.md).

References: [issue #9 completion](https://github.com/korbinjoe/toools/issues/9#issuecomment-6553925494), [cloud publication run](https://github.com/korbinjoe/toools/actions/runs/41276912591), [cloud issue close run](https://github.com/korbinjoe/toools/actions/runs/41277077122).
