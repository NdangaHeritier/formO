import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { acceptSubmission } from "@/server/services/submissions.service";
import {
  corsHeaders,
  getRequestOrigin,
  isOriginAllowed,
} from "@/server/submissions/origin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

