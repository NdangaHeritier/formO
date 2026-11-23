import { NextResponse } from "next/server";
import { jsonErrorResponse, requireNonDeveloperWorkspace } from "@/server/auth/authorization";
import { getNonDeveloperOverview } from "@/server/services/non-developer.service";

export const dynamic = "force-dynamic";

/** Audience-scoped data for the non-developer dashboard. */
export async function GET() {
  try {
    const workspace = await requireNonDeveloperWorkspace("member");
    const overview = await getNonDeveloperOverview(workspace.organization.id);
    return NextResponse.json(overview);
  } catch (error) {
    return jsonErrorResponse(error);
  }
}
