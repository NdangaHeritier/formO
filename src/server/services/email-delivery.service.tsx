import nodemailer from "nodemailer";
import { render } from "@react-email/render";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { decryptSecret } from "@/lib/crypto";
import FormSubmission from "@/emailTemplates/dev/FormSubmission";

export const MAX_DELIVERY_ATTEMPTS = 5;

type DeliveryRecipient = {
  email: string;
  type: "to" | "cc" | "bcc";
};

type DeliveryWithContext = Prisma.EmailDeliveryLogGetPayload<{
  include: {
    submission: {
      include: {
        form: {
          include: {
            project: { include: { organization: { select: { name: true } } } };
            smtpConfig: true;
            emailTemplate: true;
          };
        };
      };
    };
  };
}>;

type MailResult = {
  messageId?: string;
  response?: string;
};

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character] ?? character;
  });
}

function primitiveToString(value: Prisma.JsonValue | undefined): string {
  if (value === undefined || value === null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return JSON.stringify(value);
}

function lookupSubmissionValue(
  data: Prisma.JsonValue,
  key: string,
  forHtml: boolean
): string {
  if (typeof data !== "object" || data === null || Array.isArray(data)) return "";

  let value: Prisma.JsonValue | undefined = (data as Prisma.JsonObject)[key];
  if (value === undefined) {
    value = key.split(".").reduce<Prisma.JsonValue | undefined>(
      (current, segment) =>
        typeof current === "object" && current !== null && !Array.isArray(current)
          ? (current as Prisma.JsonObject)[segment]
          : undefined,
      data
    );
  }
  if (value === undefined) return "";
  const text = primitiveToString(value);
  return forHtml ? escapeHtml(text) : text;
}

function renderSubject(delivery: DeliveryWithContext): string {
  const { form } = delivery.submission;
  const template =
    form.customSubject || form.emailTemplate?.subjectTemplate || `New submission — ${form.title}`;

  return sanitizedSubject(template.replace(/\{\{\s*([\w.-]+)\s*\}\}/g, (_match, token: string) => {
    if (token === "form.title") return form.title;
    if (token === "form.id") return form.id;
    if (token === "site.name") return form.project.organization.name;
    if (token === "submission.id") return delivery.submission.id;
    if (token === "submission.createdAt") return delivery.submission.createdAt.toISOString();
    const key = token.startsWith("submission.") ? token.slice("submission.".length) : token;
    return lookupSubmissionValue(delivery.submission.data, key, false);
  }));
}

export function sanitizedSubject(subject: string): string {
  return subject.replace(/[\r\n]+/g, " ").trim().slice(0, 200);
}

async function createTransport(smtp: NonNullable<DeliveryWithContext["submission"]["form"]["smtpConfig"]>) {
  const password = decryptSecret({
    ciphertext: smtp.encryptedPassword,
    iv: smtp.iv,
    authTag: smtp.authTag,
    keyVersion: smtp.keyVersion,
  });

  return nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.secure,
    auth: { user: smtp.username, pass: password },
    connectionTimeout: 8_000,
    greetingTimeout: 8_000,
    socketTimeout: 10_000,
  });
}

async function deliverToRecipient(delivery: DeliveryWithContext): Promise<MailResult> {
  const { submission } = delivery;
  const { form } = submission;
  const smtp = form.smtpConfig;

  if (!smtp) {
    throw new Error("Form has no SMTP configuration assigned");
  }

  const transporter = await createTransport(smtp);
  const data =
    typeof submission.data === "object" && submission.data !== null && !Array.isArray(submission.data)
      ? Object.fromEntries(
          Object.entries(submission.data).map(([key, value]) => [key, primitiveToString(value)])
        )
      : {};

  let html: string;
  if (form.emailTemplate) {
    html = form.emailTemplate.htmlTemplate.replace(/\{\{\s*([\w.-]+)\s*\}\}/g, (_match, token: string) => {
      if (token === "form.title") return escapeHtml(form.title);
      if (token === "form.id") return form.id;
      if (token === "site.name") return escapeHtml(form.project.organization.name);
      if (token === "submission.id") return submission.id;
      if (token === "submission.createdAt") return submission.createdAt.toISOString();
      const key = token.startsWith("submission.") ? token.slice("submission.".length) : token;
      return lookupSubmissionValue(submission.data, key, true);
    });
  } else {
    html = await render(
      <FormSubmission formName={form.title} emailTo={delivery.recipientEmail} data={data} />
    );
  }

  const text = Object.entries(data)
    .map(([key, value]) => `${key}: ${value}`)
    .join("\n");

  const replyToValue = form.replyToField ? data[form.replyToField] : undefined;
  const replyTo =
    replyToValue && /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(replyToValue)
      ? replyToValue
      : undefined;
  const subject = renderSubject(delivery);

  return transporter.sendMail({
    from: smtp.fromEmail,
    to: delivery.recipientEmail,
    subject,
    html,
    text,
    ...(replyTo ? { replyTo } : {}),
  });
}

export function retryDelayMinutes(attempt: number): number {
  return Math.min(15 * 2 ** Math.max(0, attempt - 1), 240);
}

async function incrementDailyStat(
  formId: string,
  field: "acceptedCount" | "sentCount" | "failedCount" | "spamCount"
) {
  const today = new Date();
  const statDate = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));

  await prisma.formDailyStat.upsert({
    where: { formId_statDate: { formId, statDate } },
    create: { formId, statDate, [field]: 1 },
    update: { [field]: { increment: 1 } },
  });
}

