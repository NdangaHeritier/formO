import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  queryRaw: vi.fn(),
  getClientIp: vi.fn(),
  isIdentifiableIp: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({ prisma: { $queryRaw: mocks.queryRaw } }));
vi.mock("@/server/submissions/client-ip", () => ({
  getClientIp: mocks.getClientIp,
  isIdentifiableIp: mocks.isIdentifiableIp,
  UNKNOWN_IP: "unknown",
}));

import {
  DEFAULT_CLIENT_RATE_LIMIT,
  DEFAULT_FORM_RATE_LIMIT,
  RATE_LIMIT_WINDOW_SECONDS,
  buildRateLimitKey,
  decideRateLimit,
  enforceRateLimits,
  ipHashHex,
} from "@/server/submissions/rate-limit";

const allowedRow = () => [{ count: 1, expires_at: new Date(Date.now() + 30_000) }];

describe("rate limit keys", () => {
  it("keeps client buckets per form and per IP", () => {
    const hash = "a".repeat(64);
    const first = buildRateLimitKey("client", "form-1", hash);
    expect(first).toBe(`c:form-1:${hash}`);
    expect(buildRateLimitKey("client", "form-2", hash)).not.toBe(first);
    expect(buildRateLimitKey("client", "form-1", "b".repeat(64))).not.toBe(first);
  });

  it("keeps the form bucket shared across IPs", () => {
    const formKey = buildRateLimitKey("form", "form-1", "");
    expect(formKey).toBe("f:form-1");
    expect(buildRateLimitKey("form", "form-1", "a".repeat(64))).toBe(formKey);
    expect(formKey.length).toBeLessThanOrEqual(160);
  });

  it("hashes IPs to distinct 64-char hex values", () => {
    expect(ipHashHex("203.0.113.10")).toMatch(/^[0-9a-f]{64}$/);
    expect(ipHashHex("203.0.113.10")).not.toBe(ipHashHex("203.0.113.11"));
  });

  it("uses configurable defaults and window", () => {
    expect(DEFAULT_CLIENT_RATE_LIMIT).toBe(10);
    expect(DEFAULT_FORM_RATE_LIMIT).toBe(600);
    expect(RATE_LIMIT_WINDOW_SECONDS).toBe(60);
  });
});

describe("rate limit decisions", () => {
  it("fails closed when the limiter is unavailable", () => {
    expect(decideRateLimit({ client: null, form: null }, { limiterFailed: true })).toEqual({
      allowed: false,
      unavailable: true,
    });
  });

  it("uses the largest retry-after when a bucket is exceeded", () => {
    expect(decideRateLimit({ client: 12, form: 7 })).toEqual({
      allowed: false,
      retryAfterSeconds: 12,
    });
    expect(decideRateLimit({ client: null, form: null })).toEqual({ allowed: true });
  });
});

describe("enforceRateLimits", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.queryRaw.mockResolvedValue(allowedRow());
  });

  it("skips the client bucket when the IP is not identifiable", async () => {
    mocks.getClientIp.mockReturnValue("unknown");
    mocks.isIdentifiableIp.mockReturnValue(false);

    const decision = await enforceRateLimits("form-1", {} as never);

    expect(decision).toEqual({ allowed: true });
    expect(mocks.queryRaw).toHaveBeenCalledTimes(1);
  });

  it("uses both buckets when the IP is identifiable", async () => {
    mocks.getClientIp.mockReturnValue("203.0.113.10");
    mocks.isIdentifiableIp.mockReturnValue(true);

    const decision = await enforceRateLimits("form-1", {} as never);

    expect(decision).toEqual({ allowed: true });
    expect(mocks.queryRaw).toHaveBeenCalledTimes(2);
  });

  it("returns unavailable when a bucket query throws", async () => {
    mocks.getClientIp.mockReturnValue("unknown");
    mocks.isIdentifiableIp.mockReturnValue(false);
    mocks.queryRaw.mockRejectedValueOnce(new Error("db down"));

    const decision = await enforceRateLimits("form-1", {} as never);

    expect(decision).toEqual({ allowed: false, unavailable: true });
  });
});
