import "next/dist/server/node-environment";
import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { setTimeout } from "node:timers/promises";
import { IncrementalCache } from "next/dist/server/lib/incremental-cache";
import type { PrismaClient } from "@prisma/client";
import { editorPicks } from "./editor-picks";

test("catalog reads survive cache instances, preserve dates, and invalidate after publication and counter batches", async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "toools-catalog-cache-"));
  await fs.mkdir(path.join(directory, "cache"));
  const runtime = globalThis as unknown as {
    __incrementalCache?: IncrementalCache;
    prisma?: PrismaClient;
  };
  const originalCache = runtime.__incrementalCache;
  const originalPrisma = runtime.prisma;
  let slugReads = 0;
  let detailReads = 0;
  let categoryReads = 0;
  let linkReads = 0;
  let featuredReads = 0;
  let databaseAvailable = true;
  let curatedAvailable = true;
  let viewCount = 10;
  let websiteUrl = "https://approved.example/";
  const slugs = ["approved-tool"];
  runtime.prisma = {
    tool: {
      findMany: async (options: { include?: unknown }) => {
        if (options.include) {
          featuredReads += 1;
          if (!databaseAvailable) throw new Error("database unavailable");
          return curatedAvailable ? [{
            slug: editorPicks[0].slug, url: editorPicks[0].catalogUrl, status: "APPROVED",
            viewCount, createdAt: new Date("2026-10-01T00:00:00Z"), updatedAt: new Date("2026-10-02T00:00:00Z"),
          }] : [];
        }
        slugReads += 1;
        if (!databaseAvailable) throw new Error("database unavailable");
        return slugs.map((slug) => ({ slug }));
      },
      findFirst: async ({ where, select, include }: {
        where: { slug: string; status: string };
        select?: object;
        include?: { stageRecommendations?: unknown };
      }) => {
        assert.equal(where.status, "APPROVED");
        if (select) linkReads += 1;
        else if (include?.stageRecommendations) detailReads += 1;
        else featuredReads += 1;
        if (!databaseAvailable) throw new Error("database unavailable");
        const link = {
          id: `id-${where.slug}`,
          url: websiteUrl,
          github: "https://github.com/example/approved-tool",
          sourceUrl: "https://www.producthunt.com/posts/approved-tool",
          source: "PRODUCT_HUNT",
        };
        if (select) return link;
        return {
          ...link,
          slug: where.slug,
          viewCount,
          category: { name: "Development", slug: "development" },
          tags: [{ toolId: `id-${where.slug}`, tagId: "tag-one", tag: { name: "Coding" } }],
          createdAt: new Date("2026-10-01T00:00:00Z"),
          updatedAt: new Date("2026-10-02T00:00:00Z"),
        };
      },
    },
    category: {
      findMany: async () => {
        categoryReads += 1;
        return [{ slug: "development", _count: { tools: slugs.length } }];
      },
    },
  } as unknown as PrismaClient;

  function newCache() {
    return new IncrementalCache({
      fs: { ...fs, existsSync, readFileSync, mkdir: (directory) => fs.mkdir(directory, { recursive: true }) },
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
  }

  async function invalidate(tag: string) {
    // File mtimes have sub-millisecond precision; ensure the tag timestamp is
    // newer than the file written by the immediately preceding assertion.
    await setTimeout(5);
    await runtime.__incrementalCache!.revalidateTag(tag, { expire: 0 });
  }

  try {
    runtime.__incrementalCache = newCache();
    const { getApprovedTool, getApprovedToolLink, getApprovedToolSlugs, getCatalogCategories, loadFeaturedTools } = await import("./tools");
    const { CATALOG_CACHE_TAG, CATALOG_METRICS_CACHE_TAG } = await import("./catalog-cache");

    assert.equal(await getApprovedTool("missing-one"), null);
    assert.equal(await getApprovedTool("missing-two"), null);
    assert.equal(await getApprovedTool("newly-approved-tool"), null);
    assert.equal(await getApprovedToolLink("newly-approved-tool"), null);
    assert.equal(slugReads, 1, "unknown slugs reuse one shared index");
    assert.equal(detailReads, 0, "unknown slugs never query detail records");
    assert.equal(linkReads, 0, "unknown redirect slugs never query link records");

    const first = await getApprovedTool("approved-tool");
    const firstLink = await getApprovedToolLink("approved-tool");
    const firstFeatured = await loadFeaturedTools();
    assert.equal(firstFeatured.length, 1, "only valid curated entries are returned");
    assert.equal(firstFeatured[0].createdAt, "2026-10-01T00:00:00.000Z");
    await getCatalogCategories();
    runtime.__incrementalCache = newCache();
    const cached = await getApprovedTool("approved-tool");
    assert.deepEqual(cached, first);
    assert.ok(cached?.updatedAt instanceof Date, "Date consumers work on a persisted hit");
    assert.equal(detailReads, 1, "a fresh cache instance reuses disk-backed data");
    assert.deepEqual(await getApprovedToolLink("approved-tool"), firstLink);
    assert.deepEqual(await loadFeaturedTools(), firstFeatured);
    assert.equal(linkReads, 1);
    assert.equal(featuredReads, 1);

    viewCount = 17;
    await invalidate(CATALOG_METRICS_CACHE_TAG);
    assert.equal((await getApprovedTool("approved-tool"))?.viewCount, 17);
    await getCatalogCategories();
    await getApprovedToolLink("approved-tool");
    assert.equal((await loadFeaturedTools())[0].viewCount, 17);
    assert.equal(slugReads, 1, "counter batches leave the slug index warm");
    assert.equal(categoryReads, 1, "counter batches leave category counts warm");
    assert.equal(linkReads, 1, "counter batches leave outbound link data warm");
    assert.equal(featuredReads, 2, "counter batches refresh counts shown by the featured API");

    slugs.push("newly-approved-tool");
    websiteUrl = "https://approved.example/updated";
    await invalidate(CATALOG_CACHE_TAG);
    assert.ok(await getApprovedTool("newly-approved-tool"), "publication removes a previously cached miss");
    assert.ok(await getApprovedToolLink("newly-approved-tool"));
    assert.equal((await getApprovedToolLink("approved-tool"))?.url, websiteUrl, "publication refreshes stored redirects");
    assert.equal((await getCatalogCategories())[0]._count.tools, 2);

    await invalidate(CATALOG_CACHE_TAG);
    databaseAvailable = false;
    await assert.rejects(getApprovedToolSlugs(), /database unavailable/);
    databaseAvailable = true;
    assert.equal((await getApprovedToolSlugs()).length, 2, "a failed refresh does not cache an empty fallback");

    await invalidate(CATALOG_CACHE_TAG);
    const sampleOne = await loadFeaturedTools();
    const sampleTwo = await loadFeaturedTools();
    assert.deepEqual(sampleOne, sampleTwo, "featured requests preserve editorial order and rationale");
    assert.deepEqual(sampleOne.map((tool) => tool.slug), [editorPicks[0].slug]);
    curatedAvailable = false;
    await invalidate(CATALOG_CACHE_TAG);
    assert.deepEqual(await loadFeaturedTools(), [], "unpublished picks are omitted after publication invalidation");

    slugs.splice(slugs.indexOf("approved-tool"), 1);
    await invalidate(CATALOG_CACHE_TAG);
    assert.equal(await getApprovedTool("approved-tool"), null, "unpublishing also removes a cached positive result");
    assert.equal(await getApprovedToolLink("approved-tool"), null);
  } finally {
    runtime.__incrementalCache = originalCache;
    runtime.prisma = originalPrisma;
    await fs.rm(directory, { recursive: true, force: true });
  }
});
