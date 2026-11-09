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

// The smoke test has no management write path. A disabled endpoint is an
// intentional security/operations state and must be preserved by diagnostics.
async function neonRequest(apiKey: string, path: string): Promise<{ ok: boolean; status: number; body: unknown }> {
  const response = await fetch(`https://console.neon.tech/api/v2${path}`, {
    method: "GET",
    headers: { Authorization: `Bearer ${apiKey}`, Accept: "application/json", "Content-Type": "application/json" },
    signal: AbortSignal.timeout(20_000), redirect: "error",
  });
  return { ok: response.ok, status: response.status, body: await response.json().catch(() => null) };
}

function endpointDisabled(body: unknown): boolean | null {
  if (!body || typeof body !== "object" || !("endpoint" in body)) return null;
  const endpoint = (body as { endpoint?: { disabled?: unknown } }).endpoint;
  return typeof endpoint?.disabled === "boolean" ? endpoint.disabled : null;
}

async function verifyEndpointEnabled(apiKey: string): Promise<boolean> {
  const target = CLOUD_RECOVERY_TARGET;
  const path = `/projects/${target.projectId}/endpoints/${target.endpointId}`;
  const current = await neonRequest(apiKey, path);
  if (!current.ok) {
    console.log(`endpoint_read=http_${current.status}`);
    return false;
  }
  const disabled = endpointDisabled(current.body);
  if (disabled !== false) {
    console.log(`smoke_control_plane=${disabled === true ? "endpoint_disabled" : "endpoint_state_unknown"}`);
    return false;
  }
  console.log("endpoint_disabled=false");
  return true;
}

async function revealedPassword(apiKey: string): Promise<string | null> {
  const target = CLOUD_RECOVERY_TARGET;
  const response = await neonRequest(apiKey, `/projects/${target.projectId}/branches/${target.branchId}/roles/${target.role}/reveal_password`);
  if (!response.ok) {
    console.log(`reveal=http_${response.status}`);
    return null;
  }
  const body = response.body as { password?: unknown; role?: { password?: unknown } } | null;
  const password = body?.password ?? body?.role?.password;
  if (typeof password !== "string" || !password) {
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
  const apiKey = process.env.CLOUD_NEON_API_KEY || "";
  let connectionUrl = databaseUrl;
  if (apiKey) {
    const target = CLOUD_RECOVERY_TARGET;
    if (!["postgres:", "postgresql:"].includes(parsed.protocol)
      || !new Set<string>([target.hostname, target.pooledHostname]).has(parsed.hostname)
      || decodeURIComponent(parsed.username) !== target.role || parsed.pathname !== `/${target.database}`) {
      console.log("database_url=target_mismatch");
      process.exitCode = 1;
      return;
    }
    // The durable recovery template can intentionally contain a revoked password.
    // Resolve the current management password before any SQL connection attempt.
    const password = await revealedPassword(apiKey);
    if (!password || !(await verifyEndpointEnabled(apiKey))) {
      process.exitCode = 1;
      return;
    }
    const current = new URL(databaseUrl);
    current.password = password;
    connectionUrl = current.toString();
  }
  const config = pgPoolConfig(connectionUrl);
  console.log(`pool_ssl=${config.ssl ? "true" : "false"}`);

  let client: Client;
  try {
    client = await connect(connectionUrl);
  } catch (error) {
    const code = error && typeof error === "object" && "code" in error && typeof error.code === "string" ? error.code : "error";
    const message = errorText(error);
    console.log(`smoke_connect=${code}`);
    console.log(`smoke_connect_kind=${connectionFailureKind(message)}`);
    console.log(`smoke_connect_hints=${connectionFailureHints(message)}`);
    process.exitCode = 1;
    return;
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
    if (decision === "pass" && process.argv.includes("--editor-picks-preflight")) {
      const { runEditorPicksPreflight } = await import("./lib/editor-picks-preflight");
      await runEditorPicksPreflight(client, connectionUrl);
    }
  } finally {
    await client.end().catch(() => undefined);
  }
}

main().catch(() => {
  console.log("smoke_connect=error");
  console.log("smoke_connect_kind=other");
  process.exitCode = 1;
});
