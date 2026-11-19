import { NextRequest, NextResponse } from "next/server";
import { createEmailTemplateSchema } from "@/lib/validation/forms";
import { jsonErrorResponse, requireActiveWorkspace , validationErrorResponse} from "@/server/auth/authorization";
import { deleteWorkspaceEmailTemplate } from "@/server/services/forms.service";
import {
  getWorkspaceEmailTemplate,
  updateWorkspaceEmailTemplate,
} from "@/server/services/templates.service";

export const dynamic = "force-dynamic";
const updateSchema = createEmailTemplateSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: "At least one template field must be provided" }
);

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ templateId: string }> }
) {
  try {
    const workspace = await requireActiveWorkspace("member");
    const { templateId } = await context.params;
    const template = await getWorkspaceEmailTemplate(templateId, workspace.organization.id);
    return NextResponse.json({ template });
  } catch (error) {
    return jsonErrorResponse(error);
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ templateId: string }> }
) {
  try {
    const workspace = await requireActiveWorkspace("admin");
    const { templateId } = await context.params;
    const parsed = updateSchema.safeParse(await request.json());
    if (!parsed.success) {
      return validationErrorResponse(parsed.error, "Invalid template update");
    }

    const template = await updateWorkspaceEmailTemplate({
      templateId,
      organizationId: workspace.organization.id,
      actorUserId: workspace.user.id,
      input: parsed.data,
    });
    return NextResponse.json({ template });
  } catch (error) {
    return jsonErrorResponse(error);
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ templateId: string }> }
) {
  try {
    const workspace = await requireActiveWorkspace("admin");
    const { templateId } = await context.params;
    const deleted = await deleteWorkspaceEmailTemplate({
      templateId,
      organizationId: workspace.organization.id,
      actorUserId: workspace.user.id,
    });
    return NextResponse.json({ deleted });
  } catch (error) {
    return jsonErrorResponse(error);
  }
}
