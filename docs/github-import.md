# GitHub discovery and import

[README](../README.md) · [Source configuration](../scripts/config/github-sources.json) · [Production verification](github-import-rollout-2026-10-14.md)

The first-round GitHub pipeline discovers tools through Topics, keyword searches, an explicit organization allowlist, and generic directories hosted in GitHub repositories. Every new tool is `PENDING`. Existing `APPROVED`, `REJECTED`, and `PENDING` states remain unchanged, as do names, descriptions, pricing, featured flags, and editorial content. Importers may fill a missing GitHub URL and refresh GitHub stars or Product Hunt votes.

## Preview and import

```bash
# Discovery preview: no database connection or writes.
npm run import:github -- --dry-run --limit 20

# Before writing, configure DATABASE_URL, apply migrations, and seed categories.
npx prisma migrate deploy
npx prisma db seed

# Import candidates to PENDING, with identities and provenance in one transaction.
npm run import:github -- --limit 500

# Cap actual new tools instead of counting duplicates and skipped candidates.
npm run import:github -- --new-limit 500

# Inspect one tool, including every saved discovery and identity alias.
npm run sources:inspect -- --slug TOOL_SLUG
```

`DATABASE_URL` is required for writes and source inspection. `GITHUB_TOKEN` is recommended for higher GitHub API limits; public repository metadata and directory contents are sufficient. Store tokens in environment variables, never in the source configuration. A dry-run deduplicates within its own run and does **not** predict matches or conflicts against the database.

`PH_AUTO_APPROVE` and `AWESOME_AUTO_APPROVE` are no longer honored. The compatibility command `npx tsx scripts/import-awesome-lists.ts` invokes the same pipeline in `directories` mode. Product Hunt imports and trust-signal backfills also use the shared identity/provenance store; backfills preserve editorial featured flags.

For Neon databases where PostgreSQL connections are unavailable, use HTTPS:

```bash
npm run import:github -- --transport neon-http --new-limit 500
```

The HTTPS writer runs tool, alias, and discovery changes together in one transaction using a temporary SQL function. It shares the PostgreSQL writer's advisory lock and preserves moderation. Network retries reuse an operation ID to avoid duplicate creation after a lost response. If retries cannot determine the outcome, the run stops and its report marks `writeIndeterminate`; reconcile the actual database additions before resuming with the remaining new-tool budget. Source inspection currently uses PostgreSQL connections.

Publication and edits to existing approved tools also require the cache configuration described in [Catalog operations](catalog-operations.md). Importers refresh the public catalog once after committed approved-tool updates. New pending tools do not invalidate public content. For a reviewed approval SQL file use `npm run sql:publish -- --file path/to/reviewed.sql`; if publication committed and refresh failed, retry only `npm run cache:refresh`.

## SEO, GEO, and marketing coverage

The public category is **SEO & GEO & Marketing**; its stable slug remains `seo-marketing` so existing category URLs and tool relationships continue to work. GEO means generative engine optimization / AI search visibility here. Discovery deliberately uses full topic names and phrases rather than the ambiguous `geo` topic, which also includes geographic software.

Preview only this category's sources without spending the candidate budget on other categories:

```bash
npm run import:github -- --config scripts/config/github-seo-marketing-sources.json --dry-run --limit 500 --max-per-source 30
```

Remove `--dry-run` to import discovered candidates as `PENDING`, using the database and cache configuration above. Both the default and category-specific source configurations keep the 50-star minimum and the existing repository exclusions. Category-specific sources run before generic automation and AI sources in the default configuration because explicit discovery hints determine a new tool's initial category. Imports preserve the category and moderation of existing records.

A separate [reviewed tool list](../scripts/config/seo-marketing-tools.json) covers twelve concrete GitHub tools, including technical SEO, GEO / AI visibility, email marketing, and social publishing. This is a bounded editorial addition, separate from automatic discovery. Generate and inspect its targeted SQL, then publish it using the existing catalog publication workflow:

