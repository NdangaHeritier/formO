import { NextRequest, NextResponse } from "next/server";
import { updateProjectSchema } from "@/lib/validation/projects";
import { jsonErrorResponse, requireProjectAccess } from "@/server/auth/authorization";
import {
  deleteWorkspaceProject,
  getWorkspaceProjectDetail,
  updateWorkspaceProject,
} from "@/server/services/projects.service";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await context.params;
    const access = await requireProjectAccess(projectId, "member");
    const project = await getWorkspaceProjectDetail(access.project.id, access.organizationId);
    return NextResponse.json({ project });
  } catch (error) {
    return jsonErrorResponse(error);
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await context.params;
    const access = await requireProjectAccess(projectId, "admin");
    const body = await request.json();
    const parsed = updateProjectSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid project update payload" },
        { status: 400 }
      );
    }

    const project = await updateWorkspaceProject({
      projectId: access.project.id,
      organizationId: access.organizationId,
      actorUserId: access.user.id,
      input: parsed.data,
    });

    return NextResponse.json({ project });
  } catch (error) {
    return jsonErrorResponse(error);
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await context.params;
    const access = await requireProjectAccess(projectId, "admin");

    const deleted = await deleteWorkspaceProject({
      projectId: access.project.id,
      organizationId: access.organizationId,
      actorUserId: access.user.id,
    });

    return NextResponse.json({ deleted });
  } catch (error) {
    return jsonErrorResponse(error);
  }
}
