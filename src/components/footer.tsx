import Link from "next/link";
import { Suspense } from "react";
import { Wordmark } from "@/components/logo";
import { GithubStarLink } from "@/components/github-star-link";
import { FooterUpdatedAt } from "@/components/footer-updated-at";
import { GITHUB_REPO_URL } from "@/lib/site";
import { currentRelease } from "@/lib/releases";

function FooterUpdatedAtFallback() {
  return <span className="text-muted-foreground/50">Loading update time…</span>;
}

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border/60">
      <div className="mx-auto max-w-[1200px] px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <Wordmark height={20} className="text-foreground" />
            <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">
              Tools from Product Hunt, GitHub Awesome lists, and our community, organized into practical workflows.
            </p>
            <div className="mt-4">
              <GithubStarLink variant="button" />
            </div>
          </div>
          <nav aria-label="Footer" className="grid grid-cols-2 gap-x-8 gap-y-6 text-sm min-[480px]:grid-cols-3">
            <div className="flex flex-col gap-2.5">
              <span className="text-sm font-semibold text-foreground">Explore</span>
              <Link href="/stacks" className="text-muted-foreground transition-colors hover:text-foreground">
                Tool Stacks
              </Link>
              <Link href="/tools" className="text-muted-foreground transition-colors hover:text-foreground">
                Browse Tools
              </Link>
              <Link href="/categories" className="text-muted-foreground transition-colors hover:text-foreground">
                Categories
              </Link>
            </div>
            <div className="flex flex-col gap-2.5">
              <span className="text-sm font-semibold text-foreground">Contribute</span>
              <Link href="/submit" className="text-muted-foreground transition-colors hover:text-foreground">
                Submit a Tool
              </Link>
              <Link href="/how-we-curate" className="text-muted-foreground transition-colors hover:text-foreground">
                Sources & Selection
              </Link>
              <Link href="/about" className="text-muted-foreground transition-colors hover:text-foreground">
                About Toools
              </Link>
              <Link href="/editorial-policy" className="text-muted-foreground transition-colors hover:text-foreground">
                Editorial Standards
              </Link>
            </div>
            <div className="flex flex-col gap-2.5">
              <span className="text-sm font-semibold text-foreground">Open source</span>
              <a
                href={GITHUB_REPO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                GitHub Repository
              </a>
              <a href="/llms.txt" className="text-muted-foreground transition-colors hover:text-foreground">
                llms.txt
              </a>
              <Link href="/changelog" className="text-muted-foreground transition-colors hover:text-foreground">
                Changelog
              </Link>
            </div>
          </nav>
        </div>
        <div className="mt-8 flex flex-col gap-1 border-t border-border/40 pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span>© {new Date().getFullYear()} Toools</span>
            <Link
              href={`/changelog#v${currentRelease.version}`}
              aria-label={`Toools version ${currentRelease.version}, view changelog`}
              className="inline-flex min-h-11 items-center rounded-sm font-mono text-foreground underline decoration-border underline-offset-4 transition-colors hover:decoration-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
            >
              v{currentRelease.version}
            </Link>
          </div>
          <Suspense fallback={<FooterUpdatedAtFallback />}>
            <FooterUpdatedAt />
          </Suspense>
        </div>
      </div>
    </footer>
  );
}