```bash
npm run curate:seo-marketing
npm run sql:publish -- --file scripts/sql/curate-seo-marketing.sql
```

The first command generates a SQL artifact without connecting to a database. The second command applies the reviewed changes and refreshes the public catalog. It is also the way to add these tools after seeding a fresh catalog; running the full seed again is unnecessary. Existing rejected tools stay rejected. See [the coverage review](seo-geo-marketing-coverage.md) for evidence, scope, and operating-cost notes. Source configuration and SQL generation alone do not update the live catalog.

## CLI options

| Option | Default | Meaning |
| --- | --- | --- |
| `--config PATH` | `scripts/config/github-sources.json` | JSON file defining sources and repository filters |
| `--mode MODE` | `all` | `all`, `topics`, `keywords`, `organizations`, or `directories` |
| `--limit N` | `10000` | Total candidates processed, including matches and filtered candidates |
| `--new-limit N` | None | Stop after N newly created tools; matches and skipped candidates do not consume this cap |
| `--transport TRANSPORT` | `pg` | PostgreSQL connection, or `neon-http` for atomic Neon HTTPS transactions |
| `--max-per-source N` | `100` | Per-source candidate cap; maximum `1000` |
| `--dry-run` | Off | Fetch and report candidates without connecting to a database |
| `--report PATH` | `reports/imports/github-TIMESTAMP.json` | JSON report destination |
| `--help` | Off | Print usage without connecting to GitHub or a database |

Examples:

```bash
npm run import:github -- --mode topics --dry-run --max-per-source 20
npm run import:github -- --mode organizations --limit 300
npm run import:github -- --config /path/to/sources.json --mode directories
```

