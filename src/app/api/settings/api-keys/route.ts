import { NextRequest, NextResponse } from "next/server";
import { createApiKeySchema } from "@/lib/validation/forms";
import { jsonErrorResponse, requireActiveWorkspace , validationErrorResponse} from "@/server/auth/authorization";
import {
  createWorkspaceApiKey,
  listWorkspaceApiKeys,
} from "@/server/services/forms.service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const workspace = await requireActiveWorkspace("admin");
    const apiKeys = await listWorkspaceApiKeys(workspace.organization.id);
    return NextResponse.json({ apiKeys });
  } catch (error) {
    return jsonErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const workspace = await requireActiveWorkspace("admin");
    const body = await request.json();
    const parsed = createApiKeySchema.safeParse(body);

    if (!parsed.success) {
      return validationErrorResponse(parsed.error, "Invalid API key request");
    }

    const apiKey = await createWorkspaceApiKey({
      organizationId: workspace.organization.id,
      actorUserId: workspace.user.id,
      input: parsed.data,
    });

    return NextResponse.json({ apiKey }, { status: 201 });
  } catch (error) {
    return jsonErrorResponse(error);
  }
}
