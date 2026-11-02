# Toools

[English](../../README.md) · [简体中文](../../docs/i18n/README.zh-CN.md) · [日本語](../../docs/i18n/README.ja.md) · [한국어](../../docs/i18n/README.ko.md) · **Español** · [Français](../../docs/i18n/README.fr.md) · [Deutsch](../../docs/i18n/README.de.md) · [Português (Brasil)](../../docs/i18n/README.pt-BR.md)

**Encuentra las herramientas adecuadas para todo tu flujo de trabajo.**

[Visitar el sitio](https://toools.top) · [Proponer una herramienta](https://github.com/korbinjoe/toools/issues/new?template=tool-submission.yml) · [Fuentes y selección](https://toools.top/how-we-curate)

Toools es una plataforma de código abierto para descubrir herramientas y organizar flujos de trabajo. Reúne listas Awesome de GitHub, productos de Product Hunt, selecciones de los responsables del proyecto y propuestas de la comunidad para ayudarte a elegir herramientas para cada etapa.

Cambia el idioma del README con los enlaces de arriba. La versión inglesa es la referencia; las traducciones cubren la documentación del repositorio y la interfaz actual del sitio está en inglés.

## Funciones

- **Explora Tool Stacks** — Flujos seleccionados para desarrolladores independientes, creadores, startups y responsables de proyectos de código abierto, con recomendaciones por etapa y notas editoriales.
- **Busca y compara** — Busca por nombre, descripción o etiquetas y filtra por categoría, precio, plataforma, código abierto y selección destacada.
- **Decide con información** — Consulta casos de uso, ventajas y desventajas, alternativas, fuentes, estrellas de GitHub y votos de Product Hunt.
- **Descubre selecciones diarias** — Explora novedades, herramientas destacadas, flujos y categorías que rotan cada día; usa “Another batch” para cambiar de grupo.
- **Contribuye e importa** — Propón herramientas mediante GitHub Issues o importa colecciones con normalización de URL y gestión de duplicados.
- **Modo claro y oscuro** — Sigue el tema del sistema o cámbialo manualmente.

## Fuentes y selección

Todas las nuevas importaciones permanecen en `PENDING`; la aprobación automática está desactivada incluso si se configuran las variables antiguas `PH_AUTO_APPROVE` o `AWESOME_AUTO_APPROVE`. La marca de destacado puede proceder de la selección editorial o de productos de Product Hunt con más de 1.000 votos. La aprobación y la marca de destacado no garantizan pruebas prácticas. Estrellas, votos, visitas y clics indican actividad, no calidad; estrellas y votos son capturas puntuales y no se actualizan continuamente.

Consulta la [política de selección](https://toools.top/how-we-curate) y la [guía del proyecto](../../docs/project-guide.md) para conocer las reglas y limitaciones de las fuentes.

## Tecnologías

| Capa | Tecnología |
| --- | --- |
| Framework | Next.js 16 (App Router) + TypeScript |
| Interfaz | React 19 + Base UI + shadcn/ui + Lucide + Geist |
| Base de datos | PostgreSQL + Prisma 7 |
| Estilos | Tailwind CSS 4 + next-themes |
| Analítica | Vercel Web Analytics + Speed Insights |

## Ejecutar en local

Requisitos: npm, PostgreSQL y Node.js 20.19+ (20.x), 22.12+ (22.x) o 24+, según los requisitos de Prisma 7.

```bash
git clone https://github.com/korbinjoe/toools.git
cd toools
npm install
```

Crea `.env` en la raíz del repositorio:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/toools"
NEXT_PUBLIC_BASE_URL="http://localhost:3000"
```

`DATABASE_URL` es obligatorio. `NEXT_PUBLIC_BASE_URL` es opcional y su valor predeterminado es `https://toools.top`; usa tu URL local durante el desarrollo. No incluyas credenciales en el control de versiones.

Aplica las migraciones, carga las herramientas antes que los flujos y arranca el servidor de desarrollo:

```bash
npx prisma migrate deploy
npx prisma db seed
npx tsx prisma/seed-stacks.ts
npx tsx prisma/seed-tool-enrichments.ts
npm run dev
```

Abre [localhost:3000](http://localhost:3000).

## Comandos útiles

| Comando | Función |
| --- | --- |
| `npm run import:github -- --dry-run` | Previsualizar candidatos sin base de datos |
| `npm run sources:inspect -- --slug TOOL_SLUG` | Consultar todas las fuentes de una herramienta |
| `npm run dev` | Iniciar el desarrollo con Turbopack |
| `npm run dev:webpack` | Iniciar el desarrollo con Webpack |
| `npm run build` | Generar el cliente Prisma y compilar para producción |
| `npm run start` | Iniciar el servidor de producción tras compilar |
| `npm run lint` | Ejecutar ESLint |
| `npm run backfill:signals` | Completar fuentes e indicadores de popularidad |
| `npx prisma studio` | Abrir Prisma Studio |

## Importar datos

### Importaciones de GitHub

El importador de GitHub admite Topics, búsquedas por palabras clave, una lista de organizaciones permitidas y directorios genéricos Markdown/JSON. Elige las fuentes en [github-sources.json](../../scripts/config/github-sources.json). Aplica las migraciones e inicializa las categorías antes de importar a la base de datos. `--dry-run` no conecta a una base de datos y solo detecta duplicados dentro de la ejecución actual. Las importaciones reales también identifican herramientas existentes por sitio web, URL e ID del repositorio, conservan la moderación y los campos editoriales, y añaden fuentes con las fechas de primera y última detección. Los conflictos de identidad se registran sin fusionarlos automáticamente.

```bash
npm run import:github -- --dry-run --limit 20
npx prisma migrate deploy
npm run import:github -- --new-limit 500
npm run sources:inspect -- --slug TOOL_SLUG
```

Usa `GITHUB_TOKEN` para aumentar los límites de la API y `DATABASE_URL` para las importaciones reales. Los comandos anteriores de Awesome y Product Hunt usan el mismo almacén de identidades y fuentes y mantienen las nuevas herramientas pendientes. Consulta configuración, límites, informes, pruebas e inspección de fuentes en la [guía de importación de GitHub](../../docs/github-import.md).

```bash
npx tsx scripts/import-awesome-lists.ts
npx tsx scripts/import-producthunt.ts
```

Ambos importadores necesitan `DATABASE_URL`. Awesome admite `GITHUB_TOKEN` para aumentar el límite de la API. Product Hunt requiere `PRODUCTHUNT_TOKEN` o tanto `PRODUCTHUNT_API_KEY` como `PRODUCTHUNT_API_SECRET`. Consulta las opciones, los parámetros de actualización y las utilidades en la [guía del proyecto](../../docs/project-guide.md#data-import-scripts).

## Documentación

- [Versiones del producto y proceso de publicación](../../docs/versioning.md)
- [Registro de cambios](../../CHANGELOG.md)
- [Guía del proyecto: selección, importaciones, arquitectura, despliegue y analítica](../../docs/project-guide.md)
- [SEO y visibilidad en búsquedas con IA: implementación y verificación](../../docs/seo-geo-implementation.md)
- [Análisis del rendimiento del desarrollo local](../../docs/local-dev-performance-analysis-2026-10-13.md)
- [Propuestas y tareas de implementación de OpenSpec](../../openspec/changes/)

## Contribuir

Propón una herramienta con la [plantilla](https://github.com/korbinjoe/toools/issues/new?template=tool-submission.yml), informa de errores en [GitHub Issues](https://github.com/korbinjoe/toools/issues) o abre un Pull Request. Para cambios de código, ejecuta `npm run lint` y `npm run build` con la base de datos configurada. Al actualizar la documentación, sincroniza las traducciones con el README inglés y conserva los enlaces de idiomas.

## Licencia

Publicado bajo la [licencia MIT](../../LICENSE). Las herramientas de terceros, las marcas y el contenido importado conservan sus respectivos derechos y licencias.
