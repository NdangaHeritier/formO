import { describe, expect, it } from "vitest";
import { BACKOFF_MINUTES, decideSubmissionStatus, retryDelayMinutes } from "@/server/services/delivery.service";

describe("retry backoff", () => {
  it("uses 1, 5, 30, 120, 360 minutes by attempt", () => {
    expect([...BACKOFF_MINUTES]).toEqual([1, 5, 30, 120, 360]);
    expect(retryDelayMinutes(1)).toBe(1);
    expect(retryDelayMinutes(2)).toBe(5);
    expect(retryDelayMinutes(3)).toBe(30);
    expect(retryDelayMinutes(4)).toBe(120);
    expect(retryDelayMinutes(5)).toBe(360);
  });

  it("clamps out-of-range attempts", () => {
    expect(retryDelayMinutes(0)).toBe(1);
    expect(retryDelayMinutes(99)).toBe(360);
  });
});

describe("submission roll-up decision table", () => {
  it("does nothing while any sibling is non-terminal", () => {
    expect(decideSubmissionStatus(["sent", "pending"])).toEqual({
      status: null,
      setSentAt: false,
      errorMessage: null,
    });
    expect(decideSubmissionStatus(["processing"]).status).toBeNull();
    expect(decideSubmissionStatus(["retrying", "failed"]).status).toBeNull();
  });

  it("marks sent when all deliveries sent", () => {
    expect(decideSubmissionStatus(["sent", "sent"])).toEqual({
      status: "sent",
      setSentAt: true,
      errorMessage: null,
    });
  });

  it("reports partial failures", () => {
    expect(decideSubmissionStatus(["sent", "failed", "dead_letter"])).toEqual({
      status: "sent",
      setSentAt: true,
      errorMessage: "2 of 3 recipients failed",
    });
  });

  it("marks failed when no delivery was sent", () => {
    expect(decideSubmissionStatus(["failed", "dead_letter"])).toEqual({
      status: "failed",
      setSentAt: false,
      errorMessage: "2 of 2 recipients failed",
    });
  });

  it("does nothing for an empty sibling set", () => {
    expect(decideSubmissionStatus([]).status).toBeNull();
  });
});
