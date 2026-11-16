import { NextRequest, NextResponse } from "next/server";
import { jsonErrorResponse, requireActiveWorkspace } from "@/server/auth/authorization";
import { deleteWorkspaceEmailTemplate } from "@/server/services/forms.service";

export const dynamic = "force-dynamic";

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ templateId: string }> }
) {
  try {
    const { templateId } = await context.params;
    const workspace = await requireActiveWorkspace("admin");
    const deleted = await deleteWorkspaceEmailTemplate({
      templateId,
      organizationId: workspace.organization.id,
      actorUserId: workspace.user.id,
    });
    return NextResponse.json({ deleted });
  } catch (error) {
    return jsonErrorResponse(error);
  }
}
