import type { PrismaClient } from "@/generated/prisma/client";
import { hmacDigest } from "@/lib/crypto";
import {
  UNKNOWN_IP,
  isIdentifiableIp,
  resolveClientIp,
  type HeaderSource,
} from "@/server/submissions/client-ip";

/**
 * Audit rows are written from the service layer, where the HTTP request is not
 * in scope. Instead of threading an IP through every service signature we read
 * the ambient request headers here. Outside a request scope (scripts, workers)
 * `next/headers` throws, and the audit row simply records no IP hash.
 */
async function requestHeaders(): Promise<HeaderSource | null> {
  try {
    const { headers } = await import("next/headers");
    return await headers();
  } catch {
    return null;
  }
}

/** Peppered IP hash for `audit_logs.ip_hash`; null when the caller is anonymous. */
export async function currentAuditIpHash(): Promise<Uint8Array<ArrayBuffer> | null> {
  const headers = await requestHeaders();
  if (!headers) return null;

  const ip = resolveClientIp({ headers });
  return isIdentifiableIp(ip) && ip !== UNKNOWN_IP ? hmacDigest(ip) : null;
}

type AuditCreateArgs = {
  data?: Record<string, unknown> | Array<Record<string, unknown>>;
};

/**
 * Adds `ip_hash` to every `audit_logs` insert without changing the 20+ service
 * call sites. An explicit value on the insert always wins.
 */
export function applyAuditContext<T extends PrismaClient>(client: T): T {
  const extended = client.$extends({
    query: {
      auditLog: {
        async create({ args, query }: { args: AuditCreateArgs; query: (args: unknown) => unknown }) {
          const ipHash = await currentAuditIpHash();
          if (ipHash && args.data) {
            const rows = Array.isArray(args.data) ? args.data : [args.data];
            for (const row of rows) {
              if (row && row.ipHash === undefined) row.ipHash = ipHash;
            }
          }
          return query(args);
        },
      },
    },
  });

  // The extension only widens behaviour, never the shape consumed by callers.
  return extended as unknown as T;
}
