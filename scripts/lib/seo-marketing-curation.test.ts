import assert from "node:assert/strict";
import test from "node:test";
import { readFile, readdir } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { buildSeoMarketingCurationSql, type SeoMarketingTool } from "./seo-marketing-curation";
import { marketingGeoStage, marketingGrowthStack } from "../../src/lib/marketing-growth-stack";

const tool: SeoMarketingTool = {
  name: "Example SEO", slug: "example-seo", tagline: "SEO audits and AI search visibility",
  description: "A publisher's SEO tool; self-hosting and model API costs apply.",
  url: "https://seo.example.com/", github: "https://github.com/Example/SEO",
  pricing: "OPEN_SOURCE", isOpenSource: true, tags: ["SEO", "GEO"],
  useCases: ["Audit technical SEO", "Monitor AI search visibility"],
  repositoryId: "123456", licenseSpdxId: "MIT", reviewedAt: "2026-11-02",
  sources: ["https://github.com/Example/SEO/blob/main/README.md"],
};

async function database() {
  const postgres = new PGlite();
  for (const migration of (await readdir("prisma/migrations", { withFileTypes: true })).filter((item) => item.isDirectory()).map((item) => item.name).sort()) {
    await postgres.exec(await readFile(`prisma/migrations/${migration}/migration.sql`, "utf8"));
  }
  await postgres.exec(`INSERT INTO "Category" (id,name,slug) VALUES ('seo','SEO & Marketing','seo-marketing'), ('automation','Automation','automation');`);
  return postgres;
}

async function oldGrowthStack(postgres: PGlite) {
  await postgres.exec(`
    INSERT INTO "Stack" (id,name,slug,tagline,description,"sortOrder","updatedAt")
      VALUES ('growth','Marketing & SEO Growth','marketing-seo-growth','Old tagline','Old description',6,'2026-01-01'),
        ('unrelated','Other workflow','other-workflow','Other tagline','Other description',7,'2026-01-01');
    INSERT INTO "Stage" (id,name,description,"editorNote","sortOrder","stackId")
      VALUES ('keyword','Keyword Research','Old research','Old research note',1,'growth'),
        ('content','Content Creation','Old content','Old content note',2,'growth'),
        ('distribution','Distribution','Old distribution','Old distribution note',3,'growth'),
        ('measurement','Measurement','Old measurement','Old measurement note',4,'growth'),
        ('other-stage','Other stage','Other stage description','Other stage note',1,'unrelated');
    INSERT INTO "Tool" (id,name,slug,tagline,description,url,"categoryId",status,"updatedAt")
      VALUES ('core-tool','Core tool','core-tool','Core tool','Core tool','https://core.example.com','automation','APPROVED',now());
    INSERT INTO "StageRecommendation" ("stageId","toolId","sortOrder") VALUES ('keyword','core-tool',0);
  `);
}

async function reviewedList(): Promise<SeoMarketingTool[]> {
  return JSON.parse(await readFile("scripts/config/seo-marketing-tools.json", "utf8"));
}

const postizLegacyUrl = "https://www.producthunt.com/r/DTE56DREXBP3M6?utm_campaign=producthunt-api&utm_medium=api-v2&utm_source=Application%3A+github-trending-plus+%28ID%3A+285454%29";

async function pendingPostiz(postgres: PGlite, status = "PENDING", url = postizLegacyUrl) {
  await postgres.query(`INSERT INTO "Tool" (id,name,slug,tagline,description,url,"categoryId",status,source,"sourceUrl","viewCount","clickCount","updatedAt")
    VALUES ('ph-postiz','Postiz','postiz','Product Hunt launch tagline','Product Hunt launch description',$1,'automation',$2::"ToolStatus",'PRODUCT_HUNT','https://www.producthunt.com/products/postiz',31,9,now())`, [url, status]);
}

