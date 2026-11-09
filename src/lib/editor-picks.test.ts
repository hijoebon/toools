import assert from "node:assert/strict";
import test from "node:test";
import { editorPicks, resolveEditorPicks } from "./editor-picks";

const records = () => editorPicks.map((pick) => ({
  slug: pick.slug, url: pick.catalogUrl, status: "APPROVED", featured: false,
  viewCount: 0, phVotes: 0, githubStars: 0,
}));

test("editorial order and reasons are independent of catalog order and popularity", () => {
  const input = records().reverse();
  input.push({ slug: "chatgpt", url: "https://chatgpt.com", status: "APPROVED", featured: true, viewCount: 999999, phVotes: 999999, githubStars: 999999 });
  const selected = resolveEditorPicks(input);
  assert.deepEqual(selected.map((tool) => tool.slug), editorPicks.map((pick) => pick.slug));
  assert.deepEqual(selected.map((tool) => tool.editorial), editorPicks);
  assert.equal(selected.every((tool) => !tool.featured), true);
});

test("missing, unpublished, invalid, and repurposed entries are omitted without substitutes", () => {
  assert.deepEqual(resolveEditorPicks([]), []);
  for (const status of ["PENDING", "REJECTED"]) {
    assert.deepEqual(resolveEditorPicks(records().map((tool) => ({ ...tool, status }))), []);
  }
  for (const url of ["bad-url", "javascript:alert(1)", "https://unrelated.example/", "https://pdfsam.org/other-product", "https://user:password@pdfsam.org/pdfsam-basic/"]) {
    assert.deepEqual(resolveEditorPicks([{ ...records()[0], url }]), []);
  }
  assert.deepEqual(resolveEditorPicks(records().slice(1)).map((tool) => tool.slug), editorPicks.slice(1).map((pick) => pick.slug));
  assert.equal(resolveEditorPicks([...records(), ...records()]).length, editorPicks.length);
  assert.equal(resolveEditorPicks([{ ...records()[0], url: "https://www.pdfsam.org/pdfsam-basic" }]).length, 1);
});
