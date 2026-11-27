import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  jsonErrorResponse,
  validationErrorResponse,
} from "@/server/auth/authorization";
import { answerQuestion } from "@/server/services/assistant.service";
import type { FaqAudience } from "@/lib/assistant/knowledge";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  question: z.string().trim().min(1).max(500),
  audience: z.enum(["public", "developer", "nonDeveloper"]).default("public"),
  pathname: z.string().max(300).default("/"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return validationErrorResponse(parsed.error, "Invalid question");
    }
    const reply = answerQuestion(parsed.data.question, {
      audience: parsed.data.audience as FaqAudience,
      pathname: parsed.data.pathname,
    });
    return NextResponse.json({ reply });
  } catch (error) {
    return jsonErrorResponse(error);
  }
}
