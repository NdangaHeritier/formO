import { NextRequest, NextResponse } from "next/server";
import { jsonErrorResponse, requireNonDeveloperWorkspace, validationErrorResponse } from "@/server/auth/authorization";
import { updateContactListSchema } from "@/lib/validation/non-dev";
import { deleteContactList, getContactList, updateContactList } from "@/server/services/contact-list.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: Context) {
  try {
    const workspace = await requireNonDeveloperWorkspace("member");
    const { id } = await context.params;
    return NextResponse.json({ list: await getContactList(id, workspace.organization.id) });
  } catch (error) {
    return jsonErrorResponse(error);
  }
}

export async function PATCH(request: NextRequest, context: Context) {
  try {
    const workspace = await requireNonDeveloperWorkspace("member");
    const { id } = await context.params;
    const body = await request.json().catch(() => null);
    const parsed = updateContactListSchema.safeParse(body);
    if (!parsed.success) return validationErrorResponse(parsed.error, "Invalid list payload");

    const list = await updateContactList({
      id,
      organizationId: workspace.organization.id,
      actorUserId: workspace.user.id,
      input: parsed.data,
    });
    return NextResponse.json({ list });
  } catch (error) {
    return jsonErrorResponse(error);
  }
}

export async function DELETE(_request: NextRequest, context: Context) {
  try {
    const workspace = await requireNonDeveloperWorkspace("member");
    const { id } = await context.params;
    return NextResponse.json(
      await deleteContactList({
        id,
        organizationId: workspace.organization.id,
        actorUserId: workspace.user.id,
      })
    );
  } catch (error) {
    return jsonErrorResponse(error);
  }
}
