# Toools

**English** · [简体中文](docs/i18n/README.zh-CN.md) · [日本語](docs/i18n/README.ja.md) · [한국어](docs/i18n/README.ko.md) · [Español](docs/i18n/README.es.md) · [Français](docs/i18n/README.fr.md) · [Deutsch](docs/i18n/README.de.md) · [Português (Brasil)](docs/i18n/README.pt-BR.md)

**Find the right tools for your entire workflow.**

[Live site](https://toools.top) · [Submit a tool](https://github.com/korbinjoe/toools/issues/new?template=tool-submission.yml) · [Sources & selection](https://toools.top/how-we-curate)

Toools is an open-source tool discovery and workflow curation platform. Discover tools from GitHub Awesome lists, Product Hunt, maintainer selections, and community submissions — then choose tools that fit each stage of your work.

Choose a README language above. English is the reference version; these translations cover repository documentation, while the current website interface is in English.

## What you can do

- **Explore Tool Stacks** — Follow curated workflows for indie developers, creators, startups, and open-source maintainers, with stage recommendations and editor notes.
- **Browse and compare** — Search by name, description, or tags; filter by category, pricing, platform, open-source status, and featured status.
- **Make informed decisions** — Read use cases, pros and cons, alternatives, source links, GitHub stars, and Product Hunt votes on tool pages.
- **Discover daily picks** — Explore recent additions, featured tools, workflows, and categories with daily rotation and an “Another batch” control.
- **Contribute and import** — Submit tools through GitHub Issues or import collections with URL normalization and duplicate handling.
- **Use light or dark mode** — Follow your system theme or switch manually.

## Sources and selection

All new imports remain `PENDING`; automatic approval is disabled, including when legacy `PH_AUTO_APPROVE` or `AWESOME_AUTO_APPROVE` variables are set. Featured flags can come from maintainer curation or Product Hunt products with more than 1,000 votes. Approval and featured status do not establish hands-on testing. Stars, votes, views, and clicks are activity signals, not quality ratings; stars and votes are snapshots rather than continuously refreshed counts.

See the [selection policy](https://toools.top/how-we-curate) and [project guide](docs/project-guide.md) for detailed rules and source limitations.

## Tech stack

| Layer | Technology |
| --- | --- |
| Framework | Next.js 16 (App Router) + TypeScript |
| UI | React 19 + Base UI + shadcn/ui + Lucide + Geist |
| Database | PostgreSQL + Prisma 7 |
| Styling | Tailwind CSS 4 + next-themes |
| Analytics | Vercel Web Analytics + Speed Insights |

## Run locally

Requirements: npm, PostgreSQL, and Node.js 20.19+ (20.x), 22.12+ (22.x), or 24+, as required by Prisma 7.

```bash
git clone https://github.com/korbinjoe/toools.git
cd toools
npm install
```

Create `.env` in the repository root:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/toools"
NEXT_PUBLIC_BASE_URL="http://localhost:3000"
```

`DATABASE_URL` is required. `NEXT_PUBLIC_BASE_URL` is optional and defaults to `https://toools.top`; set it to your local URL for development. Keep credentials out of version control.

Apply migrations, seed tools before workflows, and start the development server:

```bash
npx prisma migrate deploy
npx prisma db seed
npx tsx prisma/seed-stacks.ts
npx tsx prisma/seed-tool-enrichments.ts
npm run dev
```

Open [localhost:3000](http://localhost:3000).

## Useful commands

| Command | Purpose |
| --- | --- |
| `npm run import:github -- --dry-run` | Import candidates without a database |
| `npm run sources:inspect -- --slug TOOL_SLUG` | Inspect all sources for a tool |
| `npm run dev` | Start development with Turbopack |
| `npm run dev:webpack` | Start development with Webpack |
| `npm run build` | Generate Prisma client and build for production |
| `npm run start` | Start the production server after a build |
| `npm run lint` | Run ESLint |
| `npm run backfill:signals` | Backfill source and popularity signals |
| `npx prisma studio` | Open Prisma Studio |

## Import data

### GitHub imports

The GitHub importer supports Topics, keyword searches, an organization allowlist, and generic Markdown/JSON directories. Edit [github-sources.json](scripts/config/github-sources.json) to choose sources. Run migrations before a database import; seed categories first. `--dry-run` makes no database connection and only detects duplicates within the current run. Database imports also match existing tools by website, repository URL, and GitHub repository ID, preserve moderation and editorial fields, and append source records with first/last discovery times. Conflicting identities are reported instead of merged.

```bash
npm run import:github -- --dry-run --limit 20
npx prisma migrate deploy
npm run import:github -- --new-limit 500
npm run sources:inspect -- --slug TOOL_SLUG
```

Use `GITHUB_TOKEN` for higher API limits and `DATABASE_URL` for actual imports. Legacy Awesome and Product Hunt commands use the same identity/provenance store and keep new tools pending. See the [GitHub import guide](docs/github-import.md) for configuration, limits, reports, tests, and source inspection.

```bash
npx tsx scripts/import-awesome-lists.ts
npx tsx scripts/import-producthunt.ts
```

Both importers require `DATABASE_URL`. Awesome imports optionally use `GITHUB_TOKEN` for higher rate limits. Product Hunt requires `PRODUCTHUNT_TOKEN` or both `PRODUCTHUNT_API_KEY` and `PRODUCTHUNT_API_SECRET`. See the [project guide](docs/project-guide.md#data-import-scripts) for options, backfill flags, and maintenance utilities.

## Documentation

- [Product versioning and release workflow](docs/versioning.md)
- [Changelog](CHANGELOG.md)
- [Project guide: curation rules, imports, architecture, deployment, and analytics](docs/project-guide.md)
- [SEO and AI search visibility: implementation and verification](docs/seo-geo-implementation.md)
- [Local development performance analysis](docs/local-dev-performance-analysis-2026-10-13.md)
- [OpenSpec proposals and implementation tasks](openspec/changes/)

## Contribute

Suggest a tool using the [submission template](https://github.com/korbinjoe/toools/issues/new?template=tool-submission.yml), report bugs in [GitHub Issues](https://github.com/korbinjoe/toools/issues), or open a pull request. For code changes, run `npm run lint` and `npm run build` with a configured database. When updating documentation, keep translations aligned with the English README and preserve the language links.

## License

Licensed under the [MIT License](LICENSE). Third-party tools, trademarks, and imported content retain their respective rights and licenses.
