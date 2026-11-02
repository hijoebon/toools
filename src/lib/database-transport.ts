import type { HTTPQueryOptions } from "@neondatabase/serverless";

export type DatabaseTransport = "pg" | "neon-http";

export function resolveDatabaseTransport(url: string, configured?: string): DatabaseTransport {
  if (!configured || configured === "pg") return "pg";
  if (configured !== "neon-http") throw new Error("DATABASE_TRANSPORT must be pg or neon-http");

  let database: URL;
  try {
    database = new URL(url);
  } catch {
    throw new Error("Neon HTTP requires a valid PostgreSQL DATABASE_URL");
  }
  if (!["postgres:", "postgresql:"].includes(database.protocol)
    || !(database.hostname === "neon.tech" || database.hostname.endsWith(".neon.tech"))
    || !database.username || database.pathname.length < 2) {
    throw new Error("Neon HTTP requires a PostgreSQL DATABASE_URL hosted by Neon");
  }
  return "neon-http";
}

export function neonHttpQueryOptions(
  timeoutSignal = () => AbortSignal.timeout(15_000),
): HTTPQueryOptions<boolean, boolean> {
  return {
    fetchOptions: {
      // The client retains fetchOptions for its lifetime and spreads it for each
      // request. A value created here would expire every later query as well.
      get signal() { return timeoutSignal(); },
    },
  };
}
