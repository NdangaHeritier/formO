import { NextRequest, NextResponse } from "next/server";
import { readJson } from "@/lib/json";
import { createEmailTemplateSchema } from "@/lib/validation/forms";
import { jsonErrorResponse, requireDeveloperWorkspace , validationErrorResponse} from "@/server/auth/authorization";
import {
  createWorkspaceEmailTemplate,
  listWorkspaceEmailTemplates,
} from "@/server/services/forms.service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const workspace = await requireDeveloperWorkspace("member");
    const templates = await listWorkspaceEmailTemplates(workspace.organization.id);
    return NextResponse.json({ templates });
  } catch (error) {
    return jsonErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const workspace = await requireDeveloperWorkspace("member");
    const body = await readJson(request);
    const parsed = createEmailTemplateSchema.safeParse(body);

    if (!parsed.success) {
      return validationErrorResponse(parsed.error, "Invalid email template payload");
    }

    const template = await createWorkspaceEmailTemplate({
      organizationId: workspace.organization.id,
      actorUserId: workspace.user.id,
      input: parsed.data,
    });

    return NextResponse.json({ template }, { status: 201 });
  } catch (error) {
    return jsonErrorResponse(error);
  }
}
