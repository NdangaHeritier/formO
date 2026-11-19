import nodemailer, { type Transporter } from "nodemailer";
import type { Prisma } from "@/generated/prisma/client";
import { decryptSecret } from "@/lib/crypto";
import { getServerEnv } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import {
  isSingleValidEmail,
  renderEmail,
  renderSubject,
  stripCrlf,
  type RenderContext,
} from "@/server/submissions/render-email";

export const MAX_ATTEMPTS = 5;
export const BACKOFF_MINUTES = [1, 5, 30, 120, 360] as const;
export const BATCH_SIZE = 25;
const TIME_BUDGET_MS = 50_000;
const STALE_PROCESSING_MS = 10 * 60_000;

export type DeliveryBatchResult = {
  claimed: number;
  sent: number;
  retried: number;
  failed: number;
};

type ClaimRow = {
  id: string;
  created_at: Date;
  submission_id: string;
  submission_created_at: Date;
  recipient_email: string;
  attempt_count: number;
};

type DeliveryContext = Prisma.FormSubmissionGetPayload<{
  include: {
    form: {
      include: {
        project: { include: { organization: { select: { name: true } } } };
        smtpConfig: true;
        emailTemplate: true;
      };
    };
  };
}>;

function todayUtc(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

/** Requeues rows orphaned by a worker that died after claiming them. */
async function recoverStaleClaims(): Promise<void> {
  await prisma.emailDeliveryLog.updateMany({
    where: {
      status: "processing",
      updatedAt: { lt: new Date(Date.now() - STALE_PROCESSING_MS) },
    },
    data: { status: "retrying", nextRetryAt: new Date() },
  });
}

/** Atomic SKIP LOCKED claim; overlapping worker runs cannot take the same row. */
async function claimBatch(limit: number): Promise<ClaimRow[]> {
  return prisma.$queryRaw<ClaimRow[]>`
    UPDATE email_deliveries d
    SET status = 'processing',
        attempt_count = d.attempt_count + 1,
        updated_at = now()
    WHERE (d.id, d.created_at) IN (
      SELECT id, created_at FROM email_deliveries
      WHERE status IN ('pending', 'retrying') AND next_retry_at <= now()
      ORDER BY next_retry_at
      LIMIT ${limit}
      FOR UPDATE SKIP LOCKED
    )
    RETURNING d.id,
              d.created_at,
              d.submission_id,
              d.submission_created_at,
              d.recipient_email,
              d.attempt_count::int AS attempt_count;
  `;
}

function transporterOptions(config: {
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password: string;
}) {
  return {
    host: stripCrlf(config.host),
    port: config.port,
    secure: config.secure,
    auth: { user: stripCrlf(config.username), pass: config.password },
    connectionTimeout: 8_000,
    greetingTimeout: 8_000,
    socketTimeout: 12_000,
  };
}

function systemTransporter(): Transporter {
  const env = getServerEnv();
  return nodemailer.createTransport(
    transporterOptions({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE === "true",
      username: env.SMTP_USER ?? "",
      password: env.SMTP_PASS ?? "",
    })
  );
}

export type SmtpSender = {
  id?: string;
  host: string;
  port: number;
  secure: boolean;
  username: string;
  encryptedPassword: Uint8Array;
  iv: Uint8Array;
  authTag: Uint8Array;
  keyVersion: number;
};

/** Shared by the delivery worker and the test-send route. */
export function getCachedTransporter(
  cache: Map<string, Transporter>,
  smtp: SmtpSender | null
): Transporter {
  const key = smtp?.id ?? "system";
  let transporter = cache.get(key);
  if (!transporter) {
    transporter = smtp ? customTransporter(smtp) : systemTransporter();
    cache.set(key, transporter);
  }
  return transporter;
}

function customTransporter(smtp: SmtpSender): Transporter {
  const password = decryptSecret({
    ciphertext: smtp.encryptedPassword,
    iv: smtp.iv,
    authTag: smtp.authTag,
    keyVersion: smtp.keyVersion,
  });
  return nodemailer.createTransport(
    transporterOptions({
      host: smtp.host,
      port: smtp.port,
      secure: smtp.secure,
      username: smtp.username,
      password,
    })
  );
}

function buildContext(delivery: DeliveryContext, recipientEmail: string): RenderContext {
  const { form, id, createdAt } = delivery;
  const data =
    delivery.data !== null && typeof delivery.data === "object" && !Array.isArray(delivery.data)
      ? Object.fromEntries(
          Object.entries(delivery.data as Record<string, unknown>).map(([key, value]) => [
            key,
            value === null || value === undefined ? "" : String(value),
          ])
        )
      : {};

  return {
    data,
    title: form.title,
    formId: form.id,
    organizationName: form.project.organization.name,
    submissionId: id,
    createdAt,
    customSubject: form.customSubject,
    template: form.emailTemplate
      ? {
          subjectTemplate: form.emailTemplate.subjectTemplate,
          htmlTemplate: form.emailTemplate.htmlTemplate,
        }
      : null,
  };
}

function classify(error: unknown): "permanent" | "temporary" {
  if (typeof error !== "object" || error === null) return "temporary";
  const code = "responseCode" in error ? Number(error.responseCode) : NaN;
  if (code >= 550 && code <= 554) return "permanent";
  const name = "code" in error ? String(error.code) : "";
  const message = "message" in error ? String(error.message) : "";
  if (name === "EINVAL" || /invalid.{0,20}(address|recipient)|no recipients/i.test(message)) {
    return "permanent";
  }
  return "temporary";
}

/** Error text is stored verbatim except for CR/LF and an explicit secret scrub. */
function safeErrorText(error: unknown): string {
  let text = error instanceof Error ? error.message : "SMTP delivery failed";
  text = text.replace(/pass(word)?\s*[:=]\s*\S+/gi, "pass=***");
  return stripCrlf(text).slice(0, 500);
}

function responseText(error: unknown): string | null {
  if (typeof error !== "object" || error === null || !("response" in error)) return null;
  return stripCrlf(String(error.response)).slice(0, 500);
}

async function incrementStat(formId: string, field: "sentCount" | "failedCount"): Promise<void> {
  await prisma.formDailyStat.upsert({
    where: { formId_statDate: { formId, statDate: todayUtc() } },
    create: { formId, statDate: todayUtc(), [field]: 1 },
    update: { [field]: { increment: 1 } },
  });
}

export type RollUpDecision = {
  status: "sent" | "failed" | null;
  setSentAt: boolean;
  errorMessage: string | null;
};

/** Pure decision table for the parent submission once siblings are terminal. */
export function decideSubmissionStatus(statuses: string[]): RollUpDecision {
  if (statuses.length === 0) return { status: null, setSentAt: false, errorMessage: null };
  if (statuses.some((status) => ["pending", "processing", "retrying"].includes(status))) {
    return { status: null, setSentAt: false, errorMessage: null };
  }

  const sent = statuses.filter((status) => status === "sent").length;
  const failed = statuses.length - sent;
  return {
    status: sent > 0 ? "sent" : "failed",
    setSentAt: sent > 0,
    errorMessage: failed > 0 ? `${failed} of ${statuses.length} recipients failed` : null,
  };
}

/** Sets the parent submission status once every sibling reached a terminal state. */
async function rollUpSubmission(submissionId: string, submissionCreatedAt: Date): Promise<void> {
  const siblings = await prisma.emailDeliveryLog.findMany({
    where: { submissionId, submissionCreatedAt },
    select: { status: true },
  });
  const decision = decideSubmissionStatus(siblings.map((row) => row.status));
  if (!decision.status) return;

  await prisma.formSubmission.updateMany({
    where: { id: submissionId, createdAt: submissionCreatedAt },
    data: {
      status: decision.status,
      sentAt: decision.setSentAt ? new Date() : null,
      errorMessage: decision.errorMessage,
    },
  });
}

export function retryDelayMinutes(attempt: number): number {
  const index = Math.max(0, Math.min(attempt, BACKOFF_MINUTES.length) - 1);
  return BACKOFF_MINUTES[index] ?? BACKOFF_MINUTES[BACKOFF_MINUTES.length - 1];
}

/**
 * Claims and sends one batch. The caller may invoke this repeatedly until it
 * returns zero claims, subject to an overall time budget.
 */
export async function runDeliveryBatch(): Promise<DeliveryBatchResult> {
  const result: DeliveryBatchResult = { claimed: 0, sent: 0, retried: 0, failed: 0 };
  const deadline = Date.now() + TIME_BUDGET_MS;
  const transporters = new Map<string, Transporter>();

  try {
    for (;;) {
      if (Date.now() >= deadline) break;
      await recoverStaleClaims();
      const claimed = await claimBatch(BATCH_SIZE);
      if (claimed.length === 0) break;
      result.claimed += claimed.length;

      for (const row of claimed) {
        if (Date.now() >= deadline) {
          // Put untouched claims back on the queue instead of waiting for the
          // 10-minute stale-claim recovery.
          await prisma.emailDeliveryLog.updateMany({
            where: {
              id: row.id,
              createdAt: row.created_at,
              status: "processing",
            },
            data: { status: "retrying", nextRetryAt: new Date() },
          });
          continue;
        }

        const delivery = await prisma.formSubmission.findUnique({
          where: { id_createdAt: { id: row.submission_id, createdAt: row.submission_created_at } },
          include: {
            form: {
              include: {
                project: { include: { organization: { select: { name: true } } } },
                smtpConfig: true,
                emailTemplate: true,
              },
            },
          },
        });

        if (!delivery) {
          result.failed += 1;
          continue;
        }

        const context = buildContext(delivery, row.recipient_email);
        const transporter = getCachedTransporter(transporters, delivery.form.smtpConfig);

        const key = {
          id_createdAt: { id: row.id, createdAt: row.created_at },
        };

        try {
          const subject = renderSubject(context);
          const { html, text, oversized } = await renderEmail(context);
          const replyTo = isSingleValidEmail(
            delivery.form.replyToField ? context.data[delivery.form.replyToField] : undefined
          );

          // Delivery is at-least-once, not exactly-once: a worker killed after
          // SMTP accepted the message but before the database recorded it will
          // resend after the 10-minute stale-claim recovery. A stable Message-ID
          // lets receiving servers deduplicate those retries.
          const info = await transporter.sendMail({
            from: stripCrlf(
              delivery.form.smtpConfig?.fromEmail ?? getServerEnv().SMTP_FROM
            ),
            to: stripCrlf(row.recipient_email),
            subject: stripCrlf(subject),
            html,
            text,
            messageId: `<${row.id}@formo.local>`,
            ...(replyTo ? { replyTo: stripCrlf(replyTo) } : {}),
          });

          const smtpResponse = stripCrlf(info.response ?? "").slice(0, 500) || null;
          await prisma.$transaction(async (tx) => {
            await tx.emailDeliveryLog.update({
              where: key,
              data: {
                status: "sent",
                providerMessageId: info.messageId ?? null,
                smtpResponse,
                errorMessage: null,
              },
            });
            await tx.emailEvent.create({
              data: {
                deliveryId: row.id,
                deliveryCreatedAt: row.created_at,
                eventType: "sent",
                metadata: { providerMessageId: info.messageId ?? null },
              },
            });
          });
          await incrementStat(delivery.form.id, "sentCount");
          result.sent += 1;
        } catch (error) {
          const permanent = classify(error);
          if (
            !permanent &&
            typeof error === "object" &&
            error !== null &&
            !("responseCode" in error)
          ) {
            // Countable signal for providers that fail without an SMTP code.
            console.warn("[delivery] retry without SMTP responseCode", {
              deliveryId: row.id,
              attempt: row.attempt_count,
              errorCode: "code" in error ? String(error.code) : "none",
            });
          }
          const dead = permanent || row.attempt_count >= MAX_ATTEMPTS;
          const status = dead ? (permanent ? "failed" : "dead_letter") : "retrying";
          const message = safeErrorText(error);

          await prisma.$transaction(async (tx) => {
            await tx.emailDeliveryLog.update({
              where: key,
              data: {
                status,
                errorMessage: message,
                smtpResponse: responseText(error),
                nextRetryAt: dead
                  ? new Date()
                  : new Date(Date.now() + retryDelayMinutes(row.attempt_count) * 60_000),
              },
            });
            await tx.emailEvent.create({
              data: {
                deliveryId: row.id,
                deliveryCreatedAt: row.created_at,
                eventType: dead ? "bounced" : "queued",
                metadata: { attempt: row.attempt_count },
              },
            });
          });
          if (dead) {
            await incrementStat(delivery.form.id, "failedCount");
            result.failed += 1;
          } else {
            result.retried += 1;
          }
        } finally {
          await rollUpSubmission(row.submission_id, row.submission_created_at);
        }
      }
    }
  } finally {
    await Promise.all(
      [...transporters.values()].map((transporter) =>
        Promise.resolve(transporter.close()).catch(() => undefined)
      )
    );
  }

  return result;
}
