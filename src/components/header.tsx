"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Wordmark } from "@/components/logo";
import { GithubStarLink } from "@/components/github-star-link";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";
import { useState } from "react";

const navLinks = [
  { href: "/stacks", label: "Stacks" },
  { href: "/tools", label: "Browse" },
  { href: "/categories", label: "Categories" },
  { href: "/changelog", label: "Changelog" },
  { href: "/submit", label: "Submit" },
];

export function Header() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/90 backdrop-blur-xl backdrop-saturate-150 supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-[60px] max-w-[1200px] items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center group">
          <Wordmark height={24} className="text-foreground transition-transform duration-200 group-hover:scale-[1.02]" />
        </Link>

        <nav className="hidden md:flex items-center gap-0.5">
          {navLinks.map((link) => {
            const isActive =
              pathname === link.href || pathname.startsWith(link.href + "/");
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "relative px-3 py-1.5 text-sm font-medium rounded-md transition-colors duration-200",
                  isActive
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {link.label}
                {isActive && (
                  <span className="absolute inset-x-1 -bottom-[calc(0.875rem+1px)] h-0.5 rounded-full bg-primary" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-1">
          <GithubStarLink variant="ghost" className="hidden sm:inline-flex" />
          <Link href="/tools?focus=search" className="hidden md:block">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
            >
              <Search className="h-4 w-4" />
            </Button>
          </Link>
          <ThemeToggle />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="md:hidden h-9 w-9"
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            onClick={() => setMobileOpen((open) => !open)}
          >
            {mobileOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>

      {mobileOpen && (
        <nav className="border-t border-border/60 md:hidden px-6 py-3 space-y-0.5 bg-background">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "block px-3 py-2.5 text-sm font-medium rounded-lg transition-colors min-h-[44px] flex items-center",
                pathname === link.href || pathname.startsWith(link.href + "/")
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              {link.label}
            </Link>
          ))}
          <GithubStarLink
            variant="ghost"
            className="w-full justify-start px-3 py-2.5 min-h-[44px] sm:hidden"
            onClick={() => setMobileOpen(false)}
          />
        </nav>
      )}
    </header>
  );
}
