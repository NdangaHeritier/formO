import { prisma } from "@/lib/prisma";
import { PARTITIONED_TABLES } from "@/server/services/maintenance.service";

export const MIN_HEADROOM_DAYS = 30;
export const STALE_QUEUE_MINUTES = 15;

export type ReadinessCheck = {
  name: string;
  ok: boolean;
  value: number | null;
  threshold: number;
  warning?: boolean;
};

export type ReadinessReport = {
  ok: boolean;
  checks: ReadinessCheck[];
};

/** Extracts the TO (upper) bound of a PostgreSQL range-partition expression. */
export function parseUpperBound(expression: string): Date | null {
  const literals = [...expression.matchAll(/'([^']+)'/g)];
  const last = literals.at(-1)?.[1];
  if (!last) return null;
  const parsed = new Date(last);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function headroomDays(upperBound: Date, now = new Date()): number {
  return Math.floor((upperBound.getTime() - now.getTime()) / 86_400_000);
}

/** Pure decision table: partition headroom and DB availability gate readiness. */
export function evaluateReadiness(
  headroomByTable: Record<string, number | null>,
  databaseOk: boolean,
  warnings: { staleQueue: number; oldestPendingAgeMinutes: number | null; defaultRows: Record<string, number> }
): ReadinessReport {
  const checks: ReadinessCheck[] = [
    { name: "database", ok: databaseOk, value: databaseOk ? 1 : 0, threshold: 1 },
  ];

  for (const table of PARTITIONED_TABLES) {
    const value = headroomByTable[table] ?? null;
    checks.push({
      name: `${table}.headroomDays`,
      ok: value !== null && value >= MIN_HEADROOM_DAYS,
      value,
      threshold: MIN_HEADROOM_DAYS,
    });
  }

  checks.push({
    name: "staleQueue",
    ok: true,
    value: warnings.staleQueue,
    threshold: STALE_QUEUE_MINUTES,
    warning: warnings.staleQueue > 0,
  });
  checks.push({
    name: "oldestPendingAgeMinutes",
    ok: true,
    value: warnings.oldestPendingAgeMinutes,
    threshold: STALE_QUEUE_MINUTES,
    warning:
      warnings.oldestPendingAgeMinutes !== null &&
      warnings.oldestPendingAgeMinutes > STALE_QUEUE_MINUTES,
  });
  for (const [table, count] of Object.entries(warnings.defaultRows)) {
    checks.push({
      name: `${table}_default.rows`,
      ok: true,
      value: count,
      threshold: 0,
      warning: count > 0,
    });
  }

  return { ok: checks.every((check) => check.ok), checks };
}

type BoundRow = { child: string; bound: string };

/** All readiness SQL lives here so the route stays a thin adapter. */
export async function collectReadiness() {
  const headroom: Record<string, number | null> = {};
  const defaultRows: Record<string, number> = {};
  const now = new Date();

  for (const table of PARTITIONED_TABLES) {
    const rows = await prisma.$queryRawUnsafe<BoundRow[]>(
      `SELECT child.relname::text AS child, pg_get_expr(child.relpartbound, child.oid) AS bound ` +
        `FROM pg_inherits i JOIN pg_class child ON child.oid = i.inhrelid ` +
        `JOIN pg_class parent ON parent.oid = i.inhparent ` +
        `WHERE parent.relname = '${table}' AND child.relpartbound IS NOT NULL`
    );
    const bounds = rows
      .map((row) => parseUpperBound(row.bound))
      .filter((date): date is Date => date !== null);
    headroom[table] = bounds.length ? headroomDays(new Date(Math.max(...bounds.map((d) => d.getTime()))), now) : null;

    const count = await prisma.$queryRawUnsafe<Array<{ n: number }>>(
      `SELECT count(*)::int AS n FROM ${table}_default`
    );
    defaultRows[table] = Number(count[0]?.n ?? 0);
  }

  const stale = await prisma.$queryRawUnsafe<Array<{ n: number; oldest_minutes: number | null }>>(
    `SELECT count(*)::int AS n, ` +
      `MAX(EXTRACT(EPOCH FROM (now() - next_retry_at)) / 60)::int AS oldest_minutes ` +
      `FROM email_deliveries ` +
      `WHERE status IN ('pending','retrying') AND next_retry_at < now() - interval '${STALE_QUEUE_MINUTES} minutes'`
  );

  return {
    headroom,
    warnings: {
      staleQueue: Number(stale[0]?.n ?? 0),
      oldestPendingAgeMinutes: stale[0]?.oldest_minutes ?? null,
      defaultRows,
    },
  };
}
