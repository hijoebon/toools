import { Client } from "pg";
import { pgPoolConfig } from "../src/lib/database-url";
import { CLOUD_RECOVERY_TARGET } from "./lib/cloud-recovery";
import { catalogReadDecision, connectionFailureHints, connectionFailureKind } from "./lib/catalog-smoke";

const KNOWN_SLUG = "chatgpt";
const MISSING_SLUG = "missing-xyz";

function errorText(error: unknown): string {
  if (!error || typeof error !== "object") return "";
  const record = error as { message?: unknown; detail?: unknown; hint?: unknown; routine?: unknown };
  return [record.message, record.detail, record.hint, record.routine].filter((item) => typeof item === "string").join(" ");
}

function mask(value: string) {
  if (process.env.GITHUB_ACTIONS === "true" && value) {
    console.log(`::add-mask::${value.replaceAll("%", "%25").replaceAll("\r", "%0D").replaceAll("\n", "%0A")}`);
  }
}

async function queryName(client: Client, slug: string): Promise<string | null> {
  const result = await client.query<{ name: string }>(
    'SELECT name FROM "Tool" WHERE slug = $1 AND status = \'APPROVED\'',
    [slug],
  );
  return result.rows[0]?.name ?? null;
}

async function connect(url: string): Promise<Client> {
  const client = new Client({ ...pgPoolConfig(url), connectionTimeoutMillis: 15_000 });
  await client.connect();
  return client;
}

async function revealedPassword(apiKey: string): Promise<string | null> {
  const target = CLOUD_RECOVERY_TARGET;
  const response = await fetch(
    `https://console.neon.tech/api/v2/projects/${target.projectId}/branches/${target.branchId}/roles/${target.role}/reveal_password`,
    { headers: { Authorization: `Bearer ${apiKey}`, Accept: "application/json" }, signal: AbortSignal.timeout(15_000) },
  );
  if (!response.ok) {
    console.log(`reveal=http_${response.status}`);
    return null;
  }
  const body = await response.json().catch(() => null) as { password?: unknown; role?: { password?: unknown } } | null;
  const password = body?.password ?? body?.role?.password;
  if (typeof password !== "string") {
    console.log("reveal=unexpected");
    return null;
  }
  mask(password);
  return password;
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL || "";
  if (!databaseUrl) {
    console.log("database_url=missing");
    process.exitCode = 1;
    return;
  }
  let parsed: URL;
  try {
    parsed = new URL(databaseUrl);
  } catch {
    console.log("database_url=invalid");
    process.exitCode = 1;
    return;
  }
  mask(decodeURIComponent(parsed.password));
  const config = pgPoolConfig(databaseUrl);
  console.log(`pool_ssl=${config.ssl ? "true" : "false"}`);

  let client: Client;
  try {
    client = await connect(databaseUrl);
  } catch (error) {
    const code = error && typeof error === "object" && "code" in error && typeof error.code === "string" ? error.code : "error";
    const message = errorText(error);
    console.log(`smoke_connect=${code}`);
    console.log(`smoke_connect_kind=${connectionFailureKind(message)}`);
    console.log(`smoke_connect_hints=${connectionFailureHints(message)}`);
    const apiKey = process.env.CLOUD_NEON_API_KEY || "";
    if (code !== "28P01" || !apiKey) {
      process.exitCode = 1;
      return;
    }
    const password = await revealedPassword(apiKey);
    if (!password) {
      process.exitCode = 1;
      return;
    }
    const rotated = new URL(databaseUrl);
    rotated.password = password;
    console.log(`password_matches_template=${password === decodeURIComponent(parsed.password)}`);
    try {
      client = await connect(rotated.toString());
    } catch (retryError) {
      const retryCode = retryError && typeof retryError === "object" && "code" in retryError && typeof retryError.code === "string" ? retryError.code : "error";
      const retryMessage = errorText(retryError);
      console.log(`smoke_connect=${retryCode}`);
      console.log(`smoke_connect_kind=${connectionFailureKind(retryMessage)}`);
      console.log(`smoke_connect_hints=${connectionFailureHints(retryMessage)}`);
      process.exitCode = 1;
      return;
    }
  }

  try {
    const known = await queryName(client, KNOWN_SLUG);
    const missing = await queryName(client, MISSING_SLUG);
    const decision = catalogReadDecision(known, missing);
    console.log(`smoke_known=${known ? "present" : "absent"}`);
    console.log(`smoke_missing=${missing ? "present" : "absent"}`);
    console.log(`smoke_known_name=${known === "ChatGPT" ? "ChatGPT" : known ? "present" : "absent"}`);
    console.log(`smoke_decision=${decision}`);
    if (decision !== "pass") process.exitCode = 1;
  } finally {
    await client.end().catch(() => undefined);
  }
}

main().catch(() => {
  console.log("smoke_connect=error");
  console.log("smoke_connect_kind=other");
  process.exitCode = 1;
});
