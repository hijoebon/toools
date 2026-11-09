import { cache } from "react";
import { prisma } from "./db";
import { catalogCache } from "./catalog-cache";
import { catalogOr } from "./catalog-fallback";
import { editorPicks, resolveEditorPicks } from "./editor-picks";

// Reuse the same category/count entry on home, filters, category pages and SEO.
export const getCatalogCategories = catalogCache(
  () => prisma.category.findMany({
    include: {
      _count: { select: { tools: { where: { status: "APPROVED" } } } },
    },
    orderBy: { sortOrder: "asc" },
  }),
  "categories",
);

export async function loadCatalogCategories() {
  return (await catalogOr(() => getCatalogCategories(), [])).value;
}

export const loadCatalogCategory = cache(async (slug: string) => {
  const read = await catalogOr(async () => {
    return (await getCatalogCategories()).find((category) => category.slug === slug) ?? null;
  }, null);
  if (read.degraded) return { status: "unavailable" as const };
  if (!read.value) return { status: "missing" as const };
  return { status: "ready" as const, category: read.value };
});

export const toolCardSelect = {
  slug: true,
  name: true,
  tagline: true,
  url: true,
  iconUrl: true,
  pricing: true,
  featured: true,
  isOpenSource: true,
  viewCount: true,
  clickCount: true,
  githubStars: true,
  phVotes: true,
  category: { select: { name: true, slug: true } },
  tags: { select: { tag: { select: { name: true } } } },
} as const;

// Also used by the sitemap and as a shared negative lookup. Random crawl URLs
// must not each create a separate database query or negative cache entry.
export const getApprovedToolSlugs = catalogCache(
  () => prisma.tool.findMany({
    where: { status: "APPROVED" },
    select: { slug: true },
    orderBy: { slug: "asc" },
  }),
  "approved-slugs",
);

const getCachedApprovedToolLink = catalogCache(
  (slug: string) => prisma.tool.findFirst({
    where: { slug, status: "APPROVED" },
    select: { id: true, url: true, github: true, sourceUrl: true, source: true },
  }),
  "approved-link",
);

// Redirects only need stored destinations. Counter batches must leave these
// entries warm so outbound clicks cannot repeatedly wake the database.
export const getApprovedToolLink = cache(async (slug: string) => {
  if (!(await getApprovedToolSlugs()).some((tool) => tool.slug === slug)) return null;
  return getCachedApprovedToolLink(slug);
});

const getCuratedCatalogTools = catalogCache(async (slugs: string[]) => {
  const tools = await prisma.tool.findMany({
    where: { slug: { in: slugs }, status: "APPROVED" },
    include: {
      category: { select: { name: true, slug: true } },
      tags: { include: { tag: { select: { name: true } } } },
    },
  });
  return tools.map((tool) => ({
    ...tool,
    createdAt: tool.createdAt.toISOString(),
    updatedAt: tool.updatedAt.toISOString(),
  }));
}, "editor-picks-catalog", { metrics: true });

export async function loadFeaturedTools() {
  // Pass the slugs as cache arguments so editing the checked-in set cannot
  // reuse a previous selection's persisted catalog snapshot.
  const read = await catalogOr(() => getCuratedCatalogTools(editorPicks.map((pick) => pick.slug)), []);
  return resolveEditorPicks(read.value);
}

export type EditorPickTool = Awaited<ReturnType<typeof loadFeaturedTools>>[number];

const getCachedApprovedTool = catalogCache(async (slug: string) => {
  const tool = await prisma.tool.findFirst({
    where: { slug, status: "APPROVED" },
    include: {
      category: true,
      tags: { include: { tag: true } },
      stageRecommendations: {
        include: {
          stage: {
            include: { stack: { select: { name: true, slug: true } } },
          },
        },
      },
    },
  });
  // Data Cache uses JSON; normalize on both misses and hits, then restore the
  // public record's Date fields below for existing server components.
  return tool ? {
    ...tool,
    createdAt: tool.createdAt.toISOString(),
    updatedAt: tool.updatedAt.toISOString(),
  } : null;
}, "approved-detail", { metrics: true });

// Share the approved record across the layout, metadata, and detail render.
export const getApprovedTool = cache(async (slug: string) => {
  if (!(await getApprovedToolSlugs()).some((tool) => tool.slug === slug)) return null;
  const tool = await getCachedApprovedTool(slug);
  return tool ? {
    ...tool,
    createdAt: new Date(tool.createdAt),
    updatedAt: new Date(tool.updatedAt),
  } : null;
});

export const loadApprovedTool = cache(async (slug: string) => {
  const read = await catalogOr(() => getApprovedTool(slug), null);
  if (read.degraded) return { status: "unavailable" as const };
  if (!read.value) return { status: "missing" as const };
  return { status: "ready" as const, tool: read.value };
});