Searches rank by stars. Each search returns at most 1,000 repositories; organization scans are sorted by most recent push. Directory parsing takes the first `--max-per-source` eligible entries per file. Caps provide bounded runs rather than an exhaustive inventory. Split broad searches by topic, dates, or star ranges and increase budgets for more coverage. Search qualifiers are documented by [GitHub](https://docs.github.com/en/search-github/searching-on-github/searching-for-repositories).

The client spaces search requests, retries network failures, malformed responses, short rate limits, and server failures up to three attempts, and fails if a requested rate-limit wait exceeds 60 seconds. Incomplete search results are reported as source errors rather than treated as complete. Reports preserve partial success, skipped reasons, identity conflicts, and source failures; any error makes the CLI exit with a nonzero status.

## Configure sources

```json
{
  "minStars": 50,
  "excludeTopics": ["awesome-list", "tutorial", "sdk", "dataset"],
  "topics": [
    { "topic": "automation", "categoryHint": "automation" }
  ],
  "keywords": [
    { "query": "\"note taking\" in:name,description,readme", "categoryHint": "writing-notes" }
  ],
  "organizations": [
    { "owner": "microsoft" },
    { "owner": "vercel", "categoryHint": "development" }
  ],
  "directories": [
    {
      "owner": "bradtraversy",
      "repo": "design-resources-for-developers",
      "path": "readme.md",
      "categoryHint": "design"
    },
    {
      "owner": "your-organization",
      "repo": "tool-catalog",
      "path": "data/tools.json",
      "ref": "main"
    }
  ]
}
```

The organization list is the allowlist: the importer never enumerates additional organizations. Empty arrays disable a source family. `categoryHint` must be an existing category slug; it takes precedence over automatic category matching. Without a hint, repository topics or directory headings provide categorization. `ref` is optional; the Contents API resolves the actual default branch when omitted. Directory files must be Markdown or JSON files smaller than 1 MB. Set a directory's optional `source` to `AWESOME_LIST` for Awesome collections; otherwise it is recorded as `GITHUB_DIRECTORY`.

Repository searches add `is:public`, `archived:false` and, unless already specified, a `stars:>=minStars` qualifier. The repository filter still enforces the global `minStars` value, so lower that value if using queries aimed at smaller projects. Private repositories, forks, archived or disabled repositories, templates, missing descriptions, excluded topics, and obvious tutorial/SDK/directory names are skipped. Curated directory repository entries bypass the star threshold but retain the other checks. These filters reduce noise; they do not replace review of whether a project is a usable tool.

## Generic directories

Markdown parsing supports linked bullet and numbered entries, table rows, reference links, headings up to level six, and descriptions. Relative navigation, fragments, code blocks, badges, credential-bearing URLs, and local addresses are excluded. The first eligible link in an entry is the tool; later documentation/demo links are not separate products. The same parser works regardless of whether the repository name contains “awesome”.

```markdown
## Automation
- [Flow](https://github.com/example/flow) — Automate repetitive tasks.

| Tool | Description |
| --- | --- |
| [Notes](https://notes.example) | Organize notes. |
```

JSON accepts an array or an object containing a `tools` array:

```json
{
  "tools": [
    {
      "name": "Flow",
      "url": "https://flow.example",
      "description": "Automate repetitive tasks.",
      "category": "automation",
      "github": "https://github.com/example/flow"
    }
  ]
}
```

`name` and `url` are required. `description`, `category`, and `github` are optional. Explicit GitHub links must identify repository roots. GitHub entries are enriched with repository ID, canonical URL, stars, topics, and detected license. Only a recognized common open-source SPDX ID sets the open-source flag; missing/custom licenses remain unverified. Unknown pricing uses the existing `FREEMIUM` placeholder on pending candidates with `pricingNeedsReview` in provenance metadata; platforms are left empty when unknown. Review these fields before approval.

## Identity and provenance

`ToolIdentity` stores unique aliases for normalized website URLs, canonical GitHub repository URLs, and GitHub repository IDs. Website normalization removes tracking parameters and fragments, preserves meaningful query parameters and paths, and equates HTTP/HTTPS and `www` variants. GitHub normalization handles case, trailing slashes, and `.git`. Repository IDs maintain identity across moves and renames after the repository has first been imported. Legacy website and repository URLs are also indexed when each run starts.

If aliases point at different tools, or different repositories claim the same website, the candidate is reported as a conflict. The importer does not silently merge or delete records. Identity claims, tool creation/update, and provenance writes use one transaction and a shared advisory lock, so concurrent importer runs converge on the same tool. Existing records are associated as they are encountered; ambiguous legacy duplicates require review.

`ToolDiscovery` retains the source family, discovery method, source key, original source URL, metadata, and `firstSeenAt`/`lastSeenAt`. Topics, keywords, organizations, directories, and Product Hunt discoveries coexist. Repeated discovery updates the last-seen timestamp without duplicating the same source record. Directory provenance points to the original file and Markdown line and records its file SHA, heading, and linked item URL. The original `Tool.source` and `Tool.sourceUrl` remain the primary source for existing UI compatibility and are not overwritten by later sources.

Each discovery stores its observed vote/star snapshot in metadata. The tool's Product Hunt vote signal is the greatest observed count across its launches, so processing a lower-vote launch cannot erase a stronger signal. GitHub stars are refreshed to the latest observed count. Neither field is a continuously refreshed measurement.

The migration preserves existing primary sources as `legacy` discovery records. Their true historical discovery time is unknown and is explicitly marked in metadata; the migration time is recorded instead. New discovery records retain the latest metadata, not every historical revision.

## Verification

```bash
npm run test:imports
npx tsc --noEmit
npm run lint
```

Unit and fixture tests cover parser formats, URL identities, filters, pagination, budgets, API failures, and discovery across all four channels. Real PostgreSQL tests cover repeat/concurrent imports, moderation preservation, repository renames, conflicts, transaction rollback, and migration of legacy sources. They run only when `TOOOLS_TEST_DATABASE_URL` points to an isolated loopback database named `toools_import_test`; the test suite clears tools in that test database. Apply migrations to the test database before running:

```bash
DATABASE_URL="postgresql://user@127.0.0.1:5432/toools_import_test" npx prisma migrate deploy
TOOOLS_TEST_DATABASE_URL="postgresql://user@127.0.0.1:5432/toools_import_test" npm run test:imports
```
