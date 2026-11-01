import type { Metadata } from "next";
import { GITHUB_REPO_URL, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "./site";
import { getToolExternalLinks } from "./tool-links";
import { isToolSourceFilter } from "./tool-sources";

export function siteUrl(path = "/") {
  return new URL(path, `${SITE_URL}/`).toString();
}

export function pageMetadata(title: string, description: string, path: string, options: { index?: boolean; image?: string } = {}): Metadata {
  const url = siteUrl(path);
  const images = [options.image || siteUrl("/opengraph-image")];
  return {
    title, description,
    alternates: { canonical: url, types: { "text/plain": siteUrl("/llms.txt") } },
    robots: { index: options.index !== false, follow: true },
    openGraph: { title: `${title} | ${SITE_NAME}`, description, url, siteName: SITE_NAME, locale: "en_US", type: "website", images },
    twitter: { card: "summary_large_image", title: `${title} | ${SITE_NAME}`, description, images },
  };
}

export function serializeJsonLd(data: unknown) {
  return JSON.stringify(data).replace(/</g, "\\u003c").replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");
}

export function breadcrumbData(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org", "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({ "@type": "ListItem", position: index + 1, name: item.name, item: siteUrl(item.path) })),
  };
}

export type ToolsSearchParams = Record<string, string | string[] | undefined>;
export const TOOLS_PAGE_SIZE = 24;
const filterKeys = ["q", "category", "pricing", "platform", "openSource", "featured", "source", "sort"] as const;
const pricingValues = ["FREE", "FREEMIUM", "PAID", "OPEN_SOURCE"];

export function toolsSearchPolicy(raw: ToolsSearchParams) {
  const params: Record<string, string> = {};
  for (const key of [...filterKeys, "page", "focus"]) {
    const value = raw[key];
    const first = Array.isArray(value) ? value[0] : value;
    if (first?.trim()) params[key] = first.trim();
  }
  const pageValue = params.page;
  const validPage = !pageValue || (/^[1-9]\d*$/.test(pageValue) && Number(pageValue) <= 1_000_000);
  const page = validPage && pageValue ? Number(pageValue) : 1;
  const index = validPage && !filterKeys.some((key) => Boolean(params[key])) && !Object.values(raw).some(Array.isArray);
  const query = new URLSearchParams();
  for (const key of filterKeys) if (params[key]) query.set(key, params[key]);
  if (page > 1) query.set("page", String(page));
  const path = `/tools${query.size ? `?${query}` : ""}`;
  // Arbitrary crawl URLs must not pass invalid enum values to Prisma.
  if (params.pricing && !pricingValues.includes(params.pricing)) delete params.pricing;
  if (params.source && !isToolSourceFilter(params.source)) delete params.source;
  return { params, page, index, path };
}

export function toolsPageHref(params: Record<string, string>, page: number) {
  return toolsSearchPolicy({ ...params, page: String(page), focus: undefined }).path;
}

const META_DESCRIPTION_LIMIT = 160;
const SHORT_DESCRIPTION = 70;

const pricingPhrase: Record<string, string> = {
  FREE: "a free",
  FREEMIUM: "a freemium",
  PAID: "a paid",
  OPEN_SOURCE: "an open-source",
};

export function clampMetaDescription(text: string, max = META_DESCRIPTION_LIMIT) {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (normalized.length <= max) return normalized;
  const cut = normalized.slice(0, max - 1);
  const boundary = cut.lastIndexOf(" ");
  return `${(boundary > 80 ? cut.slice(0, boundary) : cut).trimEnd()}…`;
}

export function toolPageDescription(input: {
  name: string;
  tagline: string;
  description: string;
  pricing: string;
  categoryName: string;
  editorialSummary?: string | null;
}) {
  const parts = [input.editorialSummary, input.description, input.tagline]
    .map((part) => part?.replace(/\s+/g, " ").trim() || "")
    .filter((part, index, all) => part && all.indexOf(part) === index);
  let text = parts.find((part) => part.length >= SHORT_DESCRIPTION) || parts.join(" ");
  if (text.length < SHORT_DESCRIPTION) {
    const pricing = pricingPhrase[input.pricing] || "a";
    text = `${text} ${input.name} is ${pricing} ${input.categoryName} tool listed on Toools. The listing links to the official site and shows the pricing label.`.replace(/\s+/g, " ").trim();
  }
  return clampMetaDescription(text);
}

