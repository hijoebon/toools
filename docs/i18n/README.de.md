# Toools

[English](../../README.md) · [简体中文](../../docs/i18n/README.zh-CN.md) · [日本語](../../docs/i18n/README.ja.md) · [한국어](../../docs/i18n/README.ko.md) · [Español](../../docs/i18n/README.es.md) · [Français](../../docs/i18n/README.fr.md) · **Deutsch** · [Português (Brasil)](../../docs/i18n/README.pt-BR.md)

**Finde die passenden Tools für deinen gesamten Workflow.**

[Website besuchen](https://toools.top) · [Tool vorschlagen](https://github.com/korbinjoe/toools/issues/new?template=tool-submission.yml) · [Quellen und Auswahl](https://toools.top/how-we-curate)

Toools ist eine Open-Source-Plattform zum Entdecken von Tools und Zusammenstellen von Workflows. Sie vereint GitHub-Awesome-Listen, Product Hunt, die Auswahl der Projektverantwortlichen und Vorschläge der Community, damit du passende Tools für jede Arbeitsphase findest.

Über die Links oben kannst du die Sprache des README wechseln. Die englische Fassung ist die Referenz. Die Übersetzungen betreffen die Dokumentation des Repositorys; die aktuelle Website ist auf Englisch.

## Funktionen

- **Tool Stacks erkunden** — Ausgewählte Workflows für unabhängige Entwickler, Kreative, Startups und Open-Source-Verantwortliche, mit Empfehlungen je Phase und redaktionellen Hinweisen.
- **Suchen und vergleichen** — Suche nach Namen, Beschreibung oder Tags und filtere nach Kategorie, Preis, Plattform, Open-Source-Status und hervorgehobenen Tools.
- **Informiert entscheiden** — Lies Anwendungsfälle, Vor- und Nachteile, Alternativen, Quellen, GitHub-Sterne und Product-Hunt-Stimmen.
- **Tägliche Empfehlungen entdecken** — Neue Tools, hervorgehobene Tools, Workflows und Kategorien wechseln täglich; „Another batch“ zeigt eine weitere Gruppe.
- **Beitragen und importieren** — Schlage Tools über GitHub Issues vor oder importiere Sammlungen mit URL-Normalisierung und Behandlung von Duplikaten.
- **Helles und dunkles Design** — Folge dem Systemdesign oder wechsle manuell.

## Quellen und Auswahl

Alle neuen Importe bleiben `PENDING`. Die automatische Freigabe ist deaktiviert, auch wenn die früheren Variablen `PH_AUTO_APPROVE` oder `AWESOME_AUTO_APPROVE` gesetzt sind. Hervorhebungen entstehen durch redaktionelle Auswahl oder bei Product-Hunt-Produkten mit mehr als 1.000 Stimmen. Freigabe und Hervorhebung garantieren keine praktischen Tests. Sterne, Stimmen, Aufrufe und Klicks zeigen Aktivität, keine Qualitätsbewertung; Sterne und Stimmen sind Momentaufnahmen und werden nicht fortlaufend aktualisiert.

Details und Grenzen der Quellen stehen in den [Auswahlregeln](https://toools.top/how-we-curate) und im [Projektleitfaden](../../docs/project-guide.md).

## Technologien

| Ebene | Technologie |
| --- | --- |
| Framework | Next.js 16 (App Router) + TypeScript |
| Oberfläche | React 19 + Base UI + shadcn/ui + Lucide + Geist |
| Datenbank | PostgreSQL + Prisma 7 |
| Stile | Tailwind CSS 4 + next-themes |
| Analyse | Vercel Web Analytics + Speed Insights |

## Lokal ausführen

Voraussetzungen: npm, PostgreSQL und Node.js 20.19+ (20.x), 22.12+ (22.x) oder 24+, entsprechend den Anforderungen von Prisma 7.

```bash
git clone https://github.com/korbinjoe/toools.git
cd toools
npm install
```

Erstelle `.env` im Hauptverzeichnis des Repositorys:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/toools"
NEXT_PUBLIC_BASE_URL="http://localhost:3000"
```

`DATABASE_URL` ist erforderlich. `NEXT_PUBLIC_BASE_URL` ist optional und standardmäßig `https://toools.top`; verwende für die Entwicklung deine lokale URL. Zugangsdaten gehören nicht in die Versionsverwaltung.

Wende Migrationen an, lade zuerst Tools und dann Workflows und starte den Entwicklungsserver:

```bash
npx prisma migrate deploy
npx prisma db seed
npx tsx prisma/seed-stacks.ts
npx tsx prisma/seed-tool-enrichments.ts
npm run dev
```

Öffne [localhost:3000](http://localhost:3000).

## Nützliche Befehle

| Befehl | Zweck |
| --- | --- |
| `npm run import:github -- --dry-run` | Kandidaten ohne Datenbank ansehen |
| `npm run sources:inspect -- --slug TOOL_SLUG` | Alle Quellen eines Tools prüfen |
| `npm run dev` | Entwicklung mit Turbopack starten |
| `npm run dev:webpack` | Entwicklung mit Webpack starten |
| `npm run build` | Prisma-Client generieren und Produktionsversion bauen |
| `npm run start` | Produktionsserver nach dem Build starten |
| `npm run lint` | ESLint ausführen |
| `npm run backfill:signals` | Quellen und Popularitätssignale ergänzen |
| `npx prisma studio` | Prisma Studio öffnen |

## Daten importieren

### GitHub-Importe

Der GitHub-Importer unterstützt Topics, Stichwortsuche, eine Liste zugelassener Organisationen und allgemeine Markdown/JSON-Verzeichnisse. Wähle die Quellen in [github-sources.json](../../scripts/config/github-sources.json). Wende vor Datenbankimporten die Migrationen an und initialisiere die Kategorien. `--dry-run` verbindet sich nicht mit einer Datenbank und erkennt nur Duplikate im aktuellen Lauf. Tatsächliche Importe gleichen bestehende Tools auch über Website, Repository-URL und GitHub-Repository-ID ab, bewahren Moderation und redaktionelle Felder und ergänzen Quellen mit erstem und letztem Fundzeitpunkt. Identitätskonflikte werden gemeldet und nicht automatisch zusammengeführt.

```bash
npm run import:github -- --dry-run --limit 20
npx prisma migrate deploy
npm run import:github -- --new-limit 500
npm run sources:inspect -- --slug TOOL_SLUG
```

Verwende `GITHUB_TOKEN` für höhere API-Limits und `DATABASE_URL` für tatsächliche Importe. Die bisherigen Awesome- und Product-Hunt-Befehle verwenden denselben Speicher für Identitäten und Quellen und lassen neue Tools ungeprüft. Konfiguration, Grenzen, Berichte, Tests und Quellenprüfung stehen im [GitHub-Importleitfaden](../../docs/github-import.md).

```bash
npx tsx scripts/import-awesome-lists.ts
npx tsx scripts/import-producthunt.ts
```

Beide Importer benötigen `DATABASE_URL`. Awesome kann optional `GITHUB_TOKEN` für ein höheres API-Limit nutzen. Product Hunt benötigt `PRODUCTHUNT_TOKEN` oder sowohl `PRODUCTHUNT_API_KEY` als auch `PRODUCTHUNT_API_SECRET`. Optionen, Parameter zum Ergänzen von Daten und Wartungswerkzeuge stehen im [Projektleitfaden](../../docs/project-guide.md#data-import-scripts).

## Dokumentation

- [Produktversionierung und Release-Ablauf](../../docs/versioning.md)
- [Änderungsprotokoll](../../CHANGELOG.md)
- [Projektleitfaden: Auswahl, Importe, Architektur, Bereitstellung und Analyse](../../docs/project-guide.md)
- [SEO und Sichtbarkeit in der KI-Suche: Umsetzung und Prüfung](../../docs/seo-geo-implementation.md)
- [Leistungsanalyse der lokalen Entwicklung](../../docs/local-dev-performance-analysis-2026-10-13.md)
- [OpenSpec-Vorschläge und Implementierungsaufgaben](../../openspec/changes/)

## Mitwirken

Schlage ein Tool mit der [Vorlage](https://github.com/korbinjoe/toools/issues/new?template=tool-submission.yml) vor, melde Fehler über [GitHub Issues](https://github.com/korbinjoe/toools/issues) oder öffne einen Pull Request. Führe bei Codeänderungen `npm run lint` und `npm run build` mit eingerichteter Datenbank aus. Halte Übersetzungen bei Dokumentationsänderungen mit dem englischen README synchron und behalte die Sprachlinks bei.

## Lizenz

Veröffentlicht unter der [MIT-Lizenz](../../LICENSE). Externe Tools, Marken und importierte Inhalte behalten ihre jeweiligen Rechte und Lizenzen.
