import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { jsonErrorResponse, requireActiveWorkspace, validationErrorResponse } from "@/server/auth/authorization";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const querySchema = z.object({
  status: z.enum(["pending", "processing", "sent", "retrying", "failed", "dead_letter"]).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

/** Recent delivery attempts for the workspace (read-only). */
export async function GET(request: NextRequest) {
  try {
    const workspace = await requireActiveWorkspace("member");
    const parsed = querySchema.safeParse({
      status: request.nextUrl.searchParams.get("status") ?? undefined,
      limit: request.nextUrl.searchParams.get("limit") ?? undefined,
    });
    if (!parsed.success) return validationErrorResponse(parsed.error, "Invalid delivery log filters");

    const logs = await prisma.emailDeliveryLog.findMany({
      where: {
        ...(parsed.data.status ? { status: parsed.data.status } : {}),
        submission: {
          form: {
            deletedAt: null,
            project: { organizationId: workspace.organization.id, deletedAt: null },
          },
        },
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: parsed.data.limit,
      select: {
        id: true,
        recipientEmail: true,
        status: true,
        attemptCount: true,
        errorMessage: true,
        createdAt: true,
        submission: {
          select: {
            form: { select: { title: true, project: { select: { name: true } } } },
          },
        },
      },
    });

    return NextResponse.json({
      logs: logs.map((log) => ({
        id: log.id,
        recipientEmail: log.recipientEmail,
        status: log.status,
        attemptCount: log.attemptCount,
        errorMessage: log.errorMessage,
        createdAt: log.createdAt.toISOString(),
        formTitle: log.submission.form.title,
        projectName: log.submission.form.project.name,
      })),
    });
  } catch (error) {
    return jsonErrorResponse(error);
  }
}
