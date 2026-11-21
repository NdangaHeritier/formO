import { isIP } from "node:net";
import type { NextRequest } from "next/server";
import { getServerEnv } from "@/lib/env";

export const UNKNOWN_IP = "unknown";

/** Minimal header accessor shared by route handlers and `next/headers`. */
export type HeaderSource = { get(name: string): string | null };

/**
 * DECISION: Next.js 16 no longer exposes a trusted connection address on
 * NextRequest. With TRUSTED_PROXY_HOPS=0 we therefore ignore both forwarding
 * headers entirely and use the connection address only if a runtime injected
 * one, otherwise "unknown". Operators behind a proxy must set the hop count
 * explicitly; there is no safe way to infer it.
 *
 * Callers must treat UNKNOWN_IP as "not identifiable": rate-limit buckets and
 * audit rows keyed on it would otherwise collapse every client into one entry.
 */
export function resolveClientIp(source: {
  headers: HeaderSource;
  connectionIp?: string | null;
}): string {
  const hops = getServerEnv().TRUSTED_PROXY_HOPS;

  if (hops === 0) {
    const connectionIp = source.connectionIp;
    return connectionIp && isIP(connectionIp) > 0 ? connectionIp : UNKNOWN_IP;
  }

  const header = source.headers.get("x-forwarded-for");
  if (!header) return UNKNOWN_IP;
  const parts = header
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length === 0) return UNKNOWN_IP;

  // N positions from the right: 1 = last proxy, 2 = the one before it.
  const candidate = parts[Math.max(0, parts.length - 1 - hops)] ?? UNKNOWN_IP;
  return isIP(candidate) > 0 ? candidate : UNKNOWN_IP;
}

export function isIdentifiableIp(ip: string): boolean {
  return ip !== UNKNOWN_IP;
}

export function getClientIp(request: NextRequest): string {
  return resolveClientIp({
    headers: request.headers,
    connectionIp: (request as NextRequest & { ip?: string }).ip ?? null,
  });
}
