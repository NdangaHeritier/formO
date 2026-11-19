import { NextRequest, NextResponse } from "next/server";
import { HttpError, jsonErrorResponse } from "@/server/auth/authorization";
import { requireFormAccess } from "@/server/auth/authorization";
import { listSubmissionsSchema, parseListQuery } from "@/lib/validation/query";
import { listFormSubmissions } from "@/server/services/submission-reads.service";

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
