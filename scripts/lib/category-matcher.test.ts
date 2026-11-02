import assert from "node:assert/strict";
import test from "node:test";
import { hasSeoMarketingIntent, matchCategory, PH_TOPIC_MAP } from "./category-matcher";

test("SEO and GEO purpose wins over generic GitHub implementation topics", () => {
  const implementation = ["ai", "llm", "gpt", "typescript", "sdk", "cli", "code", "automation"];
  for (const purpose of [
    "seo", "technical-seo", "search-engine-optimization", "seo-audit",
    "generative-engine-optimization", "answer-engine-optimization",
    "AI search visibility", "ai-search-optimization", "llm-visibility",
    "rank-tracking", "keyword-research", "backlinks",
  ]) {
    assert.equal(matchCategory([...implementation, purpose]), "seo-marketing", purpose);
  }
});

test("email and social marketing tools retain their use-case category", () => {
  for (const hints of [
    ["email", "smtp", "automation", "email-marketing"],
    ["automation", "workflow", "marketing-automation"],
    ["social-media-management", "scheduler", "api"],
    ["newsletter", "self-hosted", "go"],
    ["email-campaigns", "email", "analytics"],
  ]) assert.equal(matchCategory(hints), "seo-marketing", hints.join(", "));
});

test("geographic and unrelated compound words do not imply GEO or SEO", () => {
  for (const hint of ["geo", "geospatial", "geolocation", "geometry", "geocoding", "geography", "seoul", "geoseo", "growthbook", "conversion"]) {
    assert.equal(hasSeoMarketingIntent([hint]), false, hint);
    assert.notEqual(matchCategory([hint]), "seo-marketing", hint);
  }
  assert.notEqual(matchCategory(["geo", "geospatial", "maps", "gis"]), "seo-marketing");
  assert.notEqual(matchCategory(["search-engine", "database", "rust"]), "seo-marketing");
  assert.notEqual(matchCategory(["image-conversion", "file-converter"]), "seo-marketing");
});

test("human readable category labels and tool taglines use the stable slug", () => {
  assert.equal(matchCategory([" SEO & GEO & Marketing "]), "seo-marketing");
  assert(hasSeoMarketingIntent(["AI search visibility platform"]));
  assert(hasSeoMarketingIntent(["Self-hosted newsletter and email campaign manager"]));
  assert(hasSeoMarketingIntent(["SEO audit and rank tracking"]));
  assert.equal(PH_TOPIC_MAP["generative-engine-optimization"], "seo-marketing");
  assert.equal(PH_TOPIC_MAP["marketing-automation"], "seo-marketing");
});

test("existing non-marketing category hints keep their established categories", () => {
  assert.equal(matchCategory(["", "Security"]), "security-privacy");
  assert.equal(matchCategory(["automation"]), "automation");
  assert.equal(matchCategory(["code", "editor", "developer-tools"]), "development");
  assert.equal(matchCategory([]), "utilities");
});
