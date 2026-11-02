# Toools

[English](../../README.md) · [简体中文](../../docs/i18n/README.zh-CN.md) · [日本語](../../docs/i18n/README.ja.md) · **한국어** · [Español](../../docs/i18n/README.es.md) · [Français](../../docs/i18n/README.fr.md) · [Deutsch](../../docs/i18n/README.de.md) · [Português (Brasil)](../../docs/i18n/README.pt-BR.md)

**전체 워크플로에 맞는 도구를 찾아보세요.**

[사이트 방문](https://toools.top) · [도구 제안](https://github.com/korbinjoe/toools/issues/new?template=tool-submission.yml) · [출처와 선정 기준](https://toools.top/how-we-curate)

Toools는 도구 탐색과 워크플로 큐레이션을 위한 오픈 소스 플랫폼입니다. GitHub Awesome 목록, Product Hunt, 관리자의 선정 목록, 커뮤니티 제안을 모아 작업의 각 단계에 맞는 도구를 찾을 수 있도록 돕습니다.

위 링크에서 README 언어를 전환할 수 있습니다. 영어 버전이 기준이며 번역은 저장소 문서에 적용됩니다. 현재 웹사이트 인터페이스는 영어입니다.

## 주요 기능

- **Tool Stacks 탐색** — 개인 개발자, 크리에이터, 스타트업, 오픈 소스 관리자를 위한 워크플로와 단계별 추천 및 편집자 설명을 제공합니다.
- **탐색과 비교** — 이름, 설명, 태그로 검색하고 카테고리, 가격, 플랫폼, 오픈 소스 여부, 추천 여부로 필터링합니다.
- **선택에 필요한 정보** — 사용 사례, 장단점, 대안, 출처 링크, GitHub 스타, Product Hunt 투표 수를 확인합니다.
- **매일 새로운 발견** — 최근 추가 도구, 추천 도구, 워크플로, 카테고리가 매일 바뀌며 “Another batch”로 다음 묶음을 볼 수 있습니다.
- **기여와 가져오기** — GitHub Issues로 도구를 제안하거나 URL 정규화 및 중복 처리를 포함한 일괄 가져오기를 실행합니다.
- **라이트 및 다크 모드** — 시스템 테마를 따르거나 직접 전환합니다.

## 출처와 선정

새로 가져온 도구는 모두 `PENDING`으로 유지됩니다. 기존 `PH_AUTO_APPROVE` 또는 `AWESOME_AUTO_APPROVE` 변수를 설정해도 자동 승인은 활성화되지 않습니다. 추천 표시는 관리자 큐레이션 또는 Product Hunt에서 1,000표를 초과한 제품에 부여됩니다. 승인과 추천 표시는 실제 사용 검증을 보장하지 않습니다. 스타, 투표, 조회, 클릭은 활동 지표이며 품질 점수가 아닙니다. 스타와 투표 수는 수집 시점의 값이며 지속적으로 갱신되지 않습니다.

상세 규칙과 출처의 한계는 [선정 정책](https://toools.top/how-we-curate) 및 [프로젝트 가이드](../../docs/project-guide.md)를 참고하세요.

## 기술 스택

| 계층 | 기술 |
| --- | --- |
| 프레임워크 | Next.js 16 (App Router) + TypeScript |
| UI | React 19 + Base UI + shadcn/ui + Lucide + Geist |
| 데이터베이스 | PostgreSQL + Prisma 7 |
| 스타일 | Tailwind CSS 4 + next-themes |
| 분석 | Vercel Web Analytics + Speed Insights |

## 로컬 실행

필요 환경: npm, PostgreSQL, Prisma 7 요구 사항에 맞는 Node.js 20.19+(20.x), 22.12+(22.x) 또는 24+.

```bash
git clone https://github.com/korbinjoe/toools.git
cd toools
npm install
```

저장소 루트에 `.env`를 만드세요:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/toools"
NEXT_PUBLIC_BASE_URL="http://localhost:3000"
```

`DATABASE_URL`은 필수입니다. `NEXT_PUBLIC_BASE_URL`은 선택 사항이며 기본값은 `https://toools.top`입니다. 로컬 개발에는 로컬 URL을 설정하세요. 인증 정보는 버전 관리에 포함하지 마세요.

마이그레이션을 적용하고 도구, 워크플로 순서로 초기 데이터를 입력한 후 개발 서버를 실행하세요:

```bash
npx prisma migrate deploy
npx prisma db seed
npx tsx prisma/seed-stacks.ts
npx tsx prisma/seed-tool-enrichments.ts
npm run dev
```

[localhost:3000](http://localhost:3000)을 여세요.

## 유용한 명령어

| 명령어 | 용도 |
| --- | --- |
| `npm run import:github -- --dry-run` | 데이터베이스 없이 후보 미리 보기 |
| `npm run sources:inspect -- --slug TOOL_SLUG` | 도구의 모든 출처 확인 |
| `npm run dev` | Turbopack으로 개발 서버 실행 |
| `npm run dev:webpack` | Webpack으로 개발 서버 실행 |
| `npm run build` | Prisma 클라이언트 생성 및 프로덕션 빌드 |
| `npm run start` | 빌드 후 프로덕션 서버 실행 |
| `npm run lint` | ESLint 실행 |
| `npm run backfill:signals` | 출처 및 인기도 지표 보완 |
| `npx prisma studio` | Prisma Studio 열기 |

## 데이터 가져오기

### GitHub 가져오기

GitHub 가져오기는 Topics, 키워드 검색, 조직 허용 목록, 일반 Markdown/JSON 디렉터리를 지원합니다. [github-sources.json](../../scripts/config/github-sources.json)에서 출처를 선택하세요. 데이터베이스에 쓰기 전에 마이그레이션과 카테고리 초기화를 실행하세요. `--dry-run`은 데이터베이스에 연결하지 않고 같은 실행 내의 중복만 확인합니다. 실제 가져오기는 웹사이트, 저장소 URL, GitHub 저장소 ID로 기존 도구를 찾고 승인 상태와 편집 내용을 유지하며 최초·최근 발견 시간이 포함된 출처 기록을 추가합니다. 식별 정보 충돌은 자동으로 병합하지 않고 보고서에 기록합니다.

```bash
npm run import:github -- --dry-run --limit 20
npx prisma migrate deploy
npm run import:github -- --new-limit 500
npm run sources:inspect -- --slug TOOL_SLUG
```

API 한도를 늘리려면 `GITHUB_TOKEN`, 실제 가져오기에는 `DATABASE_URL`을 사용하세요. 기존 Awesome과 Product Hunt 명령도 동일한 식별 정보·출처 저장소를 사용하며 새 도구는 승인 대기로 유지됩니다. 설정, 제한, 보고서, 테스트 및 출처 조회는 [GitHub 가져오기 가이드](../../docs/github-import.md)를 참고하세요.

```bash
npx tsx scripts/import-awesome-lists.ts
npx tsx scripts/import-producthunt.ts
```

두 가져오기 도구 모두 `DATABASE_URL`이 필요합니다. Awesome은 선택적으로 `GITHUB_TOKEN`을 사용해 API 한도를 늘릴 수 있습니다. Product Hunt는 `PRODUCTHUNT_TOKEN` 또는 `PRODUCTHUNT_API_KEY`와 `PRODUCTHUNT_API_SECRET` 모두가 필요합니다. 설정, 보완 옵션, 유지 관리 도구는 [프로젝트 가이드](../../docs/project-guide.md#data-import-scripts)를 참고하세요.

## 문서

- [제품 버전 관리 및 릴리스 절차](../../docs/versioning.md)
- [변경 기록](../../CHANGELOG.md)
- [프로젝트 가이드: 선정, 가져오기, 구조, 배포 및 분석](../../docs/project-guide.md)
- [SEO 및 AI 검색 노출: 구현과 검증](../../docs/seo-geo-implementation.md)
- [로컬 개발 성능 분석](../../docs/local-dev-performance-analysis-2026-10-13.md)
- [OpenSpec 제안과 구현 작업](../../openspec/changes/)

## 기여

[제안 템플릿](https://github.com/korbinjoe/toools/issues/new?template=tool-submission.yml)으로 도구를 추천하거나 [GitHub Issues](https://github.com/korbinjoe/toools/issues)에 버그를 보고하거나 Pull Request를 제출하세요. 코드 변경 시 데이터베이스가 설정된 환경에서 `npm run lint`와 `npm run build`를 실행하세요. 문서 수정 시 영어 README에 맞춰 번역을 갱신하고 언어 링크를 유지하세요.

## 라이선스

[MIT 라이선스](../../LICENSE)를 따릅니다. 외부 도구, 상표, 가져온 콘텐츠에는 각자의 권리와 라이선스가 적용됩니다.
