import { NextRequest, NextResponse } from "next/server";
import { jsonErrorResponse } from "@/server/auth/authorization";
import { requireCronSecret } from "@/server/auth/cron";
import { runMaintenance } from "@/server/services/maintenance.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    requireCronSecret(request);
    const result = await runMaintenance();
    const nonEmptyDefaults = Object.entries(result.defaultPartitionRows).filter(([, n]) => n > 0);
    return NextResponse.json(
      {
        partitions: result.partitions,
        deleted: result.deleted,
        defaultPartitionRows: result.defaultPartitionRows,
        warnings: nonEmptyDefaults.map(([table, n]) => `${table}_default holds ${n} rows`),
      },
      { status: result.partitions.failed ? 500 : 200 }
    );
  } catch (error) {
    return jsonErrorResponse(error);
  }
}
