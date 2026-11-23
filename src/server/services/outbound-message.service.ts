import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { dedupeEmails, dedupeIds } from "@/lib/non-dev/recipients";
import { decodeCursor, encodeCursor } from "@/lib/validation/query";
import { stripCrlf } from "@/server/submissions/render-email";
import { HttpError } from "@/server/auth/authorization";

const messageSelect = {
  id: true,
  name: true,
  subject: true,
  status: true,
  scheduledAt: true,
  sentAt: true,
  createdAt: true,
  updatedAt: true,
  _count: { select: { deliveries: true } },
} satisfies Prisma.OutboundMessageSelect;

type MessageRow = Prisma.OutboundMessageGetPayload<{ select: typeof messageSelect }>;

function project(row: MessageRow, counts?: Record<string, number>) {
  return {
    id: row.id,
    name: row.name,
    subject: row.subject,
    status: row.status,
    scheduledAt: row.scheduledAt?.toISOString() ?? null,
    sentAt: row.sentAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    recipientCount: row._count.deliveries,
    sentCount: counts?.sent ?? 0,
    failedCount: (counts?.failed ?? 0) + (counts?.dead_letter ?? 0),
  };
}

async function scopedMessage(organizationId: string, id: string) {
  const message = await prisma.outboundMessage.findFirst({
    where: { id, organizationId },
    select: messageSelect,
  });
  if (!message) throw new HttpError(404, "Message not found");
  return message;
}

export async function listMessages(params: {
  organizationId: string;
  status?: "draft" | "queued" | "sending" | "sent" | "failed" | "canceled";
  limit: number;
  cursor?: string;
}) {
  const cursor = decodeCursor(params.cursor);
  if (params.cursor && !cursor) throw new HttpError(400, "Invalid cursor");
  const cursorDate = cursor ? new Date(cursor.createdAt) : null;

  const where: Prisma.OutboundMessageWhereInput = {
    organizationId: params.organizationId,
    ...(params.status ? { status: params.status } : {}),
    ...(cursor && cursorDate
      ? {
          OR: [
            { createdAt: { lt: cursorDate } },
            { createdAt: cursorDate, id: { lt: cursor.id } },
          ],
        }
      : {}),
  };

  const rows = await prisma.outboundMessage.findMany({
    where,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: params.limit + 1,
    select: messageSelect,
  });
  const total = await prisma.outboundMessage.count({ where });

  const hasMore = rows.length > params.limit;
  const page = rows.slice(0, params.limit);
  const grouped = await prisma.emailDeliveryLog.groupBy({
    by: ["messageId", "status"],
    where: { messageId: { in: page.map((row) => row.id) } },
    _count: { _all: true },
  });
  const countsByMessage = new Map<string, Record<string, number>>();
  for (const entry of grouped) {
    if (!entry.messageId) continue;
    const counts = countsByMessage.get(entry.messageId) ?? {};
    counts[entry.status] = entry._count._all;
    countsByMessage.set(entry.messageId, counts);
  }

  const last = page.at(-1);
  return {
    items: page.map((row) => project(row, countsByMessage.get(row.id))),
    total,
    hasMore,
    nextCursor:
      hasMore && last
        ? encodeCursor({ createdAt: last.createdAt.toISOString(), id: last.id })
        : null,
  };
}

export async function getMessage(id: string, organizationId: string) {
  const message = await scopedMessage(organizationId, id);
  const deliveries = await prisma.emailDeliveryLog.findMany({
    where: { messageId: id },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    select: {
      id: true,
      recipientEmail: true,
      status: true,
      attemptCount: true,
      nextRetryAt: true,
      errorMessage: true,
      createdAt: true,
      contact: { select: { id: true, name: true } },
    },
  });
  return {
    ...project(message),
    deliveries: deliveries.map((delivery) => ({
      id: delivery.id,
      recipientEmail: delivery.recipientEmail,
      status: delivery.status,
      attemptCount: delivery.attemptCount,
      nextRetryAt: delivery.nextRetryAt.toISOString(),
      errorMessage: delivery.errorMessage,
      createdAt: delivery.createdAt.toISOString(),
      contact: delivery.contact
        ? { id: delivery.contact.id, name: delivery.contact.name }
        : null,
    })),
  };
}

