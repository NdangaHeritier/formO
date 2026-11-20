import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaNeon } from "@prisma/adapter-neon";
import { Pool } from "pg";
import { PrismaClient } from "@/generated/prisma/client";
import { getServerEnv } from "./env";
import { resolveDatabaseDriver } from "./db-target";

const globalForPrisma = globalThis as unknown as {
  formoPool?: Pool;
  formoPrisma?: PrismaClient;
  formoShutdownHookRegistered?: boolean;
};

const LOCAL_FALLBACK = "postgresql://postgres:postgres@127.0.0.1:5432/formo";

function connectionString(): string {
  const env = getServerEnv();
  const configured = env.FORMO_DATABASE_URL || env.DATABASE_URL;
  if (process.env.NEXT_PHASE === "phase-production-build" && !configured) {
    return LOCAL_FALLBACK;
  }
  return configured;
}

/**
 * Two drivers, one client:
 * - Neon (production/serverless) uses the WebSocket adapter, which is the
 *   only reliable way to pool across short-lived serverless instances.
 * - Local Postgres keeps the plain `pg` Pool used during development.
 *
 * DECISION: Neon pools are capped at 3 connections per instance. Each serverless
 * instance gets its own pool; a higher cap across many instances would exhaust
 * Neon's connection quota. The local pool keeps 15 for normal dev workloads.
 */
function createClientAndPool(): { client: PrismaClient; pool?: Pool } {
  const url = connectionString();
  const driver = resolveDatabaseDriver(url, getServerEnv().DATABASE_DRIVER);

  if (driver === "neon") {
    const adapter = new PrismaNeon({
      connectionString: url,
      max: 3,
      connectionTimeoutMillis: 15_000,
      idleTimeoutMillis: 30_000,
    });
    return { client: new PrismaClient({ adapter }) };
  }

  const pool = new Pool({
    connectionString: url,
    max: 15,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
    options: "-c statement_timeout=15000",
  });
  return { client: new PrismaClient({ adapter: new PrismaPg(pool) }), pool };
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
      // Ignore cleanup errors during process teardown.
    }
  };
  process.once("SIGTERM", () => void shutdown());
  process.once("SIGINT", () => void shutdown());
}

/** Lazily initializes the singleton PrismaClient with the right driver. */
export function getPrisma(): PrismaClient {
  if (globalForPrisma.formoPrisma) return globalForPrisma.formoPrisma;

  const { client, pool } = createClientAndPool();
  globalForPrisma.formoPool = pool;
  globalForPrisma.formoPrisma = client;
  registerShutdownHooks();
  return client;
}

/**
 * Shared Prisma client proxy so importing `@/lib/prisma` stays safe during
 * Next.js build phases when runtime env vars are injected only at deploy time.
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

/** Verifies connectivity and returns the active server version string. */
export async function checkDatabaseHealth(): Promise<{ ok: true; serverVersion: string }> {
  await prisma.$queryRaw`SELECT 1`;
  const rows = await prisma.$queryRaw<Array<{ server_version: string }>>`SHOW server_version`;
  return { ok: true, serverVersion: rows[0]?.server_version ?? "unknown" };
}
