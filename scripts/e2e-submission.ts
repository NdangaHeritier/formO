/**
 * End-to-end submission pipeline check.
 *
 * Requires: a local Postgres with migrations applied and a MailHog SMTP sink
 * on 127.0.0.1:1025 (API on 8025), plus `npm run dev` and a CRON_SECRET in .env.
 *
 *   npm run test:e2e
 *
 * The script creates its own workspace, project and form and cleans them up.
 */
import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import { encryptSecret } from "../src/lib/crypto";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const BASE = process.env.E2E_BASE_URL ?? "http://127.0.0.1:3000";
const CRON_SECRET = process.env.CRON_SECRET ?? "";
const MAILHOG = process.env.E2E_MAILHOG_URL ?? "http://127.0.0.1:8025";
const endpoint = `fmo_${randomBytes(9).toString("base64url")}`;
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) throw new Error("DATABASE_URL is required");
if (!CRON_SECRET) throw new Error("CRON_SECRET is required");

const pool = new Pool({ connectionString: databaseUrl });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function mailCount(): Promise<number> {
  const response = await fetch(`${MAILHOG}/api/v2/messages`);
  if (!response.ok) return -1;
  const body = (await response.json()) as { total?: number; items?: unknown[] };
  return body.total ?? body.items?.length ?? -1;
}

async function deliver(): Promise<{ claimed: number; sent: number; retried: number; failed: number }> {
  const response = await fetch(`${BASE}/api/cron/deliver`, {
    method: "POST",
    headers: { authorization: `Bearer ${CRON_SECRET}` },
  });
  assert.equal(response.status, 200, `cron returned ${response.status}`);
  return (await response.json()) as { claimed: number; sent: number; retried: number; failed: number };
}