test("an explicitly reviewed Product Hunt alias reuses pending Postiz and migrates only its website URL", async () => {
  const postgres = await database();
  try {
    await pendingPostiz(postgres);
    const postiz = (await reviewedList()).find((candidate) => candidate.slug === "postiz")!;
    assert.deepEqual(postiz.legacyUrls, [postizLegacyUrl]);
    assert.ok(postiz.sources.includes("https://www.producthunt.com/products/postiz"));
    const sql = buildSeoMarketingCurationSql([postiz]);
    await postgres.exec(sql);
    const row = (await postgres.query(`SELECT id,slug,tagline,description,url,status::text,source::text,"sourceUrl","viewCount","clickCount","updatedAt" FROM "Tool"`)).rows[0];
    assert.deepEqual({ ...row, updatedAt: undefined }, {
      id: "ph-postiz", slug: "postiz", tagline: "Product Hunt launch tagline", description: "Product Hunt launch description",
      url: new URL(postiz.url).href, status: "APPROVED", source: "PRODUCT_HUNT", sourceUrl: "https://www.producthunt.com/products/postiz",
      viewCount: 31, clickCount: 9, updatedAt: undefined,
    });
    const aliases = (await postgres.query<{ key: string }>(`SELECT key FROM "ToolIdentity" WHERE "toolId"='ph-postiz'`)).rows.map((alias) => alias.key);
    assert.ok(aliases.includes("url:producthunt.com/r/DTE56DREXBP3M6"));
    assert.ok(aliases.every((key) => !key.includes("utm_")));
    const discovery = (await postgres.query<{ metadata: { legacyUrls: string[]; sources: string[] } }>(`SELECT metadata FROM "ToolDiscovery" WHERE "toolId"='ph-postiz'`)).rows[0];
    assert.deepEqual(discovery.metadata.legacyUrls, [postizLegacyUrl]);
    assert.ok(discovery.metadata.sources.includes("https://www.producthunt.com/products/postiz"));
    await postgres.exec(sql);
    assert.equal((await postgres.query(`SELECT * FROM "Tool"`)).rows.length, 1);
    assert.equal((await postgres.query(`SELECT * FROM "ToolDiscovery"`)).rows.length, 1);
    assert.deepEqual((await postgres.query(`SELECT "updatedAt" FROM "Tool" WHERE id='ph-postiz'`)).rows[0].updatedAt, row.updatedAt);
  } finally { await postgres.close(); }
});

test("reviewed legacy aliases preserve approved and rejected URLs, counters, and primary provenance", async () => {
  for (const status of ["APPROVED", "REJECTED"]) {
    const postgres = await database();
    try {
      await pendingPostiz(postgres, status);
      const postiz = (await reviewedList()).find((candidate) => candidate.slug === "postiz")!;
      await postgres.exec(buildSeoMarketingCurationSql([postiz]));
      assert.deepEqual((await postgres.query(`SELECT id,slug,url,status::text,source::text,"sourceUrl","viewCount","clickCount" FROM "Tool"`)).rows, [{
        id: "ph-postiz", slug: "postiz", url: postizLegacyUrl, status, source: "PRODUCT_HUNT",
        sourceUrl: "https://www.producthunt.com/products/postiz", viewCount: 31, clickCount: 9,
      }]);
      if (status === "REJECTED") {
        assert.equal((await postgres.query(`SELECT * FROM "ToolIdentity"`)).rows.length, 0);
        assert.equal((await postgres.query(`SELECT * FROM "ToolDiscovery"`)).rows.length, 0);
      }
    } finally { await postgres.close(); }
  }
});

test("a matching Postiz slug without its explicitly reviewed URL alias still rolls back", async () => {
  const postgres = await database();
  try {
    await pendingPostiz(postgres);
    const postiz = (await reviewedList()).find((candidate) => candidate.slug === "postiz")!;
    await assert.rejects(postgres.exec(buildSeoMarketingCurationSql([{ ...postiz, legacyUrls: undefined }])), /Slug conflict/);
    await postgres.exec("ROLLBACK;");
    assert.equal((await postgres.query(`SELECT name FROM "Category" WHERE slug='seo-marketing'`)).rows[0].name, "SEO & Marketing");
    assert.equal((await postgres.query(`SELECT url FROM "Tool" WHERE id='ph-postiz'`)).rows[0].url, postizLegacyUrl);
    assert.equal((await postgres.query(`SELECT * FROM "ToolDiscovery"`)).rows.length, 0);
  } finally { await postgres.close(); }
});

