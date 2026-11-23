import nodemailer, { type Transporter } from "nodemailer";
import type { Prisma } from "@/generated/prisma/client";
import { decryptSecret } from "@/lib/crypto";
import { connectionTarget, resolveSmtpEndpoint } from "@/lib/smtp-guard";
import { getServerEnv } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { selectDeliverySender } from "./smtp-selection";
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
  /** Age of the oldest eligible delivery, for monitoring. Null when queue empty. */
  oldestPendingAgeMinutes: number | null;
};

type ClaimRow = {
  id: string;
  created_at: Date;
  submission_id: string | null;
  submission_created_at: Date | null;
  message_id: string | null;
  contact_id: string | null;
  recipient_email: string;
  attempt_count: number;
};

type DeliveryContext = Prisma.FormSubmissionGetPayload<{
  include: {
    form: {
      include: {
        project: {
          include: {
            organization: {
              select: {
                name: true;
                smtpConfigs: { where: { isSystemDefault: true }; take: 1 };
              };
            };
          };
        };
        smtpConfig: true;
        emailTemplate: true;
      };
    };
  };
}>;

type MessageContext = Prisma.OutboundMessageGetPayload<{
  include: {
    organization: {
      select: {
        name: true;
        smtpConfigs: { where: { isSystemDefault: true }; take: 1 };
      };
    };
  };
}>;

/** Broadcast content is snapshotted at enqueue; only the header is re-scrubbed. */
export function messageMailContent(message: {
  subject: string;
  htmlBody: string;
  textBody: string | null;
}) {
  return {
    subject: stripCrlf(message.subject).trim(),
    html: message.htmlBody,
    text: message.textBody ?? "",
  };
}

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
              d.message_id,
              d.contact_id,
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
  /** Validated address to dial and the hostname TLS must verify. */
  target?: { host: string; servername?: string };
}) {
  return {
    host: stripCrlf(config.target?.host ?? config.host),
    port: config.port,
    secure: config.secure,
    auth: { user: stripCrlf(config.username), pass: config.password },
    ...(config.target?.servername ? { tls: { servername: config.target.servername } } : {}),
    connectionTimeout: 8_000,
    greetingTimeout: 8_000,
    socketTimeout: 12_000,
  };
}

/**
 * Message-ID domain for a From header. `.local` is not resolvable and does not
 * match the sending domain, which weakens receiver-side deduplication of
 * at-least-once retries.
 */
export function messageIdDomain(from: string): string {
  const match = /@([A-Za-z0-9.-]+)/.exec(from);
  const candidate = match?.[1]?.replace(/[>.]+$/, "").toLowerCase();
  const valid =
    candidate !== undefined &&
    /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/.test(candidate);
  return valid ? candidate : "formo.local";
}

/**
 * Builds (and validates) one transporter. The socket always opens against an
 * address that passed the SSRF guard, and TLS still verifies the configured
 * hostname, closing the resolve-then-connect window.
 */
