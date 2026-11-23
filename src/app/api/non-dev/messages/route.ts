import { NextRequest, NextResponse } from "next/server";
import { jsonErrorResponse, requireNonDeveloperWorkspace, validationErrorResponse } from "@/server/auth/authorization";
import { createMessageSchema, messageStatusSchema, paginationSchema } from "@/lib/validation/non-dev";
import { createMessage, listMessages } from "@/server/services/outbound-message.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const querySchema = paginationSchema.extend({
  status: messageStatusSchema.optional(),
});

export async function GET(request: NextRequest) {
  try {
    const workspace = await requireNonDeveloperWorkspace("member");
    const params = request.nextUrl.searchParams;
    const parsed = querySchema.safeParse({
      limit: params.get("limit") ?? undefined,
      cursor: params.get("cursor") ?? undefined,
      status: params.get("status") ?? undefined,
    });
    if (!parsed.success) return validationErrorResponse(parsed.error, "Invalid message filters");

    return NextResponse.json(
      await listMessages({ organizationId: workspace.organization.id, ...parsed.data })
    );
  } catch (error) {
    return jsonErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const workspace = await requireNonDeveloperWorkspace("member");
    const body = await request.json().catch(() => null);
    const parsed = createMessageSchema.safeParse(body);
    if (!parsed.success) return validationErrorResponse(parsed.error, "Invalid message payload");

    const message = await createMessage({
      organizationId: workspace.organization.id,
      actorUserId: workspace.user.id,
      input: parsed.data,
    });
    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    return jsonErrorResponse(error);
  }
}
