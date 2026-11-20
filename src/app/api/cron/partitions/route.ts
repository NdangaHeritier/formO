import { NextRequest, NextResponse } from "next/server";
import { jsonErrorResponse } from "@/server/auth/authorization";
import { requireCronAccess } from "@/server/auth/cron";
import {
  cleanupExpiredSubmissionHelpers,
  ensureMonthlyPartitions,
} from "@/server/services/partitions.service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

async function runMaintenance(request: NextRequest) {
  try {
    requireCronAccess(request);
    const partitionsCreated = await ensureMonthlyPartitions(12);
    const cleaned = await cleanupExpiredSubmissionHelpers();
    return NextResponse.json({ ok: true, partitionsCreated, cleaned });
  } catch (error) {
    return jsonErrorResponse(error);
  }
}

export async function GET(request: NextRequest) {
  return runMaintenance(request);
}

export async function POST(request: NextRequest) {
  return runMaintenance(request);
}
