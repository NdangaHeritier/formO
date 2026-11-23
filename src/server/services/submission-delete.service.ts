import { prisma } from "@/lib/prisma";
import { HttpError } from "@/server/auth/authorization";

/**
 * Submissions of soft-deleted forms stay in the database but disappear from
 * every read query. Deletion must therefore resolve scope WITHOUT filtering on
 * form.deletedAt or project.deletedAt, otherwise those records can never be
 * removed from the UI.
 */
function workspaceFormWhere(formId: string, organizationId: string) {
  return {
    id: formId,
    project: { organizationId },
  };
}

/** Permanently delete one submission; delivery logs and events cascade. */
export async function deleteSubmission(params: {
  id: string;
  organizationId: string;
  actorUserId: string;
}) {
  const { id, organizationId, actorUserId } = params;

  return prisma.$transaction(async (tx) => {
    const submission = await tx.formSubmission.findFirst({
      where: {
        id,
        form: { project: { organizationId } },
      },
      select: {
        id: true,
        createdAt: true,
        form: { select: { title: true } },
      },
    });
    if (!submission) throw new HttpError(404, "Submission not found");

    await tx.formSubmission.delete({
      where: {
        id_createdAt: { id: submission.id, createdAt: submission.createdAt },
      },
    });

    await tx.auditLog.create({
      data: {
        organizationId,
        actorUserId,
        action: "submission.deleted",
        targetType: "form_submission",
        targetId: submission.id,
        metadata: { formTitle: submission.form.title },
      },
    });

    return { id: submission.id };
  });
}

/** Permanently delete every submission belonging to one form in this workspace. */
export async function deleteFormSubmissions(params: {
  formId: string;
  organizationId: string;
  actorUserId: string;
}) {
  const { formId, organizationId, actorUserId } = params;

  return prisma.$transaction(async (tx) => {
    const form = await tx.projectForm.findFirst({
      where: workspaceFormWhere(formId, organizationId),
      select: { id: true, title: true },
    });
    if (!form) throw new HttpError(404, "Form not found");

    const count = await tx.formSubmission.count({ where: { formId: form.id } });
    await tx.formSubmission.deleteMany({ where: { formId: form.id } });

    await tx.auditLog.create({
      data: {
        organizationId,
        actorUserId,
        action: "form.submissions_deleted",
        targetType: "project_form",
        targetId: form.id,
        metadata: { formTitle: form.title, count },
      },
    });

    return { formId: form.id, count };
  });
}
