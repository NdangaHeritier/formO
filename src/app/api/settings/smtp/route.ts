import { NextRequest, NextResponse } from "next/server";
import { createSmtpConfigSchema } from "@/lib/validation/forms";
import { jsonErrorResponse, requireActiveWorkspace } from "@/server/auth/authorization";
import {
  createWorkspaceSmtpConfig,
  listWorkspaceSmtpConfigs,
} from "@/server/services/forms.service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const workspace = await requireActiveWorkspace("member");
    const smtpConfigs = await listWorkspaceSmtpConfigs(workspace.organization.id);
    return NextResponse.json({ smtpConfigs });
  } catch (error) {
    return jsonErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const workspace = await requireActiveWorkspace("admin");
    const body = await request.json();
    const parsed = createSmtpConfigSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid SMTP configuration" },
        { status: 400 }
      );
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
