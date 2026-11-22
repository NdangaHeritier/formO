import { describe, expect, it } from "vitest";
import { resolveRetentionDays, retentionCutoff } from "../src/lib/retention";

describe("retention policy", () => {
  it("prefers the workspace setting over the environment default", () => {
    expect(resolveRetentionDays(90, 30)).toBe(90);
  });

  it("uses the environment default when the workspace has no setting", () => {
    expect(resolveRetentionDays(null, 30)).toBe(30);
  });

  it("keeps data forever when neither value is set", () => {
    expect(resolveRetentionDays(null, null)).toBeNull();
    expect(retentionCutoff(null)).toBeNull();
  });

  it("computes a UTC cutoff from whole days", () => {
    const now = new Date("2026-01-31T12:00:00.000Z");
    expect(retentionCutoff(30, now)?.toISOString()).toBe("2026-01-01T12:00:00.000Z");
  });
});
