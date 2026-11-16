import { NextResponse } from "next/server";
import { jsonErrorResponse, requireActiveWorkspace } from "@/server/auth/authorization";
import { getWorkspaceAnalytics } from "@/server/services/analytics.service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const workspace = await requireActiveWorkspace("member");
    const analytics = await getWorkspaceAnalytics(workspace.organization.id);
    return NextResponse.json(analytics);
  } catch (error) {
    return jsonErrorResponse(error);
  }
}
