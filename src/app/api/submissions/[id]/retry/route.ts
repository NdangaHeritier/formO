import { NextResponse } from "next/server";
import { jsonErrorResponse, requireDeveloperWorkspace } from "@/server/auth/authorization";
import { retrySubmission } from "@/server/services/submission-reads.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const workspace = await requireDeveloperWorkspace("admin");
    return NextResponse.json(
      await retrySubmission(id, workspace.organization.id, workspace.user.id)
    );
  } catch (error) {
    return jsonErrorResponse(error);
  }
}
