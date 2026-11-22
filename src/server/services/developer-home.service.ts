import { prisma } from "@/lib/prisma";

/**
 * Read model for the developer operations home. Counts are workspace-scoped;
 * sender/key counts are only returned to workspace admins/owners.
 */
export async function getDeveloperHomeOverview(
  organizationId: string,
  canManage: boolean
) {
  const formScope = {
    deletedAt: null,
    project: { organizationId, deletedAt: null },
  } as const;

  const [recentSubmissions, failedSubmissions, deadLetters] = await Promise.all([
    prisma.formSubmission.findMany({
      where: { form: formScope },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: 5,
      select: {
        id: true,
        status: true,
        createdAt: true,
        form: {
          select: {
            title: true,
            project: { select: { slug: true, name: true } },
          },
        },
      },
    }),
    prisma.formSubmission.count({ where: { form: formScope, status: "failed" } }),
    prisma.emailDeliveryLog.count({
      where: { status: "dead_letter", submission: { form: formScope } },
    }),
  ]);

  let unverifiedSenders = 0;
  let revokedKeys = 0;
  if (canManage) {
    [unverifiedSenders, revokedKeys] = await Promise.all([
      prisma.smtpConfig.count({ where: { organizationId, isVerified: false } }),
      prisma.apiKey.count({ where: { organizationId, revokedAt: { not: null } } }),
    ]);
  }

  return {
    attention: {
      failedSubmissions,
      deadLetters,
      ...(canManage ? { unverifiedSenders, revokedKeys } : {}),
    },
    recentSubmissions: recentSubmissions.map((submission) => ({
      id: submission.id,
      status: submission.status,
      createdAt: submission.createdAt.toISOString(),
      formTitle: submission.form.title,
      projectSlug: submission.form.project.slug,
      projectName: submission.form.project.name,
    })),
  };
}
