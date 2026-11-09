"use client";

import { track } from "@vercel/analytics";

export function ToolWebsiteLink({ slug, className, children, destination = "website", source = "tool_detail" }: { slug: string; className: string; children: React.ReactNode; destination?: "website" | "github" | "source"; source?: "tool_detail" | "home_editors_picks" }) {
  return <a href={`/api/tools/${encodeURIComponent(slug)}/out${destination === "website" ? "" : `?destination=${destination}`}`} className={className} target="_blank" rel="noopener noreferrer" onClick={() => {
    track(destination === "website" ? "tool_website_click" : "tool_external_link_click", { tool: slug, source, destination });
  }}>{children}</a>;
}
