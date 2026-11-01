"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { ArrowRight, RefreshCw, Star, Triangle } from "lucide-react";
import { ToolAvatar } from "@/components/tool-avatar";
import { ToolEngagement } from "@/components/tool-engagement";
import { StackIcon } from "@/components/stack-icon";
import { CategoryIcon } from "@/components/category-nav";
import type { StackPreview } from "@/lib/stacks-data";
import {
  getDailyBatchOffset,
  nextBatchOffset,
  selectBatch,
  selectFeaturedBatch,
  selectRecentBatch,
  selectRecentPool,
} from "@/lib/home-discovery";

export interface HomeDiscoveryTool {
  slug: string;
  name: string;
  tagline: string;
  url: string;
  iconUrl: string | null;
  category: { name: string; slug: string };
  pricing: string;
  createdAt: string;
  viewCount: number;
  clickCount: number;
  githubStars: number | null;
  phVotes: number | null;
}
export interface HomeWorkflow {
  slug: string;
  name: string;
  tagline: string;
  audience: string;
  icon: StackPreview["icon"];
  toolNames: string[];
}
export interface HomeCategory {
  slug: string;
  name: string;
  count: number;
}

const container = "mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8";
const cardLink =
  "group block h-full rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
const pricingLabels: Record<string, string> = {
  FREE: "Free",
  FREEMIUM: "Freemium",
  PAID: "Paid",
  OPEN_SOURCE: "Open Source",
};
const addedDate = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "numeric",
  timeZone: "Asia/Shanghai",
});
const compactNumber = new Intl.NumberFormat("en", {
  notation: "compact",
  maximumFractionDigits: 1,
});

function BatchButton({
  label,
  next,
  onClick,
}: {
  label: string;
  next: number | null;
  onClick: (offset: number) => void;
}) {
  return (
    <button
      type="button"
      disabled={next == null}
      onClick={() => next != null && onClick(next)}
      aria-label={`Show another batch of ${label}`}
      title={
        next == null
          ? "All available items are shown"
          : `Show different ${label}`
      }
      className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-lg px-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-default disabled:opacity-40 disabled:hover:bg-transparent"
    >
      <RefreshCw className="h-3 w-3" aria-hidden="true" /> Another batch
    </button>
  );
}

function SectionHeading({
  id,
  title,
  description,
  href,
  label,
  next,
  onClick,
}: {
  id: string;
  title: string;
  description: string;
  href: string;
  label: string;
  next: number | null;
  onClick: (offset: number) => void;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
      <div>
        <h2
          id={id}
          className="text-xl font-bold tracking-tight sm:text-[1.375rem]"
        >
          {title}
        </h2>
        <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="flex items-center gap-2">
        <BatchButton label={label} next={next} onClick={onClick} />
        <Link
          href={href}
          className="inline-flex min-h-11 items-center text-xs font-semibold text-primary hover:underline"
        >
          View all →
        </Link>
      </div>
    </div>
  );
}

