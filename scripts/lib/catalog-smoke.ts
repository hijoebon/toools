const FAILURE_HINTS = [
  "insecure",
  "sslmode",
  "ssl",
  "password",
  "authentication",
  "channel",
  "binding",
  "certificate",
  "encryption",
  "pg_hba",
  "endpoint",
  "disabled",
  "quota",
  "compute",
  "timeout",
  "refused",
  "permission",
  "suspend",
] as const;

/** Words from a fixed list that appear in a driver error. The raw message is never logged. */
export function connectionFailureHints(message: string): string {
  const text = message.toLowerCase();
  const hits = FAILURE_HINTS.filter((hint) => text.includes(hint));
  return hits.length ? hits.join(",") : "none";
}

/** Classify a driver error without echoing the message. Messages can contain connection strings. */
export function connectionFailureKind(message: string): string {
  const text = message.toLowerCase();
  if (text.includes("connection is insecure")) return "insecure";
  if (text.includes("password authentication failed")) return "password";
  if (text.includes("channel binding")) return "channel-binding";
  if (text.includes("certificate") || text.includes("self-signed")) return "certificate";
  if (text.includes("no encryption") || text.includes("pg_hba")) return "encryption";
  if (text.includes("endpoint") || text.includes("disabled") || text.includes("quota") || text.includes("compute")) return "endpoint";
  if (text.includes("ssl")) return "ssl";
  if (text.includes("timeout")) return "timeout";
  if (text.includes("econnrefused") || text.includes("enotfound") || text.includes("econnreset")) return "network";
  return "other";
}

/**
 * A passing read has the known approved listing and no row for the missing slug.
 * Any thrown database error is the production "temporarily unavailable" path and is not a pass.
 */
export function catalogReadDecision(knownName: string | null, missingName: string | null): "pass" | "known-missing" | "missing-present" {
  if (!knownName) return "known-missing";
  if (missingName) return "missing-present";
  return "pass";
}
