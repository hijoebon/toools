import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { StageToolCard } from "../components/stage-tool-card";
import type { StackStageTool } from "./stacks";
import { getStackPreviewWebsite } from "./stack-preview-websites";
import { getStackToolDestination } from "./stack-tool-links";
import { stackPreviews } from "./stacks-data";

const fallbackTool: StackStageTool = {
  slug: null, name: "Ahrefs", tagline: "", pricing: null,
  viewCount: null, clickCount: null, githubStars: null, phVotes: null,
  iconUrl: null, url: "https://ahrefs.com", initial: "A", color: "#FF8800",
};

test("every curated workflow has verified website destinations without inventing detail slugs", () => {
  const names = new Set(stackPreviews.flatMap((stack) => stack.stages.flatMap((stage) => stage.tools.map((tool) => tool.name))));
  for (const name of names) {
    const url = getStackPreviewWebsite(name);
    assert.ok(url, name);
    assert.deepEqual(getStackToolDestination({ slug: null, url }), { href: new URL(url).href, external: true }, name);
  }
  for (const name of ["Unknown tool", "constructor", "__proto__"]) assert.equal(getStackPreviewWebsite(name), null);
});

test("approved tool details take priority over provider websites", () => {
  assert.deepEqual(getStackToolDestination({ slug: "ahrefs", url: "https://ahrefs.com" }), { href: "/tools/ahrefs", external: false });
  const html = renderToStaticMarkup(createElement(StageToolCard, { tool: { ...fallbackTool, slug: "ahrefs" } }));
  assert.match(html, /<a[^>]+href="\/tools\/ahrefs"/);
  assert.doesNotMatch(html, /target="_blank"/);
});

test("fallback cards are actual website links with clear external behavior and no invented signals", () => {
  const html = renderToStaticMarkup(createElement(StageToolCard, { tool: fallbackTool }));
  assert.match(html, /<a[^>]+href="https:\/\/ahrefs.com\/"/);
  assert.match(html, /target="_blank"/);
  assert.match(html, /rel="noopener noreferrer"/);
  assert.match(html, /Visit website/);
  assert.doesNotMatch(html, /Freemium|data-tool-engagement|\/tools\//);
});

test("missing or unsafe provider URLs never produce a clickable card", () => {
  for (const url of [null, "", "invalid", "/tools/guessed-slug", "javascript:alert(1)", "data:text/html,hello", "https://user:password@example.com"]) {
    assert.equal(getStackToolDestination({ slug: null, url }), null);
    const html = renderToStaticMarkup(createElement(StageToolCard, { tool: { ...fallbackTool, url } }));
    assert.doesNotMatch(html, /<a\b|hover:shadow|hover:-translate/);
    assert.match(html, /Link unavailable/);
  }
});
