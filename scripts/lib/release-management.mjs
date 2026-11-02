import { readFile, writeFile, rename, rm, mkdir } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { dirname, resolve } from "node:path";

const DATA_PATH = "src/data/changelog.json";
const CHANGE_GROUPS = ["added", "changed", "fixed"];
const GROUP_LABELS = { added: "Added", changed: "Changed", fixed: "Fixed" };

export function parseVersion(value) {
  if (typeof value !== "string" || !/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(value)) {
    throw new Error(`Expected a stable semantic version (major.minor.patch), received ${JSON.stringify(value)}`);
  }
  const parts = value.split(".").map(Number);
  if (parts.some((part) => !Number.isSafeInteger(part))) throw new Error("Version components must be safe integers");
  return parts;
}

function compareVersions(left, right) {
  const a = parseVersion(left);
  const b = parseVersion(right);
  for (let index = 0; index < 3; index++) {
    if (a[index] !== b[index]) return a[index] > b[index] ? 1 : -1;
  }
  return 0;
}

export function bumpVersion(version, level) {
  const [major, minor, patch] = parseVersion(version);
  const parts = level === "major" ? [major + 1, 0, 0]
    : level === "minor" ? [major, minor + 1, 0]
      : level === "patch" ? [major, minor, patch + 1] : null;
  if (!parts) throw new Error("Release level must be patch, minor, or major");
  const next = parts.join(".");
  parseVersion(next);
  return next;
}

export function validReleaseDate(value) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)
    && Number.isFinite(Date.parse(`${value}T00:00:00.000Z`))
    && new Date(`${value}T00:00:00.000Z`).toISOString().slice(0, 10) === value;
}

function requiredText(value, label) {
  if (typeof value !== "string" || !value.trim() || value !== value.trim() || /[\r\n]/.test(value)) {
    throw new Error(`${label} must be nonempty text on one line without surrounding whitespace`);
  }
}

function validateNotes(notes, label, released) {
  if (!notes || typeof notes !== "object" || Array.isArray(notes)) throw new Error(`${label} must be an object`);
  const fields = ["title", "summary", ...CHANGE_GROUPS, ...(released ? ["version", "date"] : [])];
  if (Object.keys(notes).some((key) => !fields.includes(key))) throw new Error(`${label} contains unknown fields`);
  requiredText(notes.title, `${label}.title`);
  requiredText(notes.summary, `${label}.summary`);
  for (const group of CHANGE_GROUPS) {
    if (!Array.isArray(notes[group])) throw new Error(`${label}.${group} must be an array`);
    for (const item of notes[group]) requiredText(item, `${label}.${group} item`);
    if (new Set(notes[group]).size !== notes[group].length) throw new Error(`${label}.${group} contains duplicate changes`);
  }
  if (released) {
    parseVersion(notes.version);
    if (!validReleaseDate(notes.date)) throw new Error(`${label}.date must be a real YYYY-MM-DD date`);
    if (!hasChanges(notes)) throw new Error(`${label} must describe at least one change`);
  }
}

export function hasChanges(notes) {
  return CHANGE_GROUPS.some((group) => notes[group].length > 0);
}

export function validateChangelog(data) {
  if (!data || typeof data !== "object" || Array.isArray(data)
    || Object.keys(data).some((key) => !["unreleased", "releases"].includes(key))) throw new Error("Invalid changelog document");
  validateNotes(data.unreleased, "unreleased", false);
  if (!Array.isArray(data.releases) || data.releases.length === 0) throw new Error("At least one product release is required");
  data.releases.forEach((release, index) => {
    validateNotes(release, `releases[${index}]`, true);
    if (index > 0) {
      const newer = data.releases[index - 1];
      if (compareVersions(newer.version, release.version) <= 0) throw new Error("Release versions must be unique and ordered newest first");
      if (newer.date < release.date) throw new Error("Release dates must be ordered newest first");
    }
  });
  return data;
}

function markdownNotes(notes) {
  const lines = [notes.summary];
  for (const group of CHANGE_GROUPS) {
    if (!notes[group].length) continue;
    lines.push("", `### ${GROUP_LABELS[group]}`, "", ...notes[group].map((item) => `- ${item}`));
  }
  return lines.join("\n");
}

export function renderChangelog(data) {
  validateChangelog(data);
  const sections = [
    "# Changelog",
    "Product changes to Toools. Product versions use major.minor.patch numbering.",
    "<!-- Generated from src/data/changelog.json. Edit that file, then run npm run release:notes. -->",
  ];
  if (hasChanges(data.unreleased)) sections.push(`## Unreleased — ${data.unreleased.title}\n\nNot yet released.\n\n${markdownNotes(data.unreleased)}`);
  for (const release of data.releases) sections.push(`## [${release.version}] — ${release.date}\n\n${release.title}\n\n${markdownNotes(release)}`);
  return `${sections.join("\n\n")}\n`;
}

