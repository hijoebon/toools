import { after, connection, NextResponse } from "next/server";
import { recordToolMetric } from "@/lib/record-tool-metric";
import { recordUaActorMetric } from "@/lib/ua-actor-metric";
import { getApprovedToolLink } from "@/lib/tools";
import { getToolOutboundUrl } from "@/lib/tool-links";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  await connection();
  const { slug } = await params;
  const tool = await getApprovedToolLink(slug);

  if (!tool) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const destination = new URL(request.url).searchParams.get("destination") ?? "website";
  const url = getToolOutboundUrl(tool, destination);
  if (!url) {
    return NextResponse.json({ error: "Link not found" }, { status: 404 });
  }

  const userAgent = request.headers.get("user-agent");
  const purpose = request.headers.get("purpose") ?? request.headers.get("sec-purpose");
  after(() => {
    void recordToolMetric(tool.id, "click");
    void recordUaActorMetric({ metric: "click", userAgent, purpose });
  });

  return NextResponse.redirect(url, 302);
}
