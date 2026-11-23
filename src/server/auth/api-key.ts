import { hmacDigest, timingSafeEqualBytes } from "@/lib/crypto";
import { prisma } from "@/lib/prisma";
import { HttpError } from "@/server/auth/authorization";

const KEY_PATTERN = /^(fmo_live_[a-f0-9]{8})_([A-Za-z0-9_-]{32})$/;
const LAST_USED_THROTTLE_MS = 60_000;

function readApiKey(request: Request): string | null {
  const headerKey = request.headers.get("x-api-key");
  if (headerKey !== null) return headerKey.trim() || null;
  const authorization = request.headers.get("authorization");
  if (!authorization) return null;
  const match = /^Bearer\s+(.+)$/i.exec(authorization.trim());
  return match?.[1]?.trim() || null;
}

/**
 * Authenticates a workspace API key. The digest comparison is constant-time;
 * the prefix is only an index hint, never a trust signal.
 */
export async function authenticateApiKey(request: Request, requiredScope = "forms:read") {
  const rawKey = readApiKey(request);
  if (!rawKey) throw new HttpError(401, "API key required");

  const match = KEY_PATTERN.exec(rawKey);
  if (!match) throw new HttpError(401, "Invalid API key");
  const prefix = match[1]!;

  const candidates = await prisma.apiKey.findMany({
    where: { keyPrefix: prefix },
    select: {
      id: true,
      organizationId: true,
      createdById: true,
      scopes: true,
      expiresAt: true,
      revokedAt: true,
      keyHash: true,
      lastUsedAt: true,
    },
    take: 20,
  });

  const presented = Buffer.from(hmacDigest(rawKey));
  const apiKey = candidates.find((candidate) =>
    timingSafeEqualBytes(Buffer.from(candidate.keyHash), presented)
  );

  if (
    !apiKey ||
    apiKey.revokedAt !== null ||
    (apiKey.expiresAt !== null && apiKey.expiresAt.getTime() <= Date.now())
  ) {
    throw new HttpError(401, "Invalid API key");
  }
  if (!apiKey.scopes.includes(requiredScope)) {
    throw new HttpError(403, `API key lacks required scope: ${requiredScope}`);
  }

  // Throttled so a hot key does not write on every request.
  if (
    !apiKey.lastUsedAt ||
    Date.now() - apiKey.lastUsedAt.getTime() > LAST_USED_THROTTLE_MS
  ) {
    void prisma.apiKey
      .update({ where: { id: apiKey.id }, data: { lastUsedAt: new Date() } })
      .catch(() => undefined);
  }

  return {
    id: apiKey.id,
    organizationId: apiKey.organizationId,
    scopes: apiKey.scopes,
    createdById: apiKey.createdById,
  };
}

/** Backward-compatible alias for older callers. */
export const requireApiKey = authenticateApiKey;
