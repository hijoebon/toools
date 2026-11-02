"use client";

import Link from "next/link";
import {
  Bot,
  Palette,
  Code2,
  PenLine,
  ImageIcon,
  Film,
  TrendingUp,
  BarChart3,
  Zap,
  Rocket,
  Shield,
  MessageSquare,
  Briefcase,
  FolderOpen,
  GraduationCap,
  Wrench,
  Workflow,
  ChevronDown,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

const categoryIcons: Record<string, LucideIcon> = {
  "ai-assistants": Bot,
  design: Palette,
  development: Code2,
  "writing-notes": PenLine,
  "image-media": ImageIcon,
  "video-audio": Film,
  "seo-marketing": TrendingUp,
  "data-analytics": BarChart3,
  productivity: Zap,
  "deploy-hosting": Rocket,
  "security-privacy": Shield,
  communication: MessageSquare,
  business: Briefcase,
  automation: Workflow,
  "file-management": FolderOpen,
  education: GraduationCap,
  utilities: Wrench,
};

interface CategoryItem {
  slug: string;
  name: string;
  icon?: string | null;
  _count?: { tools: number };
}

export function CategoryIcon({ slug, className }: { slug: string; className?: string }) {
  const Icon = categoryIcons[slug];
  if (!Icon) return null;
  return <Icon className={className} />;
}

export function HeroCategoryNav({
  categories,
  variant = "card",
}: {
  categories: CategoryItem[];
  variant?: "card" | "plain";
}) {
  const [expanded, setExpanded] = useState(false);

  const content = (
    <>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-[1.375rem] font-bold tracking-[-0.02em] text-foreground">
            Explore categories
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Browse tools by discipline
          </p>
        </div>
        <Link
          href="/categories"
          className="shrink-0 text-[0.8125rem] font-semibold text-primary transition-colors hover:text-primary/80"
        >
          View all &rarr;
        </Link>
      </div>

      <button
        type="button"
        onClick={() => setExpanded((open) => !open)}
        aria-expanded={expanded}
        className="mt-4 flex w-full items-center justify-between gap-2 rounded-lg border border-border/60 bg-background/60 px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-background hover:text-foreground md:hidden"
      >
        <span>{expanded ? "Hide categories" : `${categories.length} categories`}</span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 transition-transform duration-200",
            expanded && "rotate-180",
          )}
        />
      </button>

      <div
        className={cn(
          "flex flex-wrap gap-2",
          expanded ? "mt-4" : "mt-0 hidden md:flex md:mt-5",
        )}
      >
        {categories.map((cat) => {
          const Icon = categoryIcons[cat.slug] || Bot;
          return (
            <Link
              key={cat.slug}
              href={`/categories/${cat.slug}`}
              className="group inline-flex items-center gap-2 rounded-full border border-border/70 bg-card px-3 py-1.5 text-xs font-medium whitespace-nowrap shadow-warm-xs transition-all duration-200 hover:border-primary/35 hover:shadow-warm-md"
            >
              <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground transition-colors duration-200 group-hover:text-primary" strokeWidth={2} />
              <span className="text-foreground/90 transition-colors duration-200 group-hover:text-primary">
                {cat.name}
              </span>
              {cat._count != null && (
                <span className="rounded-full bg-muted px-1.5 py-0.5 font-mono text-[10px] tabular-nums text-muted-foreground">
                  {cat._count.tools}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </>
  );

  if (variant === "plain") {
    return <div>{content}</div>;
  }

  return (
    <div className="rounded-2xl border border-border/50 bg-card/30 p-5 shadow-warm-xs sm:p-6">
      {content}
    </div>
  );
}

export function CategoryGrid({ categories }: { categories: CategoryItem[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {categories.map((cat, i) => {
        const Icon = categoryIcons[cat.slug] || Bot;
        return (
          <Link
            key={cat.slug}
            href={`/categories/${cat.slug}`}
            className="group animate-fade-in-up"
            style={{ animationDelay: `${i * 40}ms` }}
          >
            <div className="flex items-center gap-3 rounded-xl border border-border/80 bg-card p-4 transition-all duration-200 hover:bg-accent/40 hover:border-primary/30 hover:shadow-[0_2px_8px_rgba(217,119,6,0.06)]">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted shrink-0 transition-transform duration-200 group-hover:scale-105">
                <Icon className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors duration-200" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold leading-snug group-hover:text-primary transition-colors duration-200">
                  {cat.name}
                </h3>
                {cat._count && (
                  <span className="text-xs text-muted-foreground font-mono tabular-nums">
                    {cat._count.tools} tools
                  </span>
                )}
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
