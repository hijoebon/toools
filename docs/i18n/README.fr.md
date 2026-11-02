# Toools

[English](../../README.md) · [简体中文](../../docs/i18n/README.zh-CN.md) · [日本語](../../docs/i18n/README.ja.md) · [한국어](../../docs/i18n/README.ko.md) · [Español](../../docs/i18n/README.es.md) · **Français** · [Deutsch](../../docs/i18n/README.de.md) · [Português (Brasil)](../../docs/i18n/README.pt-BR.md)

**Trouvez les bons outils pour chaque étape de votre travail.**

[Voir le site](https://toools.top) · [Proposer un outil](https://github.com/korbinjoe/toools/issues/new?template=tool-submission.yml) · [Sources et sélection](https://toools.top/how-we-curate)

Toools est une plateforme open source de découverte d’outils et de sélection de workflows. Elle rassemble des listes Awesome de GitHub, des produits de Product Hunt, les choix des responsables du projet et les propositions de la communauté pour vous aider à choisir des outils à chaque étape.

Changez la langue du README avec les liens ci-dessus. La version anglaise fait référence ; les traductions concernent la documentation du dépôt, tandis que l’interface actuelle du site est en anglais.

## Fonctionnalités

- **Explorez les Tool Stacks** — Des workflows sélectionnés pour les développeurs indépendants, les créateurs, les startups et les responsables de projets open source, avec recommandations par étape et notes éditoriales.
- **Parcourez et comparez** — Recherchez par nom, description ou tags et filtrez par catégorie, tarif, plateforme, statut open source et mise en avant.
- **Choisissez avec des repères** — Consultez les cas d’usage, avantages et inconvénients, alternatives, sources, étoiles GitHub et votes Product Hunt.
- **Découvrez les sélections quotidiennes** — Nouveautés, outils mis en avant, workflows et catégories changent chaque jour ; « Another batch » affiche un autre groupe.
- **Contribuez et importez** — Proposez des outils via GitHub Issues ou importez des collections avec normalisation des URL et gestion des doublons.
- **Thème clair ou sombre** — Suivez le thème du système ou changez-le manuellement.

## Sources et sélection

Tous les nouveaux imports restent `PENDING` ; l’approbation automatique est désactivée, même si les anciennes variables `PH_AUTO_APPROVE` ou `AWESOME_AUTO_APPROVE` sont définies. La mise en avant peut provenir de la sélection éditoriale ou de produits Product Hunt dépassant 1 000 votes. L’approbation et la mise en avant ne garantissent pas des tests pratiques. Les étoiles, votes, vues et clics indiquent l’activité, pas la qualité ; les étoiles et votes sont des instantanés, sans mise à jour continue.

Consultez la [politique de sélection](https://toools.top/how-we-curate) et le [guide du projet](../../docs/project-guide.md) pour les règles détaillées et les limites des sources.

## Technologies

| Couche | Technologie |
| --- | --- |
| Framework | Next.js 16 (App Router) + TypeScript |
| Interface | React 19 + Base UI + shadcn/ui + Lucide + Geist |
| Base de données | PostgreSQL + Prisma 7 |
| Styles | Tailwind CSS 4 + next-themes |
| Analyse | Vercel Web Analytics + Speed Insights |

## Exécution locale

Prérequis : npm, PostgreSQL et Node.js 20.19+ (20.x), 22.12+ (22.x) ou 24+, conformément aux exigences de Prisma 7.

```bash
git clone https://github.com/korbinjoe/toools.git
cd toools
npm install
```

Créez `.env` à la racine du dépôt :

```env
DATABASE_URL="postgresql://user:password@localhost:5432/toools"
NEXT_PUBLIC_BASE_URL="http://localhost:3000"
```

`DATABASE_URL` est obligatoire. `NEXT_PUBLIC_BASE_URL` est facultatif et vaut `https://toools.top` par défaut ; utilisez votre URL locale pendant le développement. Ne versionnez pas les identifiants.

Appliquez les migrations, chargez les outils avant les workflows et démarrez le serveur de développement :

```bash
npx prisma migrate deploy
npx prisma db seed
npx tsx prisma/seed-stacks.ts
npx tsx prisma/seed-tool-enrichments.ts
npm run dev
```

Ouvrez [localhost:3000](http://localhost:3000).

## Commandes utiles

| Commande | Fonction |
| --- | --- |
| `npm run import:github -- --dry-run` | Prévisualiser les candidats sans base de données |
| `npm run sources:inspect -- --slug TOOL_SLUG` | Consulter toutes les sources d’un outil |
| `npm run dev` | Démarrer le développement avec Turbopack |
| `npm run dev:webpack` | Démarrer le développement avec Webpack |
| `npm run build` | Générer le client Prisma et compiler pour la production |
| `npm run start` | Démarrer le serveur de production après compilation |
| `npm run lint` | Exécuter ESLint |
| `npm run backfill:signals` | Compléter les sources et indicateurs de popularité |
| `npx prisma studio` | Ouvrir Prisma Studio |

## Importer des données

### Imports GitHub

L’importeur GitHub prend en charge les Topics, les recherches par mots-clés, une liste d’organisations autorisées et les répertoires Markdown/JSON génériques. Choisissez les sources dans [github-sources.json](../../scripts/config/github-sources.json). Appliquez les migrations et initialisez les catégories avant un import en base. `--dry-run` ne se connecte pas à une base et ne détecte les doublons que dans l’exécution en cours. Les imports réels identifient aussi les outils existants par site, URL et ID de dépôt, préservent la modération et les champs éditoriaux, et ajoutent les sources avec les dates de première et dernière découverte. Les conflits d’identité sont signalés sans fusion automatique.

```bash
npm run import:github -- --dry-run --limit 20
npx prisma migrate deploy
npm run import:github -- --new-limit 500
npm run sources:inspect -- --slug TOOL_SLUG
```

Utilisez `GITHUB_TOKEN` pour augmenter les quotas et `DATABASE_URL` pour les imports réels. Les anciennes commandes Awesome et Product Hunt partagent le même stockage des identités et sources, en gardant les nouveaux outils en attente. Consultez la configuration, les limites, les rapports, les tests et l’inspection des sources dans le [guide d’import GitHub](../../docs/github-import.md).

```bash
npx tsx scripts/import-awesome-lists.ts
npx tsx scripts/import-producthunt.ts
```

Les deux importeurs nécessitent `DATABASE_URL`. Awesome peut utiliser `GITHUB_TOKEN` pour augmenter le quota de l’API. Product Hunt nécessite `PRODUCTHUNT_TOKEN` ou à la fois `PRODUCTHUNT_API_KEY` et `PRODUCTHUNT_API_SECRET`. Les options, paramètres de mise à jour et utilitaires sont décrits dans le [guide du projet](../../docs/project-guide.md#data-import-scripts).

## Documentation

- [Versions du produit et procédure de publication](../../docs/versioning.md)
- [Journal des modifications](../../CHANGELOG.md)
- [Guide du projet : sélection, imports, architecture, déploiement et analyse](../../docs/project-guide.md)
- [SEO et visibilité dans les recherches par IA : mise en œuvre et vérification](../../docs/seo-geo-implementation.md)
- [Analyse des performances du développement local](../../docs/local-dev-performance-analysis-2026-10-13.md)
- [Propositions et tâches d’implémentation OpenSpec](../../openspec/changes/)

## Contribuer

Proposez un outil avec le [modèle](https://github.com/korbinjoe/toools/issues/new?template=tool-submission.yml), signalez un bug dans [GitHub Issues](https://github.com/korbinjoe/toools/issues) ou ouvrez une Pull Request. Pour le code, exécutez `npm run lint` et `npm run build` avec la base de données configurée. Pour la documentation, alignez les traductions sur le README anglais et conservez les liens de langues.

## Licence

Publié sous [licence MIT](../../LICENSE). Les outils tiers, marques et contenus importés conservent leurs droits et licences respectifs.
