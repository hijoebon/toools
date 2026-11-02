import assert from "node:assert/strict";
import test from "node:test";
import { categoryPageDescription, collectionPageJsonLd, pageMetadata, serializeJsonLd, siteUrl, softwareApplicationJsonLd, toolPageDescription, toolsListingCopy, toolsPageHref, toolsSearchPolicy, websiteJsonLd } from "./seo";
import { llmsTxt } from "./llms";
import { buildSitemap, SITEMAP_INDEX_URL_LIMIT } from "./seo-sitemap";
import robots from "../app/robots";
import { toolMetricQuery } from "./tool-metrics";
import { HTML_METADATA_BOTS } from "./crawlers";
import { currentRelease } from "./releases";

test("AI search crawlers receive blocking metadata while the default limited crawlers remain covered", () => {
  for (const agent of ["OAI-SearchBot", "ChatGPT-User", "PerplexityBot", "Claude-SearchBot", "Bingbot", "facebookexternalhit", "Twitterbot", "Google-InspectionTool"]) assert.ok(HTML_METADATA_BOTS.test(agent), agent);
  assert.equal(HTML_METADATA_BOTS.test("Mozilla/5.0 Chrome/130.0 Safari/537.36"), false);
});

test("normal pagination is indexable with its own canonical; tracking and UI parameters do not create duplicate canonicals", () => {
  assert.deepEqual(toolsSearchPolicy({ page: "2", focus: "search", utm_source: "chatgpt", gclid: "123" }).path, "/tools?page=2");
  assert.equal(toolsSearchPolicy({ page: "2" }).index, true);
  assert.equal(toolsSearchPolicy({ page: "1" }).path, "/tools");
  const metadata = pageMetadata("Browse Tools", "Description", toolsSearchPolicy({ page: "2" }).path);
  assert.equal(metadata.alternates?.canonical, siteUrl("/tools?page=2"));
});

test("search, filters, and alternative sorts are noindex while remaining crawlable", () => {
  for (const params of [{ q: "AI agents" }, { category: "development" }, { pricing: "FREE" }, { sort: "clicks" }, { platform: "Web" }, { openSource: "1" }, { featured: "1" }, { source: "GITHUB" }, { source: "PRODUCT_HUNT" }]) {
    const policy = toolsSearchPolicy(params);
    assert.equal(policy.index, false);
    assert.deepEqual(pageMetadata("Tools", "Description", policy.path, { index: policy.index }).robots, { index: false, follow: true });
  }
  assert.equal(toolsSearchPolicy({ q: "   " }).index, true);
});

test("malformed crawl parameters cannot reach Prisma as enum values or overflow pagination", () => {
  for (const page of ["-1", "0", "2foo", "1.5", "999999999999999999999", "1000001"]) {
    const policy = toolsSearchPolicy({ page });
    assert.equal(policy.page, 1);
    assert.equal(policy.index, false);
  }
  assert.equal(toolsSearchPolicy({ pricing: "NOT_A_PRICE" }).params.pricing, undefined);
  for (const source of ["NOT_A_SOURCE", "constructor", "__proto__"]) assert.equal(toolsSearchPolicy({ source }).params.source, undefined);
  assert.equal(toolsSearchPolicy({ q: ["one", "two"] }).index, false);
});

test("source filters survive pagination alongside search, pricing, and sort", () => {
  const params = { q: "AI", pricing: "FREE", source: "GITHUB", sort: "newest", focus: "search" };
  assert.equal(toolsPageHref(params, 2), "/tools?q=AI&pricing=FREE&source=GITHUB&sort=newest&page=2");
  assert.equal(toolsPageHref(params, 1), "/tools?q=AI&pricing=FREE&source=GITHUB&sort=newest");
  assert.equal(toolsSearchPolicy({ source: "PRODUCT_HUNT" }).params.source, "PRODUCT_HUNT");
});

