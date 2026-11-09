import { setTimeout } from "node:timers/promises";
import { verifyEditorPicksSite } from "./lib/editor-picks-smoke";

async function main() {
  // A main push can finish CI before Vercel changes the production alias.
  for (let attempt = 1; attempt <= 20; attempt++) {
    try {
      await verifyEditorPicksSite("https://toools.top");
      return;
    } catch {
      console.log(`production_smoke_attempt=${attempt} pending_or_failed`);
      if (attempt === 20) throw new Error("Production catalog/curation verification did not pass");
      await setTimeout(15_000);
    }
  }
}

main().catch((error: Error) => { console.error(error.message); process.exitCode = 1; });