function validateVersions(state) {
  validateChangelog(state.data);
  const version = state.data.releases[0].version;
  if (state.manifest.version !== version || state.lockfile.version !== version
    || state.lockfile.packages?.[""]?.version !== version) {
    throw new Error("Current changelog, package.json, and package-lock.json versions must match");
  }
  return version;
}

export async function loadReleaseState(root, { allowMissingMarkdown = false } = {}) {
  const files = ["package.json", "package-lock.json", DATA_PATH, "CHANGELOG.md"];
  const contents = await Promise.all(files.map((file) => readFile(resolve(root, file), "utf8").catch((error) => {
    if (file === "CHANGELOG.md" && allowMissingMarkdown && error.code === "ENOENT") return null;
    throw error;
  })));
  return {
    manifest: JSON.parse(contents[0]), lockfile: JSON.parse(contents[1]),
    data: JSON.parse(contents[2]), markdown: contents[3],
  };
}

export async function checkRelease(root) {
  const state = await loadReleaseState(root);
  const version = validateVersions(state);
  if (state.markdown !== renderChangelog(state.data)) throw new Error("CHANGELOG.md is out of date; run npm run release:notes");
  return { version, releases: state.data.releases.length };
}

// Stage every file first. If replacing a later file fails, restore files already
// replaced so a failed local prepare does not leave mismatched product versions.
async function writePlan(root, entries) {
  const nonce = randomUUID();
  const staged = [];
  const replaced = [];
  try {
    for (const [file, content] of entries) {
      const path = resolve(root, file);
      await mkdir(dirname(path), { recursive: true });
      const before = await readFile(path, "utf8").catch((error) => {
        if (error.code === "ENOENT") return null;
        throw error;
      });
      const temporary = `${path}.release-${nonce}.tmp`;
      await writeFile(temporary, content, { flag: "wx" });
      staged.push({ path, temporary, before });
    }
    for (const file of staged) {
      await rename(file.temporary, file.path);
      replaced.push(file);
    }
  } catch (error) {
    const failures = [error];
    for (const file of replaced.reverse()) {
      try {
        if (file.before === null) await rm(file.path);
        else await writeFile(file.path, file.before);
      } catch (rollbackError) { failures.push(rollbackError); }
    }
    if (failures.length > 1) throw new AggregateError(failures, "Release prepare failed and file restoration was incomplete; inspect local release files");
    throw error;
  } finally {
    await Promise.all(staged.map((file) => rm(file.temporary, { force: true })));
  }
}

const json = (value) => `${JSON.stringify(value, null, 2)}\n`;

export async function writeReleaseNotes(root) {
  const state = await loadReleaseState(root, { allowMissingMarkdown: true });
  validateVersions(state);
  await writePlan(root, [["CHANGELOG.md", renderChangelog(state.data)]]);
}

export function shanghaiDate(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", day: "2-digit", timeZone: "Asia/Shanghai" }).format(now);
}

export async function prepareRelease(root, level, date = shanghaiDate()) {
  const state = await loadReleaseState(root);
  const version = validateVersions(state);
  if (state.markdown !== renderChangelog(state.data)) throw new Error("CHANGELOG.md is out of date; run npm run release:notes before preparing a release");
  const next = bumpVersion(version, level);
  if (!validReleaseDate(date) || date < state.data.releases[0].date) throw new Error("Release date must be a real YYYY-MM-DD date on or after the current release");
  if (!hasChanges(state.data.unreleased)) throw new Error("Add changes to unreleased before preparing another release");
  const release = { version: next, date, ...state.data.unreleased };
  const data = {
    unreleased: { title: "Next update", summary: "Changes being prepared for a future release.", added: [], changed: [], fixed: [] },
    releases: [release, ...state.data.releases],
  };
  const manifest = { ...state.manifest, version: next };
  const lockfile = { ...state.lockfile, version: next, packages: { ...state.lockfile.packages, "": { ...state.lockfile.packages[""], version: next } } };
  validateVersions({ manifest, lockfile, data });
  await writePlan(root, [
    ["package.json", json(manifest)], ["package-lock.json", json(lockfile)],
    [DATA_PATH, json(data)], ["CHANGELOG.md", renderChangelog(data)],
  ]);
  return next;
}
