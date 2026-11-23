import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { jsonErrorResponse, requireNonDeveloperWorkspace, validationErrorResponse } from "@/server/auth/authorization";
import { deliveryStatusSchema } from "@/lib/validation/non-dev";
import { listMessageDeliveries } from "@/server/services/outbound-message.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const querySchema = z
  .object({
    status: deliveryStatusSchema.optional(),
    messageId: z.string().uuid().optional(),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  })
  .strict();

export async function GET(request: NextRequest) {
  try {
    const workspace = await requireNonDeveloperWorkspace("member");
    const params = request.nextUrl.searchParams;
    const parsed = querySchema.safeParse({
      status: params.get("status") ?? undefined,
      messageId: params.get("messageId") ?? undefined,
      limit: params.get("limit") ?? undefined,
    });
    if (!parsed.success) return validationErrorResponse(parsed.error, "Invalid delivery filters");

    return NextResponse.json(
      await listMessageDeliveries({ organizationId: workspace.organization.id, ...parsed.data })
    );
  } catch (error) {
    return jsonErrorResponse(error);
  }
}
