import { timingSafeEqualBytes } from "@/lib/crypto";
import type { NextRequest } from "next/server";
import { HttpError } from "@/server/auth/authorization";

/**
 * Shared Bearer check for every scheduled endpoint. A missing secret is a
 * hard 503 (never run unauthenticated); a wrong secret is a 401. The
 * comparison is constant-time.
 */
/** Backward-compatible alias for the owner's existing cron routes. */
export const requireCronAccess = requireCronSecret;

export function requireCronSecret(request: NextRequest): void {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) throw new HttpError(503, "CRON_SECRET is not configured");

  const header = request.headers.get("authorization") ?? "";
  const presented = header.startsWith("Bearer ") ? header.slice("Bearer ".length) : "";
  if (!timingSafeEqualBytes(Buffer.from(secret), Buffer.from(presented))) {
    throw new HttpError(401, "Unauthorized cron request");
  }
}
