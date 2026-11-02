import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { JsonLd } from "@/components/json-ld";
import { breadcrumbData, pageMetadata } from "@/lib/seo";
import {
  currentRelease,
  formatReleaseDate,
  releaseHistory,
  unreleasedChanges,
} from "@/lib/releases";
import { GITHUB_REPO_URL } from "@/lib/site";

export const metadata = pageMetadata(
  "Changelog",
  "Follow new features, improvements, and fixes to Toools, with dated product updates and a look at what is coming next.",
  "/changelog",
);

const changeGroups = [
  { key: "added", label: "Added" },
  { key: "changed", label: "Changed" },
  { key: "fixed", label: "Fixed" },
] as const;

function ChangeGroups({
  changes,
}: {
  changes: { added: readonly string[]; changed: readonly string[]; fixed: readonly string[] };
}) {
  return (
    <div className="mt-6 space-y-5">
      {changeGroups.map(({ key, label }) => changes[key].length > 0 && (
        <div key={key}>
          <h3 className="text-sm font-semibold text-foreground">{label}</h3>
          <ul className="mt-2 list-disc space-y-2 pl-5 text-sm leading-7 text-secondary-foreground marker:text-muted-foreground">
            {changes[key].map((change) => <li key={change}>{change}</li>)}
          </ul>
        </div>
      ))}
    </div>
  );
}

export default function ChangelogPage() {
  const hasUnreleasedChanges = changeGroups.some(({ key }) => unreleasedChanges[key].length > 0);

  return (
    <article className="mx-auto max-w-4xl px-6 py-10 sm:py-14 lg:px-8">
      <JsonLd data={breadcrumbData([{ name: "Home", path: "/" }, { name: "Changelog", path: "/changelog" }])} />

      <header className="max-w-2xl pb-10 sm:pb-12">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Changelog</h1>
        <p className="mt-4 text-base leading-7 text-muted-foreground">
          New features, improvements, and fixes to Toools.
        </p>
        <p className="mt-4 text-sm text-secondary-foreground">
          Current version{" "}
          <a
            href={`#v${currentRelease.version}`}
            className="inline-flex min-h-11 items-center rounded-sm font-mono font-medium text-foreground underline decoration-border underline-offset-4 transition-colors hover:decoration-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
          >
            v{currentRelease.version}
          </a>
        </p>
      </header>

      <section aria-label="Released updates">
        {releaseHistory.map((release, index) => (
          <section
            key={release.version}
            id={`v${release.version}`}
            aria-labelledby={`release-${release.version}`}
            className="grid scroll-mt-24 gap-5 border-t border-border py-8 sm:grid-cols-[9rem_minmax(0,1fr)] sm:gap-10 sm:py-10"
          >
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 sm:block">
              <a
                href={`#v${release.version}`}
                aria-label={`Link to version ${release.version}`}
                className="inline-flex min-h-11 items-center rounded-sm font-mono text-lg font-semibold text-foreground underline decoration-transparent underline-offset-4 transition-colors hover:decoration-current focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
              >
                v{release.version}
              </a>
              {index === 0 && (
                <span className="rounded-full bg-accent px-2.5 py-1 text-xs font-medium text-accent-foreground sm:ml-2">
                  Current
                </span>
              )}
              <time dateTime={release.date} className="w-full text-sm text-muted-foreground sm:mt-1 sm:block">
                {formatReleaseDate(release.date)}
              </time>
            </div>
            <div className="min-w-0">
              <h2 id={`release-${release.version}`} className="text-xl font-semibold tracking-tight sm:text-2xl">
                {release.title}
              </h2>
              <p className="mt-3 max-w-[65ch] text-sm leading-7 text-secondary-foreground">{release.summary}</p>
              <ChangeGroups changes={release} />
            </div>
          </section>
        ))}
      </section>

      {hasUnreleasedChanges && (
        <section
          id="unreleased"
          aria-labelledby="unreleased-heading"
          className="grid scroll-mt-24 gap-5 border-t border-border py-8 sm:grid-cols-[9rem_minmax(0,1fr)] sm:gap-10 sm:py-10"
        >
          <div>
            <p className="font-semibold text-foreground">Unreleased</p>
            <p className="mt-2 text-sm text-muted-foreground">Not yet released</p>
          </div>
          <div className="min-w-0">
            <h2 id="unreleased-heading" className="text-xl font-semibold tracking-tight sm:text-2xl">
              {unreleasedChanges.title}
            </h2>
            <p className="mt-3 max-w-[65ch] text-sm leading-7 text-secondary-foreground">{unreleasedChanges.summary}</p>
            <ChangeGroups changes={unreleasedChanges} />
          </div>
        </section>
      )}

      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-border pt-6 text-sm">
        <a
          href={`${GITHUB_REPO_URL}/blob/main/CHANGELOG.md`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 items-center gap-1.5 rounded-sm font-medium text-foreground underline decoration-border underline-offset-4 transition-colors hover:decoration-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
        >
          View on GitHub
          <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
        </a>
        <Link
          href="/tools"
          className="inline-flex min-h-11 items-center rounded-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
        >
          Browse tools
        </Link>
      </div>
    </article>
  );
}
