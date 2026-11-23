import type { SubmissionStatus } from "@/generated/prisma/client";
import { decodeCursor, encodeCursor } from "@/lib/validation/query";
import { prisma } from "@/lib/prisma";
import { HttpError } from "@/server/auth/authorization";

const iso = (date: Date | null | undefined) => (date ? date.toISOString() : null);

function hashToHex(value: Uint8Array | null): string | null {
  return value ? Buffer.from(value).toString("hex") : null;
}

export async function listFormSubmissions(params: {
  formId: string;
  organizationId: string;
  status?: SubmissionStatus;
  limit: number;
  cursor?: string;
}) {
  const cursor = decodeCursor(params.cursor);
  if (params.cursor && !cursor) {
    throw new HttpError(400, "Invalid cursor", { code: "BAD_REQUEST" });
  }

  const form = await prisma.projectForm.findFirst({
    where: {
      id: params.formId,
      deletedAt: null,
      project: { organizationId: params.organizationId, deletedAt: null },
    },
    select: { id: true },
  });
  if (!form) throw new HttpError(404, "Form not found");

  const cursorDate = cursor ? new Date(cursor.createdAt) : null;
  const rows = await prisma.formSubmission.findMany({
    where: {
      formId: form.id,
      ...(params.status ? { status: params.status } : {}),
      ...(cursor && cursorDate
        ? {
            OR: [
              { createdAt: { lt: cursorDate } },
              { createdAt: cursorDate, id: { lt: cursor.id } },
            ],
          }
        : {}),
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: params.limit + 1,
    select: {
      id: true,
      formId: true,
      status: true,
      data: true,
      origin: true,
      ipHash: true,
      userAgent: true,
      sentAt: true,
      errorMessage: true,
      createdAt: true,
      _count: { select: { deliveries: true } },
    },
  });

  const hasMore = rows.length > params.limit;
  const page = rows.slice(0, params.limit);
  const last = page.at(-1);
  return {
    items: page.map((row) => ({
      id: row.id,
      formId: row.formId,
      status: row.status,
      data: row.data,
      origin: row.origin,
      ipHash: hashToHex(row.ipHash as Uint8Array | null),
      userAgent: row.userAgent,
      sentAt: iso(row.sentAt),
      errorMessage: row.errorMessage,
      createdAt: iso(row.createdAt),
      deliveryCount: row._count.deliveries,
    })),
    nextCursor:
      hasMore && last
        ? encodeCursor({ createdAt: last.createdAt.toISOString(), id: last.id })
        : null,
    hasMore,
  };
}

export type DeletedFormsScope = "include" | "exclude" | "only";

/**
 * Form/project soft-deletes must not hide submissions from the inbox — hidden
 * records cannot be inspected or deleted by an admin.
 */
function workspaceSubmissionWhere(params: {
  organizationId: string;
  formId?: string;
  status?: SubmissionStatus;
  deletedForms: DeletedFormsScope;
}) {
  return {
    form: {
      project: { organizationId: params.organizationId },
      ...(params.deletedForms === "exclude" ? { deletedAt: null } : {}),
      ...(params.deletedForms === "only" ? { deletedAt: { not: null } } : {}),
      ...(params.formId ? { id: params.formId } : {}),
    },
    ...(params.status ? { status: params.status } : {}),
  };
}

/** Workspace-wide submission list for the developer inbox. */
export async function listWorkspaceSubmissions(params: {
  organizationId: string;
  formId?: string;
  status?: SubmissionStatus;
  deletedForms?: DeletedFormsScope;
  limit: number;
  cursor?: string;
}) {
  const cursor = decodeCursor(params.cursor);
  if (params.cursor && !cursor) {
    throw new HttpError(400, "Invalid cursor", { code: "BAD_REQUEST" });
  }
  const cursorDate = cursor ? new Date(cursor.createdAt) : null;
  const deletedForms = params.deletedForms ?? "exclude";
  const where = workspaceSubmissionWhere({
    organizationId: params.organizationId,
    formId: params.formId,
    status: params.status,
    deletedForms,
  });

  const [rows, total] = await Promise.all([
    prisma.formSubmission.findMany({
      where: {
        ...where,
        ...(cursor && cursorDate
          ? {
              OR: [
                { createdAt: { lt: cursorDate } },
                { createdAt: cursorDate, id: { lt: cursor.id } },
              ],
            }
          : {}),
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: params.limit + 1,
      select: {
        id: true,
        status: true,
        createdAt: true,
        sentAt: true,
        form: {
          select: {
            id: true,
            title: true,
            deletedAt: true,
            project: { select: { name: true, slug: true } },
          },
        },
        _count: { select: { deliveries: true } },
      },
    }),
    prisma.formSubmission.count({ where }),
  ]);

  const hasMore = rows.length > params.limit;
  const page = rows.slice(0, params.limit);
  const last = page.at(-1);
  return {
    items: page.map((row) => ({
      id: row.id,
      status: row.status,
      createdAt: iso(row.createdAt),
      sentAt: iso(row.sentAt),
      formId: row.form.id,
      formTitle: row.form.title,
      formDeleted: row.form.deletedAt !== null,
      projectName: row.form.project.name,
      projectSlug: row.form.project.slug,
      deliveryCount: row._count.deliveries,
    })),
    total,
    nextCursor:
      hasMore && last
        ? encodeCursor({ createdAt: last.createdAt.toISOString(), id: last.id })
        : null,
    hasMore,
  };
}

export async function getSubmissionDetail(
  id: string,
  organizationId: string,
  includeDeleted = false
) {
  const submission = await prisma.formSubmission.findFirst({
    where: {
      id,
      form: {
        ...(includeDeleted ? {} : { deletedAt: null }),
        project: { organizationId },
      },
    },
    select: {
      id: true,
      formId: true,
      status: true,
      data: true,
      origin: true,
      ipHash: true,
      userAgent: true,
      sentAt: true,
      errorMessage: true,
      createdAt: true,
      form: { select: { id: true, title: true, endpoint: true, deletedAt: true } },
      deliveries: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          createdAt: true,
          recipientEmail: true,
          status: true,
          attemptCount: true,
          nextRetryAt: true,
          providerMessageId: true,
          smtpResponse: true,
          errorMessage: true,
          events: {
            orderBy: { createdAt: "asc" },
            select: { id: true, eventType: true, createdAt: true },
          },
        },
      },
    },
  });

  if (!submission) throw new HttpError(404, "Submission not found");
  return {
    id: submission.id,
    formId: submission.formId,
    form: {
      id: submission.form.id,
      title: submission.form.title,
      endpoint: submission.form.endpoint,
    },
    formDeleted: submission.form.deletedAt !== null,
    status: submission.status,
    data: submission.data,
    origin: submission.origin,
    ipHash: hashToHex(submission.ipHash as Uint8Array | null),
    userAgent: submission.userAgent,
    sentAt: iso(submission.sentAt),
    errorMessage: submission.errorMessage,
    createdAt: iso(submission.createdAt),
    deliveries: submission.deliveries.map((delivery) => ({
      id: delivery.id,
      createdAt: iso(delivery.createdAt),
      recipientEmail: delivery.recipientEmail,
      status: delivery.status,
      attemptCount: delivery.attemptCount,
      nextRetryAt: iso(delivery.nextRetryAt),
      providerMessageId: delivery.providerMessageId,
      smtpResponse: delivery.smtpResponse,
      errorMessage: delivery.errorMessage,
      events: delivery.events.map((event) => ({
        id: event.id,
        eventType: event.eventType,
        createdAt: iso(event.createdAt),
      })),
    })),
  };
}

