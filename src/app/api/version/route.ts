import { currentRelease } from "@/lib/releases";
import { SITE_NAME } from "@/lib/site";

// Report the version running in this deployment, independently of catalog access.
export function GET() {
  return Response.json(
    { name: SITE_NAME, version: currentRelease.version, releasedAt: currentRelease.date },
    { headers: { "Cache-Control": "no-store" } },
  );
}