test("legacy URLs match exact reviewed spellings rather than unreviewed tracking variants", async () => {
  const postgres = await database();
  try {
    const unreviewedUrl = postizLegacyUrl.replace("utm_campaign=producthunt-api", "utm_campaign=unreviewed");
    await pendingPostiz(postgres, "PENDING", unreviewedUrl);
    const postiz = (await reviewedList()).find((candidate) => candidate.slug === "postiz")!;
    await assert.rejects(postgres.exec(buildSeoMarketingCurationSql([postiz])), /Slug conflict/);
    await postgres.exec("ROLLBACK;");
    assert.equal((await postgres.query(`SELECT url FROM "Tool" WHERE id='ph-postiz'`)).rows[0].url, unreviewedUrl);
  } finally { await postgres.close(); }
});

test("an alias matching another existing listing rolls back the complete reviewed publication", async () => {
  const postgres = await database();
  try {
    await pendingPostiz(postgres);
    const tools = await reviewedList();
    const postiz = tools.find((candidate) => candidate.slug === "postiz")!;
    await postgres.query(`INSERT INTO "Tool" (id,name,slug,tagline,description,url,"categoryId",status,"updatedAt")
      VALUES ('official-postiz','Other Postiz','another-postiz','Other','Other',$1,'automation','APPROVED',now())`, [postiz.url]);
    await assert.rejects(postgres.exec(buildSeoMarketingCurationSql(tools)), /Identity conflict.*multiple existing listings/);
    await postgres.exec("ROLLBACK;");
    assert.equal((await postgres.query(`SELECT name FROM "Category" WHERE slug='seo-marketing'`)).rows[0].name, "SEO & Marketing");
    assert.equal((await postgres.query(`SELECT * FROM "Tool"`)).rows.length, 2);
    assert.equal((await postgres.query(`SELECT * FROM "ToolDiscovery"`)).rows.length, 0);
  } finally { await postgres.close(); }
});

test("generation rejects invalid legacy URLs and cross-candidate normalized alias collisions", () => {
  for (const legacyUrls of ["https://public.example.com", [null], [""], ["javascript:alert(1)"], ["http://127.0.0.1/"], ["https://user:password@public.example.com/"]]) {
    assert.throws(() => buildSeoMarketingCurationSql([{ ...tool, legacyUrls }]), /legacy URL/);
  }
  const other = { ...tool, slug: "another-seo", url: "https://another.example.com", github: "https://github.com/Other/SEO", repositoryId: "654321" };
  assert.throws(() => buildSeoMarketingCurationSql([
    { ...tool, legacyUrls: ["https://launch.example.com/product?utm_source=one"] },
    { ...other, legacyUrls: ["https://launch.example.com/product?utm_source=two"] },
  ]), /Duplicate reviewed identity/);
  assert.throws(() => buildSeoMarketingCurationSql([
    { ...tool, legacyUrls: [other.url] }, other,
  ]), /Duplicate reviewed identity/);
});

