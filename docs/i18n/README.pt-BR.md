# Toools

[English](../../README.md) · [简体中文](../../docs/i18n/README.zh-CN.md) · [日本語](../../docs/i18n/README.ja.md) · [한국어](../../docs/i18n/README.ko.md) · [Español](../../docs/i18n/README.es.md) · [Français](../../docs/i18n/README.fr.md) · [Deutsch](../../docs/i18n/README.de.md) · **Português (Brasil)**

**Encontre as ferramentas certas para todo o seu fluxo de trabalho.**

[Visitar o site](https://toools.top) · [Sugerir uma ferramenta](https://github.com/korbinjoe/toools/issues/new?template=tool-submission.yml) · [Fontes e seleção](https://toools.top/how-we-curate)

Toools é uma plataforma de código aberto para descobrir ferramentas e organizar fluxos de trabalho. Reúne listas Awesome do GitHub, produtos do Product Hunt, seleções dos responsáveis pelo projeto e sugestões da comunidade para ajudar você a escolher ferramentas para cada etapa.

Altere o idioma do README pelos links acima. A versão em inglês é a referência; as traduções abrangem a documentação do repositório, enquanto a interface atual do site está em inglês.

## Funcionalidades

- **Explore Tool Stacks** — Fluxos selecionados para desenvolvedores independentes, criadores, startups e responsáveis por projetos de código aberto, com recomendações por etapa e notas editoriais.
- **Explore e compare** — Pesquise por nome, descrição ou tags e filtre por categoria, preço, plataforma, código aberto e destaque.
- **Escolha com informação** — Consulte casos de uso, vantagens e desvantagens, alternativas, fontes, estrelas do GitHub e votos do Product Hunt.
- **Descubra seleções diárias** — Novidades, ferramentas em destaque, fluxos e categorias mudam a cada dia; use “Another batch” para ver outro grupo.
- **Contribua e importe** — Sugira ferramentas pelo GitHub Issues ou importe coleções com normalização de URLs e tratamento de duplicatas.
- **Modo claro e escuro** — Siga o tema do sistema ou altere manualmente.

## Fontes e seleção

Todas as novas importações permanecem em `PENDING`; a aprovação automática está desativada, mesmo quando as variáveis antigas `PH_AUTO_APPROVE` ou `AWESOME_AUTO_APPROVE` estão definidas. O destaque pode vir da curadoria dos responsáveis ou de produtos do Product Hunt com mais de 1.000 votos. Aprovação e destaque não garantem testes práticos. Estrelas, votos, visualizações e cliques indicam atividade, não qualidade; estrelas e votos são registros pontuais, sem atualização contínua.

Veja as regras detalhadas e limitações das fontes na [política de seleção](https://toools.top/how-we-curate) e no [guia do projeto](../../docs/project-guide.md).

## Tecnologias

| Camada | Tecnologia |
| --- | --- |
| Framework | Next.js 16 (App Router) + TypeScript |
| Interface | React 19 + Base UI + shadcn/ui + Lucide + Geist |
| Banco de dados | PostgreSQL + Prisma 7 |
| Estilos | Tailwind CSS 4 + next-themes |
| Análise | Vercel Web Analytics + Speed Insights |

## Executar localmente

Requisitos: npm, PostgreSQL e Node.js 20.19+ (20.x), 22.12+ (22.x) ou 24+, conforme os requisitos do Prisma 7.

```bash
git clone https://github.com/korbinjoe/toools.git
cd toools
npm install
```

Crie `.env` na raiz do repositório:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/toools"
NEXT_PUBLIC_BASE_URL="http://localhost:3000"
```

`DATABASE_URL` é obrigatório. `NEXT_PUBLIC_BASE_URL` é opcional e o valor padrão é `https://toools.top`; use a URL local durante o desenvolvimento. Não inclua credenciais no controle de versão.

Aplique as migrações, carregue as ferramentas antes dos fluxos e inicie o servidor de desenvolvimento:

```bash
npx prisma migrate deploy
npx prisma db seed
npx tsx prisma/seed-stacks.ts
npx tsx prisma/seed-tool-enrichments.ts
npm run dev
```

Abra [localhost:3000](http://localhost:3000).

## Comandos úteis

| Comando | Função |
| --- | --- |
| `npm run import:github -- --dry-run` | Pré-visualizar candidatos sem banco de dados |
| `npm run sources:inspect -- --slug TOOL_SLUG` | Consultar todas as fontes de uma ferramenta |
| `npm run dev` | Iniciar o desenvolvimento com Turbopack |
| `npm run dev:webpack` | Iniciar o desenvolvimento com Webpack |
| `npm run build` | Gerar o cliente Prisma e compilar para produção |
| `npm run start` | Iniciar o servidor de produção após compilar |
| `npm run lint` | Executar ESLint |
| `npm run backfill:signals` | Completar fontes e indicadores de popularidade |
| `npx prisma studio` | Abrir Prisma Studio |

## Importar dados

### Importações do GitHub

O importador do GitHub aceita Topics, busca por palavras-chave, uma lista de organizações permitidas e diretórios genéricos Markdown/JSON. Escolha as fontes em [github-sources.json](../../scripts/config/github-sources.json). Aplique as migrações e inicialize as categorias antes de importar para o banco. `--dry-run` não conecta a um banco e detecta duplicatas apenas na execução atual. As importações reais também identificam ferramentas existentes por site, URL e ID do repositório, preservam a moderação e os campos editoriais e acrescentam fontes com as datas da primeira e da última descoberta. Conflitos de identidade são registrados sem mesclagem automática.

```bash
npm run import:github -- --dry-run --limit 20
npx prisma migrate deploy
npm run import:github -- --new-limit 500
npm run sources:inspect -- --slug TOOL_SLUG
```

Use `GITHUB_TOKEN` para aumentar os limites da API e `DATABASE_URL` para importações reais. Os comandos anteriores de Awesome e Product Hunt usam o mesmo armazenamento de identidades e fontes e mantêm as novas ferramentas pendentes. Consulte configuração, limites, relatórios, testes e inspeção de fontes no [guia de importação do GitHub](../../docs/github-import.md).

```bash
npx tsx scripts/import-awesome-lists.ts
npx tsx scripts/import-producthunt.ts
```

Os dois importadores precisam de `DATABASE_URL`. Awesome pode usar `GITHUB_TOKEN` para aumentar o limite da API. Product Hunt requer `PRODUCTHUNT_TOKEN` ou tanto `PRODUCTHUNT_API_KEY` quanto `PRODUCTHUNT_API_SECRET`. Veja opções, parâmetros de atualização e utilitários no [guia do projeto](../../docs/project-guide.md#data-import-scripts).

## Documentação

- [Versionamento do produto e processo de lançamento](../../docs/versioning.md)
- [Histórico de alterações](../../CHANGELOG.md)
- [Guia do projeto: seleção, importações, arquitetura, implantação e análise](../../docs/project-guide.md)
- [SEO e visibilidade em buscas com IA: implementação e verificação](../../docs/seo-geo-implementation.md)
- [Análise do desempenho do desenvolvimento local](../../docs/local-dev-performance-analysis-2026-10-13.md)
- [Propostas e tarefas de implementação do OpenSpec](../../openspec/changes/)

## Contribuir

Sugira uma ferramenta pelo [modelo](https://github.com/korbinjoe/toools/issues/new?template=tool-submission.yml), relate problemas no [GitHub Issues](https://github.com/korbinjoe/toools/issues) ou abra um Pull Request. Para alterações no código, execute `npm run lint` e `npm run build` com o banco de dados configurado. Ao atualizar a documentação, mantenha as traduções alinhadas ao README em inglês e preserve os links de idiomas.

## Licença

Distribuído sob a [licença MIT](../../LICENSE). Ferramentas de terceiros, marcas e conteúdo importado mantêm seus respectivos direitos e licenças.
