import { NextRequest, NextResponse } from "next/server";
import { isDatabaseConfigured } from "@/lib/env";
import { checkDatabaseHealth } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const timestamp = new Date().toISOString();
  const checkReady = request.nextUrl.searchParams.get("ready") === "1";

  if (!checkReady) {
    return NextResponse.json({ status: "ok", timestamp }, { status: 200 });
  }

  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      {
        status: "unconfigured",
        database: "missing DATABASE_URL",
        timestamp,
      },
      { status: 503 }
    );
  }

  try {
    const db = await checkDatabaseHealth();
    return NextResponse.json(
      {
        status: "ok",
        database: "connected",
        postgresVersion: db.serverVersion,
        timestamp,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[health] PostgreSQL readiness check failed:", error);
    return NextResponse.json(
      {
        status: "error",
        database: "unreachable",
        timestamp,
      },
      { status: 503 }
    );
  }
}
