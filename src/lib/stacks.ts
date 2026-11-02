import { prisma } from "@/lib/db";
import { cache } from "react";
import { stackPreviews, type StackPreview } from "@/lib/stacks-data";
import { catalogCache } from "@/lib/catalog-cache";
import { getStackPreviewWebsite } from "@/lib/stack-preview-websites";

export const getCatalogStackSlugs = catalogCache(
  () => prisma.stack.findMany({ select: { slug: true } }),
  "stack-slugs",
);

export function getStackIconKey(slug: string): StackPreview["icon"] | null {
  return stackPreviews.find((s) => s.slug === slug)?.icon ?? null;
}

export const stackTags: Record<string, string[]> = {
  "indie-developer-toolkit": ["#indie-hacker", "#saas", "#solo-dev"],
  "content-creator-suite": ["#creator", "#content", "#newsletter"],
  "startup-foundation": ["#startup", "#team", "#early-stage"],
  "open-source-maintainer": ["#open-source", "#maintainer", "#community"],
  "ai-product-builder": ["#ai", "#product", "#builder"],
  "marketing-seo-growth": ["#marketing", "#seo", "#geo", "#growth"],
  "data-insights-stack": ["#data", "#analytics", "#insights"],
  "design-workflow": ["#design", "#ui-ux", "#handoff"],
  "remote-team-ops": ["#remote", "#team", "#async"],
};

export type StackListItem = {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  stageCount: number;
  toolCount: number;
};

export type StackStageTool = {
  slug: string | null;
  name: string;
  tagline: string;
  pricing: string | null;
  viewCount: number | null;
  clickCount: number | null;
  githubStars: number | null;
  phVotes: number | null;
  iconUrl: string | null;
  url: string | null;
  initial: string;
  color: string;
};

export type StackStageRelatedGroup = {
  categoryName: string;
  categorySlug: string;
  tools: StackStageTool[];
};

export type StackStage = {
  id: string;
  name: string;
  description: string | null;
  editorNote: string | null;
  tools: StackStageTool[];
  browseCategories: { name: string; slug: string }[];
  relatedGroups: StackStageRelatedGroup[];
};

export type StackDetail = {
  slug: string;
  name: string;
  description: string;
  isFallback: boolean;
  stages: StackStage[];
};

const RELATED_TOOLS_LIMIT = 6;

const toolSelect = {
  status: true,
  slug: true,
  name: true,
  tagline: true,
  pricing: true,
  viewCount: true,
  clickCount: true,
  githubStars: true,
  phVotes: true,
  iconUrl: true,
  url: true,
  categoryId: true,
  category: { select: { name: true, slug: true } },
} as const;

type ToolRow = {
  slug: string;
  name: string;
  tagline: string;
  pricing: string;
  viewCount: number;
  clickCount: number;
  githubStars: number | null;
  phVotes: number | null;
  iconUrl: string | null;
  url: string;
  categoryId: string;
  category: { name: string; slug: string };
};

function mapToolToStageTool(
  tool: ToolRow,
  preview?: StackPreview,
): StackStageTool {
  const previewTool = preview?.stages
    .flatMap((s) => s.tools)
    .find((t) => t.name === tool.name);

  return {
    slug: tool.slug,
    name: tool.name,
    tagline: tool.tagline,
    pricing: tool.pricing,
    viewCount: tool.viewCount,
    clickCount: tool.clickCount,
    githubStars: tool.githubStars,
    phVotes: tool.phVotes,
    iconUrl: tool.iconUrl,
    url: tool.url,
    initial: previewTool?.initial ?? tool.name.charAt(0).toUpperCase(),
    color: previewTool?.color ?? "#78716C",
  };
}

function signalScore(tool: Pick<ToolRow, "githubStars" | "phVotes">) {
  return (tool.githubStars ?? 0) * 10 + (tool.phVotes ?? 0);
}

function uniqueCategories(categories: { name: string; slug: string }[]) {
  return [...new Map(categories.map((c) => [c.slug, c])).values()];
}

function pickRelatedGroups(
  stageTools: ToolRow[],
  candidates: ToolRow[],
  preview?: StackPreview,
): StackStageRelatedGroup[] {
  const excludeSlugs = new Set(stageTools.map((t) => t.slug));

  return uniqueCategories(stageTools.map((t) => t.category))
    .map((category) => ({
      categoryName: category.name,
      categorySlug: category.slug,
      tools: candidates
        .filter(
          (t) => t.category.slug === category.slug && !excludeSlugs.has(t.slug),
        )
        .sort((a, b) => signalScore(b) - signalScore(a))
        .slice(0, RELATED_TOOLS_LIMIT)
        .map((t) => mapToolToStageTool(t, preview)),
    }))
    .filter((group) => group.tools.length > 0);
}

