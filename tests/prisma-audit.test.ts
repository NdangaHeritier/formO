import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  extended: { marker: "extended" },
  applyAuditContext: vi.fn(),
  pool: { end: vi.fn() },
}));

vi.mock("@/server/audit/audit-context", () => ({
  applyAuditContext: mocks.applyAuditContext,
}));
vi.mock("@prisma/adapter-pg", () => ({ PrismaPg: vi.fn() }));
vi.mock("@prisma/adapter-neon", () => ({ PrismaNeon: vi.fn() }));
vi.mock("pg", () => ({ Pool: vi.fn(function () { return mocks.pool; }) }));
vi.mock("@/generated/prisma/client", () => ({
  PrismaClient: vi.fn(function () { return { marker: "raw" }; }),
}));

import { getPrisma } from "@/lib/prisma";

describe("getPrisma", () => {
  beforeEach(() => {
    delete (globalThis as { formoPrisma?: unknown }).formoPrisma;
    mocks.applyAuditContext.mockReturnValue(mocks.extended);
    vi.clearAllMocks();
  });

  it("returns the audited client on the first call", () => {
    expect(getPrisma()).toBe(mocks.extended);
    expect(mocks.applyAuditContext).toHaveBeenCalledTimes(1);
  });

  it("reuses the same audited client", () => {
    const first = getPrisma();
    expect(getPrisma()).toBe(first);
    expect(mocks.applyAuditContext).toHaveBeenCalledTimes(1);
  });
});
