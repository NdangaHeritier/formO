import { NextRequest, NextResponse } from "next/server";
import { createFormSchema } from "@/lib/validation/forms";
import { jsonErrorResponse, requireProjectAccess , validationErrorResponse} from "@/server/auth/authorization";
import { createProjectForm, listProjectForms } from "@/server/services/forms.service";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await context.params;
    const access = await requireProjectAccess(projectId, "member");
    const forms = await listProjectForms(access.project.id);
    return NextResponse.json({
      forms,
      total: forms.length,
    });
  } catch (error) {
    return jsonErrorResponse(error);
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await context.params;
    const access = await requireProjectAccess(projectId, "member");
    const body = await request.json();
    const parsed = createFormSchema.safeParse(body);

    if (!parsed.success) {
      return validationErrorResponse(parsed.error, "Invalid form payload");
    }

    const form = await createProjectForm({
      projectId: access.project.id,
      organizationId: access.organizationId,
      actorUserId: access.user.id,
      input: parsed.data,
    });

    return NextResponse.json({ form }, { status: 201 });
  } catch (error) {
    return jsonErrorResponse(error);
  }
}