test("pagination preserves search and filters and removes only the page-one and UI parameters", () => {
  const params = { q: "AI & code", pricing: "FREE", page: "3", focus: "search" };
  assert.equal(toolsPageHref(params, 2), "/tools?q=AI+%26+code&pricing=FREE&page=2");
  assert.equal(toolsPageHref(params, 1), "/tools?q=AI+%26+code&pricing=FREE");
});

test("JSON-LD cannot terminate its script element and preserves the original structured values", () => {
  const value = { name: '</script><script>alert("x")</script>', description: "line\u2028paragraph\u2029" };
  const serialized = serializeJsonLd(value);
  assert.equal(serialized.includes("<"), false);
  assert.deepEqual(JSON.parse(serialized), value);
});

test("atomic metrics bind untrusted IDs and do not modify content timestamps", () => {
  const id = "x'; DROP TABLE Tool; --";
  for (const metric of ["view", "click"] as const) {
    const query = toolMetricQuery(id, metric);
    assert.deepEqual(query.values, [id]);
    assert.equal(query.sql.includes(id), false);
    assert.equal(query.sql.includes("updatedAt"), false);
    assert.match(query.sql, new RegExp(`${metric}Count.*\\+ 1`));
  }
});

test("sitemap exposes stored content dates and omits dates it does not have", () => {
  const sitemap = buildSitemap(
    [
      { slug: "cursor", updatedAt: "2026-11-01T05:26:16.932Z", categorySlug: "development" },
      { slug: "old", updatedAt: "not-a-date", categorySlug: "development" },
      { slug: "plain", categorySlug: "design" },
    ],
    [{ slug: "development" }, { slug: "design" }],
    [{ slug: "ai-product-builder", updatedAt: "2026-10-13" }],
  );
  const iso = (url: string) => {
    const lastModified = sitemap.find((entry) => entry.url === url)?.lastModified;
    return lastModified instanceof Date ? lastModified.toISOString() : lastModified;
  };
  assert.ok(sitemap.some((entry) => entry.url === siteUrl("/compare/n8n-vs-make-vs-zapier")));
  assert.ok(sitemap.every((entry) => !entry.url.includes("?")));
  assert.equal(iso(siteUrl("/tools/cursor")), "2026-11-01T05:26:16.932Z");
  assert.equal(iso(siteUrl("/tools/old")), undefined);
  assert.equal(iso(siteUrl("/tools/plain")), undefined);
  assert.equal(iso(siteUrl("/categories/development")), "2026-11-01T05:26:16.932Z");
  assert.equal(iso(siteUrl("/categories/design")), undefined);
  assert.equal(iso(siteUrl("/")), "2026-11-01T05:26:16.932Z");
  assert.equal(iso(siteUrl("/stacks")), "2026-10-13T00:00:00.000Z");
  assert.equal(iso(siteUrl("/about")), undefined);
  assert.equal(iso(siteUrl("/editorial-policy")), "2026-10-13T00:00:00.000Z");
  assert.equal(iso(siteUrl("/changelog")), `${currentRelease.date}T00:00:00.000Z`);
  assert.equal(iso(siteUrl("/stacks/ai-product-builder")), "2026-10-13T00:00:00.000Z");
  assert.ok(sitemap.length < SITEMAP_INDEX_URL_LIMIT);
});

test("an empty catalog sitemap still lists the homepage and static routes", () => {
  const sitemap = buildSitemap([], [], []);
  assert.ok(sitemap.some((entry) => entry.url === siteUrl("/")));
  assert.ok(sitemap.some((entry) => entry.url === siteUrl("/tools")));
  assert.ok(sitemap.some((entry) => entry.url === siteUrl("/categories")));
  assert.equal(sitemap.some((entry) => entry.url.includes("/tools/")), false);
  assert.equal(sitemap.some((entry) => entry.url.includes("/categories/")), false);
  assert.equal(sitemap.find((entry) => entry.url === siteUrl("/"))?.lastModified, undefined);
  assert.ok(sitemap.find((entry) => entry.url === siteUrl("/editorial-policy"))?.lastModified);
});

