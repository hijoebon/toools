import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { buildSeoMarketingCurationSql } from "./lib/seo-marketing-curation";

async function main() {
  if (process.argv.slice(2).length) throw new Error("Usage: npm run curate:seo-marketing (generates reviewed SQL only; never connects to a database)");
  const input = resolve("scripts/config/seo-marketing-tools.json");
  const output = resolve("scripts/sql/curate-seo-marketing.sql");
  const tools: unknown = JSON.parse(await readFile(input, "utf8"));
  const sql = buildSeoMarketingCurationSql(tools);
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, sql);
  console.log(`Generated reviewed category/tool/workflow publication: ${output}\nNo database was changed. Review the SQL, then use npm run sql:publish -- --file scripts/sql/curate-seo-marketing.sql`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Could not generate SEO/GEO/Marketing curation");
  process.exitCode = 1;
});
