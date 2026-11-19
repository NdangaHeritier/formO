import { describe, expect, it } from "vitest";
import {
  FORM_RATE_LIMIT,
  IP_RATE_LIMIT,
  RATE_LIMIT_WINDOW_SECONDS,
  buildRateLimitKey,
  ipHashHex,
} from "@/server/submissions/rate-limit";

describe("rate limit keys", () => {
  it("builds distinct per-form and per-IP keys", () => {
    const hash = "a".repeat(64);
    expect(buildRateLimitKey("form", "form-1", hash)).toBe(`f:form-1:${hash}`);
    expect(buildRateLimitKey("ip", "form-1", hash)).toBe(`ip:${hash}`);
  });

  it("stays under the 160 character column limit", () => {
    const key = buildRateLimitKey("form", "00000000-0000-0000-0000-000000000000", "b".repeat(64));
    expect(key.length).toBeLessThanOrEqual(160);
  });

  it("hashes IPs to 64 hex characters", () => {
    expect(ipHashHex("203.0.113.10")).toMatch(/^[0-9a-f]{64}$/);
    expect(ipHashHex("203.0.113.10")).not.toBe(ipHashHex("203.0.113.11"));
  });

  it("uses the specified limits and window", () => {
    expect(FORM_RATE_LIMIT).toBe(10);
    expect(IP_RATE_LIMIT).toBe(120);
    expect(RATE_LIMIT_WINDOW_SECONDS).toBe(60);
  });
});
