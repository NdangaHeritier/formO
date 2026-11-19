import { NextRequest } from "next/server";
import { afterEach, describe, expect, it } from "vitest";
import { getClientIp, UNKNOWN_IP } from "@/server/submissions/client-ip";
import { resetServerEnvCache } from "@/lib/env";

function req(headers: Record<string, string> = {}) {
  return new NextRequest("http://localhost/api/f/fmo_test", { headers });
}

const original = process.env.TRUSTED_PROXY_HOPS;
afterEach(() => {
  if (original === undefined) delete process.env.TRUSTED_PROXY_HOPS;
  else process.env.TRUSTED_PROXY_HOPS = original;
  resetServerEnvCache();
});

function setHops(value: string) {
  process.env.TRUSTED_PROXY_HOPS = value;
  resetServerEnvCache();
}

describe("getClientIp", () => {
  it("ignores a spoofed X-Forwarded-For when TRUSTED_PROXY_HOPS=0", () => {
    setHops("0");
    expect(getClientIp(req({ "x-forwarded-for": "1.2.3.4", "x-real-ip": "5.6.7.8" }))).toBe(UNKNOWN_IP);
  });

  it("takes the second-to-last entry for one trusted hop", () => {
    setHops("1");
    const header = "203.0.113.1, 198.51.100.2, 192.0.2.10";
    expect(getClientIp(req({ "x-forwarded-for": header }))).toBe("198.51.100.2");
  });

  it("takes the third-from-last entry for two trusted hops", () => {
    setHops("2");
    const header = "203.0.113.1, 198.51.100.2, 192.0.2.10";
    expect(getClientIp(req({ "x-forwarded-for": header }))).toBe("203.0.113.1");
  });

  it("returns unknown for a malformed header", () => {
    setHops("1");
    expect(getClientIp(req({ "x-forwarded-for": "garbage, not-an-ip" }))).toBe(UNKNOWN_IP);
    expect(getClientIp(req({ "x-forwarded-for": "   " }))).toBe(UNKNOWN_IP);
    expect(getClientIp(req({}))).toBe(UNKNOWN_IP);
  });

  it("supports IPv6", () => {
    setHops("1");
    expect(
      getClientIp(req({ "x-forwarded-for": "2001:db8::1, 2001:db8::2" }))
    ).toBe("2001:db8::1");
  });
});

