import { NextResponse } from "next/server";
import { jsonErrorResponse, requireDeveloperWorkspace } from "@/server/auth/authorization";
import { PRESET_TEMPLATES } from "@/server/services/template-presets";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireDeveloperWorkspace("member");
    return NextResponse.json({ presets: PRESET_TEMPLATES });
  } catch (error) {
    return jsonErrorResponse(error);
  }
}
