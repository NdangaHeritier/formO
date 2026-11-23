import { NextRequest, NextResponse } from "next/server";
import { HttpError, jsonErrorResponse } from "@/server/auth/authorization";
import { requireFormAccess } from "@/server/auth/authorization";
import { listSubmissionsSchema, parseListQuery } from "@/lib/validation/query";
import { listFormSubmissions } from "@/server/services/submission-reads.service";
import { deleteFormSubmissions } from "@/server/services/submission-delete.service";
import { requireActiveWorkspace } from "@/server/auth/authorization";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, context: { params: Promise<{ formId: string }> }) {
  try {
    const { formId } = await context.params;
    const access = await requireFormAccess(formId, "member");
    const parsed = parseListQuery(listSubmissionsSchema, request.nextUrl.searchParams);
    if (!parsed.ok) throw new HttpError(400, parsed.message, { code: "BAD_REQUEST" });

    const result = await listFormSubmissions({
      formId: access.form.id,
      organizationId: access.organizationId,
      status: parsed.value.status,
      limit: parsed.value.limit,
      cursor: parsed.value.cursor,
    });
    return NextResponse.json(result);
  } catch (error) {
    return jsonErrorResponse(error);
  }
}

/**
 * Delete every submission for one form, including submissions of soft-deleted
 * forms. Scoped by workspace here rather than requireFormAccess, which rejects
 * deleted forms and would make orphaned data undeletable.
 */
export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ formId: string }> }
) {
  try {
    const { formId } = await context.params;
    const workspace = await requireActiveWorkspace("admin");
    return NextResponse.json(
      await deleteFormSubmissions({
        formId,
        organizationId: workspace.organization.id,
        actorUserId: workspace.user.id,
      })
    );
  } catch (error) {
    return jsonErrorResponse(error);
  }
}
