import { NextRequest, NextResponse } from "next/server";
import { jsonErrorResponse, requireNonDeveloperWorkspace, validationErrorResponse } from "@/server/auth/authorization";
import { listMembersSchema } from "@/lib/validation/non-dev";
import { addListMembers, listListMembers, removeListMember } from "@/server/services/contact-list.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: Context) {
  try {
    const workspace = await requireNonDeveloperWorkspace("member");
    const { id } = await context.params;
    return NextResponse.json(await listListMembers(id, workspace.organization.id));
  } catch (error) {
    return jsonErrorResponse(error);
  }
}

export async function POST(request: NextRequest, context: Context) {
  try {
    const workspace = await requireNonDeveloperWorkspace("member");
    const { id } = await context.params;
    const body = await request.json().catch(() => null);
    const parsed = listMembersSchema.safeParse(body);
    if (!parsed.success) return validationErrorResponse(parsed.error, "Invalid member selection");

    return NextResponse.json(
      await addListMembers({
        id,
        organizationId: workspace.organization.id,
        actorUserId: workspace.user.id,
        contactIds: parsed.data.contactIds,
      })
    );
  } catch (error) {
    return jsonErrorResponse(error);
  }
}

export async function DELETE(request: NextRequest, context: Context) {
  try {
    const workspace = await requireNonDeveloperWorkspace("member");
    const { id } = await context.params;
    const body = await request.json().catch(() => null);
    const parsed = listMembersSchema.safeParse(body);
    if (!parsed.success) return validationErrorResponse(parsed.error, "Invalid member selection");

    let removed = 0;
    for (const contactId of parsed.data.contactIds) {
      removed += (
        await removeListMember({
          id,
          contactId,
          organizationId: workspace.organization.id,
          actorUserId: workspace.user.id,
        })
      ).removed;
    }
    return NextResponse.json({ removed });
  } catch (error) {
    return jsonErrorResponse(error);
  }
}
