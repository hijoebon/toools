import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { setTimeout } from "node:timers/promises";
import type { Client } from "pg";
import { editorPicks, resolveEditorPicks } from "../../src/lib/editor-picks";
import { verifyEditorPicksSite } from "./editor-picks-smoke";

export async function runEditorPicksPreflight(client: Client, databaseUrl: string) {
  const result = await client.query<{ slug: string; name: string; url: string; status: string }>(
    'SELECT slug, name, url, status FROM "Tool" WHERE slug = ANY($1::text[]) AND status = \'APPROVED\'',
    [editorPicks.map((pick) => pick.slug)],
  );
  // Also print exact matching catalog candidates to diagnose a stale or missing
  // identity without changing the catalog or guessing a replacement slug.
  console.log("curated_catalog=" + JSON.stringify(result.rows));
  assert.equal(resolveEditorPicks(result.rows).length, editorPicks.length, "All curated identities must be valid approved catalog entries");
  const total = await client.query<{ count: string }>('SELECT count(*) FROM "Tool" WHERE status = \'APPROVED\'');
  assert.ok(Number(total.rows[0].count) > 0);
  console.log(`approved_catalog_total=${total.rows[0].count}`);

  const server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "--hostname", "127.0.0.1", "--port", "3210"], {
    env: { ...process.env, DATABASE_URL: databaseUrl, DATABASE_TRANSPORT: "neon-http", TOOL_METRICS_MODE: "disabled", NEXT_TELEMETRY_DISABLED: "1" },
    // Driver errors can contain connection strings; only emit fixed smoke
    // diagnostics and safe HTTP evidence, never raw server output.
    stdio: "ignore",
  });
  try {
    let ready = false;
    for (let attempt = 0; attempt < 60; attempt++) {
      try { ready = (await fetch("http://127.0.0.1:3210/api/version", { signal: AbortSignal.timeout(1000) })).ok; } catch { /* startup */ }
      if (ready) break;
      if (server.exitCode !== null) break;
      await setTimeout(1000);
    }
    assert.ok(ready, "production build starts for preflight");
    await verifyEditorPicksSite("http://127.0.0.1:3210");
    if (process.env.EDITOR_PICKS_SCREENSHOT_MODULE) {
      const { captureEditorPicks } = await import(process.env.EDITOR_PICKS_SCREENSHOT_MODULE);
      await captureEditorPicks("http://127.0.0.1:3210");
    }
  } finally {
    server.kill("SIGTERM");
  }
}
