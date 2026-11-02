import changelog from "@/data/changelog.json";

export interface ReleaseNotes {
  title: string;
  summary: string;
  added: readonly string[];
  changed: readonly string[];
  fixed: readonly string[];
}

export interface ProductRelease extends ReleaseNotes {
  version: string;
  date: string;
}

// The release check validates this source and its version before every build.
export const releaseHistory: readonly ProductRelease[] = changelog.releases;
export const currentRelease = releaseHistory[0];
export const unreleasedChanges: ReleaseNotes = changelog.unreleased;

export function formatReleaseDate(date: string): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00.000Z`));
}