export async function createSmtpTransporter(sender: SmtpSender | null): Promise<Transporter> {
  const env = getServerEnv();
  const config = sender
    ? {
        host: sender.host,
        port: sender.port,
        secure: sender.secure,
        username: sender.username,
        password: decryptSecret({
          ciphertext: sender.encryptedPassword,
          iv: sender.iv,
          authTag: sender.authTag,
          keyVersion: sender.keyVersion,
        }),
      }
    : {
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        secure: env.SMTP_SECURE === "true",
        username: env.SMTP_USER ?? "",
        password: env.SMTP_PASS ?? "",
      };

  const endpoint = await resolveSmtpEndpoint(config.host, config.port, {
    allowLocal: env.FORMO_ALLOW_LOCAL_SMTP,
  });

  return nodemailer.createTransport(
    transporterOptions({ ...config, target: connectionTarget(endpoint) })
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

/** Shared by the delivery worker, the test-send route and workspace SMTP setup. */
export async function getCachedTransporter(
  cache: Map<string, Transporter>,
  smtp: SmtpSender | null
): Promise<Transporter> {
  const key = smtp?.id ?? "system";
  let transporter = cache.get(key);
  if (!transporter) {
    transporter = await createSmtpTransporter(smtp);
    cache.set(key, transporter);
  }
  return transporter;
}

function buildContext(delivery: DeliveryContext): RenderContext {
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

/** True only for a permanent (do-not-retry) SMTP failure. */
function classify(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false;
  const code = "responseCode" in error ? Number(error.responseCode) : NaN;
  if (code >= 550 && code <= 554) return true;
  // Name comes from Error.name for our own guard errors, which are permanent.
  if (error instanceof Error && error.name === "SmtpEndpointError") return true;
  const name = "code" in error ? String(error.code) : "";
  const message = "message" in error ? String(error.message) : "";
  return name === "EINVAL" || /invalid.{0,20}(address|recipient)|no recipients/i.test(message);
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

/** Roll up a broadcast once every recipient reached a terminal state. */
async function rollUpMessage(messageId: string): Promise<void> {
  const siblings = await prisma.emailDeliveryLog.findMany({
    where: { messageId },
    select: { status: true },
  });
  const decision = decideSubmissionStatus(siblings.map((row) => row.status));
  if (!decision.status) return;

  // A canceled broadcast keeps its status; the worker must not overwrite it.
  await prisma.outboundMessage.updateMany({
    where: { id: messageId, status: { in: ["queued", "sending"] } },
    data: {
      status: decision.status,
      ...(decision.setSentAt ? { sentAt: new Date() } : {}),
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
  const result: DeliveryBatchResult = {
    claimed: 0,
    sent: 0,
    retried: 0,
    failed: 0,
    oldestPendingAgeMinutes: null,
  };
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

        let context: RenderContext | null = null;
        let delivery: DeliveryContext | null = null;
        let message: MessageContext | null = null;
        let sender: (SmtpSender & { fromEmail: string }) | null = null;

        if (row.submission_id && row.submission_created_at) {
          delivery = await prisma.formSubmission.findUnique({
            where: {
              id_createdAt: { id: row.submission_id, createdAt: row.submission_created_at },
            },
            include: {
              form: {
                include: {
                  project: {
                    include: {
                      organization: {
                        select: {
                          name: true,
                          smtpConfigs: { where: { isSystemDefault: true }, take: 1 },
                        },
                      },
                    },
                  },
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
          context = buildContext(delivery);
          // One pipeline, three tiers: form sender → workspace default → env.
          sender = selectDeliverySender(
            delivery.form.smtpConfig,
            delivery.form.project.organization.smtpConfigs[0]
          );
        } else if (row.message_id) {
          message = await prisma.outboundMessage.findUnique({
            where: { id: row.message_id },
            include: {
              organization: {
                select: {
                  name: true,
                  smtpConfigs: { where: { isSystemDefault: true }, take: 1 },
                },
              },
            },
          });
          if (!message) {
            result.failed += 1;
            continue;
          }
          // Broadcasts have no form-level sender: workspace default → env.
          sender = selectDeliverySender(null, message.organization.smtpConfigs[0]);
          await prisma.outboundMessage.updateMany({
            where: { id: row.message_id, status: "queued" },
            data: { status: "sending" },
          });
        } else {
          // A delivery with no parent violates the XOR constraint; skip it.
          result.failed += 1;
          continue;
        }

        const key = {
          id_createdAt: { id: row.id, createdAt: row.created_at },
        };

        try {
          const transporter = await getCachedTransporter(transporters, sender);
          const mail = message
            ? { ...messageMailContent(message), replyTo: undefined }
            : {
                ...(await renderEmail(context!)),
                subject: renderSubject(context!),
                replyTo: delivery?.form.replyToField
                  ? isSingleValidEmail(context!.data[delivery.form.replyToField])
                  : undefined,
              };

          // Delivery is at-least-once, not exactly-once: a worker killed after
          // SMTP accepted the message but before the database recorded it will
          // resend after the 10-minute stale-claim recovery. A stable Message-ID
          // lets receiving servers deduplicate those retries.
          const from = stripCrlf(sender?.fromEmail ?? getServerEnv().SMTP_FROM);
          const info = await transporter.sendMail({
            from,
            to: stripCrlf(row.recipient_email),
            subject: stripCrlf(mail.subject),
            html: mail.html,
            text: mail.text,
            messageId: `<${row.id}@${messageIdDomain(from)}>`,
            ...(mail.replyTo ? { replyTo: stripCrlf(mail.replyTo) } : {}),
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
          if (delivery) await incrementStat(delivery.form.id, "sentCount");
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
          const errorMessage = safeErrorText(error);

          await prisma.$transaction(async (tx) => {
            await tx.emailDeliveryLog.update({
              where: key,
              data: {
                status,
                errorMessage,
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
            if (delivery) await incrementStat(delivery.form.id, "failedCount");
            result.failed += 1;
          } else {
            result.retried += 1;
          }
        } finally {
          if (row.submission_id && row.submission_created_at) {
            await rollUpSubmission(row.submission_id, row.submission_created_at);
          } else if (row.message_id) {
            await rollUpMessage(row.message_id);
          }
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

  const oldest = await prisma.emailDeliveryLog.findFirst({
    where: { status: { in: ["pending", "retrying"] } },
    orderBy: { nextRetryAt: "asc" },
    select: { nextRetryAt: true },
  });
  result.oldestPendingAgeMinutes = oldest
    ? Math.max(0, Math.floor((Date.now() - oldest.nextRetryAt.getTime()) / 60_000))
    : null;

  return result;
}
