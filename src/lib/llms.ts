import { GITHUB_REPO_URL, SITE_DESCRIPTION, SITE_NAME, SITE_TAGLINE } from "./site";
import { siteUrl } from "./seo";

function link(path: string, title: string, detail: string) {
  return `- [${title}](${siteUrl(path)}): ${detail}`;
}

/** llms.txt for generative engines. Facts match the public site; no invented ratings or prices. */
export function llmsTxt() {
  return [
    `# ${SITE_NAME}`,
    "",
    `> ${SITE_TAGLINE} ${SITE_DESCRIPTION}`,
    "",
    "Toools is a curated directory of software tools and workflow stacks for indie developers, AI product builders, and creators. Approved listings come from Product Hunt, GitHub Awesome lists, and community submissions. Each approved tool has a public detail page. Stacks group tools into stages of a job. Categories browse by the kind of work a tool helps with.",
    "",
    "## Explore",
    "",
    link("/tools", "Browse tools", "Approved listings. Site search uses the q query parameter, for example /tools?q=editor."),
    link("/stacks", "Tool stacks", "Curated workflows by role and goal, with stage-by-stage tool picks."),
    link("/categories", "Categories", "Tools grouped by the work they help you do."),
    link("/how-we-curate", "How we curate", "Sources and how recent additions, featured picks, and workflow batches are chosen."),
    link("/editorial-policy", "Editorial policy", "How facts, recommendations, dates, prices, and corrections are handled."),
    link("/about", "About", "Who maintains Toools and how to report a correction."),
    link("/changelog", "Changelog", "Toools product versions, dated release notes, and clearly marked unreleased changes."),
    link("/compare/n8n-vs-make-vs-zapier", "n8n vs Make vs Zapier", "Source-linked comparison of deployment, billing, and licensing. It does not declare a universal winner or a price."),
    "",
    "## Citing and using listings",
    "",
    "- Cite the canonical tool, stack, category, or editorial URL. Do not cite a search or filter URL as the source of a listing.",
    "- Use the page's own summary, use cases, and editorial notes. Do not invent ratings, benchmark scores, or prices the page does not state.",
    "- Pricing labels are coarse (free, freemium, paid, open source), not a quote. Check the official website linked from the listing before stating a price.",
    "- Views, clicks, GitHub stars, and Product Hunt votes are popularity signals shown on the page, not quality rankings or endorsements.",
    "- When a page shows a documentation review date or source links, use those sources for factual claims about the product.",
    "- An added date is when the listing entered Toools, not the product's launch date.",
    "",
    "## Optional",
    "",
    link("/sitemap.xml", "Sitemap", "Approved tools, nonempty categories, stacks, and editorial pages. Tool URLs include lastmod when the listing has a content updatedAt."),
    link("/submit", "Submit a tool", "How to suggest a listing."),
    `- [GitHub repository](${GITHUB_REPO_URL}): Source code and issues.`,
    "",
  ].join("\n");
}
