import { after, NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { runDeliveryBatch } from "@/server/services/delivery.service";
import { acceptSubmission } from "@/server/services/submissions.service";
import {
  corsHeaders,
  getRequestOrigin,
  isOriginAllowed,
} from "@/server/submissions/origin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

type RouteContext = { params: Promise<{ endpoint: string }> };

export async function OPTIONS(request: NextRequest, { params }: RouteContext) {
  const { endpoint } = await params;
  const origin = getRequestOrigin(request.headers);
  const form = await prisma.projectForm.findUnique({
    where: { endpoint },
    select: { allowedOrigins: true },
  });
  const allowed = form ? isOriginAllowed(form, origin) : true;
  return new NextResponse(null, { status: 204, headers: corsHeaders(origin, allowed) });
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  const { endpoint } = await params;
  const origin = getRequestOrigin(request.headers);
  try {
    const result = await acceptSubmission(request, endpoint);
    // Drain the same delivery queue after the visitor gets their response, so
    // normal submissions send immediately instead of waiting for the cron tick.
    // The cron job remains the safety net for retries and stuck rows.
    if (result.status === 200 || result.status === 303) {
      after(async () => {
        try {
          await runDeliveryBatch({ maxBatches: 1, batchSize: 10 });
        } catch (error) {
          console.error("[submissions] immediate delivery failed", {
            reason: error instanceof Error ? error.message : "unknown",
          });
        }
      });
    }
    if (result.location) {
      return new NextResponse(null, {
        status: result.status,
        headers: { ...result.headers, Location: result.location },
      });
    }
    return NextResponse.json(result.body ?? { error: "Submission failed", code: "ERROR" }, {
      status: result.status,
      headers: result.headers,
    });
  } catch (error) {
    console.error("[submissions] unexpected route error", {
      reason: error instanceof Error ? error.message : "unknown",
    });
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL" },
      { status: 500, headers: corsHeaders(origin, true) }
    );
  }
}

