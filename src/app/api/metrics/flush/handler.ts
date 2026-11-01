import { randomUUID } from "node:crypto";
import { validBearer } from "../../revalidate/handler";

function json(body: unknown, status: number) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

export function createMetricsCronHandler(
  flush: () => Promise<unknown>,
  getSecret = () => process.env.CRON_SECRET,
) {
  return async function GET(request: Request) {
    const secret = getSecret();
    if (!secret || secret.length < 32) {
      return json({ error: "Metric cron is not configured: CRON_SECRET must contain at least 32 characters" }, 503);
    }
    if (!validBearer(request, secret)) return json({ error: "Unauthorized" }, 401);
    try {
      return json(await flush(), 200);
    } catch (error) {
      console.error("Metric queue drain failed", error instanceof Error ? error.name : "Unknown error");
      return json({ error: "Metric queue drain failed; unacknowledged events remain queued for retry" }, 500);
    }
  };
}

export function createMetricsScheduleHandler(
  schedule: (options: { delaySeconds: number; idempotencyKey: string }) => Promise<unknown>,
  getSecret = () => process.env.CRON_SECRET,
  getMode = () => process.env.TOOL_METRICS_MODE,
) {
  return async function POST(request: Request) {
    const secret = getSecret();
    if (!secret || secret.length < 32) return json({ error: "Metric wake scheduling is not configured" }, 503);
    if (!validBearer(request, secret)) return json({ error: "Unauthorized" }, 401);
    if (getMode() !== "queue") return json({ error: "Metric queue mode is not active" }, 503);
    if (new URL(request.url).search) return json({ error: "This endpoint accepts an empty POST only" }, 400);
    // Vercel can provide a body stream for an empty POST. Check its content,
    // rather than rejecting the presence of the stream itself.
    try {
      if (await request.text() !== "") return json({ error: "This endpoint accepts an empty POST only" }, 400);
    } catch { return json({ error: "The request body could not be read" }, 400); }
    try {
      // A wake contains no tool IDs or metric events. Its topic is fixed by the
      // existing queue adapter; the caller cannot choose a key or destination.
      await schedule({ delaySeconds: 0, idempotencyKey: `operator-${randomUUID()}` });
      return json({ scheduled: true }, 202);
    } catch {
      console.error("MetricScheduleError");
      return json({ error: "Metric wake scheduling failed" }, 503);
    }
  };
}
