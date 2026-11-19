import { NextRequest, NextResponse } from "next/server";
import { jsonErrorResponse } from "@/server/auth/authorization";
import { requireCronSecret } from "@/server/auth/cron";
import { runDeliveryBatch } from "@/server/services/delivery.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Scheduler-agnostic delivery trigger. */
export async function POST(request: NextRequest) {
  try {
    requireCronSecret(request);
    const result = await runDeliveryBatch();
    return NextResponse.json(result);
  } catch (error) {
    return jsonErrorResponse(error);
  }
}
