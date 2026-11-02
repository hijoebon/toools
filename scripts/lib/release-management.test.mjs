import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, mkdir, readFile, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve, dirname } from "node:path";
import { spawnSync } from "node:child_process";
import {
  parseVersion, bumpVersion, validReleaseDate, validateChangelog,
  renderChangelog, checkRelease, loadReleaseState, prepareRelease,
  writeReleaseNotes, shanghaiDate,
} from "./release-management.mjs";

const fixtureData = () => ({
  unreleased: {
    title: "Better discovery", summary: "Find the tools that match your work.",
    added: ["Browse a broader tool collection."], changed: [], fixed: [],
  },
  releases: [{
    version: "0.2.0", date: "2026-11-02", title: "Product updates",
    summary: "Follow changes in Toools.", added: ["A public changelog."], changed: [], fixed: [],
  }],
});

const managedFiles = ["package.json", "package-lock.json", "src/data/changelog.json", "CHANGELOG.md"];

async function fixture(run) {
  const root = await mkdtemp(resolve(tmpdir(), "toools-release-test-"));
  const data = fixtureData();
  const files = {
    "package.json": `${JSON.stringify({ name: "toools", version: "0.2.0", scripts: { dev: "next dev" } }, null, 2)}\n`,
    "package-lock.json": `${JSON.stringify({ name: "toools", version: "0.2.0", lockfileVersion: 3, packages: { "": { name: "toools", version: "0.2.0" }, "node_modules/example": { version: "8.0.0" } } }, null, 2)}\n`,
    "src/data/changelog.json": `${JSON.stringify(data, null, 2)}\n`,
    "CHANGELOG.md": renderChangelog(data),
  };
  try {
    for (const [file, content] of Object.entries(files)) {
      await mkdir(dirname(resolve(root, file)), { recursive: true });
      await writeFile(resolve(root, file), content);
    }
    await run(root);
  } finally { await rm(root, { recursive: true, force: true }); }
}

async function contents(root) {
  return Promise.all(managedFiles.map((file) => readFile(resolve(root, file), "utf8")));
}

async function setData(root, change) {
  const path = resolve(root, "src/data/changelog.json");
  const data = JSON.parse(await readFile(path, "utf8"));
  change(data);
  await writeFile(path, `${JSON.stringify(data, null, 2)}\n`);
}

test("stable semantic versions reject leading zeroes, suffixes, coercions, and unsafe numbers", () => {
  assert.deepEqual(parseVersion("0.2.0"), [0, 2, 0]);
  for (const invalid of ["v0.2.0", "01.2.0", "0.2", "0.2.0-beta.1", "0.2.0+build", "1.0.0 ", 1, "9007199254740992.0.0"]) {
    assert.throws(() => parseVersion(invalid), /version|integer/i);
  }
  assert.equal(bumpVersion("0.2.9", "patch"), "0.2.10");
  assert.equal(bumpVersion("0.2.9", "minor"), "0.3.0");
  assert.equal(bumpVersion("0.2.9", "major"), "1.0.0");
  assert.throws(() => bumpVersion("0.2.0", "prerelease"), /level/);
});

test("calendar dates are real dates and automatic dates follow Shanghai midnight", () => {
  assert(validReleaseDate("2028-02-29"));
  for (const invalid of ["2026-02-29", "2026-11-31", "2026-13-01", "2026-1-02", "November 2, 2026"]) assert.equal(validReleaseDate(invalid), false, invalid);
  assert.equal(shanghaiDate(new Date("2026-11-02T15:59:59Z")), "2026-11-02");
  assert.equal(shanghaiDate(new Date("2026-11-02T16:00:00Z")), "2026-11-03");
});

test("release history rejects duplicate versions, chronological inversion, empty releases, and misspelled fields", () => {
  const good = fixtureData();
  good.releases.push({ ...good.releases[0], version: "0.1.9", date: "2026-11-01" });
  assert.doesNotThrow(() => validateChangelog(good));
  for (const mutation of [
    (data) => { data.releases.push({ ...data.releases[0] }); },
    (data) => { data.releases.push({ ...data.releases[0], version: "0.1.0", date: "2026-11-03" }); },
    (data) => { data.releases[0].added = []; },
    (data) => { data.releases[0].date = "2026-02-30"; },
    (data) => { data.unreleased.fixedd = []; },
    (data) => { data.unreleased.added = ["Same entry", "Same entry"]; },
  ]) {
    const data = fixtureData(); mutation(data);
    assert.throws(() => validateChangelog(data));
  }
});

