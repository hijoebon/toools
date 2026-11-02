import { checkRelease, prepareRelease, shanghaiDate, writeReleaseNotes } from "./lib/release-management.mjs";

const USAGE = "Usage: node scripts/release.mjs check | notes | patch|minor|major [--date YYYY-MM-DD]";

async function main() {
  const [command, ...args] = process.argv.slice(2);
  if (command === "check" && args.length === 0) {
    const result = await checkRelease(process.cwd());
    console.log(`Release check passed: v${result.version}, ${result.releases} recorded release(s).`);
  } else if (command === "notes" && args.length === 0) {
    await writeReleaseNotes(process.cwd());
    console.log("CHANGELOG.md regenerated from src/data/changelog.json.");
  } else if (["patch", "minor", "major"].includes(command)
    && (args.length === 0 || (args.length === 2 && args[0] === "--date"))) {
    const version = await prepareRelease(process.cwd(), command, args[1] ?? shanghaiDate());
    console.log(`Prepared v${version} in local release files. Review the diff, run checks, and use the normal deployment process. No Git commit, tag, push, or deployment was created.`);
  } else throw new Error(USAGE);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Release management failed");
  process.exitCode = 1;
});
