import { prisma } from "@/lib/prisma";

export interface WorkspaceAnalytics {
  projects: {
    total: number;
    thisMonth: number;
    lastMonth: number;
    changeRate: number | null;
  };
  forms: {
    total: number;
  };
  submissions: {
    total: number;
    thisMonth: number;
    lastMonth: number;
    changeRate: number | null;
    byStatus: {
      sent: number;
      failed: number;
      spam: number;
      pending: number;
    };
  };
}

/**
 * Percentage change from `previous` to `current`.
 * Returns null when there is no baseline to compare against
 * (e.g. nothing was created last month) so the UI can hide the delta
 * instead of showing a misleading 0% / infinity.
 */
export function computeChangeRate(current: number, previous: number): number | null {
  if (previous === 0) {
    return current > 0 ? 100 : null;
  }
  return Math.round(((current - previous) / previous) * 100);
}

function monthStart(offsetMonths: number): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() - offsetMonths, 1);
}

export async function getWorkspaceAnalytics(organizationId: string): Promise<WorkspaceAnalytics> {
  const thisMonthStart = monthStart(0);
  const lastMonthStart = monthStart(1);

  const projectScope = { organizationId, deletedAt: null };
  const submissionScope = {
    form: {
      deletedAt: null,
      project: projectScope,
    },
  };

  const [
    projectTotal,
    projectsThisMonth,
    projectsLastMonth,
    formsTotal,
    statusGroups,
    submissionsThisMonth,
    submissionsLastMonth,
  ] = await Promise.all([
    prisma.project.count({ where: projectScope }),
    prisma.project.count({
      where: { ...projectScope, createdAt: { gte: thisMonthStart } },
    }),
    prisma.project.count({
      where: {
        ...projectScope,
        createdAt: { gte: lastMonthStart, lt: thisMonthStart },
      },
    }),
    prisma.projectForm.count({ where: { deletedAt: null, project: projectScope } }),
    prisma.formSubmission.groupBy({
      by: ["status"],
      _count: { _all: true },
      where: submissionScope,
    }),
    prisma.formSubmission.count({
      where: { ...submissionScope, createdAt: { gte: thisMonthStart } },
    }),
    prisma.formSubmission.count({
      where: {
        ...submissionScope,
        createdAt: { gte: lastMonthStart, lt: thisMonthStart },
      },
    }),
  ]);

  const countByStatus = (status: string) =>
    statusGroups.find((g) => g.status === status)?._count._all ?? 0;

  return {
    projects: {
      total: projectTotal,
      thisMonth: projectsThisMonth,
      lastMonth: projectsLastMonth,
      changeRate: computeChangeRate(projectsThisMonth, projectsLastMonth),
    },
    forms: {
      total: formsTotal,
    },
    submissions: {
      total: statusGroups.reduce((sum, g) => sum + g._count._all, 0),
      thisMonth: submissionsThisMonth,
      lastMonth: submissionsLastMonth,
      changeRate: computeChangeRate(submissionsThisMonth, submissionsLastMonth),
      byStatus: {
        sent: countByStatus("sent"),
        failed: countByStatus("failed"),
        spam: countByStatus("spam"),
        pending: countByStatus("pending"),
      },
    },
  };
}
