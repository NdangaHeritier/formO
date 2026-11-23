import { NextResponse } from "next/server";
import { jsonErrorResponse, requireDeveloperWorkspace } from "@/server/auth/authorization";
import { listWorkspaceForms } from "@/server/services/forms.service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const workspace = await requireDeveloperWorkspace("member");
    const forms = await listWorkspaceForms(workspace.organization.id);
    return NextResponse.json({ forms, total: forms.length });
  } catch (error) {
    return jsonErrorResponse(error);
  }
}
