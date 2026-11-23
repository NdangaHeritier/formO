import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { jsonErrorResponse, requireNonDeveloperWorkspace, validationErrorResponse } from "@/server/auth/authorization";
import { createContactSchema, paginationSchema } from "@/lib/validation/non-dev";
import { createContact, listContacts } from "@/server/services/contact.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const querySchema = paginationSchema.extend({
  query: z.string().trim().max(160).optional(),
  listId: z.string().uuid().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const workspace = await requireNonDeveloperWorkspace("member");
    const params = request.nextUrl.searchParams;
    const parsed = querySchema.safeParse({
      limit: params.get("limit") ?? undefined,
      cursor: params.get("cursor") ?? undefined,
      query: params.get("query") ?? undefined,
      listId: params.get("listId") ?? undefined,
    });
    if (!parsed.success) return validationErrorResponse(parsed.error, "Invalid contact filters");

    return NextResponse.json(
      await listContacts({ organizationId: workspace.organization.id, ...parsed.data })
    );
  } catch (error) {
    return jsonErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const workspace = await requireNonDeveloperWorkspace("member");
    const body = await request.json().catch(() => null);
    const parsed = createContactSchema.safeParse(body);
    if (!parsed.success) return validationErrorResponse(parsed.error, "Invalid contact payload");

    const contact = await createContact({
      organizationId: workspace.organization.id,
      actorUserId: workspace.user.id,
      input: parsed.data,
    });
    return NextResponse.json({ contact }, { status: 201 });
  } catch (error) {
    return jsonErrorResponse(error);
  }
}
