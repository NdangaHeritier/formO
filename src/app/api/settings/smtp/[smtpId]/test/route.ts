import { NextRequest, NextResponse } from "next/server";
import { jsonErrorResponse, requireDeveloperWorkspace } from "@/server/auth/authorization";
import { verifyWorkspaceSmtpConfig } from "@/server/services/forms.service";

export const dynamic = "force-dynamic";

export async function POST(
  _request: NextRequest,
  context: { params: Promise<{ smtpId: string }> }
) {
  try {
    const { smtpId } = await context.params;
    const workspace = await requireDeveloperWorkspace("admin");
    const result = await verifyWorkspaceSmtpConfig({
      smtpId,
      organizationId: workspace.organization.id,
      actorUserId: workspace.user.id,
    });
    return NextResponse.json(result);
  } catch (error) {
    return jsonErrorResponse(error);
  }
}
