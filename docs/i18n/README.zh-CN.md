# Toools

[English](../../README.md) · **简体中文** · [日本語](../../docs/i18n/README.ja.md) · [한국어](../../docs/i18n/README.ko.md) · [Español](../../docs/i18n/README.es.md) · [Français](../../docs/i18n/README.fr.md) · [Deutsch](../../docs/i18n/README.de.md) · [Português (Brasil)](../../docs/i18n/README.pt-BR.md)

**为你的完整工作流找到合适的工具。**

[访问网站](https://toools.top) · [提交工具](https://github.com/korbinjoe/toools/issues/new?template=tool-submission.yml) · [来源与筛选规则](https://toools.top/how-we-curate)

Toools 是一个开源的工具发现与工作流策展平台，汇集 GitHub Awesome 清单、Product Hunt、维护者精选和社区提交，帮助你为工作中的每个阶段选择合适的工具。

点击上方链接切换 README 语言。英文版是文档基准；翻译覆盖仓库文档，当前网站界面为英文。

## 功能

- **探索 Tool Stacks** — 面向独立开发者、创作者、创业团队和开源维护者的精选工作流，包含各阶段的工具推荐与编辑说明。
- **浏览与比较** — 按名称、描述或标签搜索，按分类、定价、平台、开源状态和精选状态筛选。
- **辅助决策** — 在工具详情中查看使用场景、优缺点、替代方案、来源链接、GitHub 星标和 Product Hunt 票数。
- **发现每日推荐** — 浏览每日轮换的最新工具、精选工具、工作流和分类，也可点击“Another batch”立即换一批。
- **贡献与导入** — 通过 GitHub Issues 提交工具，或批量导入清单，并进行 URL 标准化与去重。
- **明暗主题** — 跟随系统主题或手动切换。

## 数据来源与筛选

所有新导入工具保持 `PENDING`，自动审核通过已禁用；即使设置旧版 `PH_AUTO_APPROVE` 或 `AWESOME_AUTO_APPROVE` 变量也不会启用。精选标记可能来自维护者策展，也可能来自票数超过 1,000 的 Product Hunt 产品。审核通过和精选标记不代表经过实际测试。星标、票数、浏览量和点击量反映活跃度，不是质量评分；星标和票数是快照，不会持续实时刷新。

详细规则及数据限制见[筛选政策](https://toools.top/how-we-curate)和[项目指南](../../docs/project-guide.md)。

## 技术栈

| 层级 | 技术 |
| --- | --- |
| 框架 | Next.js 16 (App Router) + TypeScript |
| 界面 | React 19 + Base UI + shadcn/ui + Lucide + Geist |
| 数据库 | PostgreSQL + Prisma 7 |
| 样式 | Tailwind CSS 4 + next-themes |
| 分析 | Vercel Web Analytics + Speed Insights |

## 本地运行

环境要求：npm、PostgreSQL，以及满足 Prisma 7 要求的 Node.js 20.19+（20.x）、22.12+（22.x）或 24+。

```bash
git clone https://github.com/korbinjoe/toools.git
cd toools
npm install
```

在仓库根目录创建 `.env`：

```env
DATABASE_URL="postgresql://user:password@localhost:5432/toools"
NEXT_PUBLIC_BASE_URL="http://localhost:3000"
```

`DATABASE_URL` 必填。`NEXT_PUBLIC_BASE_URL` 可选，默认值为 `https://toools.top`；本地开发时设置为本地地址。不要将凭据提交到版本库。

执行迁移，先填充工具再填充工作流，然后启动开发服务器：

```bash
npx prisma migrate deploy
npx prisma db seed
npx tsx prisma/seed-stacks.ts
npx tsx prisma/seed-tool-enrichments.ts
npm run dev
```

打开 [localhost:3000](http://localhost:3000)。

## 常用命令

| 命令 | 用途 |
| --- | --- |
| `npm run import:github -- --dry-run` | 预览候选工具，无需数据库 |
| `npm run sources:inspect -- --slug TOOL_SLUG` | 查看工具的全部来源 |
| `npm run dev` | 使用 Turbopack 启动开发服务 |
| `npm run dev:webpack` | 使用 Webpack 启动开发服务 |
| `npm run build` | 生成 Prisma 客户端并构建生产版本 |
| `npm run start` | 构建后启动生产服务 |
| `npm run lint` | 运行 ESLint |
| `npm run backfill:signals` | 回填来源与热度信号 |
| `npx prisma studio` | 打开 Prisma Studio |

## 数据导入

### GitHub 导入

GitHub 导入器支持 Topics、关键词搜索、组织白名单和通用 Markdown/JSON 目录。编辑 [github-sources.json](../../scripts/config/github-sources.json) 选择来源。写入数据库前先执行迁移并初始化分类。`--dry-run` 不连接数据库，仅检测本次运行中的重复项。实际导入还会根据官网、仓库 URL 和 GitHub 仓库 ID 匹配已有工具，保留审核状态与编辑内容，并追加包含首次及最近发现时间的来源记录。身份冲突会进入报告，不会自动合并。

```bash
npm run import:github -- --dry-run --limit 20
npx prisma migrate deploy
npm run import:github -- --new-limit 500
npm run sources:inspect -- --slug TOOL_SLUG
```

使用 `GITHUB_TOKEN` 提高 API 配额，实际导入需要 `DATABASE_URL`。旧版 Awesome 和 Product Hunt 命令共用身份与来源存储，新工具同样保持待审核。配置、限制、报告、测试和来源查询见 [GitHub 导入指南](../../docs/github-import.md)。

```bash
npx tsx scripts/import-awesome-lists.ts
npx tsx scripts/import-producthunt.ts
```

两个导入器都需要 `DATABASE_URL`。Awesome 导入可选用 `GITHUB_TOKEN` 提高 API 配额。Product Hunt 需要 `PRODUCTHUNT_TOKEN`，或同时设置 `PRODUCTHUNT_API_KEY` 和 `PRODUCTHUNT_API_SECRET`。参数、回填选项和维护工具见[项目指南](../../docs/project-guide.md#data-import-scripts)。

## 文档

- [产品版本管理与发布流程](../../docs/versioning.md)
- [更新日志](../../CHANGELOG.md)
- [项目指南：筛选规则、导入、架构、部署与分析](../../docs/project-guide.md)
- [SEO 与 AI 搜索可见性：实现与验证](../../docs/seo-geo-implementation.md)
- [本地开发性能分析](../../docs/local-dev-performance-analysis-2026-10-13.md)
- [OpenSpec 提案与实施任务](../../openspec/changes/)

## 参与贡献

使用[提交模板](https://github.com/korbinjoe/toools/issues/new?template=tool-submission.yml)推荐工具，在 [GitHub Issues](https://github.com/korbinjoe/toools/issues) 报告问题，或提交 Pull Request。修改代码后，在数据库已配置的环境中运行 `npm run lint` 和 `npm run build`。更新文档时，请让译文与英文 README 保持一致，并保留语言切换链接。

## 许可证

项目采用 [MIT 许可证](../../LICENSE)。第三方工具、商标和导入内容保留各自的权利与许可证。
