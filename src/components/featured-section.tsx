import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { ToolAvatar } from "./tool-avatar";
import { ToolWebsiteLink } from "./tool-website-link";
import type { EditorPickTool } from "@/lib/tools";

const reviewDate = new Intl.DateTimeFormat("en", {
  month: "short", day: "numeric", year: "numeric", timeZone: "UTC",
});

export function FeaturedSection({ initialTools }: { initialTools: EditorPickTool[] }) {
  if (!initialTools.length) return null;

  return (
    <section className="py-9 sm:py-12" aria-labelledby="picks-heading">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
          <div>
            <h2 id="picks-heading" className="text-xl font-bold tracking-tight sm:text-[1.375rem]">Editor&apos;s Picks</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">Useful finds for a specific job, with a reason to try each.</p>
          </div>
          <Link href="/how-we-curate#selection-heading" className="inline-flex min-h-11 items-center text-xs font-semibold text-primary hover:underline">How we choose →</Link>
        </div>
        <div className="grid grid-cols-1 items-start gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {initialTools.map((tool) => (
            <article key={tool.slug} data-editor-pick={tool.slug} className="rounded-xl border border-border/80 bg-card p-4 shadow-warm-xs sm:p-5">
              <Link href={`/tools/${tool.slug}`} prefetch={false} className="group block rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <div className="flex items-center gap-2.5">
                  <ToolAvatar name={tool.name} url={tool.url} iconUrl={tool.iconUrl} className="h-8 w-8" />
                  <span className="text-sm font-medium text-muted-foreground group-hover:text-primary">{tool.name}</span>
                </div>
                <h3 className="mt-3 text-base font-semibold leading-snug group-hover:text-primary">{tool.editorial.task}</h3>
              </Link>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{tool.editorial.reason}</p>
              <p className="mt-3 text-xs leading-relaxed text-muted-foreground"><span className="font-medium text-foreground">Keep in mind:</span> {tool.editorial.limitation}</p>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-x-4">
                <Link href={`/tools/${tool.slug}`} prefetch={false} className="inline-flex min-h-11 items-center text-xs font-semibold text-primary hover:underline">View tool →</Link>
                <ToolWebsiteLink slug={tool.slug} source="home_editors_picks" className="inline-flex min-h-11 items-center gap-1 rounded-sm text-xs font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  Visit website <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                  <span className="sr-only"> for {tool.name} (opens in a new tab)</span>
                </ToolWebsiteLink>
              </div>
              <div className="mt-2 border-t border-border/60 pt-3 text-xs leading-relaxed text-muted-foreground">
                <p>Docs checked <time dateTime={tool.editorial.reviewedOn}>{reviewDate.format(new Date(tool.editorial.reviewedOn))}</time></p>
                <ul className="mt-1 flex flex-wrap gap-x-4 gap-y-1" aria-label={`Official sources for ${tool.name}`}>
                  {tool.editorial.sources.map((source) => (
                    <li key={source.url}><a href={source.url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center underline decoration-border underline-offset-4 hover:text-primary">{source.label}<span className="sr-only"> (opens in a new tab)</span></a></li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
