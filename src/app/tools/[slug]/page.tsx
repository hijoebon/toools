import { notFound } from "next/navigation";
import Link from "next/link";
import { loadApprovedTool, toolCardSelect } from "@/lib/tools";
import { after, connection } from "next/server";
import { JsonLd } from "@/components/json-ld";
import { breadcrumbData, collectionPageJsonLd, pageMetadata, softwareApplicationJsonLd, toolPageDescription } from "@/lib/seo";
import { toolEditorial } from "@/lib/tool-editorial";
import { recordToolMetric } from "@/lib/record-tool-metric";
import { getToolExternalLinks } from "@/lib/tool-links";
import type { Metadata } from "next";
import { ArrowUpRight, ChevronRight, ExternalLink, Star, Triangle } from "lucide-react";
import { GitHubIcon } from "@/components/github-icon";
import { ToolAvatar } from "@/components/tool-avatar";
import { ToolEngagement } from "@/components/tool-engagement";
import { ToolWebsiteLink } from "@/components/tool-website-link";
import { prisma } from "@/lib/db";
import { getStackIconKey } from "@/lib/stacks";
import { StackIcon } from "@/components/stack-icon";
import { CatalogDegraded } from "@/components/catalog-degraded";
import { catalogCache } from "@/lib/catalog-cache";
import { catalogOr } from "@/lib/catalog-fallback";

interface ToolPageProps {
  params: Promise<{ slug: string }>;
}

const getAlternatives = catalogCache(async (categoryId: string, excludeSlug: string) => {
  const editorial = toolEditorial[excludeSlug];
  const slugs = editorial?.alternatives.map((alternative) => alternative.slug) ?? [];
  const tools = await prisma.tool.findMany({
    where: {
      ...(slugs.length ? { slug: { in: slugs } } : { categoryId }),
      status: "APPROVED",
      NOT: { slug: excludeSlug },
    },
    select: toolCardSelect,
    take: 4,
    orderBy: [
      { githubStars: { sort: "desc", nulls: "last" } },
      { phVotes: { sort: "desc", nulls: "last" } },
      { viewCount: "desc" },
    ],
  });
  return slugs.length ? tools.sort((a, b) => slugs.indexOf(a.slug) - slugs.indexOf(b.slug)) : tools;
}, "tool-alternatives", { metrics: true });

export async function generateMetadata({ params }: ToolPageProps): Promise<Metadata> {
  await connection();
  const { slug } = await params;
  const loaded = await loadApprovedTool(slug);
  if (loaded.status === "missing") notFound();
  if (loaded.status === "unavailable") {
    return pageMetadata("Tool", "This listing is temporarily unavailable.", `/tools/${slug}`, { index: false });
  }
  const tool = loaded.tool;
  return pageMetadata(
    `${tool.name}: Use Cases & Alternatives`,
    toolPageDescription({
      name: tool.name,
      tagline: tool.tagline,
      description: tool.description,
      pricing: tool.pricing,
      categoryName: tool.category.name,
      editorialSummary: toolEditorial[slug]?.summary,
    }),
    `/tools/${tool.slug}`,
    { image: tool.screenshotUrl || undefined },
  );
}

const pricingLabels: Record<string, string> = {
  FREE: "Free",
  FREEMIUM: "Freemium",
  PAID: "Paid",
  OPEN_SOURCE: "Open Source",
};

const compactNumber = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 });
const countNumber = new Intl.NumberFormat("en");
const listingDate = new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });

