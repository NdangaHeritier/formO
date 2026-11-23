import { NextRequest, NextResponse } from "next/server";
import { jsonErrorResponse, requireDeveloperWorkspace } from "@/server/auth/authorization";
import { verifyWorkspaceSmtpConfig } from "@/server/services/forms.service";
import { consumeBucket } from "@/server/submissions/rate-limit";

export const dynamic = "force-dynamic";

const VERIFY_ATTEMPTS_PER_WINDOW = 10;

export async function POST(
  _request: NextRequest,
  context: { params: Promise<{ smtpId: string }> }
) {
  try {
    const { smtpId } = await context.params;
    const workspace = await requireDeveloperWorkspace("admin");

    // Handshakes open sockets to an admin-chosen host: bound how often one
    // admin can trigger them, the same way test sends are bounded.
    const retryAfter = await consumeBucket(
      `smtp-verify:${workspace.user.id}`,
      VERIFY_ATTEMPTS_PER_WINDOW
    );
    if (retryAfter !== null) {
      return NextResponse.json(
        { error: "Too many verification attempts. Please try again later.", code: "RATE_LIMITED" },
        { status: 429, headers: { "Retry-After": String(retryAfter) } }
      );
    }

    const result = await verifyWorkspaceSmtpConfig({
      smtpId,
      organizationId: workspace.organization.id,
      actorUserId: workspace.user.id,
    });
    return NextResponse.json(result);
  } catch (error) {
    return jsonErrorResponse(error);
  }
}