function previewToListItem(stack: StackPreview): StackListItem {
  const toolCount = stack.stages.reduce((sum, s) => sum + s.tools.length, 0);
  return {
    slug: stack.slug,
    name: stack.name,
    tagline: stack.tagline,
    description: stack.description,
    stageCount: stack.stages.length,
    toolCount,
  };
}

function previewToDetail(stack: StackPreview): StackDetail {
  return {
    slug: stack.slug,
    name: stack.name,
    description: stack.description,
    isFallback: true,
    stages: stack.stages.map((stage, idx) => ({
      id: `preview-${idx}`,
      name: stage.name,
      description: stage.description ?? null,
      editorNote: stage.editorNote ?? null,
      tools: stage.tools.map((tool) => ({
        slug: null,
        name: tool.name,
        tagline: "",
        pricing: null,
        viewCount: null,
        clickCount: null,
        githubStars: null,
        phVotes: null,
        iconUrl: null,
        url: getStackPreviewWebsite(tool.name),
        initial: tool.initial,
        color: tool.color,
      })),
      relatedGroups: [],
      browseCategories: [],
    })),
  };
}

const getCachedStacksForList = catalogCache(async (): Promise<StackListItem[]> => {
  const stacks = await prisma.stack.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      stages: {
        include: {
          recommendations: { select: { toolId: true } },
        },
      },
    },
  });

  if (stacks.length === 0) {
    return stackPreviews.map(previewToListItem);
  }

  return stacks.map((stack) => ({
    slug: stack.slug,
    name: stack.name,
    tagline: stack.tagline,
    description: stack.description,
    stageCount: stack.stages.length,
    toolCount: stack.stages.reduce((sum, s) => sum + s.recommendations.length, 0),
  }));
}, "stacks-list");

export async function getStacksForList(): Promise<StackListItem[]> {
  try {
    return await getCachedStacksForList();
  } catch {
    // Availability fallbacks are deliberately outside the cache callback.
    return stackPreviews.map(previewToListItem);
  }
}

const getCachedStackBySlug = catalogCache(async (slug: string): Promise<StackDetail | null> => {
  const preview = stackPreviews.find((s) => s.slug === slug);

  const stack = await prisma.stack.findUnique({
    where: { slug },
    include: {
      stages: {
        orderBy: { sortOrder: "asc" },
        include: {
          recommendations: {
            orderBy: { sortOrder: "asc" },
            include: {
              tool: { select: toolSelect },
            },
          },
        },
      },
    },
  });

  if (!stack) {
    return null;
  }

  const stageToolRows = stack.stages.map((stage) =>
    stage.recommendations.filter((rec) => rec.tool.status === "APPROVED").map((rec) => rec.tool),
  );
  const recommendedSlugs = stageToolRows.flat().map((t) => t.slug);
  const categoryIds = [...new Set(stageToolRows.flat().map((t) => t.categoryId))];

  const relatedCandidates =
    categoryIds.length > 0
      ? await prisma.tool.findMany({
          where: {
            status: "APPROVED",
            categoryId: { in: categoryIds },
            slug: { notIn: recommendedSlugs },
          },
          select: toolSelect,
        })
      : [];

  return {
    slug: stack.slug,
    name: stack.name,
    description: stack.description,
    isFallback: false,
    stages: stack.stages.map((stage, idx) => {
      const stageRows = stageToolRows[idx];
      const tools = stageRows.map((t) => mapToolToStageTool(t, preview));
      const browseCategories = uniqueCategories(stageRows.map((t) => t.category));
      const relatedGroups = pickRelatedGroups(stageRows, relatedCandidates, preview);

      return {
        id: stage.id,
        name: stage.name,
        description: stage.description,
        editorNote: stage.editorNote,
        tools,
        browseCategories,
        relatedGroups,
      };
    }),
  };
}, "stack-detail", { metrics: true });

export const getStackBySlug = cache(async (slug: string): Promise<StackDetail | null> => {
  const preview = stackPreviews.find((stack) => stack.slug === slug);
  try {
    const slugs = await getCatalogStackSlugs();
    const stack = slugs.some((stack) => stack.slug === slug)
      ? await getCachedStackBySlug(slug)
      : null;
    return stack ?? (preview ? previewToDetail(preview) : null);
  } catch {
    return preview ? previewToDetail(preview) : null;
  }
});
