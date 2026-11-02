import { getToolOutboundUrl } from "./tool-links";

export type StackToolDestination = { href: string; external: boolean };

// A database slug identifies an approved detail page. Static stack previews only
// know the provider website and must not guess a slug that may lead to a 404.
export function getStackToolDestination(tool: { slug: string | null; url: string | null }): StackToolDestination | null {
  if (tool.slug?.trim()) return { href: `/tools/${encodeURIComponent(tool.slug)}`, external: false };
  const href = tool.url ? getToolOutboundUrl({ url: tool.url, github: null, sourceUrl: null }, "website") : null;
  return href ? { href, external: true } : null;
}
