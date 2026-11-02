# Toools project guide

[README](../README.md) · [GitHub import guide](github-import.md) · [MIT License](../LICENSE)

**Find the right tools for your entire workflow.**

[Live site](https://toools.top) · [Submit a tool](https://github.com/korbinjoe/toools/issues/new?template=tool-submission.yml) · [Browse issues](https://github.com/korbinjoe/toools/issues)

Toools is an open-source **tool discovery and workflow curation platform**. It brings together GitHub Awesome lists, Product Hunt launches, maintainer selections, and community submissions. Explore recent additions, follow a workflow, or compare tools with visible source and popularity signals.

## Where the tools come from

| Source | What Toools collects | Public reference |
|--------|----------------------|------------------|
| GitHub search and organizations | Topic/keyword searches and repositories from an explicit organization allowlist | [Source config](../scripts/config/github-sources.json), [importer](../scripts/import-github.ts) |
| Generic GitHub directories | Markdown lists, tables, reference links, and JSON tool collections | [Parser](../scripts/lib/directory.ts), [import guide](github-import.md) |
| GitHub Awesome lists | Linked tools, descriptions, categories, and available repository stars | [Source collections](../scripts/lib/awesome.ts), [importer](../scripts/import-awesome-lists.ts) |
| Product Hunt | Products by topic, descriptions, launch-page links, and vote counts | [Importer](../scripts/import-producthunt.ts) |
| Maintainer selections | Initial tool collection, featured flags, workflow stages, and editor notes | [Tool seeds](../prisma/seed.ts), [workflow seeds](../prisma/seed-stacks.ts) |
| Community submissions | Tools and corrections suggested by makers and users through GitHub Issues | [Submit a tool](https://github.com/korbinjoe/toools/issues/new?template=tool-submission.yml) |

Imports normalize URLs and match website URLs, canonical GitHub repository URLs, and repository IDs before writing tools and provenance atomically. All new tools are `PENDING`; auto-approval is disabled even if legacy environment variables are set. Existing moderation states and editorial fields are preserved. Public directory queries include only `APPROVED` records. Approval does not establish that each product has been individually tested.

Primary source links appear on detail pages where saved. New GitHub directory discoveries retain the original file URL, Markdown line, file SHA, heading, and linked tool URL in `ToolDiscovery`. Multiple channels append provenance instead of replacing the primary source. The migration preserves legacy sources, whose URLs may still refer to the tool itself and whose historical discovery times are unknown. Use `npm run sources:inspect -- --slug TOOL_SLUG` to inspect the full provenance. Stars and votes are snapshots from import or backfill runs; there is no continuous refresh guarantee.

## How recommendations are selected

**Featured is a discovery flag.** Maintainers can set it in curated data. The Product Hunt importer sets it on newly imported products with **more than 1,000 votes**. A featured badge alone does not mean hands-on testing or an independent quality score.

| Surface | Current selection rule |
|---------|------------------------|
| Recently Added | Three tools beside the Hero, rotating through up to 36 newest approved entries within 30 days of the newest record. Each batch prefers at most two per category before filling gaps and remains newest first. Dates refer to addition to Toools. |
| Daily batches | Recent additions, featured picks, workflows, and category shortcuts rotate at midnight in Asia/Shanghai time. Default sets stay stable within a day while candidates are unchanged. “Another batch” switches immediately; fully displayed pools have no additional batch. This is discovery rotation, not personalization or a quality ranking. |
| Editor's Picks | Four tools rotate through up to 24 newest approved featured records, excluding the tools currently visible in Recently Added, even after either section changes batches. |
| Homepage workflows and categories | Three workflows per batch from all curated workflows; eight category shortcuts per batch from all categories. “View all” always opens the complete collection. |
| Browse | Default: featured first, then views. Other sorts: newest additions or outbound clicks. Category, pricing, platform, and open-source filters apply before sorting. |
| Other category tools | Automatic suggestions from the current tool's category, ordered by GitHub stars, then Product Hunt votes, then views. Category membership does not establish equivalent capabilities. |
| Workflow stages | Maintainer-defined tool choices and editor notes for a specific task. Related tools are selected from the stage's categories and ordered by `GitHub stars × 10 + Product Hunt votes`. |

GitHub stars, Product Hunt votes, views, and clicks provide popularity and activity context. **They are not quality ratings.** Views count tool-detail visits; clicks count tracked outbound visits, not unique users. Evaluate workflow fit and check current provider pricing, features, and licensing before choosing.

The homepage selector is public in [home-discovery.ts](../src/lib/home-discovery.ts); browse ordering lives in [tools/page.tsx](../src/app/tools/page.tsx), and workflow selection in [stacks.ts](../src/lib/stacks.ts). Visitors can read the same explanation at [Sources & Selection](https://toools.top/how-we-curate).

## What makes Toools different

Two entry points, one decision loop:

```
Home → Stacks (by workflow) ──→ Stack detail (stages + editor picks) ──┐
     → Browse (by tool)      ──→ Tool listing (search + filters)      ──┤
                                                                        ▼
                                                          Tool detail (decision hub)
                                                          → Visit website via tracked link
```

**Scenario first, tools second.** Popular Stacks like *Indie Developer Toolkit* and *Content Creator Suite* map each stage of a workflow to curated recommendations with editor notes — so you pick a path before picking individual apps.

## Features

### Tool Stacks (core)

- **Curated workflows** — Multi-stage tool chains for indie devs, creators, startups, and open-source maintainers
- **Stage recommendations** — Each stage links to approved tools with pricing and trust signals
- **Editor notes** — Short rationale for why specific tools fit a stage
- **Cross-linking** — Tool detail pages show *Part of these Stacks*; category pages nudge users toward full workflows

### Browse & decide

- **Search & filters** — Name, description, tags, category, pricing, platform, open-source, and featured status; sort by popularity, recency, or clicks
- **Editor's Picks** — Featured tools selected by recency, with duplicates removed across homepage sections
- **Rich tool pages** — About, use cases, pros & cons, alternatives, and an *At a Glance* sidebar (pricing, platforms, open source, signals, freshness)
- **Visible signals** — GitHub stars, Product Hunt votes, featured badges, and view/click counts on cards; saved source links on detail pages
- **Click tracking** — Outbound visits go through `/api/tools/[slug]/out` to increment click counts before redirecting

### Community & data

- **Community submissions** — Structured GitHub Issue template and in-app guide at [toools.top/submit](https://toools.top/submit)
- **Bulk import pipeline** — Scripts to seed from Product Hunt and GitHub Awesome lists, plus trust-signal backfill
- **Dark mode** — System-aware theme toggle

## Tech Stack

| Layer | Choices |
|-------|---------|
| Framework | [Next.js 16](https://nextjs.org) (App Router) |
| UI | [React 19](https://react.dev) + [Base UI](https://base-ui.com) + [shadcn/ui](https://ui.shadcn.com) |
| Language | TypeScript |
| Database | PostgreSQL via [Prisma 7](https://www.prisma.io) |
| Styling | [Tailwind CSS 4](https://tailwindcss.com) |
| Typography | [Geist](https://vercel.com/font) Sans & Mono |
| Icons | [Lucide](https://lucide.dev) |

## Getting Started

### Prerequisites

- Node.js 20.19+, 22.12+, or 24+ (Prisma 7 requirements)
- A PostgreSQL database (e.g. [Neon](https://neon.tech), local Postgres, or Vercel Postgres)

### 1. Clone and install

```bash
git clone https://github.com/korbinjoe/toools.git
cd toools
npm install
```

### 2. Configure environment

Create a `.env` file in the project root:

```env
DATABASE_URL="postgresql://user:password@host:5432/toools"
NEXT_PUBLIC_BASE_URL="http://localhost:3000"
```

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `DATABASE_TRANSPORT` | No | `pg` (default), or `neon-http` to use Neon over HTTPS when a local network blocks PostgreSQL connections |
| `TOOL_METRICS_MODE` | No | Use `disabled` for a local preview that reads a shared catalog without recording views/clicks; deployed `direct` and `queue` modes remain supported |
| `NEXT_PUBLIC_BASE_URL` | No | Public site URL (defaults to `https://toools.top`) |

Import and backfill scripts accept additional optional variables — see [Data import scripts](#data-import-scripts) below.

Local development reads the real `DATABASE_URL` from the ignored project `.env`; the server does not need the deployment's full environment. Keep this connection current after password rotation. If the configured database is already populated, skip migration and seed commands below when you only want to preview existing content.

For a local preview of an existing Neon catalog over HTTPS:

```bash
DATABASE_TRANSPORT=neon-http TOOL_METRICS_MODE=disabled npm run dev
```

The HTTP transport is opt-in and accepts only Neon-hosted PostgreSQL URLs. It uses a fresh 15-second timeout for each request, and supports catalog reads rather than interactive Prisma transactions. The metrics setting disables recording before creating an event or accessing the database or queue. It is not a general read-only database permission: do not run import, publication, or seed scripts when you only intend to browse. Restart the dev server after updating credentials or transport settings so its database client uses the new configuration. Successful local preview startup alone is not evidence that the database connection has succeeded; verify that catalog content appears without a saved-workflow fallback notice.

### 3. Set up the database

```bash
npx prisma migrate deploy
npx prisma db seed
npx tsx prisma/seed-stacks.ts
```

Recommended for the full product experience (Stacks pages and cross-links):

```bash
npx tsx prisma/seed-tool-enrichments.ts   # use cases, pros, cons on select tools
```

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run dev:webpack` | Start dev server with Webpack (instead of Turbopack) |
| `npm run build` | Generate Prisma client and build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run backfill:signals` | Backfill trust signals (PH votes, GitHub stars, sources) |
| `npx prisma db seed` | Seed the database with curated tools |
| `npx prisma studio` | Open Prisma's database GUI |

### Data import scripts

**Unified GitHub discovery**

```bash
npm run import:github -- --dry-run --limit 20
npx prisma migrate deploy
npm run import:github -- --new-limit 500
npm run sources:inspect -- --slug TOOL_SLUG
```

Configure Topics, keyword queries, allowed organizations, and Markdown/JSON directories in [github-sources.json](../scripts/config/github-sources.json). Dry-runs never connect to a database and deduplicate only within the current run. Database imports preserve moderation and primary sources, append provenance, and report identity conflicts. See the [GitHub import guide](github-import.md) for flags, filters, limits, reports, review fields, migration behavior, and tests.

These scripts live in `scripts/` (and `prisma/` for stack seeds). Database writes require `DATABASE_URL`; the unified GitHub dry-run works without a database.

**Product Hunt import**

```bash
npx tsx scripts/import-producthunt.ts
```

Authentication — set one of:

- `PRODUCTHUNT_TOKEN` — bearer token from [producthunt.com/v2/oauth/applications](https://www.producthunt.com/v2/oauth/applications)
- `PRODUCTHUNT_API_KEY` + `PRODUCTHUNT_API_SECRET` — client credentials (token fetched automatically)

Optional: `PH_POSTS_PER_TOPIC` (default `100`). New tools remain `PENDING`; `PH_AUTO_APPROVE` is no longer honored.

**GitHub Awesome lists import**

```bash
npx tsx scripts/import-awesome-lists.ts
```

Optional: `GITHUB_TOKEN` for higher API rate limits. This compatibility command runs the configured generic directory importer. New tools remain `PENDING`; `AWESOME_AUTO_APPROVE` is no longer honored.

**Trust signal backfill**

For tools imported before trust-signal fields were added:

```bash
npx tsx scripts/backfill-trust-signals.ts
# or
npm run backfill:signals
```

Options: `--dry-run`, `--skip-awesome`, `--skip-github-stars`, `--skip-producthunt`, `--limit N`. Requires `GITHUB_TOKEN` (recommended) and/or Product Hunt credentials for full backfill.

**Other utilities**

```bash
npx tsx scripts/sync-categories.ts       # Sync category definitions
npx tsx scripts/recategorize.ts          # Re-run category matching on existing tools
npx tsx scripts/fix-icons.ts             # Backfill missing favicons
npx tsx scripts/db-stats.ts              # Print database statistics
npx tsx prisma/seed-stacks.ts            # Seed tool stacks and stage recommendations
npx tsx prisma/seed-tool-enrichments.ts  # Seed use cases, pros, and cons
```

## Project Structure

```
src/
├── app/
│   ├── page.tsx              # Home — daily discovery, Recently Added, workflows, Editor's Picks
│   ├── how-we-curate/        # Public data sources and recommendation rules
│   ├── stacks/               # Workflow listing and stage-based stack detail
│   ├── tools/                # Browse listing (search, filters) and decision-focused detail
│   ├── categories/           # Category browse (with Stacks cross-links)
│   ├── submit/               # Community submission guide
│   └── api/                  # Click tracking redirect, featured tools API
├── components/               # Stack cards, tool signals, filters, layout
└── lib/                      # Database client, stacks data, signal helpers
prisma/
├── schema.prisma             # Tool, Category, Tag, Stack, Stage models
├── migrations/               # SQL migrations
├── seed.ts                   # Seed data (~100 curated tools)
├── seed-stacks.ts            # Nine curated workflows with stage recommendations
└── seed-tool-enrichments.ts  # Use cases, pros, cons for select tools
scripts/                      # Import and maintenance scripts
openspec/                     # Design proposals and change specs
```

Site navigation: **Stacks · Browse · Categories · Submit**

## Contributing

### Submit a tool

The easiest way to contribute is to [open a tool submission issue](https://github.com/korbinjoe/toools/issues/new?template=tool-submission.yml). Fill in the template with the tool name, URL, tagline, description, category, and pricing. Maintainers review and approve submissions. You can also start from the in-app submit page at [toools.top/submit](https://toools.top/submit).

### Contribute code

1. Fork the repository
2. Create a feature branch (`git checkout -b feat/my-feature`)
3. Make your changes and ensure `npm run lint` passes
4. Open a pull request with a clear description of what changed and why

Bug reports and feature suggestions are welcome via [GitHub Issues](https://github.com/korbinjoe/toools/issues).

## Deployment

The app is designed to deploy on [Vercel](https://vercel.com) with a managed PostgreSQL instance. Set `DATABASE_URL` in your deployment environment, then run migrations and seeds against the production database:

```bash
DATABASE_URL="postgresql://..." npx prisma migrate deploy
DATABASE_URL="postgresql://..." npx prisma db seed
DATABASE_URL="postgresql://..." npx tsx prisma/seed-stacks.ts
DATABASE_URL="postgresql://..." npx tsx prisma/seed-tool-enrichments.ts
```

See `openspec/changes/vercel-deployment/` for detailed deployment notes.

### Web Analytics

Vercel Web Analytics is mounted once in `src/app/layout.tsx` using
`@vercel/analytics/next`, covering page views and client-side navigation across
the site. No analytics API key or additional environment variable is required.

1. Open the [Toools Analytics dashboard](https://vercel.com/korbinzhaos-projects/toools/analytics) and enable Web Analytics if it is not already enabled.
2. Deploy this version to the existing Toools Vercel project.
3. Visit the deployed site, then check the dashboard for visitors, page views, and traffic sources.

Development mode logs analytics events locally without sending them to Vercel.
This integration adds page-view analytics; the existing tool view/click counters
remain separate. Tool-detail website clicks emit `tool_website_click` with the tool slug and source; verify custom-event availability and ingestion in the deployed Analytics dashboard.

See the [Vercel Web Analytics setup guide](https://vercel.com/docs/analytics/quickstart) for deployment and verification details.


### SEO and AI search visibility

Every primary route declares its canonical URL and social metadata. Normal tool-list pagination is crawlable; search and filter combinations use `noindex, follow`. The sitemap includes approved tools, populated categories, workflow pages, editorial information, and the automation comparison. Counters do not alter content timestamps, and the sitemap omits unreliable historical modification dates.

Three core workflows include source-linked selection guides. Tool editorial configuration, curated alternatives, and reference review dates are kept in `src/lib/tool-editorial.ts`; approved records display that guidance automatically. No database migration is needed.

Optional ownership-verification environment variables:

| Variable | Purpose |
|----------|---------|
| `GOOGLE_SITE_VERIFICATION` | Google Search Console HTML verification token |
| `BING_SITE_VERIFICATION` | Bing Webmaster Tools HTML verification token |

Set `NEXT_PUBLIC_BASE_URL=https://toools.top` for the production build. See [SEO/GEO implementation and measurement](../docs/seo-geo-implementation.md) for rollout checks, regression commands, and a fixed AI citation observation set.

## License

Licensed under the [MIT License](../LICENSE). Third-party tools and imported content retain their respective licenses.

SEO / GEO production rollout: [2026-10-13 release verification](seo-geo-release-2026-10-13.md) (historical snapshot).
