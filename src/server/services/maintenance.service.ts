import { getServerEnv } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { resolveRetentionDays } from "@/lib/retention";

export const PARTITIONED_TABLES = [
  "form_submissions",
  "email_deliveries",
  "email_events",
  "audit_logs",
] as const;

const BATCH_SIZE = 1_000;
const MAX_BATCHES = 20;

export type MaintenanceResult = {
  partitions: { ensuredMonthsAhead: number; failed: boolean };
  deleted: { rateLimitBuckets: number; idempotencyKeys: number; submissions: number };
  defaultPartitionRows: Record<string, number>;
  errors: string[];
};

/** Deletes expired rows in bounded batches so a long cleanup cannot lock the table. */
async function deleteExpired(table: "rate_limit_buckets" | "submission_idempotency_keys") {
  let total = 0;
  for (let batch = 0; batch < MAX_BATCHES; batch += 1) {
    const deleted = await prisma.$executeRawUnsafe(
      `DELETE FROM ${table} WHERE ctid IN (` +
        `SELECT ctid FROM ${table} WHERE expires_at < now() LIMIT ${BATCH_SIZE}` +
        `)`
    );
    total += deleted;
    if (deleted < BATCH_SIZE) break;
  }
  return total;
}

/** Bounded, workspace-scoped pruning. Only called when a policy is configured. */
async function pruneWorkspaceSubmissions(organizationId: string, days: number) {
  let total = 0;
  for (let batch = 0; batch < MAX_BATCHES; batch += 1) {
    const deleted = await prisma.$executeRaw`
      DELETE FROM form_submissions
      WHERE ctid IN (
        SELECT s.ctid FROM form_submissions s
        JOIN project_forms pf ON pf.id = s.form_id
        JOIN projects p ON p.id = pf.project_id
        WHERE p.organization_id = ${organizationId}::uuid
          AND s.created_at < now() - (${days}::int * interval '1 day')
        LIMIT ${BATCH_SIZE}
      )`;
    total += deleted;
    if (deleted < BATCH_SIZE) break;
  }
  return total;
}

/** All steps run even when one fails; the caller decides the status code. */
export async function runMaintenance(): Promise<MaintenanceResult> {
  const monthsAhead = getServerEnv().PARTITION_MONTHS_AHEAD;
  const result: MaintenanceResult = {
    partitions: { ensuredMonthsAhead: monthsAhead, failed: false },
    deleted: { rateLimitBuckets: 0, idempotencyKeys: 0, submissions: 0 },
    defaultPartitionRows: {},
    errors: [],
  };

  try {
    await prisma.$transaction(async (tx) => {
      // Cast the void result: Prisma cannot deserialize a raw `void` column.
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext('formo.monthly-partitions'))::text AS acquired`;
      await tx.$queryRaw`SELECT ensure_monthly_partitions(${monthsAhead})`;
    });
  } catch (error) {
    result.partitions.failed = true;
    result.errors.push("partitions");
    console.error("[maintenance] partition provisioning failed", {
      reason: error instanceof Error ? error.message : "unknown",
    });
  }

  try {
    result.deleted.rateLimitBuckets = await deleteExpired("rate_limit_buckets");
  } catch (error) {
    result.errors.push("rate_limit_cleanup");
    console.error("[maintenance] rate-limit cleanup failed", {
      reason: error instanceof Error ? error.message : "unknown",
    });
  }

  try {
    result.deleted.idempotencyKeys = await deleteExpired("submission_idempotency_keys");
  } catch (error) {
    result.errors.push("idempotency_cleanup");
    console.error("[maintenance] idempotency cleanup failed", {
      reason: error instanceof Error ? error.message : "unknown",
    });
  }

  try {
    const envDays = getServerEnv().FORMO_SUBMISSION_RETENTION_DAYS ?? null;
    const organizations = await prisma.organization.findMany({
      select: { id: true, retentionDays: true },
    });
    for (const organization of organizations) {
      const days = resolveRetentionDays(organization.retentionDays, envDays);
      if (days === null) continue;
      result.deleted.submissions += await pruneWorkspaceSubmissions(organization.id, days);
    }
  } catch (error) {
    result.errors.push("retention_cleanup");
    console.error("[maintenance] retention cleanup failed", {
      reason: error instanceof Error ? error.message : "unknown",
    });
  }

  for (const table of PARTITIONED_TABLES) {
    try {
      const rows = await prisma.$queryRawUnsafe<Array<{ n: number }>>(
        `SELECT count(*)::int AS n FROM ${table}_default`
      );
      result.defaultPartitionRows[table] = Number(rows[0]?.n ?? 0);
    } catch (error) {
      result.errors.push(`default_partition_${table}`);
      console.error("[maintenance] default partition count failed", {
        table,
        reason: error instanceof Error ? error.message : "unknown",
      });
    }
  }

  return result;
}
