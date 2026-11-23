import { NextRequest, NextResponse } from "next/server";
import { jsonErrorResponse, requireNonDeveloperWorkspace } from "@/server/auth/authorization";
import { cancelMessage } from "@/server/services/outbound-message.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const workspace = await requireNonDeveloperWorkspace("member");
    const { id } = await context.params;
    return NextResponse.json({
      message: await cancelMessage({
        id,
        organizationId: workspace.organization.id,
        actorUserId: workspace.user.id,
      }),
    });
  } catch (error) {
    return jsonErrorResponse(error);
  }
}
