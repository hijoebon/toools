import { notFound } from "next/navigation";
import { connection } from "next/server";
import Link from "next/link";
import type { Metadata } from "next";
import { StageToolsSection } from "@/components/stage-tools-section";
import { getStackBySlug, stackTags } from "@/lib/stacks";
import { stackPreviews } from "@/lib/stacks-data";
import { StackIcon } from "@/components/stack-icon";
import { JsonLd } from "@/components/json-ld";
import { StackGuide } from "@/components/stack-guide";
import { stackGuides } from "@/lib/stack-guides";
import { breadcrumbData, pageMetadata, siteUrl } from "@/lib/seo";

interface StackPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return stackPreviews.map((stack) => ({ slug: stack.slug }));
}

export async function generateMetadata({ params }: StackPageProps): Promise<Metadata> {
  await connection();
  const { slug } = await params;
  const stack = await getStackBySlug(slug);
  if (!stack) notFound();
  const guide = stackGuides[slug];
  return pageMetadata(guide?.title || `${stack.name} — Tool Stack`, guide?.description || stack.description, `/stacks/${stack.slug}`);
}

function StackJsonLd({ stack }: { stack: NonNullable<Awaited<ReturnType<typeof getStackBySlug>>> }) {
  const tools = [...new Map(stack.stages.flatMap((stage) => stage.tools).map((tool) => [tool.slug || tool.name, tool])).values()];
  const guide = stackGuides[stack.slug];
  const url = siteUrl(`/stacks/${stack.slug}`);
  return <>
    <JsonLd data={breadcrumbData([{ name: "Home", path: "/" }, { name: "Tool Stacks", path: "/stacks" }, { name: stack.name, path: `/stacks/${stack.slug}` }])} />
    <JsonLd data={{ "@context": "https://schema.org", "@type": "CollectionPage", url, name: guide?.title || stack.name, description: guide?.description || stack.description,
      mainEntity: { "@type": "ItemList", numberOfItems: tools.length, itemListElement: tools.map((tool, index) => ({ "@type": "ListItem", position: index + 1, name: tool.name, ...(tool.slug ? { url: siteUrl(`/tools/${tool.slug}`) } : tool.url ? { url: tool.url } : {}) })) },
      ...(guide ? { hasPart: { "@type": "Article", "@id": `${url}#selection-guide`, headline: guide.title, description: guide.description, dateModified: guide.reviewedOn, inLanguage: "en", author: { "@type": "Organization", name: "Toools maintainers", url: siteUrl("/about") }, publisher: { "@id": `${siteUrl()}#publisher` } } } : {}),
    }} />
  </>;
}

export default async function StackDetailPage({ params }: StackPageProps) {
  await connection();
  const { slug } = await params;
  const stack = await getStackBySlug(slug);
  if (!stack) notFound();

  const guide = stackGuides[slug];
  const tags = stackTags[slug] ?? [];
  const stackMeta = stackPreviews.find((s) => s.slug === slug);

  return (
    <>
      <StackJsonLd stack={stack} />
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
        <nav className="flex items-center gap-1.5 text-xs text-muted-foreground pt-5 mb-5">
          <Link href="/stacks" className="hover:text-foreground transition-colors">Stacks</Link>
          <span className="text-border">/</span>
          <span className="text-foreground font-medium">{stack.name}</span>
        </nav>

        <div className="pb-8">
          <div className="flex items-start gap-3">
            {stackMeta && <StackIcon icon={stackMeta.icon} size="lg" className="mt-1" />}
            <div>
              <h1 className="text-[clamp(1.5rem,3.5vw,2.25rem)] font-extrabold tracking-[-0.03em]">
                {guide?.title || stack.name}
              </h1>
              <p className="mt-2 max-w-[60ch] text-base leading-relaxed text-muted-foreground">
                {guide?.description || stack.description}
              </p>
              {stack.isFallback && (
                <p role="status" className="mt-4 max-w-[65ch] rounded-lg border border-border bg-muted/40 px-3 py-2.5 text-sm leading-relaxed text-muted-foreground">
                  Showing saved workflow picks while live catalog details are unavailable. Tool cards open their official websites.
                </p>
              )}
            </div>
          </div>
          {tags.length > 0 && (
            <div className="flex gap-1.5 mt-3.5 flex-wrap">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex rounded-full bg-muted px-2 py-0.5 text-[0.6875rem] font-medium text-muted-foreground"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {guide && <StackGuide guide={guide} stack={stack} />}

        <div className="flex border border-border rounded-2xl overflow-hidden bg-card shadow-sm mb-10">
          {stack.stages.map((stage, idx) => (
            <a
              key={stage.id}
              href={`#stage-${idx + 1}`}
              className={`flex-1 py-2.5 px-2 text-center text-[0.6875rem] font-semibold text-muted-foreground hover:bg-muted hover:text-foreground transition-all cursor-pointer ${idx < stack.stages.length - 1 ? "border-r border-border" : ""}`}
            >
              <span className="block text-[0.5625rem] text-muted-foreground/60 uppercase tracking-wider mb-0.5">
                {String(idx + 1).padStart(2, "0")}
              </span>
              {stage.name.split(" ")[0]}
            </a>
          ))}
        </div>

        <div className="pb-10">
          {stack.stages.map((stage, idx) => (
            <div key={stage.id} id={`stage-${idx + 1}`} className="relative pl-10 mb-10 last:mb-0">
              {idx < stack.stages.length - 1 && (
                <div className="absolute left-[11px] top-8 bottom-[-40px] w-0.5 bg-gradient-to-b from-border to-transparent" />
              )}
              <div className="absolute left-[5px] top-1 w-3.5 h-3.5 rounded-full bg-primary border-[3px] border-accent shadow-[0_0_0_3px_var(--background)]" />

              <div className="text-[0.625rem] font-bold text-primary uppercase tracking-wider font-mono mb-0.5">
                Stage {String(idx + 1).padStart(2, "0")}
              </div>
              <h2 className="text-lg font-bold tracking-[-0.015em]">{stage.name}</h2>
              {stage.description && (
                <p className="text-[0.8125rem] text-muted-foreground mt-0.5">{stage.description}</p>
              )}

              <StageToolsSection
                stageId={stage.id}
                tools={stage.tools}
                browseCategories={stage.browseCategories}
                relatedGroups={stage.relatedGroups}
              />

              {stage.editorNote && (
                <div className="mt-3.5 px-3.5 py-2.5 bg-muted/50 border-l-[3px] border-primary rounded-r-lg text-xs text-secondary-foreground leading-relaxed">
                  {stage.editorNote}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="text-center py-6 pb-16">
          <Link href="/stacks">
            <button
              type="button"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg border border-border text-sm font-semibold hover:bg-muted transition-colors"
            >
              Explore more stacks
            </button>
          </Link>
        </div>
      </div>
    </>
  );
}
