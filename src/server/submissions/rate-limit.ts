import type { NextRequest } from "next/server";
import { hmacDigest } from "@/lib/crypto";
import { getServerEnv } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { getClientIp, isIdentifiableIp } from "@/server/submissions/client-ip";

/**
 * Two independent dimensions bound abuse of the public intake endpoint:
 *
 * - `client` — one bucket per (form, client IP). This is the bucket a single
 *   visitor can exhaust; it must never be shared between visitors.
 * - `form`   — one bucket per form across all clients. This bounds a distributed
 *   flood that per-IP limits cannot see, and stays high enough for busy sites.
 *
 * A client IP that cannot be trusted (see `resolveClientIp`) is skipped for the
 * client bucket: bucketing every anonymous visitor under "unknown" would turn
 * the limiter itself into a deployment-wide denial of service.
 */
export const DEFAULT_CLIENT_RATE_LIMIT = 10;
export const DEFAULT_FORM_RATE_LIMIT = 600;
export const RATE_LIMIT_WINDOW_SECONDS = 60;

/** Backward-compatible aliases for the original constant names. */
export const FORM_RATE_LIMIT = DEFAULT_CLIENT_RATE_LIMIT;
export const IP_RATE_LIMIT = DEFAULT_FORM_RATE_LIMIT;

export type RateLimitScope = "client" | "form";

export type RateLimitConfig = { clientLimit: number; formLimit: number };

export function rateLimitConfig(): RateLimitConfig {
  const env = getServerEnv();
  return {
    clientLimit: env.FORMO_RATE_LIMIT_PER_CLIENT ?? DEFAULT_CLIENT_RATE_LIMIT,
    formLimit: env.FORMO_RATE_LIMIT_PER_FORM ?? DEFAULT_FORM_RATE_LIMIT,
  };
}

/** Hex-encoded peppered IP hash shared with the submission row. */
export function ipHashHex(ip: string): string {
  return Buffer.from(hmacDigest(ip)).toString("hex");
}

/** Short, fixed-shape bucket keys that stay well under the 160 char column. */
export function buildRateLimitKey(scope: RateLimitScope, formId: string, ipHex: string): string {
  return scope === "client" ? `c:${formId}:${ipHex}` : `f:${formId}`;
}

export type RateLimitDecision =
  | { allowed: true }
  | { allowed: false; retryAfterSeconds: number }
  | { allowed: false; unavailable: true };

/**
 * Pure combination rule. A limiter fault fails **closed** for the public
 * endpoint: serving unlimited traffic while the limiter is unreachable would
 * silently remove the only unauthenticated abuse control.
 */
export function decideRateLimit(
  retryAfter: { client: number | null; form: number | null },
  options: { limiterFailed?: boolean } = {}
): RateLimitDecision {
  if (options.limiterFailed) return { allowed: false, unavailable: true };

  const exceeded = [retryAfter.client, retryAfter.form].filter(
    (value): value is number => value !== null
  );
  if (exceeded.length === 0) return { allowed: true };

  return { allowed: false, retryAfterSeconds: Math.max(...exceeded) };
}

type BucketRow = { count: number; expires_at: Date };

export async function consumeBucket(key: string, limit: number): Promise<number | null> {
  const rows = await prisma.$queryRaw<BucketRow[]>`
    INSERT INTO rate_limit_buckets (bucket_key, count, window_start, expires_at)
    VALUES (${key}, 1, now(), now() + make_interval(secs => ${RATE_LIMIT_WINDOW_SECONDS}))
    ON CONFLICT (bucket_key) DO UPDATE SET
      count = CASE
        WHEN rate_limit_buckets.expires_at < now() THEN 1
        ELSE rate_limit_buckets.count + 1
      END,
      window_start = CASE
        WHEN rate_limit_buckets.expires_at < now() THEN now()
        ELSE rate_limit_buckets.window_start
      END,
      expires_at = CASE
        WHEN rate_limit_buckets.expires_at < now()
          THEN now() + make_interval(secs => ${RATE_LIMIT_WINDOW_SECONDS})
        ELSE rate_limit_buckets.expires_at
      END
    RETURNING count::int AS count, expires_at;
  `;

  const row = rows[0];
  if (!row || row.count <= limit) return null;
  const seconds = Math.ceil((new Date(row.expires_at).getTime() - Date.now()) / 1000);
  return Math.max(1, Math.min(seconds, RATE_LIMIT_WINDOW_SECONDS));
}

/** Applies both buckets in a stable order; the caller decides the HTTP shape. */
export async function enforceRateLimits(
  formId: string,
  request: NextRequest
): Promise<RateLimitDecision> {
  const ip = getClientIp(request);
  const { clientLimit, formLimit } = rateLimitConfig();

  try {
    const formRetry = await consumeBucket(buildRateLimitKey("form", formId, ""), formLimit);
    const clientRetry = isIdentifiableIp(ip)
      ? await consumeBucket(
          buildRateLimitKey("client", formId, ipHashHex(ip)),
          clientLimit
        )
      : null;

    return decideRateLimit({ client: clientRetry, form: formRetry });
  } catch (error) {
    // Logged without the IP or any field value.
    console.error("[submissions] rate limiter unavailable; failing closed", {
      reason: error instanceof Error ? error.message : "unknown",
    });
    return decideRateLimit({ client: null, form: null }, { limiterFailed: true });
  }
}