/** Requeues failed/dead-lettered deliveries for another delivery attempt. */
export async function retrySubmission(
  id: string,
  organizationId: string,
  actorUserId: string
) {
  const submission = await prisma.formSubmission.findFirst({
    where: {
      id,
      form: {
        deletedAt: null,
        project: { organizationId, deletedAt: null },
      },
    },
    select: { id: true, createdAt: true, formId: true },
  });
  if (!submission) throw new HttpError(404, "Submission not found");

  const failed = await prisma.emailDeliveryLog.findMany({
    where: {
      submissionId: submission.id,
      submissionCreatedAt: submission.createdAt,
      status: { in: ["failed", "dead_letter"] },
    },
    select: { id: true, createdAt: true },
  });
  if (failed.length === 0) {
    throw new HttpError(409, "No failed deliveries to retry", { code: "CONFLICT" });
  }

  await prisma.$transaction(async (tx) => {
    for (const delivery of failed) {
      await tx.emailDeliveryLog.update({
        where: { id_createdAt: { id: delivery.id, createdAt: delivery.createdAt } },
        data: {
          status: "retrying",
          attemptCount: 0,
          nextRetryAt: new Date(),
          errorMessage: null,
          smtpResponse: null,
        },
      });
    }
    await tx.formSubmission.update({
      where: { id_createdAt: { id: submission.id, createdAt: submission.createdAt } },
      data: { status: "pending", sentAt: null, errorMessage: null },
    });
    await tx.auditLog.create({
      data: {
        organizationId,
        actorUserId,
        action: "submission.retried",
        targetType: "form_submission",
        targetId: submission.id,
        metadata: { deliveryCount: failed.length },
      },
    });
  });

  return { retried: failed.length };
}
