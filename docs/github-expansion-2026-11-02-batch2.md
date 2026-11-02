# Reviewed GitHub expansion — 2026-11-02, batch 2

This batch adds 42 reviewed tools across fifteen existing categories. The [reviewed input](../scripts/config/github-reviewed-2026-11-02-batch2.json) records stable repository IDs, canonical repositories, dated star counts, maintenance state, platform and installation evidence, practical use cases, license evidence paths and hashes, and review notes.

## Discovery and selection

Three focused review groups covered developer and infrastructure tools; personal productivity and local utilities; and creative, AI, communications and marketing applications. Topic searches and targeted official-repository checks led to 76 repository reviews. Forty-two products passed the review; this is a bounded editorial batch rather than an exhaustive scan of GitHub.

The database baseline contained 7,131 records: 5,886 approved and 1,245 pending, with 2,076 identity aliases. Candidates were compared using stable repository IDs, current and reviewed historical repository URLs, normalized websites, identity aliases, names and proposed slugs. The selected tools had no baseline matches and no overlapping identities within the batch. Their 142 distinct identity aliases will prevent future repeated discovery from creating another listing. Existing pending or moderated listings are not promoted by this publication.

Already-listed products and older names, including Vane/Perplexica, Signal Desktop, Synfig Studio and Plausible, were excluded. Archived, stale, ambiguous and non-OSI candidates were omitted rather than given inferred license or maintenance claims. For example, Dockhand and lakeFS were not labeled as open source under their current Business Source licenses.

## Reviewed products