/** Updates the parent submission from the state of all recipient deliveries. */
async function synchronizeSubmission(submissionId: string, submissionCreatedAt: Date) {
  const deliveries = await prisma.emailDeliveryLog.findMany({
    where: { submissionId, submissionCreatedAt },
    select: { status: true, errorMessage: true },
  });

  if (deliveries.length === 0) return;

  const allSent = deliveries.every((delivery) => delivery.status === "sent");
  const hasDeadLetter = deliveries.some((delivery) => delivery.status === "dead_letter");
  const status = allSent ? "sent" : hasDeadLetter ? "failed" : "pending";
  const error = deliveries.find((delivery) => delivery.errorMessage)?.errorMessage ?? null;

  await prisma.formSubmission.updateMany({
    where: { id: submissionId, createdAt: submissionCreatedAt },
    data: {
      status,
      sentAt: allSent ? new Date() : null,
      errorMessage: status === "pending" ? null : error,
    },
  });
}

/**
 * Creates one durable delivery per active recipient. Each recipient is emailed
 * independently, so CC/BCC members are not accidentally expanded into a To header.
 */
export async function queueSubmissionEmails(
  submission: { id: string; createdAt: Date },
  recipients: DeliveryRecipient[],
  tx: Prisma.TransactionClient
): Promise<number> {
  if (recipients.length === 0) return 0;

  const now = new Date();
  for (const recipient of recipients) {
    const delivery = await tx.emailDeliveryLog.create({
      data: {
        submissionId: submission.id,
        submissionCreatedAt: submission.createdAt,
        recipientEmail: recipient.email,
        status: "pending",
        nextRetryAt: now,
      },
      select: { id: true, createdAt: true },
    });
    await tx.emailEvent.create({
      data: {
        deliveryId: delivery.id,
        deliveryCreatedAt: delivery.createdAt,
        eventType: "queued",
      },
    });
  }

  return recipients.length;
}

/**
 * Processes pending/retrying deliveries with atomic claims and bounded retries.
 * Delivery is at-least-once by design; SMTP cannot provide exactly-once semantics
 * without a provider idempotency facility.
 */
export async function processEmailDeliveries(options?: { batchSize?: number; submissionId?: string }) {
  const batchSize = Math.min(Math.max(options?.batchSize ?? 20, 1), 100);
  const staleBefore = new Date(Date.now() - 15 * 60_000);

  // A previous serverless invocation may have died between claiming and sending.
  await prisma.emailDeliveryLog.updateMany({
    where: { status: "processing", updatedAt: { lt: staleBefore } },
    data: { status: "retrying" },
  });

  const candidates = await prisma.emailDeliveryLog.findMany({
    where: {
      status: { in: ["pending", "retrying"] },
      nextRetryAt: { lte: new Date() },
      attemptCount: { lt: MAX_DELIVERY_ATTEMPTS },
      ...(options?.submissionId ? { submissionId: options.submissionId } : {}),
      // Queue entries before SMTP setup remain durable and become eligible
      // automatically once a sender is assigned to the form.
      submission: { form: { smtpConfigId: { not: null } } },
    },
    include: {
      submission: {
        include: {
          form: {
            include: {
              project: { include: { organization: { select: { name: true } } } },
              smtpConfig: true,
              emailTemplate: true,
            },
          },
        },
      },
    },
    orderBy: { nextRetryAt: "asc" },
    take: batchSize,
  });

  let sent = 0;
  let retrying = 0;
  let deadLetter = 0;
  let skipped = 0;

  for (const candidate of candidates) {
    const claimed = await prisma.emailDeliveryLog.updateMany({
      where: {
        id: candidate.id,
        createdAt: candidate.createdAt,
        status: { in: ["pending", "retrying"] },
        nextRetryAt: { lte: new Date() },
        attemptCount: { lt: MAX_DELIVERY_ATTEMPTS },
      },
      data: { status: "processing", attemptCount: { increment: 1 } },
    });
    if (claimed.count === 0) {
      skipped += 1;
      continue;
    }

    const attempt = candidate.attemptCount + 1;
    try {
      const result = await deliverToRecipient(candidate);
      const { submissionId, submissionCreatedAt } = candidate;
      await prisma.$transaction([
        prisma.emailDeliveryLog.update({
          where: {
            id_createdAt: { id: candidate.id, createdAt: candidate.createdAt },
          },
          data: {
            status: "sent",
            providerMessageId: result.messageId ?? null,
            smtpResponse: result.response ?? null,
            errorMessage: null,
          },
        }),
        prisma.emailEvent.create({
          data: {
            deliveryId: candidate.id,
            deliveryCreatedAt: candidate.createdAt,
            eventType: "sent",
            metadata: { providerMessageId: result.messageId ?? null },
          },
        }),
      ]);
      await incrementDailyStat(candidate.submission.formId, "sentCount");
      await synchronizeSubmission(submissionId, submissionCreatedAt);
      sent += 1;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown SMTP error";
      const isFinal = attempt >= MAX_DELIVERY_ATTEMPTS;
      const nextStatus = isFinal ? "dead_letter" : "retrying";
      await prisma.emailDeliveryLog.update({
        where: { id_createdAt: { id: candidate.id, createdAt: candidate.createdAt } },
        data: {
          status: nextStatus,
          errorMessage: message.slice(0, 1_000),
          nextRetryAt: new Date(Date.now() + retryDelayMinutes(attempt) * 60_000),
          smtpResponse:
            typeof error === "object" && error !== null && "response" in error
              ? String(error.response).slice(0, 1_000)
              : null,
        },
      });
      if (isFinal) {
        await incrementDailyStat(candidate.submission.formId, "failedCount");
        deadLetter += 1;
      } else {
        retrying += 1;
      }
      await synchronizeSubmission(candidate.submissionId, candidate.submissionCreatedAt);
    }
  }

  return { candidates: candidates.length, sent, retrying, deadLetter, skipped };
}
