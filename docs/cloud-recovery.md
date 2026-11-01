# Cloud recovery on November 1, 2026

The `Neon recovery and publication` GitHub Actions workflow runs the recovery on GitHub's standard `ubuntu-latest` runner. It does not require the owner's Mac, a local terminal, or Codex to remain running. The repository is public, so standard hosted runner time is free. The workflow uses no larger runners, Actions cache, uploaded artifacts, new hosted services, or paid-plan upgrades. Existing Neon and Vercel free-plan limits still apply.

## Schedule and scope

The workflow must be present on the default `main` branch, enabled, and configured with the secrets below before the recovery date. Its UTC cron is `8,23,38,53 * 1-3 11 *`: every 15 minutes from **November 1, 2026, 08:08 Asia/Shanghai** through November 3 UTC. The original `7,22,37,52` schedule never created a run, so the minute list was shifted once to make GitHub register it again. A push no longer starts recovery. The catalog smoke must pass before this workflow rewrites `DATABASE_URL` or redeploys, and the same smoke runs on pull requests so a production deploy is not the first time the read is tried. Both the workflow's scheduled-run check and the recovery entrypoint restrict recovery to `2026-11-01T00:00:00Z <= now < 2026-11-04T00:00:00Z` (Beijing time November 1, 08:00 through November 4, 08:00). An early manual `recover` invocation is rejected by the entrypoint.

GitHub can delay or drop scheduled jobs during high load; 08:07 is a target, not a guaranteed completion time. Repeated attempts and idempotent recovery steps cover a delayed start or a failed run. A fixed concurrency group prevents overlapping runs from changing passwords, deploying, or publishing simultaneously. A new invocation does not cancel one already running. The workflow operates only in `korbinjoe/toools` on `main` and has a 30-minute run limit.

GitHub automatically disables a public repository's scheduled workflows after 60 days without repository activity. The current October setup is within that window. The recovery entrypoint disables this workflow after verified completion so it does not run in a future November.

## Credentials

Store the following values as **Actions repository secrets** in `korbinjoe/toools`. Do not commit an environment file, paste the values into an issue, or supply them as workflow-dispatch inputs.

| Secret | Purpose |
| --- | --- |
| `CLOUD_NEON_API_KEY` | A dedicated key scoped to the existing Toools Neon project, with Editor access to manage its existing role and endpoint. |
| `CLOUD_VERCEL_TOKEN` | A dedicated token scoped to the existing Toools Vercel project, expiring after the recovery window. |
| `CLOUD_DATABASE_TEMPLATE` | The immutable original database URL, including the actual exposed password. It preserves the host/database/role/SSL settings and provides the exact old-password baseline for verifying rotation. Never substitute a placeholder or overwrite it with the new URL. |
| `REVALIDATION_SECRET` | The same publication-invalidation secret deployed with the application. |
| `CRON_SECRET` | The statistics consumer's existing Cron authentication secret, synchronized into the deployment. |

The workflow receives `GITHUB_TOKEN` automatically for this run and uses the runner-provided `GITHUB_SHA` and `GITHUB_REPOSITORY`. It does not need a stored GitHub personal access token. Permissions are limited to `contents: read` for checkout, `issues: write` for the verified publication reply and closure, and `actions: write` to disable this one-time recovery after success. Checkout does not persist Git credentials. Third-party service secrets are injected only into the recovery step, after dependency installation.

Neon project-scoped keys do not expire automatically. Revoke the dedicated recovery key after completion. Give the dedicated Vercel token a short expiration beyond November 4, 2026, 08:00 Beijing time; revoke it after completion as well. Do not transfer personal CLI refresh tokens to the runner. Keep existing unrelated application credentials unchanged.

## Preflight and recovery

The manual **Run workflow** action defaults to `preflight`:

```bash
gh workflow run neon-recovery.yml --ref main -f mode=preflight
```

Preflight checks cloud credentials and target identity without resetting a password, enabling the endpoint, migrating, publishing, deploying, or closing the issue. It is the appropriate check immediately after setup. Manual recovery uses the same entrypoint and time gate:

```bash
gh workflow run neon-recovery.yml --ref main -f mode=recover
```

The commands run the existing workflow on GitHub; the caller's computer can be shut down after GitHub accepts the dispatch. The schedule needs no future local dispatch.

Recovery must complete these ordered checks before reporting success:

1. Confirm the expected existing Neon project, production branch, endpoint, and free-plan recovery window. Do not upgrade plans or create a replacement project.
2. Rotate the exposed database role password and wait until Neon's operations finish. Preserve the database connection parameters and update the matching Vercel configuration. An uncertain API response must be reconciled before retrying a mutation.
3. Deploy the trusted `main` commit with the new credential and direct statistics mode while the endpoint is restricted, then enable it with a 0.25 CU ceiling and Free's five-minute idle timeout. Validate migration, repeat publication and receipt replay on an isolated 0.25 CU branch; delete that branch even on failure. An Actions cleanup step also targets only this run's branch.
4. Apply the production receipt migration and reviewed `scripts/approve-issue-9.sql` transaction. Validate the independent queue canary without changing production counts; enable queued statistics, redeploy the same commit, and verify an authenticated production drain. Refresh the shared catalog and check MangaTranslate's public detail page, category/search visibility, and sitemap. Do not run the full seed as a substitute for publication. Existing environment variables are preserved; previous immutable preview deployments retain their old snapshots, and future preview deployments receive the updated project configuration.
5. Only after database and live-site verification, reply to and close issue #9, then disable the recovery workflow. Repeated runs must detect completed work rather than reset counters, duplicate a listing, or post repeated completion replies.

The Actions run page is the cloud execution record. Logs and step summaries must contain statuses, target IDs, and verification results only: no API tokens, passwords, full connection strings, environment dumps, or raw credential-bearing API responses. Newly generated secrets must be masked before any logging. No credentials or database export are uploaded as artifacts.

The local `.env` is not remotely writable while the Mac is off. Cloud recovery updates the authoritative production configuration. When local development resumes, synchronize the rotated database credential through the existing private local credential workflow; do not restore the exposed password or copy a connection string through chat.

## Failure handling

A failed run leaves the issue open and must not claim the listing is live. Inspect the Actions failure status before a manual retry. Scheduled retries remain bounded by the recovery window. A quota or authentication error must not trigger a paid upgrade, create another database, or bypass publication verification. If the bounded attempts cannot complete recovery, the run history is the failure record and the issue remains available for follow-up.

Once cloud preflight succeeds and the workflow is enabled on `main`, disable the old local Codex recovery automation to avoid a second independent executor. Disabling that local automation does not disable this GitHub workflow.

References: [Actions billing](https://docs.github.com/en/billing/concepts/product-billing/github-actions), [scheduled workflow behavior](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule), [automatic GitHub token](https://docs.github.com/en/actions/tutorials/authenticate-with-github_token), [Neon API keys](https://neon.com/docs/manage/api-keys), [Vercel project-scoped token creation](https://vercel.com/docs/rest-api/authentication/create-an-auth-token), and [catalog publication and batched statistics](catalog-operations.md).