export default async function ToolPage({ params }: ToolPageProps) {
  await connection();
  const { slug } = await params;
  const loaded = await loadApprovedTool(slug);
  if (loaded.status === "missing") notFound();
  if (loaded.status === "unavailable") {
    return <CatalogDegraded title="Tool" message="This listing is temporarily unavailable." />;
  }
  const tool = loaded.tool;

  after(() => recordToolMetric(tool.id, "view"));
  const editorial = toolEditorial[slug];
  const externalLinks = getToolExternalLinks(tool);
  const githubLink = externalLinks.find((link) => link.kind === "github");
  const tagline = tool.tagline.trim();
  const headingDetail = tagline && tagline.toLowerCase() !== tool.name.trim().toLowerCase()
    ? tagline
    : tool.category.name;

  const alternatives = (await catalogOr(() => getAlternatives(tool.categoryId, tool.slug), [])).value;

  const stacks = tool.stageRecommendations.map((sr) => ({
    name: sr.stage.stack.name,
    slug: sr.stage.stack.slug,
    stageName: sr.stage.name,
  }));

  return (
    <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
      <JsonLd data={breadcrumbData([{ name: "Home", path: "/" }, { name: "Tools", path: "/tools" }, { name: tool.category.name, path: `/categories/${tool.category.slug}` }, { name: tool.name, path: `/tools/${tool.slug}` }])} />
      <JsonLd data={softwareApplicationJsonLd(tool, editorial?.summary)} />
      {alternatives.length > 0 && (
        <JsonLd data={collectionPageJsonLd({
          path: `/tools/${tool.slug}`,
          name: `Alternatives to ${tool.name}`,
          description: toolPageDescription({ name: tool.name, tagline: tool.tagline, description: tool.description, pricing: tool.pricing, categoryName: tool.category.name, editorialSummary: editorial?.summary }),
          items: alternatives.map((alt) => ({ name: alt.name, path: `/tools/${alt.slug}` })),
        })} />
      )}
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-muted-foreground pt-5 mb-5">
        <Link href="/tools" className="hover:text-foreground transition-colors">Tools</Link>
        <ChevronRight className="h-3 w-3" />
        <Link href={`/categories/${tool.category.slug}`} className="hover:text-foreground transition-colors">{tool.category.name}</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground font-medium truncate max-w-[200px]">{tool.name}</span>
      </nav>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-10 pb-16">
        {/* Main content */}
        <div className="min-w-0">
          {/* Tool hero */}
          <div className="flex gap-4 items-start pb-7">
            <ToolAvatar name={tool.name} url={tool.url} iconUrl={tool.iconUrl} className="h-[52px] w-[52px]" />
            <div className="min-w-0">
              <h1 className="text-balance break-words text-[1.75rem] font-extrabold leading-tight tracking-[-0.025em]">
                {tool.name} — {headingDetail}
              </h1>
              <div className="flex gap-1.5 mt-2.5 flex-wrap">
                <Link href={`/categories/${tool.category.slug}`} className="inline-flex rounded-full bg-muted px-2 py-0.5 text-[0.6875rem] font-medium text-muted-foreground hover:text-foreground transition-colors">
                  {tool.category.name}
                </Link>
                {tool.tags.slice(0, 3).map(({ tag }) => (
                  <span key={tag.id} className="inline-flex rounded-full bg-muted px-2 py-0.5 text-[0.6875rem] font-medium text-muted-foreground">
                    {tag.name}
                  </span>
                ))}
              </div>
              <ToolEngagement viewCount={tool.viewCount} clickCount={tool.clickCount} className="mt-3" />
              {externalLinks.length > 0 && (
                <nav aria-label={`${tool.name} external links`} className="mt-3 flex flex-wrap gap-2">
                  {externalLinks.map((link) => (
                    <ToolWebsiteLink key={link.destination} slug={tool.slug} destination={link.destination} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
                      {link.kind === "github" ? <GitHubIcon className="h-3.5 w-3.5" /> : link.kind === "product-hunt" ? <Triangle className="h-3.5 w-3.5" aria-hidden="true" /> : <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />}
                      {link.label}
                      <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
                    </ToolWebsiteLink>
                  ))}
                </nav>
              )}
            </div>
          </div>

          {/* About */}
          {tool.description && (
            <section className="mb-8">
              <h2 className="text-base font-bold tracking-[-0.01em] mb-3 pb-2 border-b border-border">About</h2>
              <p className="text-sm text-secondary-foreground max-w-[60ch] leading-[1.7]">
                {editorial?.summary || tool.description}
              </p>
            </section>
          )}

          {editorial && (
            <section className="mb-8 rounded-xl border border-border bg-muted/30 p-5">
              <h2 className="text-base font-bold mb-3">When to choose {tool.name}</h2>
              <p className="text-sm leading-relaxed text-secondary-foreground">{editorial.bestFor}</p>
              <h3 className="text-sm font-semibold mt-4 mb-1">Before you commit</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{editorial.checkBeforeChoosing}</p>
              {editorial.licenseNote && <p className="text-sm leading-relaxed mt-3">{editorial.licenseNote}</p>}
              <p className="text-xs text-muted-foreground mt-4">Editorial guidance by <Link href="/about" className="underline">Toools maintainers</Link>. Documentation reviewed <time dateTime={editorial.reviewedOn}>{editorial.reviewedOn}</time>.</p>
              <ul className="flex flex-wrap gap-x-4 gap-y-2 mt-3 text-xs">
                {editorial.sources.map((source) => <li key={source.url}><a href={source.url} target="_blank" rel="noopener noreferrer" className="text-primary underline">{source.label}</a></li>)}
              </ul>
            </section>
          )}
          {!editorial && tool.sourceUrl && <p className="mb-8 text-xs text-muted-foreground">Listing source: <a href={tool.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-primary underline">Original source</a>. <Link href="/editorial-policy" className="underline">How we curate tools</Link>.</p>}

          {/* Use Cases */}
          {tool.useCases.length > 0 && (
            <section className="mb-8">
              <h2 className="text-base font-bold tracking-[-0.01em] mb-3 pb-2 border-b border-border">Use Cases</h2>
              <ul className="flex flex-col gap-2">
                {tool.useCases.map((uc, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-secondary-foreground">
                    <span className="w-[5px] h-[5px] rounded-full bg-primary shrink-0 mt-2" />
                    {uc}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Pros & Cons */}
          {(tool.pros.length > 0 || tool.cons.length > 0) && (
            <section className="mb-8">
              <h2 className="text-base font-bold tracking-[-0.01em] mb-3 pb-2 border-b border-border">Pros & Cons</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {tool.pros.length > 0 && (
                  <div>
                    <h4 className="text-[0.8125rem] font-semibold text-emerald-600 dark:text-emerald-400 mb-2.5 flex items-center gap-1.5">Strengths</h4>
                    <ul className="space-y-1.5">
                      {tool.pros.map((p, i) => (
                        <li key={i} className="flex items-start gap-1.5 text-[0.8125rem] text-secondary-foreground">
                          <span className="font-bold font-mono text-emerald-600 dark:text-emerald-400">+</span>
                          {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {tool.cons.length > 0 && (
                  <div>
                    <h4 className="text-[0.8125rem] font-semibold text-red-600 dark:text-red-400 mb-2.5 flex items-center gap-1.5">Limitations</h4>
                    <ul className="space-y-1.5">
                      {tool.cons.map((c, i) => (
                        <li key={i} className="flex items-start gap-1.5 text-[0.8125rem] text-secondary-foreground">
                          <span className="font-bold font-mono text-red-600 dark:text-red-400">-</span>
                          {c}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Divider */}
          <div className="h-px bg-border" />

          {/* Part of these Stacks */}
          {stacks.length > 0 && (
            <section className="mt-7 mb-8">
              <h2 className="text-base font-bold tracking-[-0.01em] mb-3 pb-2 border-b border-border">Part of these Stacks</h2>
              <div className="flex flex-col gap-2">
                {stacks.map((s) => {
                  const iconKey = getStackIconKey(s.slug);
                  return (
                  <Link
                    key={`${s.slug}-${s.stageName}`}
                    href={`/stacks/${s.slug}`}
                    className="flex items-center gap-2.5 rounded-xl bg-muted/50 px-3.5 py-3 text-[0.8125rem] transition-colors hover:bg-muted"
                  >
                    {iconKey && <StackIcon icon={iconKey} size="sm" />}
                    <span className="font-semibold">{s.name}</span>
                    <span className="ml-auto text-muted-foreground">{s.stageName} stage</span>
                  </Link>
                  );
                })}
              </div>
            </section>
          )}

          {/* Divider */}
          <div className="h-px bg-border" />

          {/* Alternatives */}
          {alternatives.length > 0 && (
            <section className="mt-7">
              <h2 className="text-base font-bold tracking-[-0.01em] mb-3 pb-2 border-b border-border">
                {editorial?.alternatives.length ? `Alternatives to ${tool.name}` : `More ${tool.category.name} tools`}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {alternatives.map((alt) => (
                  <Link key={alt.slug} href={`/tools/${alt.slug}`} className="group">
                    <article className="flex flex-col gap-2.5 p-4 rounded-2xl border border-border/80 bg-card shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
                      <ToolAvatar name={alt.name} url={alt.url} iconUrl={alt.iconUrl} className="h-10 w-10" />
                      <div>
                        <div className="text-[0.8125rem] font-semibold group-hover:text-primary transition-colors">{alt.name}</div>
                        <p className="text-[0.6875rem] text-muted-foreground mt-1 leading-relaxed">{editorial?.alternatives.find((alternative) => alternative.slug === alt.slug)?.reason || alt.tagline}</p>
                      </div>
                      <div className="flex gap-1.5 flex-wrap mt-auto">
                        <span className="inline-flex rounded-full bg-accent px-2 py-0.5 text-[0.6875rem] font-medium text-accent-foreground">
                          {pricingLabels[alt.pricing] || alt.pricing}
                        </span>
                        {alt.githubStars && (
                          <span className="inline-flex items-center gap-1 text-[0.6875rem] text-muted-foreground font-mono font-medium">
                            <Star className="h-3 w-3" />
                            {compactNumber.format(alt.githubStars)}
                          </span>
                        )}
                        {!alt.githubStars && alt.phVotes && (
                          <span className="inline-flex items-center gap-1 text-[0.6875rem] text-muted-foreground font-mono font-medium">
                            <Triangle className="h-3 w-3" />
                            {compactNumber.format(alt.phVotes)}
                          </span>
                        )}
                      </div>
                      <ToolEngagement viewCount={alt.viewCount} clickCount={alt.clickCount} />
                    </article>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Sidebar */}
        <aside className="lg:sticky lg:top-20 self-start flex flex-col gap-4">
          {/* CTA button */}
          <ToolWebsiteLink
            slug={tool.slug}
            className="flex items-center justify-center gap-1.5 w-full h-10 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-[0.8125rem] transition-all shadow-sm hover:shadow-md"
          >
            Visit Website
            <ArrowUpRight className="h-3.5 w-3.5" />
          </ToolWebsiteLink>

          {/* At a Glance card */}
          <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm">
            <h3 className="text-[0.6875rem] font-semibold uppercase tracking-wider text-muted-foreground mb-3.5">
              At a Glance
            </h3>
            <dl className="flex flex-col">
              <div className="flex justify-between items-center py-2 border-b border-muted text-[0.8125rem]" title="Visits to this tool's detail page on Toools">
                <dt className="text-muted-foreground">Views</dt>
                <dd className="m-0 font-semibold font-mono tabular-nums">{countNumber.format(tool.viewCount)}</dd>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-muted text-[0.8125rem]" title="Tracked outbound clicks from Toools">
                <dt className="text-muted-foreground">Clicks</dt>
                <dd className="m-0 font-semibold font-mono tabular-nums">{countNumber.format(tool.clickCount)}</dd>
              </div>
              {tool.phVotes != null && (
                <div className="flex justify-between items-center py-2 border-b border-muted text-[0.8125rem]">
                  <dt className="text-muted-foreground">PH Votes</dt>
                  <dd className="m-0 font-semibold font-mono text-primary">{compactNumber.format(tool.phVotes)}</dd>
                </div>
              )}
              {tool.githubStars != null && (
                <div className="flex justify-between items-center py-2 border-b border-muted text-[0.8125rem]">
                  <dt className="text-muted-foreground">GitHub Stars</dt>
                  <dd className="m-0 font-semibold font-mono">
                    {githubLink ? (
                      <ToolWebsiteLink slug={tool.slug} destination="github" className="inline-flex items-center gap-1 hover:text-primary transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
                        <span className="sr-only">View {tool.name} on GitHub, </span>
                        {compactNumber.format(tool.githubStars)}
                        <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
                      </ToolWebsiteLink>
                    ) : compactNumber.format(tool.githubStars)}
                  </dd>
                </div>
              )}
              {!tool.github && !tool.githubStars && (
                <div className="flex justify-between items-center py-2 border-b border-muted text-[0.8125rem]">
                  <dt className="text-muted-foreground">GitHub</dt>
                  <dd className="m-0 font-semibold text-muted-foreground">Closed source</dd>
                </div>
              )}
              <div className="flex justify-between items-center py-2 border-b border-muted text-[0.8125rem]">
                <dt className="text-muted-foreground">Pricing</dt>
                <dd className="m-0 font-semibold font-mono">{editorial?.licenseNote ? "Self-hosted / Cloud" : pricingLabels[tool.pricing]}</dd>
              </div>
              {tool.platforms.length > 0 && (
                <div className="flex justify-between items-center py-2 border-b border-muted text-[0.8125rem]">
                  <dt className="text-muted-foreground">Platforms</dt>
                  <dd className="m-0 font-semibold font-mono">{tool.platforms.join(", ")}</dd>
                </div>
              )}
              <div className="flex justify-between items-center py-2 text-[0.8125rem]">
                <dt className="text-muted-foreground">Updated</dt>
                <dd className="m-0 font-semibold font-mono">
                  <time dateTime={tool.updatedAt.toISOString()}>{listingDate.format(tool.updatedAt)}</time>
                </dd>
              </div>
            </dl>
          </div>
        </aside>
      </div>
    </div>
  );
}
