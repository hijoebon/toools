import assert from "node:assert/strict";
import test from "node:test";
import { readFile, readdir } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";

test("issue 12 publication SQL is repeatable and keeps engagement counts", async () => {
  const postgres = new PGlite();
  try {
    const migrations = (await readdir("prisma/migrations", { withFileTypes: true }))
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort();
    for (const migration of migrations) {
      await postgres.exec(await readFile(`prisma/migrations/${migration}/migration.sql`, "utf8"));
    }
    await postgres.exec(`
      INSERT INTO "Category" (id, name, slug) VALUES ('productivity', 'Productivity', 'productivity');
      INSERT INTO "Tag" (id, name, slug) VALUES
        ('ai', 'AI', 'ai'),
        ('writing', 'Writing', 'writing'),
        ('audio', 'Audio', 'audio');
    `);
    const publication = await readFile("scripts/approve-issue-12.sql", "utf8");
    await postgres.exec(publication);
    await postgres.query(`UPDATE "Tool" SET "viewCount" = 9, "clickCount" = 2 WHERE slug = 'yap'`);
    await postgres.exec(publication);
    const { rows } = await postgres.query<Record<string, unknown>>(`
      SELECT t.name, t.slug, t.status::text AS status, t.pricing::text AS pricing, t.url,
             t.platforms, t."viewCount", t."clickCount", t."isOpenSource", c.slug AS "categorySlug",
             ARRAY(SELECT tag.slug FROM "ToolTag" tt JOIN "Tag" tag ON tag.id = tt."tagId"
                   WHERE tt."toolId" = t.id ORDER BY tag.slug) AS tags
      FROM "Tool" t JOIN "Category" c ON c.id = t."categoryId" WHERE t.slug = 'yap'
    `);
    assert.equal(rows.length, 1);
    assert.equal(rows[0].name, "Yap");
    assert.equal(rows[0].status, "APPROVED");
    assert.equal(rows[0].pricing, "PAID");
    assert.equal(rows[0].url, "https://yapapp.cc/");
    assert.equal(rows[0].categorySlug, "productivity");
    assert.equal(rows[0].isOpenSource, false);
    assert.deepEqual(rows[0].platforms, ["macOS", "Windows", "iOS", "Android"]);
    assert.deepEqual(rows[0].tags, ["ai", "audio", "writing"]);
    assert.equal(rows[0].viewCount, 9);
    assert.equal(rows[0].clickCount, 2);
    const identity = await postgres.query(`SELECT key FROM "ToolIdentity" i JOIN "Tool" t ON t.id = i."toolId" WHERE t.slug = 'yap'`);
    assert.deepEqual(identity.rows, [{ key: "url:yapapp.cc" }]);
    const discovery = await postgres.query(`SELECT "sourceKey" FROM "ToolDiscovery" d JOIN "Tool" t ON t.id = d."toolId" WHERE t.slug = 'yap'`);
    assert.deepEqual(discovery.rows, [{ sourceKey: "korbinjoe/toools#12" }]);
  } finally {
    await postgres.close();
  }
});
