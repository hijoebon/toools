import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { chromium } from "/tmp/toools-visual-check/node_modules/playwright/index.mjs";

export async function captureEditorPicks(origin) {
  const browser = await chromium.launch();
  await mkdir("reports/editor-picks", { recursive: true });
  try {
    for (const [label, width, colorScheme] of [["desktop", 1440, "light"], ["mobile", 390, "light"], ["mobile-dark", 390, "dark"]]) {
      const page = await browser.newPage({ viewport: { width, height: 1000 }, colorScheme, reducedMotion: "reduce" });
      await page.goto(origin);
      const section = page.locator('section[aria-labelledby="picks-heading"]');
      await section.scrollIntoViewIfNeeded();
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `${label}: horizontal overflow`);
      const api = await (await page.request.get(`${origin}/api/featured`)).json();
      assert.ok(api.length > 0);
      assert.equal(await section.locator("article").count(), api.length);
      assert.deepEqual(await section.locator("article").evaluateAll((cards) => cards.map((card) => card.dataset.editorPick)), api.map((tool) => tool.slug));
      assert.equal(await section.getByRole("button", { name: /batch|refresh/i }).count(), 0);
      for (const tool of api) {
        await section.getByRole("heading", { name: tool.editorial.task, exact: true }).waitFor();
        assert.ok(await section.getByText(tool.editorial.reason, { exact: true }).isVisible());
        assert.ok(await section.getByText(tool.editorial.limitation, { exact: false }).isVisible());
      }
      await section.screenshot({ path: `reports/editor-picks/${label}.png` });
      console.log(`visual_${label}=readable_cards,no_horizontal_overflow,api_order_matches`);
      await page.close();
    }
  } finally { await browser.close(); }
}
