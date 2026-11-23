import { NextRequest, NextResponse } from "next/server";
import { createSmtpConfigSchema } from "@/lib/validation/forms";
import { jsonErrorResponse, requireDeveloperWorkspace, validationErrorResponse } from "@/server/auth/authorization";
import {
  deleteWorkspaceSmtpConfig,
  updateWorkspaceSmtpConfig,
} from "@/server/services/forms.service";

export const dynamic = "force-dynamic";

// Reuse the create field schemas, but do not inherit their defaults: a PATCH
// that only changes one field must not silently reset every other field.
const updateSmtpSchema = createSmtpConfigSchema
  .extend({
    port: createSmtpConfigSchema.shape.port.unwrap(),
    secure: createSmtpConfigSchema.shape.secure.unwrap(),
  })
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one SMTP field must be provided for update",
  });

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ smtpId: string }> }
) {
  try {
    const { smtpId } = await context.params;
    const workspace = await requireDeveloperWorkspace("admin");
    const parsed = updateSmtpSchema.safeParse(await request.json());

    if (!parsed.success) {
      return validationErrorResponse(parsed.error, "Invalid SMTP configuration");
    }

    const smtpConfig = await updateWorkspaceSmtpConfig({
      smtpId,
      organizationId: workspace.organization.id,
      actorUserId: workspace.user.id,
      input: parsed.data,
    });

    return NextResponse.json({ smtpConfig });
  } catch (error) {
    return jsonErrorResponse(error);
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ smtpId: string }> }
) {
  try {
    const { smtpId } = await context.params;
    const workspace = await requireDeveloperWorkspace("admin");
    const deleted = await deleteWorkspaceSmtpConfig({
      smtpId,
      organizationId: workspace.organization.id,
      actorUserId: workspace.user.id,
    });
    return NextResponse.json({ deleted });
  } catch (error) {
    return jsonErrorResponse(error);
  }
}
