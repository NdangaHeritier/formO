import { NextRequest, NextResponse } from "next/server";
import { createEmailTemplateSchema } from "@/lib/validation/forms";
import { jsonErrorResponse, requireActiveWorkspace } from "@/server/auth/authorization";
import {
  createWorkspaceEmailTemplate,
  listWorkspaceEmailTemplates,
} from "@/server/services/forms.service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const workspace = await requireActiveWorkspace("member");
    const templates = await listWorkspaceEmailTemplates(workspace.organization.id);
    return NextResponse.json({ templates });
  } catch (error) {
    return jsonErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const workspace = await requireActiveWorkspace("member");
    const body = await request.json();
    const parsed = createEmailTemplateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid email template payload" },
        { status: 400 }
      );
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
