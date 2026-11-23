import { describe, expect, it } from "vitest";
import { dedupeEmails, dedupeIds } from "../src/lib/non-dev/recipients";

describe("non-dev recipient helpers", () => {
  it("dedupes emails case-insensitively while preserving order", () => {
    expect(dedupeEmails(["A@Example.com", "a@example.com", "b@example.com"])).toEqual([
      "a@example.com",
      "b@example.com",
    ]);
  });

  it("drops blank values", () => {
    expect(dedupeEmails(["  ", "user@example.com"])).toEqual(["user@example.com"]);
  });

  it("dedupes ids without changing their order", () => {
    expect(dedupeIds(["b", "a", "b"])).toEqual(["b", "a"]);
  });
});
