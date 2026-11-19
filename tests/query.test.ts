import { describe, expect, it } from "vitest";
import {
  decodeCursor,
  encodeCursor,
  listSubmissionsSchema,
  parseListQuery,
} from "@/lib/validation/query";

describe("keyset cursor", () => {
  it("round-trips a composite (createdAt, id) cursor", () => {
    const cursor = { createdAt: "2026-11-11T10:00:00.000Z", id: "abc-123" };
    const encoded = encodeCursor(cursor);
    expect(encoded).not.toContain("+");
    expect(decodeCursor(encoded)).toEqual(cursor);
  });

  it("rejects malformed, absent and non-ISO cursors", () => {
    expect(decodeCursor(undefined)).toBeNull();
    expect(decodeCursor("not-base64!!")).toBeNull();
    expect(decodeCursor(Buffer.from('{"createdAt":"bad","id":"x"}').toString("base64url"))).toBeNull();
    expect(decodeCursor(Buffer.from('{"createdAt":"2026-01-01T00:00:00Z"}').toString("base64url"))).toBeNull();
  });
});

describe("list query validation", () => {
  it("defaults limit to 20 and accepts a status filter", () => {
    const result = parseListQuery(listSubmissionsSchema, new URLSearchParams("status=sent"));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.limit).toBe(20);
      expect(result.value.status).toBe("sent");
    }
  });

  it("rejects unknown status and out-of-range limits", () => {
    expect(parseListQuery(listSubmissionsSchema, new URLSearchParams("status=nope")).ok).toBe(false);
    expect(parseListQuery(listSubmissionsSchema, new URLSearchParams("limit=0")).ok).toBe(false);
    expect(parseListQuery(listSubmissionsSchema, new URLSearchParams("limit=101")).ok).toBe(false);
    expect(parseListQuery(listSubmissionsSchema, new URLSearchParams("surprise=1")).ok).toBe(false);
  });
});
