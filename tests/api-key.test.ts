import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    apiKey: { findMany: vi.fn(async () => []), update: vi.fn(async () => ({})) },
  },
}));

import { generateApiKey } from "@/lib/crypto";
import { prisma } from "@/lib/prisma";
import { authenticateApiKey } from "@/server/auth/api-key";

const findMany = prisma.apiKey.findMany as unknown as ReturnType<typeof vi.fn>;
const update = prisma.apiKey.update as unknown as ReturnType<typeof vi.fn>;

function request(key?: string) {
  return new Request("http://localhost/api/v1/forms", {
    headers: key ? { "x-api-key": key } : {},
  });
}

function stored(generated: ReturnType<typeof generateApiKey>, overrides: Record<string, unknown> = {}) {
  return {
    id: "key-1",
    organizationId: "org-1",
    createdById: "user-1",
    scopes: ["forms:read"],
    expiresAt: null,
    revokedAt: null,
    keyHash: Buffer.from(generated.keyHash),
    lastUsedAt: new Date(),
    ...overrides,
  };
}

beforeEach(() => {
  findMany.mockReset();
  update.mockReset();
  findMany.mockResolvedValue([]);
  update.mockResolvedValue({});
});

describe("authenticateApiKey", () => {
  it("requires a key", async () => {
    await expect(authenticateApiKey(request())).rejects.toMatchObject({ status: 401 });
  });

  it("rejects a malformed key without a lookup", async () => {
    await expect(authenticateApiKey(request("not-a-key"))).rejects.toMatchObject({ status: 401 });
    expect(findMany).not.toHaveBeenCalled();
  });

  it("accepts a valid key with the required scope", async () => {
    const generated = generateApiKey();
    findMany.mockResolvedValue([stored(generated)]);
    const result = await authenticateApiKey(request(generated.rawKey), "forms:read");
    expect(result.organizationId).toBe("org-1");
    expect((findMany.mock.calls[0]?.[0] as { where: { keyPrefix: string } }).where.keyPrefix).toBe(
      generated.keyPrefix
    );
  });

  it("rejects a revoked key", async () => {
    const generated = generateApiKey();
    findMany.mockResolvedValue([stored(generated, { revokedAt: new Date() })]);
    await expect(authenticateApiKey(request(generated.rawKey), "forms:read")).rejects.toMatchObject({ status: 401 });
  });

  it("rejects an expired key", async () => {
    const generated = generateApiKey();
    findMany.mockResolvedValue([stored(generated, { expiresAt: new Date(Date.now() - 1000) })]);
    await expect(authenticateApiKey(request(generated.rawKey), "forms:read")).rejects.toMatchObject({ status: 401 });
  });

  it("rejects a key without the required scope", async () => {
    const generated = generateApiKey();
    findMany.mockResolvedValue([stored(generated, { scopes: ["forms:write"] })]);
    await expect(authenticateApiKey(request(generated.rawKey), "forms:read")).rejects.toMatchObject({ status: 403 });
  });

  it("does not trust a matching prefix with a wrong secret", async () => {
    const good = generateApiKey();
    const attacker = generateApiKey();
    findMany.mockResolvedValue([stored(attacker, { keyPrefix: good.keyPrefix })]);
    await expect(authenticateApiKey(request(good.rawKey), "forms:read")).rejects.toMatchObject({ status: 401 });
  });

  it("throttles lastUsedAt writes", async () => {
    const generated = generateApiKey();
    findMany.mockResolvedValue([stored(generated, { lastUsedAt: new Date() })]);
    await authenticateApiKey(request(generated.rawKey), "forms:read");
    expect(update).not.toHaveBeenCalled();
  });

  it("updates lastUsedAt when stale", async () => {
    const generated = generateApiKey();
    findMany.mockResolvedValue([
      stored(generated, { lastUsedAt: new Date(Date.now() - 120_000) }),
    ]);
    await authenticateApiKey(request(generated.rawKey), "forms:read");
    expect(update).toHaveBeenCalledTimes(1);
  });
});