test("product version checks detect either root lock version drifting from the public notes", async () => {
  for (const field of ["package", "lock", "lock-root"]) await fixture(async (root) => {
    assert.deepEqual(await checkRelease(root), { version: "0.2.0", releases: 1 });
    const path = resolve(root, field === "package" ? "package.json" : "package-lock.json");
    const value = JSON.parse(await readFile(path, "utf8"));
    if (field === "lock-root") value.packages[""].version = "0.1.0";
    else value.version = "0.1.0";
    await writeFile(path, JSON.stringify(value));
    const before = await contents(root);
    await assert.rejects(checkRelease(root), /versions must match/);
    await assert.rejects(prepareRelease(root, "patch", "2026-11-03"), /versions must match/);
    assert.deepEqual(await contents(root), before);
  });
});

test("each release level moves the pending changes and synchronizes only the four release files", async () => {
  for (const [level, expected] of [["patch", "0.2.1"], ["minor", "0.3.0"], ["major", "1.0.0"]]) await fixture(async (root) => {
    const previous = await loadReleaseState(root);
    assert.equal(await prepareRelease(root, level, "2026-11-03"), expected);
    const state = await loadReleaseState(root);
    assert.equal(state.manifest.version, expected);
    assert.equal(state.lockfile.version, expected);
    assert.equal(state.lockfile.packages[""].version, expected);
    assert.equal(state.lockfile.packages["node_modules/example"].version, "8.0.0");
    assert.equal(state.manifest.scripts.dev, "next dev");
    assert.deepEqual(state.data.releases[0], { version: expected, date: "2026-11-03", ...previous.data.unreleased });
    assert.deepEqual(state.data.releases[1], previous.data.releases[0]);
    assert.deepEqual(state.data.unreleased.added, []);
    assert.doesNotMatch(state.markdown, /## Unreleased/);
    assert.equal((await checkRelease(root)).version, expected);
    assert.equal(await readFile(resolve(root, "CHANGELOG.md"), "utf8"), renderChangelog(state.data));
  });
});

test("empty unreleased changes and invalid dates fail before any release file changes", async () => {
  await fixture(async (root) => {
    const before = await contents(root);
    for (const date of ["2026-11-01", "2026-02-30"]) {
      await assert.rejects(prepareRelease(root, "patch", date), /Release date/);
      assert.deepEqual(await contents(root), before);
    }
    await prepareRelease(root, "patch", "2026-11-03");
    const released = await contents(root);
    await assert.rejects(prepareRelease(root, "patch", "2026-11-03"), /Add changes to unreleased/);
    assert.deepEqual(await contents(root), released);
  });
});

test("a stale generated document is detected and can be repaired without preparing a version", async () => {
  await fixture(async (root) => {
    await setData(root, (data) => { data.unreleased.fixed.push("Keep the selected category when moving to another page."); });
    const before = await contents(root);
    await assert.rejects(checkRelease(root), /CHANGELOG.md is out of date/);
    await assert.rejects(prepareRelease(root, "patch", "2026-11-03"), /CHANGELOG.md is out of date/);
    assert.deepEqual(await contents(root), before);
    await writeReleaseNotes(root);
    const after = await contents(root);
    assert.deepEqual(after.slice(0, 3), before.slice(0, 3));
    assert.match(after[3], /### Fixed/);
    assert.equal((await checkRelease(root)).version, "0.2.0");
  });
});

test("release notes can rebuild a missing generated document while checks and preparation refuse it", async () => {
  await fixture(async (root) => {
    const before = (await contents(root)).slice(0, 3);
    await rm(resolve(root, "CHANGELOG.md"));
    await assert.rejects(checkRelease(root), /ENOENT/);
    await assert.rejects(prepareRelease(root, "patch", "2026-11-03"), /ENOENT/);
    await writeReleaseNotes(root);
    assert.deepEqual((await contents(root)).slice(0, 3), before);
    assert.equal((await checkRelease(root)).version, "0.2.0");
  });
});

test("the CLI validates arguments and prepares a version without invoking Git or requiring dependencies", async () => {
  await fixture(async (root) => {
    const script = resolve("scripts/release.mjs");
    const before = await contents(root);
    const invalid = spawnSync(process.execPath, [script, "patch", "--unknown"], { cwd: root, encoding: "utf8", env: {} });
    assert.equal(invalid.status, 1);
    assert.match(invalid.stderr, /Usage:/);
    assert.deepEqual(await contents(root), before);
    const prepared = spawnSync(process.execPath, [script, "patch", "--date", "2026-11-03"], { cwd: root, encoding: "utf8", env: {} });
    assert.equal(prepared.status, 0, prepared.stderr);
    assert.match(prepared.stdout, /Prepared v0.2.1/);
    assert.match(prepared.stdout, /No Git commit, tag, push, or deployment/);
    assert.equal((await checkRelease(root)).version, "0.2.1");
  });
});

test("the repository's product version and generated changelog stay in sync", async () => {
  const result = await checkRelease(process.cwd());
  assert(result.releases >= 1);
  assert.match(result.version, /^\d+\.\d+\.\d+$/);
});
