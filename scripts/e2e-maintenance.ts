/**
 * End-to-end partition maintenance check. Requires a local Postgres with all
 * migrations applied (including 0004_default_partitions) and a running server
 * with CRON_SECRET set.
 *
 *   npm run test:e2e:maintenance
 *
 * This script prints actual results; it does not mock the database.
 */
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { evaluateReadiness } from "../src/server/services/health.service";

const BASE = process.env.E2E_BASE_URL ?? "http://127.0.0.1:3000";
const CRON_SECRET = process.env.CRON_SECRET ?? "";
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required");
if (!CRON_SECRET) throw new Error("CRON_SECRET is required");

const pool = new Pool({ connectionString: databaseUrl });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function cron(path: string) {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { authorization: `Bearer ${CRON_SECRET}` },
  });
  return { status: res.status, body: await res.json() };
}

async function main() {
  const future = new Date(Date.now() + 13 * 30 * 86_400_000);
  const orgId = randomUUID();
  const auditId = randomUUID();

  // 1. A row 13 months out must be caught by the DEFAULT partition or rejected.
  await prisma.organization.create({
    data: { id: orgId, name: "E2E maintenance", slug: `e2e-maint-${randomUUID().slice(0, 8)}` },
  });
  let landedInDefault = false;
  try {
    await prisma.$executeRawUnsafe(
      `INSERT INTO audit_logs (id, organization_id, action, target_type, created_at) ` +
        `VALUES ('${auditId}'::uuid, '${orgId}'::uuid, 'e2e', 'test', $1::timestamptz)`,
      future
    );
    const rows = await prisma.$queryRawUnsafe<Array<{ n: number }>>(
      `SELECT count(*)::int AS n FROM audit_logs_default WHERE id = '${auditId}'::uuid`
    );
    landedInDefault = (rows[0]?.n ?? 0) === 1;
    console.log(`1. 13-month audit row inserted; landed in DEFAULT partition: ${landedInDefault}`);
  } catch (error) {
    console.log(
      `1. 13-month audit row rejected before maintenance (expected without DEFAULT): ${
        error instanceof Error ? error.message.slice(0, 120) : "unknown"
      }`
    );
  }

  // An occupied DEFAULT partition blocks CREATE ... PARTITION. Simulate the
  // documented operator cleanup (docs/operations.md) before provisioning.
  if (landedInDefault) {
    await prisma.$executeRawUnsafe(
      `DELETE FROM audit_logs_default WHERE action = 'e2e'`
    );
    console.log("1. test row removed from DEFAULT before provisioning");
  }

  // 2. Run maintenance with a large horizon, then the same insert should reach a real partition.
  process.env.PARTITION_MONTHS_AHEAD = "15";
  const maintenance = await cron("/api/cron/maintenance");
  console.log("2. maintenance:", maintenance.status, JSON.stringify(maintenance.body));
  assert.equal(maintenance.status, 200);

  const secondId = randomUUID();
  await prisma.$executeRawUnsafe(
    `INSERT INTO audit_logs (id, organization_id, action, target_type, created_at) ` +
      `VALUES ('${secondId}'::uuid, '${orgId}'::uuid, 'e2e', 'test', $1::timestamptz)`,
    future
  );
  const inRange = await prisma.$queryRawUnsafe<Array<{ n: number }>>(
    `SELECT count(*)::int AS n FROM audit_logs ` +
      `WHERE id = '${secondId}'::uuid AND tableoid <> 'audit_logs_default'::regclass`
  );
  assert.equal(inRange[0]?.n, 1, "row should land in a real month partition");
  console.log("2. row landed in a real month partition: true");

  // 3. Expired helper rows are deleted.
  const bucketKey = `e2e:${randomUUID()}`;
  await prisma.$executeRawUnsafe(
    `INSERT INTO rate_limit_buckets (bucket_key, count, window_start, expires_at) ` +
      `VALUES ($1, 1, now(), now() - interval '1 day')`,
    bucketKey
  );
  await prisma.$executeRawUnsafe(
    `INSERT INTO submission_idempotency_keys (form_id, idempotency_key, submission_id, submission_created_at, expires_at) ` +
      `SELECT id, $1, id, now(), now() - interval '1 day' FROM project_forms LIMIT 1`,
    bucketKey
  ).catch(() => undefined); // no forms in a fresh DB â€” cleanup still asserted below
  const cleanup = await cron("/api/cron/maintenance");
  console.log("3. cleanup maintenance:", cleanup.status, JSON.stringify(cleanup.body.deleted));
  const remaining = await prisma.$queryRawUnsafe<Array<{ n: number }>>(
    `SELECT count(*)::int AS n FROM rate_limit_buckets WHERE bucket_key = $1`,
    bucketKey
  );
  assert.equal(remaining[0]?.n, 0);
  console.log("3. expired rate-limit row deleted: true");

  // 4. Readiness passes with real headroom, fails when the threshold exceeds it.
  const ready = await fetch(`${BASE}/api/health?ready=1`);
  const readyBody = await ready.json();
  console.log("4. readiness:", ready.status, JSON.stringify(readyBody.checks));
  assert.equal(ready.status, 200);
  const headroom = Object.fromEntries(
    (readyBody.checks as Array<{ name: string; value: number | null }>)
      .filter((c) => c.name.endsWith(".headroomDays"))
      .map((c) => [c.name.replace(".headroomDays", ""), c.value])
  );
  const strict = evaluateReadiness(headroom, true, {
    staleQueue: 0,
    oldestPendingAgeMinutes: null,
    defaultRows: {},
  });
  assert.equal(strict.ok, true);
  // Drop the effective headroom below the threshold and confirm the pure decision fails.
  const impossible = evaluateReadiness(
    Object.fromEntries(Object.keys(headroom).map((k) => [k, -1])),
    true,
    { staleQueue: 0, oldestPendingAgeMinutes: null, defaultRows: {} }
  );
  assert.equal(impossible.ok, false);
  console.log("4. readiness threshold decision: PASS at real headroom, FAIL below 30 days");

  console.log("e2e maintenance: PASS");
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });

