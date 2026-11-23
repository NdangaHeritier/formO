import { prisma } from "@/lib/prisma";

/**
 * Delivery-outcome analytics for the non-developer surface. No open/click data
 * exists yet (the enum values have no writer), so this reports sent, failed
 * and queued outcomes only.
 */
export async function getNonDevAnalytics(organizationId: string) {
  const [messages, deliveries, lastSent] = await Promise.all([
    prisma.outboundMessage.groupBy({
      by: ["status"],
      where: { organizationId },
      _count: { _all: true },
    }),
    prisma.emailDeliveryLog.groupBy({
      by: ["status"],
      where: { message: { organizationId } },
      _count: { _all: true },
    }),
    prisma.emailDeliveryLog.findFirst({
      where: {
        message: { organizationId },
        status: "sent",
      },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    }),
  ]);

  const messageCounts: Record<string, number> = {};
  for (const row of messages) messageCounts[row.status] = row._count._all;
  const deliveryCounts: Record<string, number> = {};
  for (const row of deliveries) deliveryCounts[row.status] = row._count._all;

  return {
    messages: {
      total: Object.values(messageCounts).reduce((sum, count) => sum + count, 0),
      queued: messageCounts.queued ?? 0,
      sending: messageCounts.sending ?? 0,
      sent: messageCounts.sent ?? 0,
      failed: messageCounts.failed ?? 0,
      canceled: messageCounts.canceled ?? 0,
    },
    recipients: {
      total: Object.values(deliveryCounts).reduce((sum, count) => sum + count, 0),
      pending: (deliveryCounts.pending ?? 0) + (deliveryCounts.retrying ?? 0),
      sent: deliveryCounts.sent ?? 0,
      failed: (deliveryCounts.failed ?? 0) + (deliveryCounts.dead_letter ?? 0),
    },
    lastSentAt: lastSent?.createdAt.toISOString() ?? null,
  };
}
