import { NextResponse } from "next/server";
import { jsonErrorResponse, requireNonDeveloperWorkspace } from "@/server/auth/authorization";
import { listNonDevTemplates } from "@/server/services/non-dev-template.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const workspace = await requireNonDeveloperWorkspace("member");
    return NextResponse.json(await listNonDevTemplates(workspace.organization.id));
  } catch (error) {
    return jsonErrorResponse(error);
  }
}
