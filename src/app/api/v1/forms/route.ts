import { NextResponse } from "next/server";
import { jsonErrorResponse } from "@/server/auth/authorization";
import { authenticateApiKey } from "@/server/auth/api-key";
import { listWorkspaceForms } from "@/server/services/forms.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** First API-key consumer: read the caller's workspace forms. */
export async function GET(request: Request) {
  try {
    const key = await authenticateApiKey(request, "forms:read");
    const forms = await listWorkspaceForms(key.organizationId);
    return NextResponse.json({ forms, total: forms.length });
  } catch (error) {
    return jsonErrorResponse(error);
  }
}
