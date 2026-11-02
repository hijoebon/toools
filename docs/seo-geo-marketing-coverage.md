# SEO & GEO & Marketing coverage

Reviewed on **2026-11-02**. The display name expands while the category slug stays `seo-marketing` to preserve existing URLs and relationships.

## Why GitHub coverage was missing

The default discovery configuration previously focused on productivity, automation, developer tools, notes, and AI agents. It had no SEO, GEO, email-marketing, or social-marketing topics or keyword searches. Some relevant projects could appear through generic self-hosting or automation sources, but those paths did not provide reliable coverage or category hints.

The default configuration now starts with dedicated category topics and keyword searches. A [category-only configuration](../scripts/config/github-seo-marketing-sources.json) prevents unrelated sources from consuming a targeted run's budget. It retains the default 50-star floor and exclusions for archived repositories, forks, templates, tutorials, SDKs, and datasets. Broad `geo` discovery is intentionally absent: geographic libraries are unrelated to generative engine optimization.

## Reviewed editorial additions

The machine-readable [tool list](../scripts/config/seo-marketing-tools.json) records twelve listings, official repository IDs, license identifiers, descriptions, use cases, source links, and the review date. Each is a public, non-archived application with documented setup; none is a tutorial or an Awesome list. Repository metadata, README content, and license files were checked through GitHub's connected tools and official repository pages. This review checks product identity and documented scope; it does not claim to have installed or run the upstream applications.

| Tool | Coverage added | Official evidence |
| --- | --- | --- |
| OpenSEO | Keyword research, rank tracking, backlink research, site audits, and AI visibility. DataForSEO usage and hosted service costs are separate. | [Repository and README](https://github.com/every-app/open-seo), [MIT license](https://github.com/every-app/open-seo/blob/main/LICENSE) |
| SEOnaut | Technical SEO crawling and severity-based reports for broken links, redirects, metadata, and headings. | [Repository and README](https://github.com/StJudeWasHere/seonaut), [MIT license](https://github.com/StJudeWasHere/seonaut/blob/main/LICENSE) |
| SerpBear | Self-hosted keyword-position tracking, change reports, and a reporting API. Scraping services and proxies may cost extra. | [Repository and README](https://github.com/towfiqi/serpbear), [MIT license](https://github.com/towfiqi/serpbear/blob/main/LICENSE) |
| SiteOne Crawler | Cross-platform crawling, SEO and quality audits, report export, and optional AI-assisted metadata / llms.txt work. | [Repository and README](https://github.com/janreges/siteone-crawler), [MIT license](https://github.com/janreges/siteone-crawler/blob/main/LICENSE) |
| LibreCrawl | Web-based SEO crawling, JavaScript rendering, link analysis, and structured exports. | [Repository and README](https://github.com/PhialsBasement/LibreCrawl), [MIT license](https://github.com/PhialsBasement/LibreCrawl/blob/main/LICENSE) |
| OneGlanse | GEO / AEO measurement through captured AI-product answers: mentions, citations, recommendations, and competitors. Bring your own accounts and analysis key. | [Repository and README](https://github.com/oneglanse/oneglanse), [MIT license](https://github.com/oneglanse/oneglanse/blob/main/LICENSE) |
| Mautic | Marketing automation, audience segmentation, and multichannel campaigns on your infrastructure. | [Repository and README](https://github.com/mautic/mautic), [GPL license](https://github.com/mautic/mautic/blob/7.x/LICENSE.txt) |
| listmonk | Standalone newsletters, subscriber lists, and email campaigns. Delivery and hosting are separate. | [Repository and README](https://github.com/knadh/listmonk), [AGPL license](https://github.com/knadh/listmonk/blob/master/LICENSE) |
| Keila | Newsletter creation, subscribers, and signup forms. Self-hosting and the paid cloud service are distinct choices. | [Repository and README](https://github.com/pentacent/keila), [AGPL license](https://github.com/pentacent/keila/blob/main/LICENSE.md) |
| SendPortal | Email campaigns, mailing lists, delivery tracking, reports, and multiple workspaces. Email-provider charges are separate. | [Repository and README](https://github.com/mettle/sendportal), [MIT license](https://github.com/mettle/sendportal/blob/master/LICENSE) |
| Postiz | Social-media scheduling, publishing, team collaboration, analytics, and automation integrations. Cloud, provider, and infrastructure costs are separate. | [Repository and README](https://github.com/gitroomhq/postiz-app), [AGPL license](https://github.com/gitroomhq/postiz-app/blob/main/LICENSE) |
| Mixpost Lite | MIT-licensed community social-media scheduling; commercial Pro and Enterprise features are outside this listing's open-source scope. | [Repository and README](https://github.com/inovector/mixpost), [MIT license](https://github.com/inovector/mixpost/blob/main/LICENSE.md) |

`OPEN_SOURCE` describes the listed source edition and is not a promise that hosting, data APIs, email delivery, model inference, or commercial editions are free. Star counts are not hardcoded in the editorial file because the GitHub metadata connector did not return an exact current count; the normal importer can refresh them from live repository metadata.

## Marketing growth workflow

The existing `/stacks/marketing-seo-growth` URL becomes **Marketing, SEO & GEO Growth**. Its five stages are Keyword Research, Content Creation, Distribution, **GEO & AI Visibility**, and Measurement. The new GEO stage covers:

- **SiteOne Crawler:** AI search readiness, including crawlability and extractable content. Its [official AI GEO audit documentation](https://github.com/janreges/siteone-crawler#ai-search-readiness---ai-geo) describes the optional `--ai-geo` checks.
- **OneGlanse:** saved AI-product answers, brand mentions, recommendations, citations, and competitor comparisons.
- **OpenSEO:** AI visibility alongside SEO research and audits.

Compare a consistent prompt set over time and preserve the underlying answers. AI citations, referrals, and conversions are separate outcomes; a readiness audit or `llms.txt` file does not guarantee citation. The final Measurement stage retains search traffic and on-site behavior tools for those different outcomes.

The shared [workflow definition](../src/lib/marketing-growth-stack.ts) supplies the seed, saved-workflow preview, and reviewed SQL publication. The publication updates only this Stack, preserves its ID and the original four stage IDs, inserts or updates the GEO stage, moves Measurement to fifth, and resolves approved GEO recommendations through their reviewed repository identities rather than assuming their catalog slugs. The existing four stages and their recommendations are retained. A missing Stack is left for the complete stack seed rather than creating a partial workflow.

The live Stack page reads its database stages. Updating source files or generating SQL alone does not update the real-database preview. Apply the reviewed publication and refresh the matching catalog cache before claiming the five-stage workflow is live; do not rerun the full stack seed against an existing database for this change.

## Apply the reviewed list

```bash
# Generate the bounded, reviewable SQL artifact; no database writes.
npm run curate:seo-marketing

# Apply the reviewed changes and refresh the public catalog.
npm run sql:publish -- --file scripts/sql/curate-seo-marketing.sql
```

Use the same workflow after a fresh catalog seed; do not rerun the full seed to add these twelve tools to an existing database. The targeted path matches existing identities, preserves rejected records and unrelated editorial fields, and limits publication to this reviewed list. New automatic discoveries remain `PENDING` under the existing importer policy.

This document and the generated SQL describe prepared changes. A successful catalog publication receipt is required before claiming the live site has changed.

## Continue discovery

```bash
npm run import:github -- --config scripts/config/github-seo-marketing-sources.json --dry-run --limit 500 --max-per-source 30
```

Remove `--dry-run` only when importing new candidates into the review queue. A capped discovery run is not an exhaustive census: search results are ranked by stars and per-source limits still apply. Review the report for source errors, exclusions, duplicates, and identity conflicts before treating it as a coverage measurement.