export function HomeDiscoverySections({
  hero,
  recentTools,
  recentUnavailable = false,
  featuredTools,
  workflows,
  categories,
  day,
}: {
  hero: ReactNode;
  recentTools: HomeDiscoveryTool[];
  recentUnavailable?: boolean;
  featuredTools: HomeDiscoveryTool[];
  workflows: HomeWorkflow[];
  categories: HomeCategory[];
  day: number;
}) {
  const recentPool = selectRecentPool(recentTools);
  const [offsets, setOffsets] = useState(() => {
    const recent = getDailyBatchOffset(day, 3, recentPool.length, (offset) =>
      selectRecentBatch(recentPool, offset),
    );
    const initialRecent = selectRecentBatch(recentPool, recent);
    return {
      recent,
      picks: getDailyBatchOffset(day + 7, 4, featuredTools.length, (offset) =>
        selectFeaturedBatch(featuredTools, initialRecent, offset),
      ),
      workflows: getDailyBatchOffset(day, 3, workflows.length, (offset) =>
        selectBatch(workflows, 3, offset),
      ),
      categories: getDailyBatchOffset(day, 8, categories.length, (offset) =>
        selectBatch(categories, 8, offset),
      ),
    };
  });
  const recent = selectRecentBatch(recentPool, offsets.recent);
  const picks = selectFeaturedBatch(featuredTools, recent, offsets.picks);
  const selectedWorkflows = selectBatch(workflows, 3, offsets.workflows);
  const selectedCategories = selectBatch(categories, 8, offsets.categories);
  const nextRecent = nextBatchOffset(
    offsets.recent,
    3,
    recentPool.length,
    (offset) => selectRecentBatch(recentPool, offset),
  );
  const nextPicks = nextBatchOffset(
    offsets.picks,
    4,
    featuredTools.length,
    (offset) => selectFeaturedBatch(featuredTools, recent, offset),
  );
  const nextWorkflows = nextBatchOffset(
    offsets.workflows,
    3,
    workflows.length,
    (offset) => selectBatch(workflows, 3, offset),
  );
  const nextCategories = nextBatchOffset(
    offsets.categories,
    8,
    categories.length,
    (offset) => selectBatch(categories, 8, offset),
  );
  const change = (section: keyof typeof offsets) => (offset: number) =>
    setOffsets((current) => ({ ...current, [section]: offset }));

  return (
    <>
      <section
        className="pb-8 pt-7 sm:pb-10 sm:pt-10 lg:pt-12"
        aria-label="Discover tools"
      >
        <div className={container}>
          <div className="grid items-center gap-6 lg:grid-cols-[1fr_460px] lg:gap-10">
            {hero}
            <aside
              aria-labelledby="recent-heading"
              className="min-w-0 overflow-hidden rounded-2xl border border-primary/20 bg-card shadow-warm-md"
            >
              <div className="flex flex-wrap items-center justify-between gap-x-3 border-b border-border/60 px-4 py-2">
                <div>
                  <h2 id="recent-heading" className="text-sm font-bold">
                    Recently Added
                  </h2>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    Recent finds · A new batch each day
                  </p>
                </div>
                <BatchButton
                  label="recently added tools"
                  next={nextRecent}
                  onClick={change("recent")}
                />
              </div>
              <div
                aria-live="polite"
                aria-atomic="true"
                className="divide-y divide-border/60"
              >
                {recent.map((tool) => (
                  <Link
                    key={tool.slug}
                    href={`/tools/${tool.slug}`}
                    prefetch={false}
                    className="group block px-4 py-3 transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                  >
                    <article className="flex items-start gap-3">
                      <ToolAvatar
                        name={tool.name}
                        url={tool.url}
                        iconUrl={tool.iconUrl}
                        className="h-9 w-9"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="truncate text-sm font-semibold group-hover:text-primary">
                            {tool.name}
                          </h3>
                          {Number.isFinite(new Date(tool.createdAt).getTime()) && (
                            <time
                              dateTime={tool.createdAt}
                              title={`Added ${tool.createdAt.slice(0, 10)}`}
                              className="shrink-0 text-[10px] text-muted-foreground"
                            >
                              {addedDate.format(new Date(tool.createdAt))}
                            </time>
                          )}
                        </div>
                        <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                          {tool.tagline}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                          <span className="text-[10px] font-medium text-primary">
                            {pricingLabels[tool.pricing]}
                          </span>
                          <ToolEngagement
                            viewCount={tool.viewCount}
                            clickCount={tool.clickCount}
                          />
                        </div>
                      </div>
                    </article>
                  </Link>
                ))}
                {!recent.length && (
                  <p className="p-5 text-sm text-muted-foreground">
                    {recentUnavailable
                      ? "Recent additions are unavailable right now."
                      : "No recent additions yet."}
                  </p>
                )}
              </div>
              <Link
                href="/tools?sort=newest"
                className="block border-t border-border/60 px-4 py-2.5 text-xs font-semibold text-primary hover:bg-muted/40"
              >
                Browse recent additions →
              </Link>
            </aside>
          </div>
        </div>
      </section>

      <section
        className="border-y border-border/60 bg-muted/30 py-8 sm:py-10"
        aria-labelledby="workflows-heading"
      >
        <div className={container}>
          <SectionHeading
            id="workflows-heading"
            title="Explore Workflows"
            description="Start with a goal. Explore a different path each day."
            href="/stacks"
            label="workflows"
            next={nextWorkflows}
            onClick={change("workflows")}
          />
          <div
            aria-live="polite"
            aria-atomic="true"
            className="grid grid-cols-1 gap-3 md:grid-cols-3"
          >
            {selectedWorkflows.map((stack) => (
              <Link
                key={stack.slug}
                href={`/stacks/${stack.slug}`}
                className={cardLink}
              >
                <article className="hover-lift flex h-full flex-col rounded-xl border border-border/80 bg-card p-5 shadow-warm-xs">
                  <div className="flex items-center gap-3">
                    <StackIcon icon={stack.icon} size="sm" />
                    <h3 className="text-sm font-bold group-hover:text-primary">
                      {stack.name}
                    </h3>
                  </div>
                  <p className="mt-3 text-[0.8125rem] leading-relaxed text-muted-foreground">
                    {stack.tagline}
                  </p>
                  <p className="mt-3 text-[11px] text-muted-foreground">
                    For {stack.audience}
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-foreground/80">
                    {stack.toolNames.slice(0, 3).join(" · ")}
                    {stack.toolNames.length > 3 && (
                      <span className="text-muted-foreground">
                        {" "}
                        +{stack.toolNames.length - 3} more
                      </span>
                    )}
                  </p>
                  <span className="mt-auto inline-flex items-center gap-1 pt-4 text-xs font-semibold text-primary">
                    Explore workflow{" "}
                    <ArrowRight className="h-3 w-3" aria-hidden="true" />
                  </span>
                </article>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {picks.length > 0 && (
        <section className="py-9 sm:py-12" aria-labelledby="picks-heading">
          <div className={container}>
            <SectionHeading
              id="picks-heading"
              title="Editor's Picks"
              description="Featured tools to explore today"
              href="/tools?featured=1"
              label="editor's picks"
              next={nextPicks}
              onClick={change("picks")}
            />
            <div
              aria-live="polite"
              aria-atomic="true"
              className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4"
            >
              {picks.map((tool) => (
                <Link
                  key={tool.slug}
                  href={`/tools/${tool.slug}`}
                  prefetch={false}
                  className={cardLink}
                >
                  <article className="hover-lift flex h-full flex-col rounded-xl border border-border/80 bg-card p-4 shadow-warm-xs">
                    <div className="flex items-center gap-2.5">
                      <ToolAvatar
                        name={tool.name}
                        url={tool.url}
                        iconUrl={tool.iconUrl}
                        className="h-8 w-8"
                      />
                      <h3 className="text-sm font-semibold group-hover:text-primary">
                        {tool.name}
                      </h3>
                    </div>
                    <p className="mt-3 line-clamp-2 flex-1 text-xs leading-relaxed text-muted-foreground">
                      {tool.tagline}
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px]">
                      <span className="rounded-full bg-accent px-2 py-0.5 font-medium text-accent-foreground">
                        {pricingLabels[tool.pricing]}
                      </span>
                      {tool.githubStars != null && tool.githubStars > 0 ? (
                        <span
                          className="inline-flex items-center gap-1 text-muted-foreground"
                          aria-label={`${tool.githubStars} GitHub stars`}
                        >
                          <Star className="h-3 w-3" aria-hidden="true" />
                          {compactNumber.format(tool.githubStars)}
                        </span>
                      ) : tool.phVotes != null && tool.phVotes > 0 ? (
                        <span
                          className="inline-flex items-center gap-1 text-muted-foreground"
                          aria-label={`${tool.phVotes} Product Hunt votes`}
                        >
                          <Triangle className="h-3 w-3" aria-hidden="true" />
                          {compactNumber.format(tool.phVotes)}
                        </span>
                      ) : null}
                    </div>
                    <ToolEngagement
                      viewCount={tool.viewCount}
                      clickCount={tool.clickCount}
                      className="mt-3"
                    />
                  </article>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {categories.length > 0 && (
        <section
          className="border-t border-border/60 py-9 pb-14 sm:py-12 sm:pb-16"
          aria-labelledby="categories-heading"
        >
          <div className={container}>
            <SectionHeading
              id="categories-heading"
              title="Explore categories"
              description="Browse a different set of disciplines each day"
              href="/categories"
              label="categories"
              next={nextCategories}
              onClick={change("categories")}
            />
            <div
              aria-live="polite"
              aria-atomic="true"
              className="flex flex-wrap gap-2"
            >
              {selectedCategories.map((category) => (
                <Link
                  key={category.slug}
                  href={`/categories/${category.slug}`}
                  className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card px-3 py-2 text-xs shadow-warm-xs transition-colors hover:border-primary/40 hover:text-primary"
                >
                  <CategoryIcon
                    slug={category.slug}
                    className="h-3.5 w-3.5 text-muted-foreground"
                  />
                  {category.name}
                  <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] tabular-nums text-muted-foreground">
                    {category.count}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
