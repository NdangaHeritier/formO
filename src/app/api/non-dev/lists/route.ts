import { NextRequest, NextResponse } from "next/server";
import { jsonErrorResponse, requireNonDeveloperWorkspace, validationErrorResponse } from "@/server/auth/authorization";
import { createContactListSchema } from "@/lib/validation/non-dev";
import { createContactList, listContactLists } from "@/server/services/contact-list.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const workspace = await requireNonDeveloperWorkspace("member");
    return NextResponse.json(await listContactLists(workspace.organization.id));
  } catch (error) {
    return jsonErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const workspace = await requireNonDeveloperWorkspace("member");
    const body = await request.json().catch(() => null);
    const parsed = createContactListSchema.safeParse(body);
    if (!parsed.success) return validationErrorResponse(parsed.error, "Invalid list payload");

    const list = await createContactList({
      organizationId: workspace.organization.id,
      actorUserId: workspace.user.id,
      input: parsed.data,
    });
    return NextResponse.json({ list }, { status: 201 });
  } catch (error) {
    return jsonErrorResponse(error);
  }
}
