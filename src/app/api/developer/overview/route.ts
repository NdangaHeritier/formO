import { NextResponse } from "next/server";
import { jsonErrorResponse, requireActiveWorkspace } from "@/server/auth/authorization";
import { getDeveloperHomeOverview } from "@/server/services/developer-home.service";

export const dynamic = "force-dynamic";

/** Workspace-scoped data for the developer operations home. */
export async function GET() {
  try {
    const workspace = await requireActiveWorkspace("member");
    const canManage = workspace.role === "admin" || workspace.role === "owner";
    const overview = await getDeveloperHomeOverview(workspace.organization.id, canManage);
    return NextResponse.json(overview);
  } catch (error) {
    return jsonErrorResponse(error);
  }
}