export function categoryPageDescription(category: { name: string; description?: string | null; count: number }) {
  const own = category.description?.replace(/\s+/g, " ").trim() || "";
  if (own.length >= SHORT_DESCRIPTION) return clampMetaDescription(own);
  const count = category.count > 0 ? `${category.count} approved ` : "";
  const lead = own ? `${own} ` : "";
  return clampMetaDescription(`${lead}Browse ${count}${category.name} tools on Toools. Each listing links to the official site and shows its pricing label.`);
}

export function toolsListingCopy(params: Record<string, string>, page: number) {
  const query = params.q?.trim();
  const clipped = query ? clampMetaDescription(query, 48).replace(/…$/, "") : "";
  const title = query
    ? (page > 1 ? `“${clipped}” tools — Page ${page}` : `“${clipped}” tools`)
    : (page > 1 ? `Browse Tools — Page ${page}` : "Browse Tools");
  const description = query
    ? clampMetaDescription(`Search Toools for “${query}”. Results are approved listings with pricing, platforms, and a link to each official site.`)
    : "Search and filter curated tools by source, category, pricing, platform, open-source status, and trust signals.";
  return { title, description };
}

function sameIdentity(left: string, right: string) {
  try {
    const a = new URL(left);
    const b = new URL(right);
    const path = (value: URL) => value.pathname.replace(/\/$/, "");
    return a.protocol === b.protocol && a.hostname.toLowerCase() === b.hostname.toLowerCase() && path(a) === path(b) && a.search === b.search;
  } catch {
    return left === right;
  }
}

export function softwareIdentityUrls(tool: { url: string; github: string | null; sourceUrl: string | null; source?: string | null }) {
  const urls: string[] = [];
  for (const link of getToolExternalLinks(tool)) {
    if (link.kind !== "github" && link.kind !== "product-hunt") continue;
    if (sameIdentity(link.url, tool.url) || urls.some((existing) => sameIdentity(existing, link.url))) continue;
    urls.push(link.url);
  }
  return urls;
}

function softwareOffer(pricing: string) {
  if (pricing !== "FREE" && pricing !== "OPEN_SOURCE") return undefined;
  return { "@type": "Offer", price: "0", priceCurrency: "USD" };
}

function isoDate(value: Date) {
  return value instanceof Date && Number.isFinite(value.getTime()) ? value.toISOString() : undefined;
}

export function softwareApplicationJsonLd(tool: {
  slug: string;
  name: string;
  description: string;
  tagline?: string;
  url: string;
  pricing: string;
  platforms: string[];
  github: string | null;
  sourceUrl: string | null;
  source?: string | null;
  createdAt: Date;
  updatedAt: Date;
  category: { name: string };
}, editorialSummary?: string | null) {
  const sameAs = softwareIdentityUrls(tool);
  const description = editorialSummary?.trim() || tool.description.trim() || tool.tagline?.trim() || undefined;
  const offers = softwareOffer(tool.pricing);
  const datePublished = isoDate(tool.createdAt);
  const dateModified = isoDate(tool.updatedAt);
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "@id": `${siteUrl(`/tools/${tool.slug}`)}#software`,
    name: tool.name,
    ...(description ? { description } : {}),
    url: tool.url,
    applicationCategory: tool.category.name,
    ...(tool.platforms.length ? { operatingSystem: tool.platforms.join(", ") } : {}),
    mainEntityOfPage: siteUrl(`/tools/${tool.slug}`),
    ...(datePublished ? { datePublished } : {}),
    ...(dateModified ? { dateModified } : {}),
    ...(sameAs.length ? { sameAs } : {}),
    ...(offers ? { offers } : {}),
    ...(offers || tool.pricing === "FREEMIUM" ? { isAccessibleForFree: true } : {}),
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${siteUrl()}#website`,
        name: SITE_NAME,
        url: siteUrl(),
        description: SITE_DESCRIPTION,
        inLanguage: "en",
        publisher: { "@id": `${siteUrl()}#publisher` },
        potentialAction: {
          "@type": "SearchAction",
          target: { "@type": "EntryPoint", urlTemplate: `${siteUrl("/tools")}?q={search_term_string}` },
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@type": "Organization",
        "@id": `${siteUrl()}#publisher`,
        name: SITE_NAME,
        url: siteUrl(),
        logo: { "@type": "ImageObject", url: siteUrl("/logo.svg") },
        sameAs: [GITHUB_REPO_URL],
      },
    ],
  };
}

export function collectionPageJsonLd(input: { path: string; name: string; description: string; items: { name: string; path: string }[] }) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    url: siteUrl(input.path),
    name: input.name,
    description: input.description,
    isPartOf: { "@id": `${siteUrl()}#website` },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: input.items.length,
      itemListElement: input.items.map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: item.name,
        url: siteUrl(item.path),
      })),
    },
  };
}