test("growth publication preserves original stages and resolves GEO recommendations to reused catalog identities", async () => {
  const postgres = await database();
  try {
    await oldGrowthStack(postgres);
    const otherStack = (await postgres.query(`SELECT name,tagline,description,"updatedAt" FROM "Stack" WHERE id='unrelated'`)).rows[0];
    const tools = await reviewedList();
    const oneGlanse = tools.find((candidate) => candidate.slug === "oneglanse")!;
    await postgres.query(`INSERT INTO "Tool" (id,name,slug,tagline,description,url,"categoryId",status,"viewCount","clickCount","updatedAt")
      VALUES ('legacy-geo','Existing GEO','legacy-geo','Existing review','Existing review',$1,'automation','APPROVED',19,4,now())`, [oneGlanse.url]);
    const sql = buildSeoMarketingCurationSql(tools);
    await postgres.exec(sql);
    const stack = (await postgres.query(`SELECT id,name,slug,tagline,description,"sortOrder","updatedAt" FROM "Stack" WHERE id='growth'`)).rows[0];
    assert.equal(stack.name, marketingGrowthStack.name);
    assert.equal(stack.slug, marketingGrowthStack.slug);
    assert.equal(stack.tagline, marketingGrowthStack.tagline);
    assert.equal(stack.description, marketingGrowthStack.description);
    assert.equal(stack.sortOrder, 6);
    const stages = (await postgres.query(`SELECT id,name,description,"editorNote","sortOrder" FROM "Stage" WHERE "stackId"='growth' ORDER BY "sortOrder"`)).rows;
    assert.equal(stages.length, 5);
    for (const [index, expected] of marketingGrowthStack.stages.entries()) {
      assert.equal(stages[index].name, expected.name);
      assert.equal(stages[index].description, expected.description);
      assert.equal(stages[index].editorNote, expected.editorNote);
      assert.equal(stages[index].sortOrder, expected.sortOrder);
    }
    assert.deepEqual(stages.filter((stage) => stage.name !== marketingGeoStage.name).map((stage) => stage.id), ["keyword", "content", "distribution", "measurement"]);
    const recommendations = (await postgres.query(`SELECT t.id,t.slug,r."sortOrder" FROM "StageRecommendation" r
      JOIN "Stage" s ON s.id=r."stageId" JOIN "Tool" t ON t.id=r."toolId"
      WHERE s."stackId"='growth' AND s.name='GEO & AI Visibility' ORDER BY r."sortOrder"`)).rows;
    assert.deepEqual(recommendations.map((row) => row.slug), marketingGeoStage.tools.map((pick) => pick.slug === "oneglanse" ? "legacy-geo" : pick.slug));
    assert.deepEqual(recommendations.map((row) => row.sortOrder), [0, 1, 2]);
    assert.equal((await postgres.query(`SELECT * FROM "StageRecommendation" WHERE "stageId"='keyword' AND "toolId"='core-tool'`)).rows.length, 1);
    assert.deepEqual((await postgres.query(`SELECT "viewCount","clickCount" FROM "Tool" WHERE id='legacy-geo'`)).rows, [{ viewCount: 19, clickCount: 4 }]);
    assert.deepEqual((await postgres.query(`SELECT name,tagline,description,"updatedAt" FROM "Stack" WHERE id='unrelated'`)).rows[0], otherStack);
    await postgres.exec(sql);
    assert.deepEqual((await postgres.query(`SELECT id,name,description,"editorNote","sortOrder" FROM "Stage" WHERE "stackId"='growth' ORDER BY "sortOrder"`)).rows, stages);
    assert.deepEqual((await postgres.query(`SELECT "updatedAt" FROM "Stack" WHERE id='growth'`)).rows[0].updatedAt, stack.updatedAt);
    assert.equal((await postgres.query(`SELECT * FROM "StageRecommendation" r JOIN "Stage" s ON s.id=r."stageId" WHERE s."stackId"='growth' AND s.name='GEO & AI Visibility'`)).rows.length, 3);
  } finally { await postgres.close(); }
});

test("GEO publication does not recommend or revive a rejected matching tool", async () => {
  const postgres = await database();
  try {
    await oldGrowthStack(postgres);
    const tools = await reviewedList();
    const oneGlanse = tools.find((candidate) => candidate.slug === "oneglanse")!;
    await postgres.query(`INSERT INTO "Tool" (id,name,slug,tagline,description,url,"categoryId",status,"updatedAt")
      VALUES ('rejected-geo','Rejected GEO','rejected-geo','Rejected','Rejected',$1,'automation','REJECTED',now())`, [oneGlanse.url]);
    await postgres.query(`INSERT INTO "ToolIdentity" (key,"toolId") VALUES ($1,'rejected-geo')`, ["github-id:" + oneGlanse.repositoryId]);
    await postgres.exec(buildSeoMarketingCurationSql(tools));
    assert.equal((await postgres.query(`SELECT status::text FROM "Tool" WHERE id='rejected-geo'`)).rows[0].status, "REJECTED");
    assert.equal((await postgres.query(`SELECT * FROM "StageRecommendation" WHERE "toolId"='rejected-geo'`)).rows.length, 0);
    assert.equal((await postgres.query(`SELECT * FROM "StageRecommendation" r JOIN "Stage" s ON s.id=r."stageId" WHERE s.name='GEO & AI Visibility'`)).rows.length, 2);
  } finally { await postgres.close(); }
});

