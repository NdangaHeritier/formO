import { NextResponse } from "next/server";
import { jsonErrorResponse, requireActiveWorkspace } from "@/server/auth/authorization";
import { getSubmissionDetail } from "@/server/services/submission-reads.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const workspace = await requireActiveWorkspace("member");
    return NextResponse.json(await getSubmissionDetail(id, workspace.organization.id));
  } catch (error) {
    return jsonErrorResponse(error);
  }
}
