import { NextRequest, NextResponse } from "next/server";
import { createProjectSchema } from "@/lib/validation/projects";
import { jsonErrorResponse, requireActiveWorkspace } from "@/server/auth/authorization";
import {
  createWorkspaceProject,
  listWorkspaceProjects,
} from "@/server/services/projects.service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const workspace = await requireActiveWorkspace("member");
    const projects = await listWorkspaceProjects(workspace.organization.id);
    return NextResponse.json({
      projects,
      total: projects.length,
    });
  } catch (error) {
    return jsonErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const workspace = await requireActiveWorkspace("member");
    const body = await request.json();
    const parsed = createProjectSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid project payload" },
        { status: 400 }
      );
    }

    const project = await createWorkspaceProject({
      organizationId: workspace.organization.id,
      actorUserId: workspace.user.id,
      input: parsed.data,
    });

    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    return jsonErrorResponse(error);
  }
}
