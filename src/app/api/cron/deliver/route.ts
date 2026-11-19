import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqualBytes } from "@/lib/crypto";
import { runDeliveryBatch } from "@/server/services/delivery.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Scheduler-agnostic delivery trigger. Unauthenticated runs are impossible:
 * an unset secret always returns 503, even in development.
 */
export async function POST(request: NextRequest) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET is not configured" }, { status: 503 });
  }

  const header = request.headers.get("authorization") ?? "";
  const presented = header.startsWith("Bearer ") ? header.slice("Bearer ".length) : "";
  if (!timingSafeEqualBytes(Buffer.from(secret), Buffer.from(presented))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runDeliveryBatch();
    return NextResponse.json(result);
  } catch (error) {
    console.error("[delivery] batch failed", {
      reason: error instanceof Error ? error.message : "unknown",
    });
    return NextResponse.json({ error: "Delivery batch failed" }, { status: 500 });
  }
}
