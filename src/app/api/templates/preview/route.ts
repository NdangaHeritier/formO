import { NextRequest, NextResponse } from "next/server";
import { jsonErrorResponse, requireDeveloperWorkspace , validationErrorResponse} from "@/server/auth/authorization";
import { renderPresetHtml } from "@/server/services/template-presets";
import { templateSchemaParameters } from "@/lib/template-design";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const workspace = await requireDeveloperWorkspace("member");
    const parsed = templateSchemaParameters.safeParse(await request.json());
    if (!parsed.success) {
      return validationErrorResponse(parsed.error, "Invalid preview payload");
    }

    const html = await renderPresetHtml(parsed.data.presetId, {
      ...parsed.data,
      siteName: workspace.organization.name,
    });
    return NextResponse.json({ html });
  } catch (error) {
    return jsonErrorResponse(error);
  }
}
