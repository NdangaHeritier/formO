import { NextRequest, NextResponse } from "next/server";
import { jsonErrorResponse, requireActiveWorkspace } from "@/server/auth/authorization";
import { deleteWorkspaceSmtpConfig } from "@/server/services/forms.service";

export const dynamic = "force-dynamic";

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ smtpId: string }> }
) {
  try {
    const { smtpId } = await context.params;
    const workspace = await requireActiveWorkspace("admin");
    const deleted = await deleteWorkspaceSmtpConfig({
      smtpId,
      organizationId: workspace.organization.id,
      actorUserId: workspace.user.id,
    });
    return NextResponse.json({ deleted });
  } catch (error) {
    return jsonErrorResponse(error);
  }
}
