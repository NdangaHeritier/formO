import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { jsonErrorResponse, requireDeveloperWorkspace, validationErrorResponse } from "@/server/auth/authorization";
import { listWorkspaceSubmissions } from "@/server/services/submission-reads.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const querySchema = z.object({
  formId: z.string().uuid().optional(),
  status: z.enum(["sent", "failed", "pending", "spam"]).optional(),
  deletedForms: z.enum(["include", "exclude", "only"]).default("exclude"),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

/** Workspace-wide submission inbox, audience-safe (no SMTP data). */
export async function GET(request: NextRequest) {
  try {
    const workspace = await requireDeveloperWorkspace("member");
    const parsed = querySchema.safeParse({
      formId: request.nextUrl.searchParams.get("formId") ?? undefined,
      status: request.nextUrl.searchParams.get("status") ?? undefined,
      deletedForms: request.nextUrl.searchParams.get("deletedForms") ?? undefined,
      cursor: request.nextUrl.searchParams.get("cursor") ?? undefined,
      limit: request.nextUrl.searchParams.get("limit") ?? undefined,
    });
    if (!parsed.success) {
      return validationErrorResponse(parsed.error, "Invalid submission filters");
    }

    const result = await listWorkspaceSubmissions({
      organizationId: workspace.organization.id,
      ...parsed.data,
    });
    return NextResponse.json(result);
  } catch (error) {
    return jsonErrorResponse(error);
  }
}