| Tool / official repository | Category | Purpose | Source-edition license |
| --- | --- | --- | --- |
| [Page Assist](https://github.com/n4ze3m/page-assist) | AI Assistants | Use local AI from a browser sidebar and chat interface | MIT |
| [Semaphore UI](https://github.com/semaphoreui/semaphore) | Automation | Run infrastructure tasks and schedules from a web interface | MIT |
| [Delta Chat Desktop](https://github.com/deltachat/deltachat-desktop) | Communication | Use Delta Chat messaging from a desktop computer | GPL-3.0 |
| [dblab](https://github.com/danvergara/dblab) | Data & Analytics | Work with local and remote databases from the terminal | MIT |
| [Harlequin](https://github.com/tconbeer/harlequin) | Data & Analytics | Explore databases with a SQL IDE in your terminal | MIT |
| [LazySQL](https://github.com/jorgerojas26/lazysql) | Data & Analytics | Manage database connections and SQL queries from the terminal | MIT |
| [Pgweb](https://github.com/sosedoff/pgweb) | Data & Analytics | Explore PostgreSQL through a lightweight web client | MIT |
| [rainfrog](https://github.com/achristmascarl/rainfrog) | Data & Analytics | Browse and query databases with a keyboard-driven terminal client | MIT |
| [Sling CLI](https://github.com/slingdata-io/sling-cli) | Data & Analytics | Move data between databases, files, and object storage | GPL-3.0 |
| [sqlit](https://github.com/Maxteabag/sqlit) | Data & Analytics | Connect to databases and query them from a terminal workspace | MIT |
| [gping](https://github.com/orf/gping) | Deploy & Hosting | Graph response times for hosts and commands | MIT |
| [Komodo](https://github.com/moghtech/komodo) | Deploy & Hosting | Build and deploy applications across your servers | GPL-3.0 |
| [Trippy](https://github.com/fujiapple852/trippy) | Deploy & Hosting | Investigate network routes, latency, and packet loss | Apache-2.0 |
| [Graphite Editor](https://github.com/GraphiteEditor/Graphite) | Design | Create vector and procedural graphics in a browser editor | Apache-2.0 |
| [delta](https://github.com/dandavison/delta) | Development | Read Git diffs with syntax highlighting and side-by-side views | MIT |
| [Difftastic](https://github.com/Wilfred/difftastic) | Development | Compare code changes using language syntax | MIT |
| [fq](https://github.com/wader/fq) | Development | Inspect and query binary files with a jq-style command line | MIT |
| [mise](https://github.com/jdx/mise) | Development | Manage development tools, environment variables, and project tasks | MIT |
| [Dufs](https://github.com/sigoden/dufs) | File Management | Serve and manage files through a browser or WebDAV | Apache-2.0 |
| [dupeGuru](https://github.com/arsenetar/dupeguru) | File Management | Find duplicate files with a desktop comparison workflow | GPL-3.0 |
| [Krokiet](https://github.com/qarmin/czkawka) | File Management | Find duplicate and unnecessary files with Czkawka’s current desktop UI | GPL-3.0-only |
| [ComfyUI](https://github.com/Comfy-Org/ComfyUI) | Image & Media | Build reusable AI media workflows with a visual node graph | GPL-3.0 |
| [InvokeAI](https://github.com/invoke-ai/InvokeAI) | Image & Media | Generate and refine images with a canvas and reusable workflows | Apache-2.0 |
| [Meshroom](https://github.com/alicevision/Meshroom) | Image & Media | Build 3D reconstruction pipelines from photographs | MPL-2.0 |
| [Deskflow](https://github.com/deskflow/deskflow) | Productivity | Share a keyboard and mouse across nearby computers | GPL-2.0 |
| [Floccus](https://github.com/floccusaddon/floccus) | Productivity | Sync browser bookmarks through storage you choose | MPL-2.0 |
| [Heimer](https://github.com/juzzlin/Heimer) | Productivity | Draw mind maps and export them as images or SVG | GPL-3.0 |
| [Kando](https://github.com/kando-menu/kando) | Productivity | Launch desktop actions from configurable pie menus | MIT |
| [Linkora](https://github.com/LinkoraApp/Linkora) | Productivity | Organize links and save webpages with optional self-hosted sync | MIT |
| [Sol](https://github.com/ospfranco/sol) | Productivity | Launch Mac apps and everyday actions from one command interface | MIT |
| [wnr](https://github.com/RoderickQiu/wnr) | Productivity | Use a desktop timer for focused work and time management | MPL-2.0 |
| [Tinyauth](https://github.com/tinyauthapp/tinyauth) | Security & Privacy | Add sign-in and access controls to self-hosted applications | AGPL-3.0 |
| [Ackee](https://github.com/electerious/Ackee) | SEO & GEO & Marketing | Monitor website traffic and events on your own server | MIT |
| [BillionMail](https://github.com/Billionmail/BillionMail) | SEO & GEO & Marketing | Run email campaigns and mailing infrastructure on your own server | AGPL-3.0 |
| [Shynet](https://github.com/milesmcc/shynet) | SEO & GEO & Marketing | Measure website traffic with a self-hosted analytics dashboard | Apache-2.0 |
| [Ksnip](https://github.com/ksnip/ksnip) | Utilities | Capture screenshots and annotate them on the desktop | GPL-3.0 |
| [Beutl](https://github.com/b-editor/beutl) | Video & Audio | Combine video, graphics, text, and audio in a desktop compositor | MIT |
| [Flowblade](https://github.com/jliljebl/flowblade) | Video & Audio | Edit and composite video with a Linux multitrack timeline | GPL-3.0 |
| [HyperFrames](https://github.com/heygen-com/hyperframes) | Video & Audio | Turn HTML compositions into rendered videos | Apache-2.0 |
| [Tangent](https://github.com/suchnsuch/Tangent) | Writing & Notes | Write linked Markdown notes with a visual navigation history | Apache-2.0 |
| [TreeSheets](https://github.com/aardappel/treesheets) | Writing & Notes | Organize notes and plans in nested spreadsheet-style grids | Zlib |
| [zk](https://github.com/zk-org/zk) | Writing & Notes | Manage a plain-text Zettelkasten from the command line | GPL-3.0 |

The review checked official repository metadata, README material, source-edition license texts or explicit application license declarations, and installation or release documentation. It did not install or execute upstream applications or perform a security audit. Star counts are dated observations, not continuous rankings. Hosting, external model APIs, model licenses, storage, commercial editions and other services can have separate costs or terms.

Specific edition boundaries are preserved: Krokiet is the current Czkawka desktop frontend with a GPL-3.0-only application declaration and separately licensed shared components; Kando code is MIT with separate asset/documentation notices; Graphite Editor is distinct from the existing Graphite monitoring product; Beutl's MIT main application has a separate GPL-3.0 FFmpeg worker. Meshroom's MPL-2.0 text and Windows/Linux installation scope were checked. Where GitHub reported NOASSERTION, actual license evidence was inspected and the conclusion recorded. Linkora's platform list was checked against its stable release assets. Meshroom and Flowblade use HTTPS homepages verified with normal certificate validation.

## Publication scope

The [reviewed SQL](../scripts/sql/curate-github-reviewed-2026-11-02-batch2.sql) uses one transaction and the existing importer identity lock. It resolves existing categories without changing their definitions. This publication's preflight requires all 42 records to be new. Existing APPROVED and REJECTED listings are left intact, counters are preserved, and identity or slug conflicts abort the transaction. Only these reviewed tools, their tags, additive provenance and identity aliases are published. No Stack, stage or recommendation is changed.

Use the existing private database and matching cache-refresh configuration. Submit the complete reviewed SET, lock and DO block as one atomic transaction, refresh the active production catalog and verify all committed fields, identities and public pages. A lost acknowledgment requires database reconciliation before replay; a refresh failure after commit requires only cache refresh. Do not run the full seed. Version 0.2.2 records this catalog update in the public changelog.
