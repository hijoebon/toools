# Reviewed GitHub expansion — 2026-11-02

This batch adds 35 reviewed tools across twelve existing categories. The [reviewed input](../scripts/config/github-reviewed-2026-11-02.json) records stable repository IDs, current canonical repositories, observed star counts, maintenance state, installation evidence, license file links and hashes, platform scope, use cases, and reviewer notes.

## Discovery and selection

The bounded topic/keyword scan processed 487 candidate records across eighteen configured searches. It retained 449 unique dry-run candidates, matched fifteen repeats within the run, and skipped twenty-one entries. Two website identity conflicts were reported rather than merged. These dry-run totals do not represent database additions or an exhaustive GitHub inventory. Targeted official-repository reviews supplemented that discovery scan.

The database baseline contained 7,095 records (5,850 approved and 1,245 pending) and 1,967 identity aliases. The final batch was compared using repository IDs, canonical GitHub URLs, normalized websites, aliases and proposed slugs. None of the selected 35 matched an existing listing. Popular tools already approved were excluded; existing duplicate groups such as AppFlowy, Mealie, Super Productivity, Gitleaks and Restic were left for separate identity review. No existing listing is silently merged, deleted or re-approved by this batch.

## Reviewed products

| Tool / official repository | Category | Purpose | Source-edition license |
| --- | --- | --- | --- |
| [Goose](https://github.com/aaif-goose/goose) | AI Assistants | A desktop and terminal AI agent for everyday workflows | Apache-2.0 |
| [LibreChat](https://github.com/LibreChat-AI/LibreChat) | AI Assistants | A self-hosted workspace for AI chat, files, and agents | MIT |
| [AutoKey](https://github.com/autokey/autokey) | Automation | Automate text entry and desktop actions on Linux | GPL-3.0 |
| [DbGate Community](https://github.com/dbgate/dbgate) | Data & Analytics | Query and browse SQL and NoSQL databases | GPL-3.0 |
| [Arcane](https://github.com/getarcaneapp/arcane) | Deploy & Hosting | Manage Docker environments through a web dashboard | BSD-3-Clause |
| [Coroot Community Edition](https://github.com/coroot/coroot) | Deploy & Hosting | Investigate application health with connected telemetry | Apache-2.0 |
| [Dozzle](https://github.com/amir20/dozzle) | Deploy & Hosting | Watch container logs from a browser | MIT |
| [drawDB](https://github.com/drawdb-io/drawdb) | Development | Design database diagrams and generate SQL in a browser | AGPL-3.0 |
| [Docfd](https://github.com/darrenldl/docfd) | File Management | Find passages across local documents from the terminal | MIT |
| [Kopia](https://github.com/kopia/kopia) | File Management | Back up files with encrypted incremental snapshots | Apache-2.0 |
| [organize](https://github.com/tfeldmann/organize) | File Management | Sort and rename files with reusable rules | MIT |
| [Pinta](https://github.com/PintaProject/Pinta) | Image & Media | A straightforward desktop painting and image editor | MIT |
| [Ditto](https://github.com/sabrogden/Ditto) | Productivity | Search and reuse clipboard history on Windows | GPL-3.0 |
| [Faved](https://github.com/denho/faved) | Productivity | Manage bookmark collections with nested tags and search | MIT |
| [Mindwtr](https://github.com/dongdongbh/Mindwtr) | Productivity | Capture tasks and follow a guided GTD workflow | AGPL-3.0 |
| [age](https://github.com/FiloSottile/age) | Security & Privacy | Encrypt files with recipient keys or passphrases | BSD-3-Clause |
| [CrowdSec Security Engine](https://github.com/crowdsecurity/crowdsec) | Security & Privacy | Detect suspicious activity and connect defensive responses | MIT |
| [OpenBao](https://github.com/openbao/openbao) | Security & Privacy | Manage application secrets, certificates, and keys | MPL-2.0 |
| [Pocket ID](https://github.com/pocket-id/pocket-id) | Security & Privacy | Self-hosted sign-in with passkeys and OpenID Connect | BSD-2-Clause |
| [SOPS](https://github.com/getsops/sops) | Security & Privacy | Edit encrypted configuration and secrets files | MPL-2.0 |
| [Syft](https://github.com/anchore/syft) | Security & Privacy | Generate software bills of materials from images and files | Apache-2.0 |
| [WGDashboard](https://github.com/WGDashboard/WGDashboard) | Security & Privacy | Manage WireGuard peers and configurations in a browser | Apache-2.0 |
| [Nilesoft Shell](https://github.com/moudey/Shell) | Utilities | Customize Windows File Explorer context menus | MIT |
| [NormCap](https://github.com/dynobo/normcap) | Utilities | Copy text from a selected screen region | GPL-3.0-or-later |
| [OCRmyPDF](https://github.com/ocrmypdf/OCRmyPDF) | Utilities | Add searchable text to scanned PDF documents | MPL-2.0 |
| [PDF Arranger](https://github.com/pdfarranger/pdfarranger) | Utilities | Arrange, crop, split, and merge PDF pages visually | GPL-3.0 |
| [PDFsam Basic](https://github.com/torakiki/pdfsam) | Utilities | Split, merge, rotate, and extract PDF pages offline | AGPL-3.0 |
| [Sioyek](https://github.com/ahrm/sioyek) | Utilities | A keyboard-focused PDF reader for technical documents | GPL-3.0 |
| [Text Grab](https://github.com/TheJoeFin/Text-Grab) | Utilities | Extract and clean up on-screen text with local OCR | MIT |
| [Kdenlive](https://github.com/KDE/kdenlive) | Video & Audio | Edit video with a multitrack desktop workflow | GPL-3.0 |
| [OpenShot](https://github.com/OpenShot/openshot-qt) | Video & Audio | A cross-platform video editor with titles and keyframes | GPL-3.0-or-later |
| [OpenToonz](https://github.com/opentoonz/opentoonz) | Video & Audio | Create 2D animation with drawing and compositing tools | BSD-3-Clause |
| [Subtitle Edit](https://github.com/SubtitleEdit/subtitleedit) | Video & Audio | Create, synchronize, and convert video subtitles | MIT |
| [CherryTree](https://github.com/giuspen/cherrytree) | Writing & Notes | Organize rich-text notes and code in a local tree | GPL-3.0-or-later |
| [Markor](https://github.com/gsantner/markor) | Writing & Notes | Edit Markdown notes and plain-text tasks on Android | Apache-2.0 |

The listed edition is open source; hosting, model inference, external providers, commercial editions and managed services can have separate charges. DbGate and Coroot are explicitly scoped to Community editions, CrowdSec to the public Security Engine, and PDFsam to Basic. Where automatic SPDX detection returned NOASSERTION, reviewers inspected the license text and documented the result rather than assuming open-source status. The review checked official metadata, README, license and installation/release documentation. It did not install upstream applications or perform a security audit. Star counts are dated observations rather than continuously updated values.

## Publication scope

The [reviewed SQL](../scripts/sql/curate-github-reviewed-2026-11-02.sql) uses one transaction and the importer identity lock. Each candidate resolves an existing category; category names and definitions are not changed. Existing APPROVED or REJECTED records are preserved. New tools and explicitly matched PENDING records in this reviewed input become APPROVED, with tags, source provenance and unique identities. Existing counters, primary provenance, IDs and slugs are retained. Identity or slug conflicts roll back the whole batch. No Stack or stage is changed.

Publication requires the existing private database and matching cache-refresh configuration. Execute the full reviewed transaction once, refresh the active production catalog, and verify the committed rows and pages. A lost write acknowledgment requires database reconciliation before any replay; a cache-refresh failure after commit requires only the refresh operation. Do not rerun the full seed. The local transport can use an atomic Neon HTTPS transaction preserving the reviewed SET, lock and complete DO block.