test("tool metadata and software structured data use stored fields without inventing ratings", () => {
  const short = toolPageDescription({ name: "Yap", tagline: "Talk", description: "Voice notes", pricing: "FREE", categoryName: "Audio" });
  assert.ok(short.length >= 70);
  assert.match(short, /Yap/);
  assert.match(short, /Audio/);
  const editorial = "ChatGPT is a conversational assistant for drafting, analysis, coding, and working with files. Available tools depend on the account and plan.";
  assert.equal(toolPageDescription({ name: "ChatGPT", tagline: "Assistant", description: "Longer description that should lose to the editorial summary because the summary is already specific.", pricing: "FREEMIUM", categoryName: "AI Assistants", editorialSummary: editorial }), editorial);
  const free = softwareApplicationJsonLd({
    slug: "excalidraw", name: "Excalidraw", description: "Whiteboard", url: "https://excalidraw.com", pricing: "OPEN_SOURCE", platforms: ["Web"],
    github: "https://github.com/excalidraw/excalidraw", sourceUrl: "https://github.com/sindresorhus/awesome", source: "AWESOME_LIST",
    createdAt: new Date("2026-01-02T00:00:00.000Z"), updatedAt: new Date("2026-02-03T03:04:05.000Z"), category: { name: "Design" },
  });
  assert.deepEqual(free.offers, { "@type": "Offer", price: "0", priceCurrency: "USD" });
  assert.equal(free.dateModified, "2026-02-03T03:04:05.000Z");
  assert.equal(free.datePublished, "2026-01-02T00:00:00.000Z");
  assert.deepEqual(free.sameAs, ["https://github.com/excalidraw/excalidraw"]);
  assert.equal(JSON.stringify(free).includes("aggregateRating"), false);
  const paid = softwareApplicationJsonLd({
    slug: "paid", name: "Paid", description: "Paid tool", url: "https://paid.example", pricing: "PAID", platforms: [],
    github: null, sourceUrl: null, createdAt: new Date("not-a-date"), updatedAt: new Date("not-a-date"), category: { name: "Other" },
  });
  assert.equal("offers" in paid, false);
  assert.equal("isAccessibleForFree" in paid, false);
  assert.equal("dateModified" in paid, false);
  const search = toolsListingCopy({ q: "AI agents" }, 1);
  assert.match(search.title, /AI agents/);
  assert.match(search.description, /AI agents/);
  assert.equal(categoryPageDescription({ name: "Design", description: "Short", count: 12 }).includes("12 approved"), true);
  const website = websiteJsonLd();
  assert.equal(JSON.stringify(website).includes(`${siteUrl("/tools")}?q={search_term_string}`), true);
  assert.equal(website["@graph"].filter((node) => node["@type"] === "WebSite").length, 1);
  assert.equal(website["@graph"].filter((node) => node["@type"] === "Organization").length, 1);
  assert.equal(JSON.stringify(website).includes("aggregateRating"), false);
  const collection = collectionPageJsonLd({ path: "/stacks", name: "Tool Stacks", description: "Workflows", items: [{ name: "Indie", path: "/stacks/indie-developer-toolkit" }] });
  assert.equal(collection.mainEntity.numberOfItems, 1);
  assert.equal(pageMetadata("Tools", "Description", "/tools").alternates?.types?.["text/plain"], siteUrl("/llms.txt"));
});

test("llms.txt names the directory, key sections, and citation limits", () => {
  const text = llmsTxt();
  for (const path of ["/tools", "/stacks", "/categories", "/editorial-policy", "/how-we-curate", "/changelog"]) assert.match(text, new RegExp(path.replaceAll("/", "\\/")));
  assert.match(text, /Do not invent ratings/);
  assert.match(text, /q query parameter/);
  assert.equal(text.startsWith("# Toools"), true);
});

test("robots still allows OAI-SearchBot and points at the sitemap", () => {
  const result = robots();
  assert.equal(result.sitemap, `${siteUrl("/sitemap.xml")}`);
  const rules = Array.isArray(result.rules) ? result.rules : [result.rules];
  assert.ok(rules.some((rule) => rule && JSON.stringify(rule.userAgent).includes("OAI-SearchBot") && rule.allow === "/"));
});
