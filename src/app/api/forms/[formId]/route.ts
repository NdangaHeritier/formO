import { NextRequest, NextResponse } from "next/server";
import { updateFormSchema } from "@/lib/validation/forms";
import { jsonErrorResponse, requireFormAccess } from "@/server/auth/authorization";
import {
  deleteProjectForm,
  getProjectFormDetail,
  updateProjectForm,
} from "@/server/services/forms.service";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ formId: string }> }
) {
  try {
    const { formId } = await context.params;
    const access = await requireFormAccess(formId, "member");
    const form = await getProjectFormDetail(access.form.id);
    return NextResponse.json({ form });
  } catch (error) {
    return jsonErrorResponse(error);
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ formId: string }> }
) {
  try {
    const { formId } = await context.params;
    const access = await requireFormAccess(formId, "member");
    const body = await request.json();
    const parsed = updateFormSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid form update payload" },
        { status: 400 }
      );
    }

    const form = await updateProjectForm({
      formId: access.form.id,
      organizationId: access.organizationId,
      actorUserId: access.user.id,
      input: parsed.data,
    });

    return NextResponse.json({ form });
  } catch (error) {
    return jsonErrorResponse(error);
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ formId: string }> }
) {
  try {
    const { formId } = await context.params;
    const access = await requireFormAccess(formId, "admin");
    const deleted = await deleteProjectForm({
      formId: access.form.id,
      organizationId: access.organizationId,
      actorUserId: access.user.id,
    });
    return NextResponse.json({ deleted });
  } catch (error) {
    return jsonErrorResponse(error);
  }
}
