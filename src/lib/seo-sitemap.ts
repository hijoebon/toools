import type { MetadataRoute } from "next";
import { siteUrl } from "./seo";
import { currentRelease } from "./releases";

export type SitemapTool = { slug: string; updatedAt?: string | null; categorySlug?: string | null };
export type SitemapCategory = { slug: string };
export type SitemapStack = { slug: string; updatedAt?: string | null };

// Pages whose visible copy records a content date. Do not stamp pages that have none.
const STATIC_CONTENT_DATES: Record<string, string> = {
  "/changelog": currentRelease.date,
  "/editorial-policy": "2026-10-13",
  "/compare/n8n-vs-make-vs-zapier": "2026-10-13",
};

const STATIC_PATHS = ["/", "/stacks", "/tools", "/categories", "/submit", "/about", "/changelog", "/editorial-policy", "/how-we-curate", "/compare/n8n-vs-make-vs-zapier"];

// One urlset stays valid well past the current catalog (~6k URLs, under 1MB).
// Google's cap is 50,000 URLs and 50MB. generateSitemaps would turn sitemap.xml
// into an index and move lastmod onto child files, so keep a single file until then.
export const SITEMAP_INDEX_URL_LIMIT = 50_000;

export function isoTimestamp(value: unknown): string | null {
  if (value instanceof Date) return Number.isFinite(value.getTime()) ? value.toISOString() : null;
  if (typeof value !== "string" || !value.trim()) return null;
  const time = Date.parse(value);
  return Number.isFinite(time) ? new Date(time).toISOString() : null;
}

export function latestIso(...values: (string | null | undefined)[]): string | null {
  let latest: number | undefined;
  for (const value of values) {
    const iso = isoTimestamp(value);
    if (!iso) continue;
    const time = Date.parse(iso);
    if (latest === undefined || time > latest) latest = time;
  }
  return latest === undefined ? null : new Date(latest).toISOString();
}

function entry(path: string, updatedAt?: string | null): MetadataRoute.Sitemap[number] {
  const lastModified = isoTimestamp(updatedAt);
  const url = siteUrl(path);
  return lastModified ? { url, lastModified: new Date(lastModified) } : { url };
}

export function buildSitemap(tools: SitemapTool[], categories: SitemapCategory[], stacks: SitemapStack[]): MetadataRoute.Sitemap {
  const categoryUpdated = new Map<string, string>();
  for (const tool of tools) {
    const updatedAt = isoTimestamp(tool.updatedAt);
    if (!tool.categorySlug || !updatedAt) continue;
    const current = categoryUpdated.get(tool.categorySlug);
    if (!current || Date.parse(updatedAt) > Date.parse(current)) categoryUpdated.set(tool.categorySlug, updatedAt);
  }
  const newestTool = latestIso(...tools.map((tool) => tool.updatedAt));
  const newestStack = latestIso(...stacks.map((stack) => stack.updatedAt));
  const sectionDates: Record<string, string | null> = {
    "/": newestTool,
    "/tools": newestTool,
    "/categories": newestTool,
    "/stacks": newestStack,
  };

  return [
    ...STATIC_PATHS.map((path) => entry(path, sectionDates[path] ?? STATIC_CONTENT_DATES[path])),
    ...stacks.map((stack) => entry(`/stacks/${stack.slug}`, stack.updatedAt)),
    ...tools.map((tool) => entry(`/tools/${tool.slug}`, tool.updatedAt)),
    ...categories.map((category) => entry(`/categories/${category.slug}`, categoryUpdated.get(category.slug))),
  ];
}
