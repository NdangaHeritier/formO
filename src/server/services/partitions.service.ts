import { prisma } from "@/lib/prisma";

/**
 * Creates the monthly partitions required by the append-only submission,
 * delivery, event, and audit tables. Safe to run concurrently: a database
 * advisory lock serializes provisioners for the duration of the transaction.
 *
 * The lock and the create calls deliberately share a transaction. This prevents
 * two serverless instances from both observing a missing partition and then
 * attempting to create it at the same time.
 */
export async function ensureMonthlyPartitions(monthsAhead = 3): Promise<number> {
  return prisma.$transaction(async (tx) => {
    // One statement per prepared query: PostgreSQL rejects multiple commands.
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext('formo.monthly-partitions'))::text AS acquired`;
    const rows = await tx.$queryRaw<Array<{ created: number }>>`
      SELECT ensure_monthly_partitions(${monthsAhead}) AS created
    `;
    return Number(rows.at(-1)?.created ?? 0);
  });
}

/** Removes expired helper rows so rate-limit and idempotency tables stay bounded. */
export async function cleanupExpiredSubmissionHelpers() {
  const now = new Date();
  const [idempotencyKeys, rateLimitBuckets] = await prisma.$transaction([
    prisma.submissionIdempotencyKey.deleteMany({ where: { expiresAt: { lte: now } } }),
    prisma.rateLimitBucket.deleteMany({ where: { expiresAt: { lte: now } } }),
  ]);

  return {
    idempotencyKeys: idempotencyKeys.count,
    rateLimitBuckets: rateLimitBuckets.count,
  };
}