test("an unrelated or incomplete reviewed batch leaves the existing growth workflow untouched", async () => {
  const postgres = await database();
  try {
    await oldGrowthStack(postgres);
    const before = (await postgres.query(`SELECT * FROM "Stack" ORDER BY id`)).rows;
    const stages = (await postgres.query(`SELECT * FROM "Stage" ORDER BY id`)).rows;
    await postgres.exec(buildSeoMarketingCurationSql([tool]));
    const oneGlanse = (await reviewedList()).find((candidate) => candidate.slug === "oneglanse")!;
    await postgres.exec(buildSeoMarketingCurationSql([oneGlanse]));
    assert.deepEqual((await postgres.query(`SELECT * FROM "Stack" ORDER BY id`)).rows, before);
    assert.deepEqual((await postgres.query(`SELECT * FROM "Stage" ORDER BY id`)).rows, stages);
  } finally { await postgres.close(); }
});

test("GEO stage ambiguity rolls back the complete category, tool, and workflow publication", async () => {
  const postgres = await database();
  try {
    await oldGrowthStack(postgres);
    await postgres.query(`INSERT INTO "Stage" (id,name,"sortOrder","stackId") VALUES ('geo-a',$1,4,'growth'),('geo-b',$1,5,'growth')`, [marketingGeoStage.name]);
    await assert.rejects(postgres.exec(buildSeoMarketingCurationSql(await reviewedList())), /Growth stage conflict.*multiple existing stages/);
    await postgres.exec("ROLLBACK;");
    assert.equal((await postgres.query(`SELECT name FROM "Category" WHERE slug='seo-marketing'`)).rows[0].name, "SEO & Marketing");
    assert.equal((await postgres.query(`SELECT name FROM "Stack" WHERE id='growth'`)).rows[0].name, "Marketing & SEO Growth");
    assert.equal((await postgres.query(`SELECT * FROM "ToolDiscovery"`)).rows.length, 0);
    assert.equal((await postgres.query(`SELECT * FROM "Tool"`)).rows.length, 1);
  } finally { await postgres.close(); }
});

test("curation does not create an incomplete growth workflow when the target stack is absent", async () => {
  const postgres = await database();
  try {
    await postgres.exec(buildSeoMarketingCurationSql(await reviewedList()));
    assert.equal((await postgres.query(`SELECT * FROM "Stack"`)).rows.length, 0);
    assert.equal((await postgres.query(`SELECT * FROM "Stage"`)).rows.length, 0);
    assert.equal((await postgres.query(`SELECT * FROM "StageRecommendation"`)).rows.length, 0);
  } finally { await postgres.close(); }
});

test("reviewed curation creates repeatable GitHub listings, tags and provenance without resetting counters", async () => {
  const postgres = await database();
  try {
    const specialDescription = `${tool.description} Literal $toools_curation$ and \\ paths stay intact.`;
    const sql = buildSeoMarketingCurationSql([{ ...tool, description: specialDescription }]);
    await postgres.exec(sql);
    await postgres.exec(`UPDATE "Tool" SET "viewCount"=17,"clickCount"=3 WHERE slug='example-seo';`);
    const before = (await postgres.query<{ createdAt: Date; updatedAt: Date }>(`SELECT "createdAt","updatedAt" FROM "Tool"`)).rows[0];
    await postgres.exec(sql);
    const result = (await postgres.query(`SELECT t.name,t.slug,t.status::text,t.source::text,t.description,t."viewCount",t."clickCount",t."useCases",t."createdAt",t."updatedAt",c.name AS category,c.slug AS "categorySlug" FROM "Tool" t JOIN "Category" c ON c.id=t."categoryId"`)).rows;
    assert.equal(result.length, 1);
    assert.equal(result[0].category, "SEO & GEO & Marketing");
    assert.equal(result[0].categorySlug, "seo-marketing");
    assert.equal(result[0].source, "GITHUB_REPOSITORY");
    assert.equal(result[0].status, "APPROVED");
    assert.equal(result[0].description, specialDescription);
    assert.equal(result[0].viewCount, 17);
    assert.equal(result[0].clickCount, 3);
    assert.deepEqual(result[0].useCases, tool.useCases);
    assert.deepEqual(result[0].createdAt, before.createdAt);
    assert.deepEqual(result[0].updatedAt, before.updatedAt);
    assert.equal((await postgres.query(`SELECT * FROM "ToolIdentity"`)).rows.length, 3);
    assert.equal((await postgres.query(`SELECT * FROM "ToolTag"`)).rows.length, 2);
    const discovery = (await postgres.query<{ metadata: Record<string, unknown> }>(`SELECT metadata FROM "ToolDiscovery" WHERE source='GITHUB_REPOSITORY'`)).rows;
    assert.equal(discovery.length, 1);
    assert.deepEqual(discovery[0].metadata.sources, tool.sources);
    assert.equal(discovery[0].metadata.licenseSpdxId, "MIT");
  } finally { await postgres.close(); }
});

