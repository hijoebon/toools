import Link from "next/link";
import { JsonLd } from "@/components/json-ld";
import { breadcrumbData, pageMetadata } from "@/lib/seo";
import { GITHUB_ISSUES_URL } from "@/lib/site";

export const metadata = pageMetadata("Editorial Standards", "How Toools uses provider documentation, labels editorial judgments, selects alternatives, and records review dates and corrections.", "/editorial-policy");

const standards = [
  { title: "Prefer primary sources", text: "For capability, deployment, pricing, and licensing claims, use provider documentation, official pricing pages, and the project's repository or license. A maker submission or imported directory listing is a lead for review, not independent verification." },
  { title: "Separate facts from recommendations", text: "Capability summaries cite their documentation. “When to choose” guidance is an editorial judgment about a task and its constraints. A recommendation is not a benchmark or a promise of results. Hands-on findings should only be labeled as such when the test and its conditions are recorded." },
  { title: "Explain the decision criteria", text: "Evaluate task fit, deployment requirements, maintenance work, data portability, licensing, and cost at intended usage. A tool's stars, votes, or visits are popularity signals; they do not establish quality or suitability." },
  { title: "Make alternatives meaningful", text: "Curated alternatives explain the need each option addresses. Automatically selected products from the same category are labeled as more tools in that category, rather than equivalent replacements." },
  { title: "Use dates honestly", text: "A documentation review date identifies the reference review for that guidance. It does not imply a full product test or continuous monitoring. Visits and outbound clicks are activity counters, not content updates, and they do not change a listing's updated time. Sitemap lastmod uses a tool or stack updatedAt when one is stored. A category date is the newest approved tool in that category. Pages without a stored content time omit lastmod." },
  { title: "Treat prices and licenses as conditions", text: "Check current prices and terms at the provider. A free allowance can differ from production cost, and source-available software is not automatically open source. Where a guide does not verify an exact amount, it uses budgeting questions rather than a fixed total." },
  { title: "Disclose commercial influence", text: "Any paid placement, affiliate relationship, or sponsored recommendation should be disclosed on the affected content. A featured badge indicates an editorial selection and does not by itself substantiate a performance claim." },
];

export default function EditorialPolicyPage() {
  return <article className="mx-auto max-w-3xl px-6 py-10 sm:py-12">
    <JsonLd data={breadcrumbData([{ name: "Home", path: "/" }, { name: "Editorial Standards", path: "/editorial-policy" }])} />
    <h1 className="text-3xl font-bold tracking-tight">Editorial standards</h1>
    <p className="mt-4 text-sm leading-7 text-secondary-foreground">These standards guide source-linked content by <Link href="/about" className="text-primary underline">Toools maintainers</Link>. Older imported listings may contain less detail; source review dates appear only where a documentation review has been recorded.</p>
    <p className="mt-3 text-xs text-muted-foreground">Policy updated <time dateTime="2026-10-13">2026-10-13</time>.</p>
    <div className="mt-8 space-y-7">{standards.map((standard) => <section key={standard.title}><h2 className="text-lg font-semibold">{standard.title}</h2><p className="mt-2 text-sm leading-7 text-secondary-foreground">{standard.text}</p></section>)}</div>
    <h2 className="mt-8 text-lg font-semibold">Corrections</h2>
    <p className="mt-2 text-sm leading-7 text-secondary-foreground">Open a <a href={GITHUB_ISSUES_URL} className="text-primary underline" target="_blank" rel="noopener noreferrer">GitHub issue</a> with the page URL, the disputed claim, and an official source. Accepted corrections should update the relevant text and its review record.</p>
  </article>;
}
