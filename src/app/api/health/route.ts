import { NextRequest, NextResponse } from "next/server";
import { isDatabaseConfigured } from "@/lib/env";
import { checkDatabaseHealth } from "@/lib/prisma";
import {
  collectReadiness,
  evaluateReadiness,
} from "@/server/services/health.service";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const timestamp = new Date().toISOString();
  const checkReady = request.nextUrl.searchParams.get("ready") === "1";

  if (!checkReady) {
    return NextResponse.json({ status: "ok", timestamp }, { status: 200 });
  }

  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { status: "unconfigured", database: "missing DATABASE_URL", timestamp },
      { status: 503 }
    );
  }

  try {
    const db = await checkDatabaseHealth();
    const collected = await collectReadiness();
    const report = evaluateReadiness(collected.headroom, true, collected.warnings);
    return NextResponse.json(
      {
        status: report.ok ? "ok" : "not_ready",
        database: "connected",
        postgresVersion: db.serverVersion,
        timestamp,
        ...report,
      },
      { status: report.ok ? 200 : 503 }
    );
  } catch (error) {
    console.error("[health] PostgreSQL readiness check failed:", {
      reason: error instanceof Error ? error.message : "unknown",
    });
    const report = evaluateReadiness({}, false, {
      staleQueue: 0,
      oldestPendingAgeMinutes: null,
      defaultRows: {},
    });
    return NextResponse.json(
      { status: "error", database: "unreachable", timestamp, ...report },
      { status: 503 }
    );
  }
}
