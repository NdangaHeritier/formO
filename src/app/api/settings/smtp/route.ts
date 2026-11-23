import { NextRequest, NextResponse } from "next/server";
import { createSmtpConfigSchema } from "@/lib/validation/forms";
import { jsonErrorResponse, requireDeveloperWorkspace , validationErrorResponse} from "@/server/auth/authorization";
import {
  createWorkspaceSmtpConfig,
  listWorkspaceSmtpConfigs,
} from "@/server/services/forms.service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const workspace = await requireDeveloperWorkspace("admin");
    const smtpConfigs = await listWorkspaceSmtpConfigs(workspace.organization.id);
    return NextResponse.json({ smtpConfigs });
  } catch (error) {
    return jsonErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const workspace = await requireDeveloperWorkspace("admin");
    const body = await request.json();
    const parsed = createSmtpConfigSchema.safeParse(body);

    if (!parsed.success) {
      return validationErrorResponse(parsed.error, "Invalid SMTP configuration");
    }

    const smtpConfig = await createWorkspaceSmtpConfig({
      organizationId: workspace.organization.id,
      actorUserId: workspace.user.id,
      input: parsed.data,
    });

    return NextResponse.json({ smtpConfig }, { status: 201 });
  } catch (error) {
    return jsonErrorResponse(error);
  }
}
