import "dotenv/config";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { Client } from "pg";
import { pgPoolConfig } from "../src/lib/database-url";
import { refreshCatalog, refreshConfiguration } from "./lib/catalog-publication";

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 1 && args[0] === "--help") {
    console.log("Usage: npm run sql:publish -- --file scripts/approve-issue-9.sql\nRuns a reviewed SQL file (including its BEGIN/COMMIT) in one PostgreSQL session, then expires the catalog cache. Requires DATABASE_URL, CACHE_REVALIDATION_URL, and REVALIDATION_SECRET. Never automatically retries database writes.");
    return;
  }
  if (args.length !== 2 || args[0] !== "--file" || !args[1].endsWith(".sql")) throw new Error("Usage: npm run sql:publish -- --file path/to/reviewed.sql");
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
  // Fail before writing when the known cache configuration is incomplete.
  const configuration = refreshConfiguration();
  const sql = await readFile(resolve(args[1]), "utf8");
  if (!sql.trim()) throw new Error("SQL file is empty");
  // Neon rejects a cleartext session. Use the same TLS client options as catalog reads.
  const client = new Client({ ...pgPoolConfig(process.env.DATABASE_URL), connectionTimeoutMillis: 15_000 });
  let submitted = false;
  try {
    await client.connect();
    submitted = true;
    // A single query preserves the reviewed file's transaction boundaries and
    // aborts later statements on an error. Do not split SQL on semicolons.
    await client.query(sql);
  } catch (error) {
    if (submitted) console.error("SQL did not return a successful result. Some reviewed files may already have committed, and a lost connection can make the result uncertain. Inspect the database before replaying the write; use npm run cache:refresh if the publication committed.");
    throw error;
  } finally {
    await client.end();
  }
  console.log("SQL completed successfully.");
  await refreshCatalog(configuration);
}

main().catch((error) => {
  // Driver errors can include SQL text; do not print connection options or env.
  console.error(error instanceof Error ? error.message : "SQL publication failed");
  process.exitCode = 1;
});
