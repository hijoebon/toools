import type { MetadataRoute } from "next";
import { connection } from "next/server";
import { catalogOr } from "@/lib/catalog-fallback";
import { catalogCache } from "@/lib/catalog-cache";
import { prisma } from "@/lib/db";
import { buildSitemap, isoTimestamp, latestIso, type SitemapStack, type SitemapTool } from "@/lib/seo-sitemap";
import { stackGuides } from "@/lib/stack-guides";
import { stackPreviews } from "@/lib/stacks-data";
import { getCatalogCategories } from "@/lib/tools";

const getSitemapTools = catalogCache(async () => {
  const tools = await prisma.tool.findMany({
    where: { status: "APPROVED" },
    select: { slug: true, updatedAt: true, category: { select: { slug: true } } },
    orderBy: { slug: "asc" },
  });
  return tools.flatMap((tool): SitemapTool[] => tool.slug ? [{
    slug: tool.slug,
    updatedAt: isoTimestamp(tool.updatedAt),
    categorySlug: tool.category?.slug ?? null,
  }] : []);
}, "sitemap-tools");

const getSitemapStacks = catalogCache(async () => {
  const stacks = await prisma.stack.findMany({
    select: { slug: true, updatedAt: true },
    orderBy: { slug: "asc" },
  });
  return stacks.flatMap((stack): SitemapStack[] => stack.slug ? [{
    slug: stack.slug,
    updatedAt: isoTimestamp(stack.updatedAt),
  }] : []);
}, "sitemap-stacks");

export async function loadSitemap(): Promise<MetadataRoute.Sitemap> {
  const [tools, categories, stacks] = await Promise.all([
    catalogOr(() => getSitemapTools(), []),
    catalogOr(() => getCatalogCategories(), []),
    catalogOr(() => getSitemapStacks(), []),
  ]);
  const storedStacks = new Map(stacks.value.map((stack) => [stack.slug, stack.updatedAt]));
  const stackSlugs = [...new Set([...stackPreviews.map((stack) => stack.slug), ...stacks.value.map((stack) => stack.slug)])];
  const stackRoutes = stackSlugs.map((slug) => ({
    slug,
    updatedAt: latestIso(storedStacks.get(slug), stackGuides[slug]?.reviewedOn),
  }));
  return buildSitemap(
    tools.value,
    categories.value.filter((category) => category._count.tools > 0),
    stackRoutes,
  );
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await connection();
  return loadSitemap();
}
