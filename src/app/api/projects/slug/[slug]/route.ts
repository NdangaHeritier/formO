import { NextRequest, NextResponse } from "next/server";
import { jsonErrorResponse, requireProjectAccess } from "@/server/auth/authorization";
import { getWorkspaceProjectDetail } from "@/server/services/projects.service";

export const dynamic = "force-dynamic";

// Resolves a project by its slug (e.g. /developer/projects/formo-feedback)
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;
    const access = await requireProjectAccess(slug, "member");
    const project = await getWorkspaceProjectDetail(access.project.id, access.organizationId);
    return NextResponse.json({ project });
  } catch (error) {
    return jsonErrorResponse(error);
  }
}
