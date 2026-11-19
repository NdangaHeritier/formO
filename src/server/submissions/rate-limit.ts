import { hmacDigest } from "@/lib/crypto";
import { prisma } from "@/lib/prisma";

export const FORM_RATE_LIMIT = 10;
export const IP_RATE_LIMIT = 120;
export const RATE_LIMIT_WINDOW_SECONDS = 60;

/** Hex-encoded peppered IP hash shared with the submission row. */
export function ipHashHex(ip: string): string {
  return Buffer.from(hmacDigest(ip)).toString("hex");
}

/** Short, fixed-shape bucket keys that stay well under the 160 char column. */
export function buildRateLimitKey(scope: "form" | "ip", formId: string, ipHex: string): string {
  return scope === "form" ? `f:${formId}:${ipHex}` : `ip:${ipHex}`;
}

type BucketRow = { count: number; expires_at: Date };

async function consume(key: string, limit: number): Promise<number | null> {
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

/**
 * Applies both buckets. A rate-limiter fault never blocks a real submission;
 * the error is logged without the IP or any field value.
 */
export async function enforceRateLimits(formId: string, ip: string): Promise<number | null> {
  const hash = ipHashHex(ip);
  try {
    const ipRetry = await consume(buildRateLimitKey("ip", formId, hash), IP_RATE_LIMIT);
    const formRetry = await consume(buildRateLimitKey("form", formId, hash), FORM_RATE_LIMIT);
    return formRetry ?? ipRetry;
  } catch (error) {
    console.error("[submissions] rate limiter unavailable; failing open", {
      reason: error instanceof Error ? error.message : "unknown",
    });
    return null;
  }
}