test("curation reuses a legacy website under another slug and preserves its primary source and editorial text", async () => {
  const postgres = await database();
  try {
    await postgres.exec(`INSERT INTO "Tool" (id,name,slug,tagline,description,url,"categoryId",status,source,"sourceUrl","viewCount","clickCount","useCases","updatedAt") VALUES ('old','Existing tool','legacy-seo','Handwritten tagline','Handwritten review','http://www.seo.example.com','automation','APPROVED','AWESOME_LIST','https://github.com/example/directory',29,8,ARRAY['Existing case'],now());`);
    await postgres.exec(buildSeoMarketingCurationSql([tool]));
    const rows = (await postgres.query(`SELECT id,slug,tagline,description,source::text,"sourceUrl","categoryId",github,"viewCount","clickCount","useCases",pricing::text,"isOpenSource" FROM "Tool"`)).rows;
    assert.equal(rows.length, 1);
    assert.equal(rows[0].id, "old");
    assert.equal(rows[0].slug, "legacy-seo");
    assert.equal(rows[0].categoryId, "seo");
    assert.equal(rows[0].description, "Handwritten review");
    assert.equal(rows[0].tagline, "Handwritten tagline");
    assert.equal(rows[0].source, "AWESOME_LIST");
    assert.equal(rows[0].sourceUrl, "https://github.com/example/directory");
    assert.equal(rows[0].github, "https://github.com/example/seo");
    assert.equal(rows[0].viewCount, 29);
    assert.equal(rows[0].clickCount, 8);
    assert.equal(rows[0].pricing, "FREE");
    assert.equal(rows[0].isOpenSource, false);
    assert.deepEqual(rows[0].useCases, ["Existing case", ...tool.useCases]);
    assert.equal((await postgres.query(`SELECT * FROM "ToolDiscovery" WHERE source='GITHUB_REPOSITORY'`)).rows.length, 1);
  } finally { await postgres.close(); }
});

test("curation reuses GitHub legacy spellings and approves only reviewed pending entries", async () => {
  const postgres = await database();
  try {
    await postgres.exec(`INSERT INTO "Tool" (id,name,slug,tagline,description,url,github,"categoryId",status,"updatedAt") VALUES ('old','Old','old-name','Old','Old','https://elsewhere.example.com','http://www.GitHub.com/EXAMPLE/SEO.git/','automation','PENDING',now());`);
    await postgres.exec(buildSeoMarketingCurationSql([tool]));
    assert.deepEqual((await postgres.query(`SELECT id,slug,status::text,"categoryId",pricing::text,"isOpenSource" FROM "Tool"`)).rows, [{ id: "old", slug: "old-name", status: "APPROVED", categoryId: "seo", pricing: "OPEN_SOURCE", isOpenSource: true }]);
  } finally { await postgres.close(); }
});

test("a rejected matching listing is not revived or enriched", async () => {
  const postgres = await database();
  try {
    await postgres.exec(`INSERT INTO "Tool" (id,name,slug,tagline,description,url,"categoryId",status,"updatedAt") VALUES ('rejected','Rejected','rejected-seo','Rejected','Rejected','https://seo.example.com/','automation','REJECTED',now());`);
    await postgres.exec(buildSeoMarketingCurationSql([tool]));
    assert.deepEqual((await postgres.query(`SELECT id,status::text,"categoryId",github FROM "Tool"`)).rows, [{ id: "rejected", status: "REJECTED", categoryId: "automation", github: null }]);
    assert.equal((await postgres.query(`SELECT * FROM "ToolIdentity"`)).rows.length, 0);
    assert.equal((await postgres.query(`SELECT * FROM "ToolDiscovery"`)).rows.length, 0);
  } finally { await postgres.close(); }
});

