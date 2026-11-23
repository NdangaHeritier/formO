import { NextRequest, NextResponse } from "next/server";
import { jsonErrorResponse, requireNonDeveloperWorkspace, validationErrorResponse } from "@/server/auth/authorization";
import { updateContactSchema } from "@/lib/validation/non-dev";
import { deleteContact, getContact, updateContact } from "@/server/services/contact.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: Context) {
  try {
    const workspace = await requireNonDeveloperWorkspace("member");
    const { id } = await context.params;
    return NextResponse.json({ contact: await getContact(id, workspace.organization.id) });
  } catch (error) {
    return jsonErrorResponse(error);
  }
}

export async function PATCH(request: NextRequest, context: Context) {
  try {
    const workspace = await requireNonDeveloperWorkspace("member");
    const { id } = await context.params;
    const body = await request.json().catch(() => null);
    const parsed = updateContactSchema.safeParse(body);
    if (!parsed.success) return validationErrorResponse(parsed.error, "Invalid contact payload");

    const contact = await updateContact({
      id,
      organizationId: workspace.organization.id,
      actorUserId: workspace.user.id,
      input: parsed.data,
    });
    return NextResponse.json({ contact });
  } catch (error) {
    return jsonErrorResponse(error);
  }
}

export async function DELETE(_request: NextRequest, context: Context) {
  try {
    const workspace = await requireNonDeveloperWorkspace("member");
    const { id } = await context.params;
    return NextResponse.json(
      await deleteContact({
        id,
        organizationId: workspace.organization.id,
        actorUserId: workspace.user.id,
      })
    );
  } catch (error) {
    return jsonErrorResponse(error);
  }
}
