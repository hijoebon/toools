import "next/dist/server/node-environment";
import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { notFound } from "next/navigation";
import { IncrementalCache } from "next/dist/server/lib/incremental-cache";
import type { PrismaClient } from "@prisma/client";
import { catalogOr } from "./catalog-fallback";
import { siteUrl } from "./seo";
import { stackPreviews } from "./stacks-data";
import { getStackToolDestination } from "./stack-tool-links";
import { marketingGrowthStack, marketingGeoStage } from "./marketing-growth-stack";

test("catalog reads fall back on failure and still surface real not-found errors", async () => {
  assert.deepEqual(await catalogOr(async () => 2, 0), { value: 2, degraded: false });
  assert.deepEqual(await catalogOr(async () => {
    throw new Error("database unavailable");
  }, []), { value: [], degraded: true });
  await assert.rejects(catalogOr(async () => {
    notFound();
  }, 0));
});

test("catalog routes degrade when the database is unreachable and recover without caching the fallback", async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "toools-catalog-outage-"));
  await fs.mkdir(path.join(directory, "cache"));
  const runtime = globalThis as unknown as {
    __incrementalCache?: IncrementalCache;
    prisma?: PrismaClient;
  };
  const originalCache = runtime.__incrementalCache;
  const originalPrisma = runtime.prisma;
  let databaseAvailable = false;
  const slugs = ["approved-tool"];
  const categories = [{
    slug: "development",
    name: "Development",
    description: "Dev tools",
    icon: null,
    _count: { tools: 1 },
  }];
  const stacks = [{ slug: "from-db" }];
  const toolCount = 30;

  runtime.prisma = {
    tool: {
      findMany: async () => {
        if (!databaseAvailable) throw new Error("database unavailable");
        return slugs.map((slug) => ({ slug }));
      },
      findFirst: async ({ where }: { where: { slug: string } }) => {
        if (!databaseAvailable) throw new Error("database unavailable");
        if (!slugs.includes(where.slug)) return null;
        return {
          id: `id-${where.slug}`,
          slug: where.slug,
          url: "https://approved.example/",
          github: null,
          sourceUrl: null,
          source: "PRODUCT_HUNT",
          viewCount: 1,
          category: { name: "Development", slug: "development" },
          tags: [],
          createdAt: new Date("2026-10-01T00:00:00Z"),
          updatedAt: new Date("2026-10-02T00:00:00Z"),
        };
      },
      count: async () => {
        if (!databaseAvailable) throw new Error("database unavailable");
        return toolCount;
      },
    },
    category: {
      findMany: async () => {
        if (!databaseAvailable) throw new Error("database unavailable");
        return categories;
      },
    },
    stack: {
      findMany: async () => {
        if (!databaseAvailable) throw new Error("database unavailable");
        return stacks;
      },
      findUnique: async ({ where }: { where: { slug: string } }) => {
        if (!databaseAvailable) throw new Error("database unavailable");
        return where.slug === "from-db" ? {
          slug: "from-db", name: "Live workflow", description: "From the catalog", stages: [],
        } : null;
      },
    },
  } as unknown as PrismaClient;

  runtime.__incrementalCache = new IncrementalCache({
    fs: { ...fs, existsSync, readFileSync, mkdir: (target) => fs.mkdir(target, { recursive: true }) },
    dev: false,
    flushToDisk: true,
    maxMemoryCacheSize: 0,
    serverDistDir: path.join(directory, "server"),
    requestHeaders: {},
    getPrerenderManifest: () => ({
      version: 4,
      routes: {},
      dynamicRoutes: {},
      notFoundRoutes: [],
      preview: { previewModeId: "test", previewModeSigningKey: "test", previewModeEncryptionKey: "test" },
    }),
  });

  try {
    const { loadSitemap } = await import("../app/sitemap");
    const { loadToolsPageData, resolveToolsListingMeta } = await import("../app/tools/page");
    const { loadCategoryPageData } = await import("../app/categories/[slug]/page");
    const { loadApprovedTool, loadCatalogCategories, loadCatalogCategory, loadFeaturedTools } = await import("./tools");
    const { getStackBySlug } = await import("./stacks");

    const degradedSitemap = await loadSitemap();
    const degradedUrls = degradedSitemap.map((entry) => entry.url);
    assert.ok(degradedUrls.includes(siteUrl("/")));
    assert.ok(degradedUrls.includes(siteUrl("/tools")));
    assert.ok(degradedUrls.includes(siteUrl("/categories")));
    for (const stack of stackPreviews) assert.ok(degradedUrls.includes(siteUrl(`/stacks/${stack.slug}`)), stack.slug);
    assert.equal(degradedUrls.some((url) => url.includes("/tools/")), false);
    assert.equal(degradedUrls.some((url) => url.includes("/categories/")), false);
    assert.equal(degradedUrls.includes(siteUrl("/stacks/from-db")), false);

    assert.deepEqual(await loadCatalogCategories(), []);
    assert.equal((await loadCatalogCategory("development")).status, "unavailable");
    assert.equal((await loadApprovedTool("approved-tool")).status, "unavailable");
    assert.deepEqual(await loadFeaturedTools(), []);
    assert.equal((await loadCategoryPageData("development")).status, "unavailable");

    // Static workflows remain usable during an outage without guessing catalog
    // slugs, prices, or engagement numbers that the database did not return.
    for (const preview of stackPreviews) {
      const fallback = await getStackBySlug(preview.slug);
      assert.ok(fallback, preview.slug);
      assert.equal(fallback.isFallback, true);
      for (const tool of fallback.stages.flatMap((stage) => stage.tools)) {
        const destination = getStackToolDestination(tool);
        assert.ok(destination?.external, `${preview.slug}: ${tool.name}`);
        assert.match(destination.href, /^https:\/\//);
        assert.equal(tool.slug, null);
        assert.equal(tool.pricing, null);
        assert.equal(tool.viewCount, null);
        assert.equal(tool.clickCount, null);
      }
    }
    const marketingFallback = await getStackBySlug(marketingGrowthStack.slug);
    assert.ok(marketingFallback);
    assert.equal(marketingFallback.name, marketingGrowthStack.name);
    assert.equal(marketingFallback.stages.length, 5);
    const geoStage = marketingFallback.stages[3];
    assert.equal(geoStage.name, marketingGeoStage.name);
    assert.equal(geoStage.description, marketingGeoStage.description);
    assert.equal(geoStage.editorNote, marketingGeoStage.editorNote);
    assert.deepEqual(geoStage.tools.map((tool) => tool.name), marketingGeoStage.tools.map((tool) => tool.name));
    assert.equal(marketingFallback.stages[4].name, "Measurement");
    assert.equal(await getStackBySlug("not-a-curated-stack"), null);

    const degradedTools = await loadToolsPageData({ page: "3" });
    assert.equal(degradedTools.degraded, true);
    assert.equal(degradedTools.outOfRange, false);
    assert.equal(degradedTools.total, 0);
    assert.equal(degradedTools.tools.length, 0);
    assert.equal(degradedTools.categories.length, 0);
    const degradedMeta = await resolveToolsListingMeta({ page: "3" });
    assert.equal(degradedMeta.notFound, false);
    if (!degradedMeta.notFound) assert.equal(degradedMeta.index, false);

    databaseAvailable = true;

    const liveStack = await getStackBySlug("from-db");
    assert.ok(liveStack);
    assert.equal(liveStack.isFallback, false);
    assert.equal(liveStack.name, "Live workflow");
    assert.equal(await getStackBySlug("not-a-curated-stack"), null);

    assert.equal((await loadCatalogCategories()).length, 1);
    assert.equal((await loadCatalogCategory("development")).status, "ready");
    assert.equal((await loadCatalogCategory("missing-category")).status, "missing");
    const tool = await loadApprovedTool("approved-tool");
    assert.equal(tool.status, "ready");
    if (tool.status === "ready") assert.equal(tool.tool.slug, "approved-tool");
    assert.equal((await loadApprovedTool("missing-tool")).status, "missing");
    assert.equal((await loadFeaturedTools()).length, 1);
    const category = await loadCategoryPageData("development");
    assert.equal(category.status, "ready");
    if (category.status === "ready") assert.equal(category.tools.length, 1);
    assert.equal((await loadCategoryPageData("missing-category")).status, "missing");

    const recoveredSitemap = (await loadSitemap()).map((entry) => entry.url);
    assert.ok(recoveredSitemap.includes(siteUrl("/tools/approved-tool")));
    assert.ok(recoveredSitemap.includes(siteUrl("/categories/development")));
    assert.ok(recoveredSitemap.includes(siteUrl("/stacks/from-db")));
    assert.ok(recoveredSitemap.includes(siteUrl("/stacks/indie-developer-toolkit")));

    const listed = await loadToolsPageData({ page: "2" });
    assert.equal(listed.degraded, false);
    assert.equal(listed.outOfRange, false);
    assert.equal(listed.total, toolCount);
    assert.equal(listed.tools.length, 1);
    assert.equal(listed.categories.length, 1);
    assert.equal((await loadToolsPageData({ page: "3" })).outOfRange, true);
    const recoveredMeta = await resolveToolsListingMeta({ page: "2" });
    assert.equal(recoveredMeta.notFound, false);
    if (!recoveredMeta.notFound) assert.equal(recoveredMeta.index, true);
    assert.equal((await resolveToolsListingMeta({ page: "3" })).notFound, true);
    const filteredMeta = await resolveToolsListingMeta({ page: "2", q: "editor" });
    assert.equal(filteredMeta.notFound, false);
    if (!filteredMeta.notFound) assert.equal(filteredMeta.index, false);
  } finally {
    runtime.__incrementalCache = originalCache;
    runtime.prisma = originalPrisma;
    await fs.rm(directory, { recursive: true, force: true });
  }
});
