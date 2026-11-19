import { describe, expect, it } from "vitest";
import {
  MIN_HEADROOM_DAYS,
  evaluateReadiness,
  headroomDays,
  parseUpperBound,
} from "@/server/services/health.service";

const noWarnings = {
  staleQueue: 0,
  oldestPendingAgeMinutes: null,
  defaultRows: {
    form_submissions: 0,
    email_deliveries: 0,
    email_events: 0,
    audit_logs: 0,
  },
};
const tables = ["form_submissions", "email_deliveries", "email_events", "audit_logs"];

describe("partition headroom", () => {
  it("parses the upper bound of a PostgreSQL range expression", () => {
    const expr = "FOR VALUES FROM ('2026-11-01 00:00:00+00') TO ('2026-12-01 00:00:00+00')";
    expect(parseUpperBound(expr)?.toISOString()).toBe("2026-12-01T00:00:00.000Z");
  });

  it("returns null for an unparseable expression", () => {
    expect(parseUpperBound("FOR VALUES FROM ('bad') TO ('worse')")).toBeNull();
  });

  it("computes whole days of headroom", () => {
    const now = new Date("2026-11-01T00:00:00.000Z");
    const upper = new Date("2026-12-05T12:00:00.000Z");
    expect(headroomDays(upper, now)).toBe(34);
  });
});

describe("readiness thresholds", () => {
  it("is ready at exactly 30 days on every table", () => {
    const headroom = Object.fromEntries(tables.map((t) => [t, MIN_HEADROOM_DAYS]));
    const report = evaluateReadiness(headroom, true, noWarnings);
    expect(report.ok).toBe(true);
  });

  it("is not ready when one table has 29 days", () => {
    const headroom = Object.fromEntries(tables.map((t) => [t, 60]));
    headroom["audit_logs"] = MIN_HEADROOM_DAYS - 1;
    const report = evaluateReadiness(headroom, true, noWarnings);
    expect(report.ok).toBe(false);
    expect(report.checks.find((c) => c.name === "audit_logs.headroomDays")?.ok).toBe(false);
  });

  it("is not ready with a missing bound or a dead database", () => {
    expect(evaluateReadiness({ ...Object.fromEntries(tables.map((t) => [t, 60])) }, false, noWarnings).ok).toBe(false);
    expect(evaluateReadiness({}, true, noWarnings).ok).toBe(false);
  });

  it("reports stale queue and non-empty defaults as warnings without failing", () => {
    const headroom = Object.fromEntries(tables.map((t) => [t, 60]));
    const report = evaluateReadiness(headroom, true, {
      staleQueue: 4,
      oldestPendingAgeMinutes: 22,
      defaultRows: { ...noWarnings.defaultRows, audit_logs: 3 },
    });
    expect(report.ok).toBe(true);
    expect(report.checks.find((c) => c.name === "staleQueue")?.warning).toBe(true);
    expect(report.checks.find((c) => c.name === "audit_logs_default.rows")?.warning).toBe(true);
  });
});
