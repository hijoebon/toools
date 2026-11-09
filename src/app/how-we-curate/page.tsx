import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { GITHUB_REPO_URL } from "@/lib/site";
import { pageMetadata, breadcrumbData } from "@/lib/seo";
import { JsonLd } from "@/components/json-ld";

export const metadata: Metadata = pageMetadata(
  "Sources & Selection",
  "Where Toools finds tools and how approved listings, featured tools, recent additions, workflow picks, and popularity signals shape recommendations.",
  "/how-we-curate",
);

const sources = [
  {
    name: "GitHub Awesome lists",
    description: "Community-maintained collections of developer, design, productivity, and self-hosted tools. Imports collect linked tools and available GitHub stars.",
    href: `${GITHUB_REPO_URL}/blob/main/scripts/lib/awesome.ts`,
    label: "See the source collections",
  },
  {
    name: "Product Hunt",
    description: "Products discovered through topic-based imports, with their descriptions, launch-page links, and vote counts.",
    href: `${GITHUB_REPO_URL}/blob/main/scripts/import-producthunt.ts`,
    label: "See the import rules",
  },
  {
    name: "Maintainers & community",
    description: "The initial collection and workflow recommendations are maintained in the repository. Makers and users can suggest additions and corrections through GitHub Issues.",
    href: "/submit",
    label: "Suggest a tool",
  },
];

const selections = [
  {
    name: "Recently Added",
    description: "Three tools beside the Hero, selected from up to 36 newest approved records within 30 days of the newest entry. Each batch prefers no more than two tools per category before filling gaps, and keeps the selected tools newest first. Added dates describe entry into Toools, not product launch dates.",
  },
  {
    name: "Daily batches",
    description: "Recent additions, workflows, and category shortcuts rotate daily at midnight in Asia/Shanghai time. The default selection stays stable within a day while the candidate pool is unchanged. “Another batch” changes the visible selection immediately. When all available items fit, there is no additional batch.",
  },
  {
    name: "Editor's Picks",
    description: "A small, manually maintained set of approved tools for specific tasks. Each card explains who it helps, an advantage over a common approach, a relevant limit, and the official sources checked. The homepage and featured API share the same order. Picks do not rotate daily or use views, votes, stars, or the catalog Featured flag for selection. Recent batches omit these picks.",
  },
  {
    name: "Browse tools",
    description: "The default order puts featured tools first, then sorts by Toools views. You can switch to newest additions or outbound clicks, and filter by category, pricing, platform, and open-source status.",
  },
  {
    name: "Other tools in the same category",
    description: "Automatic suggestions use the current tool's category and order candidates by GitHub stars, then Product Hunt votes, then views. Sharing a category is a starting point for comparison, not proof that two tools have equivalent capabilities.",
  },
  {
    name: "Workflow recommendations",
    description: "The homepage shows three workflows per batch, rotating through all curated workflows. Maintainers choose tools for specific stages of a task and record editor notes. “Explore more” offers other tools from those categories, ordered by a popularity score of GitHub stars × 10 + Product Hunt votes.",
  },
];

export default function HowWeCuratePage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <JsonLd data={breadcrumbData([{ name: "Home", path: "/" }, { name: "Sources & Selection", path: "/how-we-curate" }])} />
      <Link href="/" className="text-xs font-medium text-muted-foreground hover:text-primary">← Back to discovery</Link>
      <h1 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl">Where tools come from. How picks are made.</h1>
      <p className="mt-4 text-base leading-relaxed text-muted-foreground">
        Toools brings public collections, product launches, and community suggestions into one place.
        Workflow guidance and visible signals help you decide what fits your task.
      </p>

      <section id="sources" aria-labelledby="sources-heading" className="mt-9 scroll-mt-24">
        <h2 id="sources-heading" className="text-xl font-semibold">Our data sources</h2>
        <div className="mt-4 space-y-3">
          {sources.map((source) => (
            <div key={source.name} className="rounded-xl border border-border bg-card p-4 sm:p-5">
              <h3 className="text-sm font-semibold">{source.name}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{source.description}</p>
              <Link href={source.href} className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary">
                {source.label} <ArrowRight className="h-3 w-3" aria-hidden="true" />
              </Link>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
          Source links appear on tool pages when saved. Awesome imports may link to the tool itself;
          the source collections and import code are public in our repository.
        </p>
      </section>

      <section aria-labelledby="eligibility-heading" className="mt-9">
        <h2 id="eligibility-heading" className="text-xl font-semibold">What gets listed or featured</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          The directory shows approved records. Import scripts normalize URLs, avoid duplicate entries,
          and assign categories. New imports default to pending; maintainers can explicitly enable automatic approval.
          An approved listing therefore does not imply an individual hands-on review.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Featured status can be set by maintainers or by the Product Hunt import and backfill rules
          for products with more than 1,000 votes. It is a catalog discovery flag, not a product test score or eligibility for Editor’s Picks.
        </p>
      </section>

      <section aria-labelledby="selection-heading" className="mt-9">
        <h2 id="selection-heading" className="text-xl font-semibold">How recommendations are selected</h2>
        <dl className="mt-4 divide-y divide-border rounded-xl border border-border px-4 sm:px-5">
          {selections.map((selection) => (
            <div key={selection.name} className="py-4">
              <dt className="text-sm font-semibold">{selection.name}</dt>
              <dd className="mt-2 text-sm leading-relaxed text-muted-foreground">{selection.description}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section aria-labelledby="signals-heading" className="mt-9">
        <h2 id="signals-heading" className="text-xl font-semibold">What the numbers tell you</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          GitHub stars and Product Hunt votes are snapshots collected during imports or backfills.
          Views count tool-detail visits; clicks count tracked outbound visits. These are activity and
          popularity signals, not a quality rating or a measure of unique users.
          Check current capabilities, pricing, and licensing with the provider before choosing.
        </p>
        <Link href={GITHUB_REPO_URL} className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary">
          Read the source code <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      </section>
    </article>
  );
}