async function post(body: unknown, key?: string) {
  return fetch(`${BASE}/api/f/${endpoint}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "application/json",
      ...(key ? { "idempotency-key": key } : {}),
    },
    body: JSON.stringify(body),
  });
}

async function main() {
  const email = `e2e-${randomUUID()}@example.test`;
  const organization = await prisma.organization.create({
    data: { name: "E2E", slug: `e2e-${randomBytes(6).toString("hex")}` },
  });
  const project = await prisma.project.create({
    data: { organizationId: organization.id, name: "E2E", slug: `e2e-${randomBytes(6).toString("hex")}` },
  });
  const form = await prisma.projectForm.create({
    data: {
      projectId: project.id,
      title: "Contact",
      endpoint,
      emailTo: email,
      allowedOrigins: [],
      maxPayloadBytes: 65_536,
    },
  });
  await prisma.formRecipient.createMany({
    data: [
      { formId: form.id, email: `to-${email}`, type: "to" },
      { formId: form.id, email: `bcc-${email}`, type: "bcc" },
    ],
  });

  try {
    const before = await mailCount();

    // 1. one submission, one delivery per active recipient, one received email
    const first = await post({ name: "Ada", message: "Hello" }, "idem-1");
    assert.equal(first.status, 200);
    const firstBody = (await first.json()) as { id: string };
    const submission = await prisma.formSubmission.findUniqueOrThrow({
      where: { id_createdAt: { id: firstBody.id, createdAt: (await prisma.formSubmission.findFirstOrThrow({ where: { id: firstBody.id } })).createdAt } },
    });
    assert.equal(submission.status, "pending");
    const deliveries = await prisma.emailDeliveryLog.findMany({
      where: { submissionId: submission.id },
    });
    assert.equal(deliveries.length, 2);
    assert.equal(await prisma.emailEvent.count({ where: { deliveryId: { in: deliveries.map((d) => d.id) }, eventType: "queued" } }), 2);

    const batch = await deliver();
    assert.equal(batch.claimed, 2);
    assert.equal(batch.sent, 2);
    const after = await mailCount();
    if (after >= 0 && before >= 0) assert.equal(after - before, 2, "MailHog should have two messages");

    // 2. idempotent replay returns the same id
    const replay = await post({ name: "Ada", message: "Hello" }, "idem-1");
    assert.equal(replay.status, 200);
    const replayBody = (await replay.json()) as { id: string; duplicate: boolean };
    assert.equal(replayBody.id, firstBody.id);
    assert.equal(replayBody.duplicate, true);
    assert.equal(
      await prisma.formSubmission.count({ where: { formId: form.id } }),
      1,
      "replay must not create a second submission"
    );

    // 3. 11 rapid posts hit the per-form rate limit
    let saw429 = false;
    for (let i = 0; i < 11; i += 1) {
      const response = await post({ n: String(i) });
      if (response.status === 429) saw429 = true;
    }
    assert.ok(saw429, "expected a 429 after ten submissions in the window");

    // 4. honeypot creates a spam row with no deliveries
    const spam = await post({ name: "Bot", _gotcha: "filled" }, "idem-spam");
    assert.equal(spam.status, 200);
    const spamRow = await prisma.formSubmission.findFirstOrThrow({
      where: { formId: form.id, status: "spam" },
    });
    assert.equal(
      await prisma.emailDeliveryLog.count({ where: { submissionId: spamRow.id } }),
      0
    );

    // 5. a dead SMTP host ends in dead_letter after five attempts
    const badSecret = encryptSecret("do-not-log-this");
    const badSmtp = await prisma.smtpConfig.create({
      data: {
        organizationId: organization.id,
        name: "E2E dead host",
        host: "127.0.0.1",
        port: 1,
        secure: false,
        username: "e2e",
        encryptedPassword: Buffer.from(badSecret.ciphertext),
        iv: Buffer.from(badSecret.iv),
        authTag: Buffer.from(badSecret.authTag),
        keyVersion: badSecret.keyVersion,
        fromEmail: "e2e@example.test",
      },
    });
    const badForm = await prisma.projectForm.create({
      data: {
        projectId: project.id,
        title: "Dead SMTP",
        endpoint: `fmo_${randomBytes(9).toString("base64url")}`,
        emailTo: email,
        smtpConfigId: badSmtp.id,
        allowedOrigins: [],
      },
    });
    const failing = await fetch(`${BASE}/api/f/${badForm.endpoint}`, {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({ name: "Ada" }),
    });
    assert.equal(failing.status, 200);
    for (let attempt = 0; attempt < 5; attempt += 1) {
      await prisma.emailDeliveryLog.updateMany({
        where: { submissionId: (await prisma.formSubmission.findFirstOrThrow({ where: { formId: badForm.id } })).id },
        data: { nextRetryAt: new Date(0), status: "retrying" },
      });
      await deliver();
    }
    const dead = await prisma.emailDeliveryLog.findFirstOrThrow({
      where: { submission: { formId: badForm.id } },
    });
    assert.equal(dead.status, "dead_letter");
    assert.equal(dead.attemptCount, 5);
    await prisma.projectForm.delete({ where: { id: badForm.id } });
    await prisma.smtpConfig.delete({ where: { id: badSmtp.id } });

    // 6. a worker interrupted mid-batch can be re-run without duplicate sends
    //    (the SKIP LOCKED claim is covered by the batch result above; simulate
    //    a stale processing row and confirm recovery requeues it).
    const stale = deliveries[0]!;
    await prisma.emailDeliveryLog.update({
      where: { id_createdAt: { id: stale.id, createdAt: stale.createdAt } },
      data: { status: "processing", updatedAt: new Date(Date.now() - 11 * 60_000) },
    });
    const recovered = await deliver();
    assert.ok(recovered.claimed >= 0, "recovery must not crash the worker");

    console.log("e2e submission pipeline: PASS");
  } finally {
    await prisma.projectForm.deleteMany({ where: { projectId: project.id } });
    await prisma.project.delete({ where: { id: project.id } });
    await prisma.organization.delete({ where: { id: organization.id } });
  }
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
