# Editor's Picks

`src/lib/editor-picks.ts` is the small, ordered source of truth. The homepage and
`GET /api/featured` both call `loadFeaturedTools()`. There is no random fallback,
daily rotation, or popularity threshold. Missing, unapproved, malformed, or
repurposed catalog entries are omitted; an unavailable catalog hides the section.
Recently Added omits the visible picks so a batch change cannot displace a pick.
The directory's existing Featured filter and popular ordering are separate and
continue to include familiar tools.

## Selection and weekly review

Recommend a manual review once a week; no recurring review job is installed.
Keep roughly three or four useful recommendations, and accept fewer when the
evidence is weak. For every pick:

- Resolve an existing APPROVED catalog slug and verify that its website still
  identifies the product and edition reviewed. Do not create a listing merely to
  fill this section.
- Name a concrete task and who benefits. Explain an advantage over the ordinary
  approach, such as uploading files, repeating manual steps, or keeping notes in
  a service-specific store. Obscurity alone is not a benefit.
- Check the provider's current official features, documentation, relevant
  platform/edition limits, and pricing where the recommendation depends on it.
  Keep source URLs and the actual review date beside the copy.
- Include a meaningful limitation. Documentation review does not establish
  hands-on testing, reliability, security, speed, or comparative benchmark results.
- Reject obvious default recommendations when they add no discovery value.
  Views, outbound clicks, Product Hunt votes, GitHub stars, and the legacy
  `featured` field are not editorial merit or selection inputs.
- Change or remove stale recommendations through an ordinary reviewed PR. Run
  preflight again, including the live catalog identity check. Do not substitute
  random or popular tools when a pick disappears.

## Initial documentation review: November 9, 2026

- **PDFsam Basic:** local page assembly for document packets, avoiding a server
  upload. Basic is for page operations; full text editing belongs to other tools
  or editions. [Official features and editions](https://pdfsam.org/pdfsam-basic/).
- **Squoosh:** inspect compression quality for an individual website image, with
  image processing in the browser. Choose quality yourself; usage analytics and
  before/after sizes are collected even though image contents stay local.
  [Official app](https://squoosh.app/),
  [official processing/analytics statement](https://github.com/GoogleChromeLabs/squoosh#privacy).
- **Markor:** portable Markdown and todo.txt files for Android writers who want
  offline editing in a normal folder. Android only; sync is a separate app's job.
  [Official features and sync FAQ](https://github.com/gsantner/markor#features).

These are editorial judgments based on those documents, not product test results.

## Outbound measurement

The website CTA reuses `ToolWebsiteLink`, the existing `/api/tools/:slug/out`
redirect, and Vercel's existing `tool_website_click` event with
`source=home_editors_picks`, `tool=<slug>`, and `destination=website`. Detail-page
links keep their existing `source=tool_detail`. No user identifier, new collector,
database table, or impression event is introduced. The redirect's existing click
counter aggregates all entry points; it does not identify homepage attribution.
Vercel custom events can identify those homepage CTA clicks when Web Analytics
is enabled and delivered. Neither those events nor homepage page views establish
card impressions, so **outbound CTR is not currently measurable**. A future CTR
report needs a defined, matching impression denominator.

## Release verification

The PR workflow runs the repository tests, lint, typecheck, build, and
`node --import tsx scripts/catalog-smoke.ts --editor-picks-preflight`. That uses
the existing read-only credential resolution, never changes endpoint state, and
checks approved catalog identities before starting the production build locally
with the real database and metrics disabled. It verifies the populated directory,
ChatGPT detail, an HTTP 404 for a missing slug, search, categories, both featured
responses, and their exact homepage order. Desktop/mobile screenshots are retained
briefly as CI artifacts. An event-driven check after a main push repeats public
HTTP verification on **https://toools.top** after deployment propagation. A READY
deployment or a static/degraded page alone is not passing evidence.
