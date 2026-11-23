import { NextResponse } from "next/server";
import { jsonErrorResponse, requireDeveloperWorkspace } from "@/server/auth/authorization";
import { getSubmissionDetail } from "@/server/services/submission-reads.service";
import { deleteSubmission } from "@/server/services/submission-delete.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const workspace = await requireDeveloperWorkspace("member");
    const includeDeleted = new URL(request.url).searchParams.get("includeDeleted") === "1";
    return NextResponse.json(
      await getSubmissionDetail(id, workspace.organization.id, includeDeleted)
    );
  } catch (error) {
    return jsonErrorResponse(error);
  }
}

/** Admin-only permanent deletion; delivery logs and events cascade. */
export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const workspace = await requireDeveloperWorkspace("admin");
    return NextResponse.json(
      await deleteSubmission({
        id,
        organizationId: workspace.organization.id,
        actorUserId: workspace.user.id,
      })
    );
  } catch (error) {
    return jsonErrorResponse(error);
  }
}
