import { createHash } from "node:crypto";
import { classifyRequestActor } from "./crawlers";

export type UaActorMetricKind = "view" | "click";

export type RecordUaActorMetricInput = {
  metric: UaActorMetricKind;
  userAgent?: string | null;
  purpose?: string | null;
};

const UA_PREVIEW_MAX = 120;
const FINGERPRINT_HEX_LEN = 32;

/** Normalize UA for stable fingerprinting (trim + collapse whitespace + lowercase). */
export function normalizeUserAgent(userAgent?: string | null): string {
  return (userAgent ?? "").trim().replace(/\s+/g, " ").toLowerCase();
}

/** Truncated sha256 hex of the normalized UA (32 hex chars). Empty UA → fixed sentinel. */
export function fingerprintUserAgent(userAgent?: string | null): string {
  const normalized = normalizeUserAgent(userAgent);
  const material = normalized.length ? normalized : "missing_ua";
  return createHash("sha256").update(material).digest("hex").slice(0, FINGERPRINT_HEX_LEN);
}

export function previewUserAgent(userAgent?: string | null): string {
  const raw = (userAgent ?? "").trim().replace(/\s+/g, " ");
  if (!raw) return "(missing)";
  return raw.length <= UA_PREVIEW_MAX ? raw : `${raw.slice(0, UA_PREVIEW_MAX - 1)}…`;
}

/** UTC calendar day as Date at 00:00:00.000Z (stored as @db.Date). */
export function utcDay(now: Date = new Date()): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

export type UaActorMetricUpsertRow = {
  day: Date;
  uaFingerprint: string;
  uaPreview: string;
  actorClass: string;
  botFamily: string | null;
  metric: UaActorMetricKind;
};

export type UaActorMetricDeps = {
  mode: () => string | undefined;
  upsert: (row: UaActorMetricUpsertRow) => Promise<unknown>;
  now?: () => Date;
};

/**
 * Injectable recorder for tests. Days are UTC. Skips when TOOL_METRICS_MODE=disabled
 * (same local-preview behavior as recordToolMetric).
 */
export function createUaActorMetricRecorder(deps: UaActorMetricDeps) {
  return async function record(input: RecordUaActorMetricInput) {
    const mode = deps.mode();
    if (mode === "disabled") return;
    if (mode && mode !== "direct" && mode !== "queue") {
      throw new Error("Invalid TOOL_METRICS_MODE");
    }

    const classification = classifyRequestActor({
      userAgent: input.userAgent,
      purpose: input.purpose,
    });

    const row: UaActorMetricUpsertRow = {
      day: utcDay((deps.now ?? (() => new Date()))()),
      uaFingerprint: fingerprintUserAgent(input.userAgent),
      uaPreview: previewUserAgent(input.userAgent),
      actorClass: classification.actorClass,
      botFamily: classification.botFamily,
      metric: input.metric,
    };

    await deps.upsert(row);
  };
}

async function prismaUpsert(row: UaActorMetricUpsertRow) {
  const { prisma } = await import("./db");
  await prisma.uaActorMetricDaily.upsert({
    where: {
      day_uaFingerprint_metric: {
        day: row.day,
        uaFingerprint: row.uaFingerprint,
        metric: row.metric,
      },
    },
    create: {
      day: row.day,
      uaFingerprint: row.uaFingerprint,
      uaPreview: row.uaPreview,
      actorClass: row.actorClass,
      botFamily: row.botFamily,
      metric: row.metric,
      count: 1,
    },
    update: {
      count: { increment: 1 },
      // Keep classification/preview fresh if UA mapping changes later.
      uaPreview: row.uaPreview,
      actorClass: row.actorClass,
      botFamily: row.botFamily,
    },
  });
}

const record = createUaActorMetricRecorder({
  mode: () => process.env.TOOL_METRICS_MODE,
  upsert: prismaUpsert,
});

/** Side-path UA actor daily metric. Never throws to callers; swallows like recordToolMetric. */
export async function recordUaActorMetric(input: RecordUaActorMetricInput) {
  try {
    await record(input);
  } catch {
    // No database URL, SQL error body, or UA full string in public logs.
    console.error("UA actor metric could not be recorded", { metric: input.metric });
  }
}