export async function createMessage(params: {
  organizationId: string;
  actorUserId: string;
  input: {
    name: string;
    subject: string;
    htmlBody: string;
    textBody?: string;
    templateId?: string | null;
    contactIds: string[];
    listIds: string[];
    emails: string[];
    scheduledAt?: string | null;
  };
}) {
  const { organizationId, actorUserId, input } = params;
  const contactIds = dedupeIds(input.contactIds);
  const listIds = dedupeIds(input.listIds);

  if (input.templateId) {
    const template = await prisma.emailTemplate.findFirst({
      where: { id: input.templateId, organizationId },
      select: { id: true },
    });
    if (!template) throw new HttpError(400, "Template not found in this workspace");
  }
  if (contactIds.length > 0) {
    const found = await prisma.contact.count({
      where: { id: { in: contactIds }, organizationId },
    });
    if (found !== contactIds.length) {
      throw new HttpError(400, "One or more contacts were not found in this workspace");
    }
  }
  if (listIds.length > 0) {
    const found = await prisma.contactList.count({
      where: { id: { in: listIds }, organizationId },
    });
    if (found !== listIds.length) {
      throw new HttpError(400, "One or more lists were not found in this workspace");
    }
  }

  const contacts = await prisma.contact.findMany({
    where: {
      organizationId,
      isActive: true,
      OR: [
        ...(contactIds.length > 0 ? [{ id: { in: contactIds } }] : []),
        ...(listIds.length > 0 ? [{ lists: { some: { listId: { in: listIds } } } }] : []),
      ],
    },
    select: { id: true, email: true },
  });
  const contactByEmail = new Map(contacts.map((contact) => [contact.email.toLowerCase(), contact.id]));
  const recipients = dedupeEmails([
    ...contacts.map((contact) => contact.email),
    ...input.emails,
  ]);
  if (recipients.length === 0) {
    throw new HttpError(400, "No active recipients matched the selected audience");
  }

  const scheduledAt = input.scheduledAt ? new Date(input.scheduledAt) : null;
  if (scheduledAt && Number.isNaN(scheduledAt.getTime())) {
    throw new HttpError(400, "Invalid schedule time");
  }

  const message = await prisma.$transaction(async (tx) => {
    const created = await tx.outboundMessage.create({
      data: {
        organizationId,
        createdById: actorUserId,
        templateId: input.templateId ?? null,
        name: input.name.trim(),
        // Subject is a mail header: never allow embedded line breaks.
        subject: stripCrlf(input.subject).trim(),
        htmlBody: input.htmlBody,
        textBody: input.textBody ?? null,
        status: "queued",
        scheduledAt,
      },
      select: messageSelect,
    });
    await tx.emailDeliveryLog.createMany({
      data: recipients.map((email) => ({
        messageId: created.id,
        recipientEmail: email,
        contactId: contactByEmail.get(email.toLowerCase()) ?? null,
        status: "pending" as const,
        nextRetryAt: scheduledAt ?? new Date(),
      })),
    });
    await tx.auditLog.create({
      data: {
        organizationId,
        actorUserId,
        action: "message.created",
        targetType: "outbound_message",
        targetId: created.id,
        metadata: { name: created.name, recipientCount: recipients.length },
      },
    });
    return created;
  });

  return getMessage(message.id, organizationId);
}

export async function cancelMessage(params: {
  id: string;
  organizationId: string;
  actorUserId: string;
}) {
  const { id, organizationId, actorUserId } = params;
  const message = await scopedMessage(organizationId, id);
  if (message.status !== "queued") {
    throw new HttpError(409, "Only queued messages can be canceled", { code: "CONFLICT" });
  }

  return prisma.$transaction(async (tx) => {
    await tx.emailDeliveryLog.updateMany({
      where: {
        messageId: id,
        status: { in: ["pending", "retrying", "processing"] },
      },
      data: {
        status: "failed",
        errorMessage: "Canceled before send",
        nextRetryAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      },
    });
    await tx.outboundMessage.update({ where: { id }, data: { status: "canceled" } });
    await tx.auditLog.create({
      data: {
        organizationId,
        actorUserId,
        action: "message.canceled",
        targetType: "outbound_message",
        targetId: id,
      },
    });
    return getMessage(id, organizationId);
  });
}

export async function retryMessage(params: {
  id: string;
  organizationId: string;
  actorUserId: string;
}) {
  const { id, organizationId, actorUserId } = params;
  const message = await scopedMessage(organizationId, id);
  if (message.status !== "failed" && message.status !== "canceled") {
    throw new HttpError(409, "Only failed or canceled messages can be retried", {
      code: "CONFLICT",
    });
  }

  return prisma.$transaction(async (tx) => {
    await tx.emailDeliveryLog.updateMany({
      where: { messageId: id, status: { in: ["failed", "dead_letter"] } },
      data: {
        status: "retrying",
        attemptCount: 0,
        nextRetryAt: new Date(),
        errorMessage: null,
        smtpResponse: null,
      },
    });
    await tx.outboundMessage.update({
      where: { id },
      data: { status: "queued", sentAt: null },
    });
    await tx.auditLog.create({
      data: {
        organizationId,
        actorUserId,
        action: "message.retried",
        targetType: "outbound_message",
        targetId: id,
      },
    });
    return getMessage(id, organizationId);
  });
}

/** Workspace delivery feed for broadcasts only; no transport/SMTP fields. */
export async function listMessageDeliveries(params: {
  organizationId: string;
  status?: "pending" | "processing" | "sent" | "retrying" | "failed" | "dead_letter";
  messageId?: string;
  limit: number;
}) {
  const rows = await prisma.emailDeliveryLog.findMany({
    where: {
      message: { organizationId: params.organizationId },
      ...(params.status ? { status: params.status } : {}),
      ...(params.messageId ? { messageId: params.messageId } : {}),
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: params.limit,
    select: {
      id: true,
      recipientEmail: true,
      status: true,
      attemptCount: true,
      errorMessage: true,
      createdAt: true,
      message: { select: { id: true, name: true } },
    },
  });
  return {
    deliveries: rows.map((row) => ({
      id: row.id,
      recipientEmail: row.recipientEmail,
      status: row.status,
      attemptCount: row.attemptCount,
      errorMessage: row.errorMessage,
      createdAt: row.createdAt.toISOString(),
      messageId: row.message?.id ?? null,
      messageName: row.message?.name ?? null,
    })),
  };
}
