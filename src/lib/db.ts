import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { connection } from "next/server";
import { getDatabaseUrl, pgPoolConfig } from "@/lib/database-url";
import { catalogCache } from "@/lib/catalog-cache";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function createPrismaClient() {
  const pool = new Pool({
    ...pgPoolConfig(getDatabaseUrl()),
    connectionTimeoutMillis: 15_000,
    idleTimeoutMillis: 30_000,
    max: 5,
  });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

const getCachedDataUpdatedAt = catalogCache(async () => {
  const result = await prisma.tool.aggregate({
    where: { status: "APPROVED" },
    _max: { updatedAt: true },
  });
  return result._max.updatedAt?.toISOString() ?? null;
}, "updated-at");

export async function getDataUpdatedAt() {
  await connection();
  try {
    const updatedAt = await getCachedDataUpdatedAt();
    return updatedAt ? new Date(updatedAt) : null;
  } catch {
    return null;
  }
}
