export interface EditorPick {
  slug: string;
  catalogUrl: string;
  task: string;
  reason: string;
  limitation: string;
  reviewedOn: string;
  sources: { label: string; url: string }[];
}

// Ordered, documentation-based recommendations. Review criteria: docs/editor-picks.md.
// Catalog popularity signals and the legacy featured flag do not select these tools.
export const editorPicks: readonly EditorPick[] = [
  {
    slug: "pdfsam-basic",
    catalogUrl: "https://pdfsam.org/pdfsam-basic/",
    task: "Merge PDFs without uploading them",
    reason: "For people assembling document packets: combine selected pages locally instead of sending files to an online PDF merger.",
    limitation: "Basic handles page operations; editing existing PDF text needs a different tool or edition.",
    reviewedOn: "2026-11-09",
    sources: [{ label: "Official features & editions", url: "https://pdfsam.org/pdfsam-basic/" }],
  },
  {
    slug: "squoosh",
    catalogUrl: "https://squoosh.app",
    task: "Check image quality before shrinking a page asset",
    reason: "For site builders: compare compression settings visually and process the image in your browser instead of uploading it to a compression service.",
    limitation: "Judge each image's quality yourself. Local image processing does not mean no analytics: the app reports usage and file sizes.",
    reviewedOn: "2026-11-09",
    sources: [
      { label: "Official app", url: "https://squoosh.app/" },
      { label: "Processing & analytics", url: "https://github.com/GoogleChromeLabs/squoosh#privacy" },
    ],
  },
  {
    slug: "markor",
    catalogUrl: "https://github.com/gsantner/markor",
    task: "Keep Android notes in ordinary text files",
    reason: "For writers who want portable notes: edit Markdown and todo.txt offline in a normal folder, rather than keeping the only copy inside a notes service.",
    limitation: "Android only. Syncing those files across devices requires a separate sync app.",
    reviewedOn: "2026-11-09",
    sources: [{ label: "Official features & sync FAQ", url: "https://github.com/gsantner/markor#features" }],
  },
];

function catalogIdentity(value: string): string | null {
  try {
    const url = new URL(value);
    if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) return null;
    return url.hostname.toLowerCase().replace(/^www\./, "") + url.pathname.replace(/\/+$/, "");
  } catch {
    return null;
  }
}

/** Keep editorial order, skip missing/unpublished/invalid or repurposed listings. */
export function resolveEditorPicks<T extends { slug: string; url: string; status: string }>(tools: T[]) {
  const bySlug = new Map(tools.map((tool) => [tool.slug, tool]));
  return editorPicks.flatMap((editorial) => {
    const tool = bySlug.get(editorial.slug);
    if (!tool || tool.status !== "APPROVED"
      || catalogIdentity(tool.url) !== catalogIdentity(editorial.catalogUrl)) return [];
    return [{ ...tool, editorial }];
  });
}
