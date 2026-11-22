import { prisma } from "@/lib/prisma";

/** NULL clears the workspace override and falls back to the env default. */
export async function setWorkspaceRetention(params: {
  organizationId: string;
  actorUserId: string;
  retentionDays: number | null;
}) {
  const { organizationId, actorUserId, retentionDays } = params;
  return prisma.$transaction([
    prisma.organization.update({
      where: { id: organizationId },
      data: { retentionDays },
      select: { id: true, retentionDays: true },
    }),
    prisma.auditLog.create({
      data: {
        organizationId,
        actorUserId,
        action: "workspace.retention_changed",
        targetType: "organization",
        targetId: organizationId,
        metadata: { retentionDays },
      },
    }),
  ]);
}
