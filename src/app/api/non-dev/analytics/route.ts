import { NextResponse } from "next/server";
import { jsonErrorResponse, requireNonDeveloperWorkspace } from "@/server/auth/authorization";
import { getNonDevAnalytics } from "@/server/services/non-dev-analytics.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const workspace = await requireNonDeveloperWorkspace("member");
    return NextResponse.json(await getNonDevAnalytics(workspace.organization.id));
  } catch (error) {
    return jsonErrorResponse(error);
  }
}
