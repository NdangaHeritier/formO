import { NextResponse } from "next/server";
import { z } from "zod";
import { jsonErrorResponse, requireDeveloperWorkspace, validationErrorResponse } from "@/server/auth/authorization";
import { prisma } from "@/lib/prisma";
import { setWorkspaceRetention } from "@/server/services/retention.service";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  retentionDays: z.union([z.null(), z.number().int().min(1).max(3650)]),
});

export async function GET() {
  try {
    const workspace = await requireDeveloperWorkspace("member");
    const organization = await prisma.organization.findUnique({
      where: { id: workspace.organization.id },
      select: { retentionDays: true },
    });
    return NextResponse.json({ retentionDays: organization?.retentionDays ?? null });
  } catch (error) {
    return jsonErrorResponse(error);
  }
}

export async function PUT(request: Request) {
  try {
    const workspace = await requireDeveloperWorkspace("admin");
    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) return validationErrorResponse(parsed.error, "Invalid retention setting");

    const [updated] = await setWorkspaceRetention({
      organizationId: workspace.organization.id,
      actorUserId: workspace.user.id,
      retentionDays: parsed.data.retentionDays,
    });
    return NextResponse.json({ retentionDays: updated.retentionDays });
  } catch (error) {
    return jsonErrorResponse(error);
  }
}
