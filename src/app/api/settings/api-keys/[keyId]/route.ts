import { NextRequest, NextResponse } from "next/server";
import { jsonErrorResponse, requireDeveloperWorkspace } from "@/server/auth/authorization";
import { revokeWorkspaceApiKey } from "@/server/services/forms.service";

export const dynamic = "force-dynamic";

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ keyId: string }> }
) {
  try {
    const { keyId } = await context.params;
    const workspace = await requireDeveloperWorkspace("admin");
    const revoked = await revokeWorkspaceApiKey({
      keyId,
      organizationId: workspace.organization.id,
      actorUserId: workspace.user.id,
    });
    return NextResponse.json({ revoked });
  } catch (error) {
    return jsonErrorResponse(error);
  }
}