test("ambiguous identity and occupied slugs roll back the entire category publication", async () => {
  for (const conflict of ["multiple", "slug", "repository", "alias", "repository-id"]) {
    const postgres = await database();
    try {
      if (conflict === "multiple") await postgres.exec(`INSERT INTO "Tool" (id,name,slug,tagline,description,url,github,"categoryId","updatedAt") VALUES ('one','One','one','One','One','https://seo.example.com/',null,'automation',now()), ('two','Two','two','Two','Two','https://other.example.com/','https://github.com/example/seo','automation',now());`);
      if (conflict === "slug") await postgres.exec(`INSERT INTO "Tool" (id,name,slug,tagline,description,url,"categoryId","updatedAt") VALUES ('one','Other','example-seo','Other','Other','https://other.example.com/','automation',now());`);
      if (conflict === "repository") await postgres.exec(`INSERT INTO "Tool" (id,name,slug,tagline,description,url,github,"categoryId","updatedAt") VALUES ('one','Other','other','Other','Other','https://seo.example.com/','https://github.com/another/repository','automation',now());`);
      if (conflict === "alias" || conflict === "repository-id") {
        await postgres.exec(`INSERT INTO "Tool" (id,name,slug,tagline,description,url,"categoryId","updatedAt") VALUES ('one','Other','other','Other','Other','https://seo.example.com/','automation',now());`);
        await postgres.query(`INSERT INTO "ToolIdentity" (key,"toolId") VALUES ($1,'one')`, [conflict === "alias" ? "repo:other/repository" : "github-id:999999"]);
      }
      await assert.rejects(postgres.exec(buildSeoMarketingCurationSql([tool])), /conflict/i);
      await postgres.exec("ROLLBACK;");
      assert.equal((await postgres.query<{ name: string }>(`SELECT name FROM "Category" WHERE slug='seo-marketing'`)).rows[0].name, "SEO & Marketing");
      assert.equal((await postgres.query(`SELECT * FROM "ToolDiscovery"`)).rows.length, 0);
    } finally { await postgres.close(); }
  }
});

test("website matching keeps distinct product paths and query variants separate", async () => {
  const postgres = await database();
  try {
    await postgres.exec(`INSERT INTO "Tool" (id,name,slug,tagline,description,url,"categoryId","updatedAt") VALUES ('one','Other','other','Other','Other','https://seo.example.com/product?plan=free','automation',now());`);
    await postgres.exec(buildSeoMarketingCurationSql([{ ...tool, url: "https://seo.example.com/Product?plan=pro" }]));
    assert.equal((await postgres.query(`SELECT * FROM "Tool"`)).rows.length, 2);
  } finally { await postgres.close(); }
});

test("the checked-in reviewed list executes against the real schema", async () => {
  const postgres = await database();
  try {
    const tools: SeoMarketingTool[] = JSON.parse(await readFile("scripts/config/seo-marketing-tools.json", "utf8"));
    await postgres.exec(buildSeoMarketingCurationSql(tools));
    await postgres.exec(buildSeoMarketingCurationSql(tools));
    assert.equal((await postgres.query(`SELECT * FROM "Tool" WHERE status='APPROVED'`)).rows.length, tools.length);
    assert.equal((await postgres.query(`SELECT * FROM "ToolDiscovery"`)).rows.length, tools.length);
  } finally { await postgres.close(); }
});

test("the checked-in publication SQL matches the reviewed JSON and generator", async () => {
  const tools: unknown = JSON.parse(await readFile("scripts/config/seo-marketing-tools.json", "utf8"));
  assert.equal(await readFile("scripts/sql/curate-seo-marketing.sql", "utf8"), buildSeoMarketingCurationSql(tools));
});

test("generation rejects unverified data and keeps literal SQL characters in reviewed descriptions", () => {
  assert.throws(() => buildSeoMarketingCurationSql([]), /nonempty/);
  assert.throws(() => buildSeoMarketingCurationSql([tool, tool]), /duplicate/i);
  assert.throws(() => buildSeoMarketingCurationSql([{ ...tool, licenseSpdxId: "NOASSERTION" }]), /license/);
  assert.throws(() => buildSeoMarketingCurationSql([{ ...tool, url: "http://127.0.0.1/" }]), /public tool URL/);
  assert.throws(() => buildSeoMarketingCurationSql([{ ...tool, sources: [] }]), /sources/);
  const sql = buildSeoMarketingCurationSql([{ ...tool, description: "A publisher's tool with $toools_curation$ and a \\ slash" }]);
  assert.match(sql, /publisher''s/);
  assert.match(sql, /DO \$toools_curation_x\$/);
});
