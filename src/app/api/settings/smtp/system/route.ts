import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { jsonErrorResponse, requireActiveWorkspace, validationErrorResponse } from "@/server/auth/authorization";
import { setWorkspaceDefaultSmtp } from "@/server/services/forms.service";

export const dynamic = "force-dynamic";

const schema = z.object({
  smtpConfigId: z.string().uuid().nullable(),
});

/** The workspace default is the sender used when a form has no explicit sender. */
export async function PUT(request: NextRequest) {
  try {
    const workspace = await requireActiveWorkspace("admin");
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) {
      return validationErrorResponse(parsed.error, "Invalid workspace default sender");
    }

    const result = await setWorkspaceDefaultSmtp({
      organizationId: workspace.organization.id,
      actorUserId: workspace.user.id,
      smtpConfigId: parsed.data.smtpConfigId,
    });
    return NextResponse.json(result);
  } catch (error) {
    return jsonErrorResponse(error);
  }
}
