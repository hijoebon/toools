const LEGACY_SSL_MODES = /([?&])sslmode=(prefer|require|verify-ca)(?=(&|$))/i;
const HAS_SSL_MODE = /[?&]sslmode=/i;

function isNeonHost(url: string): boolean {
  try {
    const host = new URL(url).hostname;
    return host === "neon.tech" || host.endsWith(".neon.tech");
  } catch {
    return false;
  }
}

/**
 * pg v8 treats prefer/require/verify-ca as verify-full and warns until the URL
 * says so explicitly. Neon closes a cleartext session before authentication
 * (`28000 connection is insecure`), which the catalog then reports as unavailable.
 * A Neon URL from the project guide has no sslmode, so add verify-full there.
 */
export function normalizePgSslMode(url: string): string {
  if (!isNeonHost(url)) return url.replace(LEGACY_SSL_MODES, "$1sslmode=verify-full");
  if (HAS_SSL_MODE.test(url)) return url.replace(/([?&])sslmode=[^&]*/i, "$1sslmode=verify-full");
  return `${url}${url.includes("?") ? "&" : "?"}sslmode=verify-full`;
}

export function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }
  return normalizePgSslMode(url);
}
