import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { jsonErrorResponse, HttpError, requireDeveloperWorkspace , validationErrorResponse} from "@/server/auth/authorization";
import { sendTemplateTestEmail } from "@/server/services/forms.service";
import { consumeBucket } from "@/server/submissions/rate-limit";
import { templateSchemaParameters } from "@/lib/template-design";

export const dynamic = "force-dynamic";

// No `to` field: the recipient is always the signed-in user's own verified
// address. Unknown body keys are stripped by zod's default object behaviour.
const testSendSchema = z.union([
  templateSchemaParameters.extend({ smtpConfigId: z.string().uuid() }),
  z.object({ templateId: z.string().uuid(), smtpConfigId: z.string().uuid() }),
]);

export async function POST(request: NextRequest) {
  try {
    const workspace = await requireDeveloperWorkspace("admin");
    if (!workspace.user.emailVerified) {
      throw new HttpError(403, "Verify your email address before sending test messages");
    }

    const retryAfter = await consumeBucket(`u:${workspace.user.id}`, 5);
    if (retryAfter !== null) {
      return NextResponse.json(
        { error: "Too many test emails. Please try again later.", code: "RATE_LIMITED" },
        { status: 429, headers: { "Retry-After": String(retryAfter) } }
      );
    }

    const parsed = testSendSchema.safeParse(await request.json());
    if (!parsed.success) {
      return validationErrorResponse(parsed.error, "Invalid test-send payload");
    }

    const result = await sendTemplateTestEmail({
      organizationId: workspace.organization.id,
      actorUserId: workspace.user.id,
      userEmail: workspace.user.email,
      ...("templateId" in parsed.data
        ? { templateId: parsed.data.templateId }
        : { presetId: parsed.data.presetId }),
      smtpConfigId: parsed.data.smtpConfigId,
    });
    return NextResponse.json(result);
  } catch (error) {
    return jsonErrorResponse(error);
  }
}

