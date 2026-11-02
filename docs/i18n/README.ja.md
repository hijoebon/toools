# Toools

[English](../../README.md) · [简体中文](../../docs/i18n/README.zh-CN.md) · **日本語** · [한국어](../../docs/i18n/README.ko.md) · [Español](../../docs/i18n/README.es.md) · [Français](../../docs/i18n/README.fr.md) · [Deutsch](../../docs/i18n/README.de.md) · [Português (Brasil)](../../docs/i18n/README.pt-BR.md)

**ワークフロー全体に合ったツールを見つけよう。**

[サイトを見る](https://toools.top) · [ツールを提案](https://github.com/korbinjoe/toools/issues/new?template=tool-submission.yml) · [情報源と選定基準](https://toools.top/how-we-curate)

Toools は、ツールの発見とワークフローのキュレーションを支援するオープンソースのプラットフォームです。GitHub Awesome リスト、Product Hunt、メンテナーの選定、コミュニティの投稿から、作業の各段階に合うツールを探せます。

上のリンクで README の言語を切り替えられます。英語版が基準です。翻訳の対象はリポジトリのドキュメントで、現在のサイトの表示言語は英語です。

## できること

- **Tool Stacks を探索** — 個人開発者、クリエイター、スタートアップ、オープンソースのメンテナー向けに、各段階の推奨ツールと編集者のコメントを用意しています。
- **検索と比較** — 名前、説明、タグで検索し、カテゴリ、料金、プラットフォーム、オープンソース、注目ツールの条件で絞り込めます。
- **選択に役立つ情報** — 用途、長所と短所、代替ツール、情報源、GitHub スター、Product Hunt の投票数を確認できます。
- **日替わりの発見** — 新着、注目ツール、ワークフロー、カテゴリが日替わりで表示され、「Another batch」で次の組に切り替えられます。
- **提案とインポート** — GitHub Issues からツールを提案したり、URL の正規化と重複処理を伴う一括インポートを実行できます。
- **ライト・ダークモード** — システム設定に合わせるか、手動で切り替えられます。

## 情報源と選定

新規インポートはすべて `PENDING` のままです。旧設定の `PH_AUTO_APPROVE` や `AWESOME_AUTO_APPROVE` を指定しても自動承認は有効になりません。注目マークはメンテナーの選定や、Product Hunt で 1,000 票を超えた製品に付与されます。承認や注目マークは実機検証を保証しません。スター、投票、閲覧、クリックは利用状況の指標であり、品質評価ではありません。スターと投票数は取得時点の値で、常時更新されません。

詳細と情報源の制約は[選定方針](https://toools.top/how-we-curate)と[プロジェクトガイド](../../docs/project-guide.md)をご覧ください。

## 技術構成

| レイヤー | 技術 |
| --- | --- |
| フレームワーク | Next.js 16 (App Router) + TypeScript |
| UI | React 19 + Base UI + shadcn/ui + Lucide + Geist |
| データベース | PostgreSQL + Prisma 7 |
| スタイル | Tailwind CSS 4 + next-themes |
| 分析 | Vercel Web Analytics + Speed Insights |

## ローカルで実行

必要な環境：npm、PostgreSQL、Prisma 7 の要件を満たす Node.js 20.19+（20.x）、22.12+（22.x）、または 24+。

```bash
git clone https://github.com/korbinjoe/toools.git
cd toools
npm install
```

リポジトリのルートに `.env` を作成します：

```env
DATABASE_URL="postgresql://user:password@localhost:5432/toools"
NEXT_PUBLIC_BASE_URL="http://localhost:3000"
```

`DATABASE_URL` は必須です。`NEXT_PUBLIC_BASE_URL` は任意で、初期値は `https://toools.top` です。開発時はローカル URL を設定してください。認証情報はコミットしないでください。

マイグレーションを適用し、ツール、ワークフローの順で初期データを投入して、開発サーバーを起動します：

```bash
npx prisma migrate deploy
npx prisma db seed
npx tsx prisma/seed-stacks.ts
npx tsx prisma/seed-tool-enrichments.ts
npm run dev
```

[localhost:3000](http://localhost:3000) を開きます。

## 便利なコマンド

| コマンド | 用途 |
| --- | --- |
| `npm run import:github -- --dry-run` | データベースなしで候補を確認 |
| `npm run sources:inspect -- --slug TOOL_SLUG` | ツールの全情報源を確認 |
| `npm run dev` | Turbopack で開発サーバーを起動 |
| `npm run dev:webpack` | Webpack で開発サーバーを起動 |
| `npm run build` | Prisma クライアントの生成と本番ビルド |
| `npm run start` | ビルド後に本番サーバーを起動 |
| `npm run lint` | ESLint を実行 |
| `npm run backfill:signals` | 情報源と人気指標を補完 |
| `npx prisma studio` | Prisma Studio を開く |

## データのインポート

### GitHub からのインポート

GitHub インポーターは Topics、キーワード検索、組織の許可リスト、汎用 Markdown/JSON ディレクトリに対応しています。[github-sources.json](../../scripts/config/github-sources.json) で情報源を選択してください。データベースへの書き込み前にマイグレーションとカテゴリの初期化が必要です。`--dry-run` はデータベースに接続せず、同じ実行内の重複だけを検出します。実際のインポートでは、公式サイト、リポジトリ URL、GitHub リポジトリ ID で既存ツールを照合し、承認状態と編集内容を保持して、初回と最終発見日時を含む情報源を追加します。識別情報の競合は自動統合せず、レポートに記録します。

```bash
npm run import:github -- --dry-run --limit 20
npx prisma migrate deploy
npm run import:github -- --new-limit 500
npm run sources:inspect -- --slug TOOL_SLUG
```

API 上限を増やすには `GITHUB_TOKEN`、実際のインポートには `DATABASE_URL` を設定します。従来の Awesome と Product Hunt も同じ重複判定・情報源ストアを利用し、新規ツールは承認待ちになります。設定、制限、レポート、テスト、情報源の確認は [GitHub インポートガイド](../../docs/github-import.md)をご覧ください。

```bash
npx tsx scripts/import-awesome-lists.ts
npx tsx scripts/import-producthunt.ts
```

両方のインポーターに `DATABASE_URL` が必要です。Awesome では任意の `GITHUB_TOKEN` で API の利用上限を増やせます。Product Hunt には `PRODUCTHUNT_TOKEN`、または `PRODUCTHUNT_API_KEY` と `PRODUCTHUNT_API_SECRET` の両方が必要です。設定、補完オプション、保守ツールは[プロジェクトガイド](../../docs/project-guide.md#data-import-scripts)をご覧ください。

## ドキュメント

- [製品のバージョン管理とリリース手順](../../docs/versioning.md)
- [変更履歴](../../CHANGELOG.md)
- [プロジェクトガイド：選定、インポート、構成、デプロイ、分析](../../docs/project-guide.md)
- [SEO と AI 検索での可視性：実装と検証](../../docs/seo-geo-implementation.md)
- [ローカル開発の性能分析](../../docs/local-dev-performance-analysis-2026-10-13.md)
- [OpenSpec の提案と実装タスク](../../openspec/changes/)

## 貢献

[投稿テンプレート](https://github.com/korbinjoe/toools/issues/new?template=tool-submission.yml)でツールを提案し、[GitHub Issues](https://github.com/korbinjoe/toools/issues)で不具合を報告するか、Pull Request を作成できます。コードを変更したら、データベースを設定した環境で `npm run lint` と `npm run build` を実行してください。ドキュメントの更新時は英語版に翻訳を合わせ、言語リンクを維持してください。

## ライセンス

[MIT ライセンス](../../LICENSE)で公開されています。外部ツール、商標、インポートされたコンテンツには、それぞれの権利とライセンスが適用されます。
