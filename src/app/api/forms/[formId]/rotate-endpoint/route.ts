import { NextRequest, NextResponse } from "next/server";
import { jsonErrorResponse, requireFormAccess } from "@/server/auth/authorization";
import { rotateProjectFormEndpoint } from "@/server/services/forms.service";

export const dynamic = "force-dynamic";

export async function POST(
  _request: NextRequest,
  context: { params: Promise<{ formId: string }> }
) {
  try {
    const { formId } = await context.params;
    const access = await requireFormAccess(formId, "admin");
    const form = await rotateProjectFormEndpoint({
      formId: access.form.id,
      organizationId: access.organizationId,
      actorUserId: access.user.id,
    });

    return NextResponse.json({ form });
  } catch (error) {
    return jsonErrorResponse(error);
  }
}
