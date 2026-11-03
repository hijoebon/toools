import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  // Keep the two rules separate on purpose: Next.js renders one user-agent
  // list as a single block, and the previous combined ["*", "OAI-SearchBot"]
  // rule rendered as an empty "*" block followed by an OAI-SearchBot block,
  // which is ambiguous for some robots.txt parsers. Both rules allow the
  // whole site except /admin and /api/; no tool or category page is blocked.
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/admin", "/api/"] },
      { userAgent: "OAI-SearchBot", allow: "/", disallow: ["/admin", "/api/"] },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
