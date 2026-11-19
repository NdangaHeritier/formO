import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "@/generated/prisma/client";
import { getServerEnv } from "./env";

const globalForPrisma = globalThis as unknown as {
  formoPool?: Pool;
  formoPrisma?: PrismaClient;
  formoShutdownHookRegistered?: boolean;
};

function createPool(): Pool {
  const connectionString =
    process.env.NEXT_PHASE === "phase-production-build" && !process.env.DATABASE_URL
      ? "postgresql://postgres:postgres@127.0.0.1:5432/formo"
      : getServerEnv().DATABASE_URL;

  return new Pool({
    connectionString,
    max: 15,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
    options: "-c statement_timeout=15000",
  });
}

function registerShutdownHooks(): void {
  if (globalForPrisma.formoShutdownHookRegistered) return;
  if (typeof process === "undefined" || typeof process.on !== "function") return;

  globalForPrisma.formoShutdownHookRegistered = true;

  const shutdown = async () => {
    try {
      await globalForPrisma.formoPrisma?.$disconnect();
      await globalForPrisma.formoPool?.end();
    } catch {
      // Ignore cleanup errors during process teardown
    }
  };

  process.once("SIGTERM", () => void shutdown());
  process.once("SIGINT", () => void shutdown());
}

/**
 * Lazily initializes and returns the singleton PrismaClient backed by a bounded pg Pool.
 */
export function getPrisma(): PrismaClient {
  if (globalForPrisma.formoPrisma) {
    return globalForPrisma.formoPrisma;
  }

  const pool = globalForPrisma.formoPool ?? createPool();
  const adapter = new PrismaPg(pool);
  const client = new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

  globalForPrisma.formoPool = pool;
  globalForPrisma.formoPrisma = client;

  registerShutdownHooks();
  return client;
}

/**
 * Shared Prisma client proxy so importing `@/lib/prisma` remains safe during Next.js build phases
 * even when runtime environment variables are injected only at deploy time.
 */
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getPrisma();
    const value = Reflect.get(client, prop);
    return typeof value === "function" ? value.bind(client) : value;
  },
});

/** Detects Prisma unique-constraint violations without importing generated classes. */
export function isUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "P2002"
  );
}

/**
 * Verifies PostgreSQL connectivity and returns the active server version string.
 */
export async function checkDatabaseHealth(): Promise<{ ok: true; serverVersion: string }> {
  await prisma.$queryRaw`SELECT 1`;
  const rows = await prisma.$queryRaw<Array<{ server_version: string }>>`SHOW server_version`;
  return {
    ok: true,
    serverVersion: rows[0]?.server_version ?? "unknown",
  };
}
