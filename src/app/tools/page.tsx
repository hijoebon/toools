import type { Metadata } from "next";
import { cache, Suspense } from "react";
import { connection } from "next/server";
import { SearchBar } from "@/components/search-bar";
import { FilterPanel } from "@/components/filter-panel";
import { ToolGrid } from "@/components/tool-grid";
import { Pagination } from "@/components/pagination";
import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import { notFound } from "next/navigation";
import { pageMetadata, toolsListingCopy, toolsSearchPolicy, TOOLS_PAGE_SIZE, type ToolsSearchParams } from "@/lib/seo";
import { toolSourceWhere } from "@/lib/tool-sources";
import { catalogCache } from "@/lib/catalog-cache";
import { catalogOr } from "@/lib/catalog-fallback";
import { loadCatalogCategories, toolCardSelect } from "@/lib/tools";

interface ToolsPageProps {
  searchParams: Promise<ToolsSearchParams>;
}

export async function toolsPageBounds(where: Prisma.ToolWhereInput, page: number) {
  const totalRead = await catalogOr(() => getToolsTotal(JSON.stringify(where)), 0);
  const totalPages = Math.ceil(totalRead.value / TOOLS_PAGE_SIZE);
  return {
    total: totalRead.value,
    degraded: totalRead.degraded,
    outOfRange: !totalRead.degraded && page > Math.max(1, totalPages),
  };
}

export async function resolveToolsListingMeta(raw: ToolsSearchParams) {
  const policy = toolsSearchPolicy(raw);
  let index = policy.index;
  if (policy.page > 1) {
    const bounds = await toolsPageBounds(buildWhere(policy.params), policy.page);
    if (bounds.outOfRange) return { notFound: true as const };
    if (bounds.degraded) index = false;
  }
  return { notFound: false as const, index, path: policy.path, page: policy.page };
}

export async function generateMetadata({ searchParams }: ToolsPageProps): Promise<Metadata> {
  await connection();
  const raw = await searchParams;
  const meta = await resolveToolsListingMeta(raw);
  if (meta.notFound) notFound();
  const copy = toolsListingCopy(toolsSearchPolicy(raw).params, meta.page);
  return pageMetadata(copy.title, copy.description, meta.path, { index: meta.index });
}

function buildWhere(params: {
  q?: string;
  category?: string;
  pricing?: string;
  openSource?: string;
  featured?: string;
  platform?: string;
  source?: string;
}): Prisma.ToolWhereInput {
  const where: Prisma.ToolWhereInput = { status: "APPROVED" };

  if (params.q) {
    where.OR = [
      { name: { contains: params.q, mode: "insensitive" } },
      { tagline: { contains: params.q, mode: "insensitive" } },
      { description: { contains: params.q, mode: "insensitive" } },
      { tags: { some: { tag: { name: { contains: params.q, mode: "insensitive" } } } } },
    ];
  }

  if (params.category) {
    where.category = { slug: params.category };
  }

  if (params.pricing) {
    where.pricing = params.pricing as Prisma.EnumPricingFilter["equals"];
  }

  if (params.openSource === "1") {
    where.isOpenSource = true;
  }

  if (params.featured === "1") {
    where.featured = true;
  }

  if (params.platform) {
    where.platforms = { has: params.platform };
  }

  if (params.source) {
    const source = toolSourceWhere(params.source);
    if (source) where.AND = [source];
  }

  return where;
}

function buildOrderBy(sort?: string): Prisma.ToolOrderByWithRelationInput[] {
  switch (sort) {
    case "newest":
      return [{ createdAt: "desc" }, { slug: "asc" }];
    case "clicks":
      return [{ clickCount: "desc" }, { slug: "asc" }];
    default:
      return [{ featured: "desc" }, { viewCount: "desc" }, { slug: "asc" }];
  }
}

const getCachedTools = catalogCache(async (
  where: Prisma.ToolWhereInput,
  orderBy: Prisma.ToolOrderByWithRelationInput[],
  page: number,
) => {
  return prisma.tool.findMany({
    where,
    select: toolCardSelect,
    orderBy,
    skip: (page - 1) * TOOLS_PAGE_SIZE,
    take: TOOLS_PAGE_SIZE,
  });
}, "tools-page", { metrics: true });

const getToolsTotal = cache(catalogCache(
  (serializedWhere: string) => prisma.tool.count({
    where: JSON.parse(serializedWhere) as Prisma.ToolWhereInput,
  }),
  "tools-total",
));

export async function loadToolsPageData(raw: ToolsSearchParams) {
  const { params, page } = toolsSearchPolicy(raw);
  const where = buildWhere(params);
  const orderBy = buildOrderBy(params.sort);
  const [toolsRead, categories, bounds] = await Promise.all([
    catalogOr(() => getCachedTools(where, orderBy, page), []),
    loadCatalogCategories(),
    toolsPageBounds(where, page),
  ]);
  return {
    params,
    page,
    tools: toolsRead.value,
    categories,
    total: bounds.degraded ? 0 : bounds.total,
    outOfRange: bounds.outOfRange,
    degraded: toolsRead.degraded || bounds.degraded,
  };
}

export default async function ToolsPage({ searchParams }: ToolsPageProps) {
  await connection();
  const { params, page, tools, categories, total, outOfRange } = await loadToolsPageData(await searchParams);
  if (outOfRange) notFound();

  const totalPages = Math.ceil(total / TOOLS_PAGE_SIZE);

  return (
    <div className="mx-auto max-w-6xl px-6 lg:px-8 py-10 sm:py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Browse Tools</h1>
        <p className="text-sm text-muted-foreground mt-1">
          <span className="font-mono tabular-nums">{total}</span>
          {" "}tool{total !== 1 ? "s" : ""}
          {params.q && (
            <span> matching <span className="text-foreground font-medium">&ldquo;{params.q}&rdquo;</span></span>
          )}
        </p>
      </div>

      <div className="space-y-6">
        <Suspense fallback={<div className="h-11 rounded-xl animate-shimmer" />}>
          <SearchBar defaultValue={params.q || ""} placeholder="Search tools..." autoFocus={params.focus === "search"} />
        </Suspense>

        <Suspense fallback={<div className="h-20 rounded-xl animate-shimmer" />}>
          <FilterPanel categories={categories} />
        </Suspense>

        <div className="pt-2">
          <ToolGrid tools={tools} />
          <Pagination currentPage={page} totalPages={totalPages} searchParams={params} />
        </div>
      </div>
    </div>
  );
}
