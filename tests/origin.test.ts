import { describe, expect, it } from "vitest";
import {
  EMPTY_ALLOWED_ORIGINS_POLICY,
  corsHeaders,
  isOriginAllowed,
  isRedirectAllowed,
  normalizeOrigin,
} from "@/server/submissions/origin";

const dev = false;

describe("origin matching", () => {
  it("allows server-to-server calls with no Origin", () => {
    expect(isOriginAllowed({ allowedOrigins: ["https://a.test"] }, null)).toBe(true);
    expect(isOriginAllowed({ allowedOrigins: ["https://a.test"] }, "")).toBe(true);
  });

  it("follows the single empty-list policy constant", () => {
    const form = { allowedOrigins: [] };
    expect(isOriginAllowed(form, "https://anything.test")).toBe(
      EMPTY_ALLOWED_ORIGINS_POLICY === "allow"
    );
  });

  it("requires an exact scheme/host/port match", () => {
    const form = { allowedOrigins: ["https://site.test:8443/"] };
    expect(isOriginAllowed(form, "https://site.test:8443")).toBe(true);
    expect(isOriginAllowed(form, "https://site.test")).toBe(false);
    expect(isOriginAllowed(form, "http://site.test:8443")).toBe(false);
    expect(isOriginAllowed(form, "https://evil.test")).toBe(false);
  });

  it("treats exactly ['*'] as the only wildcard list", () => {
    expect(isOriginAllowed({ allowedOrigins: ["*"] }, "https://evil.test")).toBe(true);
    expect(
      isOriginAllowed({ allowedOrigins: ["*", "https://site.test"] }, "https://evil.test")
    ).toBe(false);
  });

  it("normalizes trailing slashes and rejects non-http schemes", () => {
    expect(normalizeOrigin("https://site.test/path?q=1")).toBe("https://site.test");
    expect(normalizeOrigin("javascript:alert(1)")).toBeNull();
    expect(normalizeOrigin("not a url")).toBeNull();
  });

  it("never sets credentials on CORS responses", () => {
    const headers = corsHeaders("https://site.test", true);
    expect(headers["Access-Control-Allow-Origin"]).toBe("https://site.test");
    expect(headers["Access-Control-Max-Age"]).toBe("86400");
    expect(headers["Vary"]).toBe("Origin");
    expect(headers["Access-Control-Allow-Credentials"]).toBeUndefined();
  });

  it("omits the allow-origin header when the origin is rejected", () => {
    const headers = corsHeaders("https://evil.test", false);
    expect(headers["Access-Control-Allow-Origin"]).toBeUndefined();
  });
});

describe("redirect validation", () => {
  const form = { allowedOrigins: ["https://site.test"] };

  it("accepts an allowed https origin", () => {
    expect(isRedirectAllowed("https://site.test/done", form, null, dev)).toBe(
      "https://site.test/done"
    );
  });

  it("accepts the request's own origin without an allow-list entry", () => {
    expect(isRedirectAllowed("https://other.test/done", form, "https://other.test", dev)).toBe(
      "https://other.test/done"
    );
  });

  it("rejects open redirects", () => {
    expect(isRedirectAllowed("https://evil.test/steal", form, "https://site.test", dev)).toBeNull();
    expect(isRedirectAllowed("//evil.test/steal", form, null, dev)).toBeNull();
    expect(isRedirectAllowed("javascript:alert(1)", form, null, dev)).toBeNull();
    expect(isRedirectAllowed("https://site.test.evil.test/", form, null, dev)).toBeNull();
  });

  it("rejects http except localhost in development", () => {
    expect(
      isRedirectAllowed(
        "http://localhost:3000/done",
        { allowedOrigins: ["http://localhost:3000"] },
        null,
        true
      )
    ).toBe("http://localhost:3000/done");
    expect(isRedirectAllowed("http://localhost:3000/done", form, null, false)).toBeNull();
    expect(isRedirectAllowed("http://site.test/done", form, "http://site.test", true)).toBeNull();
  });

  it("does not allow arbitrary redirects from an empty allow-list", () => {
    expect(isRedirectAllowed("https://evil.test/", { allowedOrigins: [] }, null, dev)).toBeNull();
  });
});
