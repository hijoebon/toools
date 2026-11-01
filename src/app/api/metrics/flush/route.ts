import { flushToolMetrics } from "@/lib/flush-tool-metrics";
import { scheduleMetricFlush } from "@/lib/metric-queue";
import { createMetricsCronHandler, createMetricsScheduleHandler } from "./handler";

export const runtime = "nodejs";
export const maxDuration = 300;

export const GET = createMetricsCronHandler(() => flushToolMetrics({ pruneReceipts: true }));
export const POST = createMetricsScheduleHandler(scheduleMetricFlush);
