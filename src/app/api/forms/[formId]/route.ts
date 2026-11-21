import { NextRequest, NextResponse } from "next/server";
import { readJson } from "@/lib/json";
import { updateFormSchema } from "@/lib/validation/forms";
import { jsonErrorResponse, requireFormAccess , validationErrorResponse} from "@/server/auth/authorization";
import {
  deleteProjectForm,
  getProjectFormDetail,
  updateProjectForm,
} from "@/server/services/forms.service";

export const dynamic = "force-dynamic";

// Public submissions live only at POST /api/f/{endpoint}. This route is form
// management (by form id) and deliberately exposes no POST or OPTIONS.

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ formId: string }> }
) {
  try {
    const { formId } = await context.params;
    const access = await requireFormAccess(formId, "member");
    const form = await getProjectFormDetail(access.form.id, access.organizationId);
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
    const body = await readJson(request);
    const parsed = updateFormSchema.safeParse(body);

    if (!parsed.success) {
      return validationErrorResponse(parsed.error, "Invalid form update payload");
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
