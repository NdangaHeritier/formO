import { prisma } from "@/lib/prisma";

/**
 * Audience-scoped read model for the non-developer dashboard.
 *
 * It deliberately contains no endpoint, API key, SMTP or template-body fields:
 * those belong to the developer surface. Delivery is reported as a read-only
 * status because the workspace owns the transport.
 */
export async function getNonDeveloperOverview(organizationId: string) {
  const formScope = {
    deletedAt: null,
    project: { organizationId, deletedAt: null },
  } as const;

  const [forms, counts, lastSent, templates] = await Promise.all([
    prisma.projectForm.findMany({
      where: formScope,
      select: {
        id: true,
        title: true,
        isActive: true,
        emailTo: true,
        project: { select: { name: true } },
        recipients: {
          where: { isActive: true },
          select: { email: true },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.formSubmission.groupBy({
      by: ["formId", "status"],
      where: { form: formScope },
      _count: { _all: true },
    }),
    prisma.formSubmission.groupBy({
      by: ["formId"],
      where: { form: formScope },
      _max: { sentAt: true },
    }),
    prisma.emailTemplate.findMany({
      where: { organizationId },
      select: { id: true, name: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const byForm = new Map<string, { sent: number; failed: number; pending: number; spam: number }>();
  for (const row of counts) {
    const entry = byForm.get(row.formId) ?? { sent: 0, failed: 0, pending: 0, spam: 0 };
    if (row.status === "sent") entry.sent = row._count._all;
    else if (row.status === "failed") entry.failed = row._count._all;
    else if (row.status === "pending") entry.pending = row._count._all;
    else if (row.status === "spam") entry.spam = row._count._all;
    byForm.set(row.formId, entry);
  }

  let total = { sent: 0, failed: 0, pending: 0 };
  let workspaceLastSentAt: string | null = null;

  const formViews = forms.map((form) => {
    const stats = byForm.get(form.id) ?? { sent: 0, failed: 0, pending: 0, spam: 0 };
    total = {
      sent: total.sent + stats.sent,
      failed: total.failed + stats.failed,
      pending: total.pending + stats.pending,
    };
    const lastSentAt =
      lastSent.find((row) => row.formId === form.id)?._max.sentAt?.toISOString() ?? null;
    if (lastSentAt && (!workspaceLastSentAt || lastSentAt > workspaceLastSentAt)) {
      workspaceLastSentAt = lastSentAt;
    }

    const recipients = form.recipients.map((recipient) => recipient.email);
    return {
      id: form.id,
      title: form.title,
      project: form.project.name,
      recipients: recipients.length > 0 ? recipients : [form.emailTo],
      delivery: {
        status: !form.isActive
          ? ("paused" as const)
          : stats.sent > 0
            ? ("active" as const)
            : stats.failed > 0
              ? ("attention" as const)
              : ("waiting" as const),
        lastSentAt,
        ...stats,
      },
    };
  });

  return {
    forms: formViews,
    templates,
    delivery: {
      managedBy: "workspace" as const,
      ...total,
      lastSentAt: workspaceLastSentAt,
    },
  };
}
