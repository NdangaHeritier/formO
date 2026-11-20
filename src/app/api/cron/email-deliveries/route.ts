import { NextRequest, NextResponse } from "next/server";
import { jsonErrorResponse } from "@/server/auth/authorization";
import { requireCronAccess } from "@/server/auth/cron";
import { processEmailDeliveries } from "@/server/services/email-delivery.service";
import { ensureMonthlyPartitions } from "@/server/services/partitions.service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

async function runWorker(request: NextRequest) {
  try {
    requireCronAccess(request);
    const partitionsCreated = await ensureMonthlyPartitions(3);
    const result = await processEmailDeliveries({ batchSize: 20 });
    return NextResponse.json({ ok: true, partitionsCreated, ...result });
  } catch (error) {
    return jsonErrorResponse(error);
  }
}

export async function GET(request: NextRequest) {
  return runWorker(request);
}

export async function POST(request: NextRequest) {
  return runWorker(request);
}
