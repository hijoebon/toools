import assert from "node:assert/strict";
import { editorPicks } from "../../src/lib/editor-picks";

function text(html: string) {
  return html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ");
}

/** Read-only HTTP proof; never follows a tool's outbound link or records a click. */
export async function verifyEditorPicksSite(baseUrl: string) {
  const origin = new URL(baseUrl).origin;
  assert.ok(origin === "https://toools.top" || /^http:\/\/127\.0\.0\.1:\d+$/.test(origin), "Use the local preflight server or toools.top");
  const get = async (path: string) => {
    const response = await fetch(new URL(path, origin), { signal: AbortSignal.timeout(45_000), redirect: "error", headers: { "Cache-Control": "no-cache" } });
    return { response, body: await response.text() };
  };
  const home = await get("/");
  assert.equal(home.response.status, 200, "homepage responds");
  const api = await get("/api/featured");
  assert.equal(api.response.status, 200, "featured endpoint responds");
  const picks = JSON.parse(api.body) as { slug: string; name: string; status: string; editorial: unknown }[];
  const expected = editorPicks.map((pick) => pick.slug);
  assert.deepEqual(picks.map((tool) => tool.slug), expected, "every checked-in pick must resolve to a valid approved record before release");
  assert.deepEqual(picks.map((tool) => tool.editorial), editorPicks, "API includes current reasons, limits, review dates, and sources");
  assert.equal(picks.every((tool) => tool.status === "APPROVED"), true);
  const rendered = [...home.body.matchAll(/data-editor-pick="([^"]+)"/g)].map((match) => match[1]);
  assert.deepEqual(rendered, expected, "homepage and API use the same order");
  const repeat = JSON.parse((await get("/api/featured")).body) as typeof picks;
  assert.deepEqual(repeat.map((tool) => tool.slug), expected, "repeated requests do not sample random tools");
  for (const pick of picks) {
    const page = await get(`/tools/${pick.slug}`);
    assert.equal(page.response.status, 200, `${pick.slug} detail`);
    assert.ok(text(page.body).includes(pick.name), `${pick.slug} has actual detail content`);
    assert.doesNotMatch(text(page.body), /This listing is temporarily unavailable/);
    assert.ok(home.body.includes(`/api/tools/${pick.slug}/out`), `${pick.slug} uses the existing tracked redirect`);
  }
  const known = await get("/tools/chatgpt");
  assert.equal(known.response.status, 200);
  assert.ok(text(known.body.match(/<h1\b[^>]*>[\s\S]*?<\/h1>/)?.[0] ?? "").includes("ChatGPT"), "known slug renders its actual heading");
  assert.match(known.body, /AI assistant by OpenAI/);
  assert.doesNotMatch(text(known.body), /This listing is temporarily unavailable/);
  const missing = await get("/tools/missing-editors-picks-20261109");
  assert.equal(missing.response.status, 404, "missing detail must send HTTP 404, not a degraded 200");
  const catalog = await get("/tools");
  assert.equal(catalog.response.status, 200);
  const total = Number(text(catalog.body).match(/(\d[\d,]*)\s+tools\b/)?.[1].replaceAll(",", ""));
  assert.ok(total > 0, "catalog is populated");
  const search = await get("/tools?q=ChatGPT");
  assert.equal(search.response.status, 200);
  assert.ok(search.body.includes('href="/tools/chatgpt"'), "popular tools remain searchable");
  const categories = await get("/categories");
  assert.equal(categories.response.status, 200);
  assert.ok(categories.body.includes('href="/categories/development"'));
  const evidence = { origin, picks: picks.map(({ slug, name }) => ({ slug, name })), homepageMatchesApi: true, repeatMatches: true, known: { slug: "chatgpt", status: known.response.status, actualDetail: true }, missingStatus: missing.response.status, catalogTotal: total, search: "ChatGPT present", categories: "populated", verifiedAt: new Date().toISOString() };
  console.log(JSON.stringify(evidence));
  return evidence;
}
