import { describe, expect, it } from "vitest";
import { resolveDatabaseDriver } from "@/lib/db-target";

describe("resolveDatabaseDriver", () => {
  it("uses the local pg driver for a local Postgres URL", () => {
    expect(
      resolveDatabaseDriver("postgresql://postgres:postgres@127.0.0.1:5432/formo")
    ).toBe("pg");
  });

  it("detects a Neon pooled endpoint", () => {
    expect(
      resolveDatabaseDriver(
        "postgresql://u:p@ep-abc-123-pooler.us-east-2.aws.neon.tech/formo?sslmode=require"
      )
    ).toBe("neon");
  });

  it("detects a Neon direct endpoint", () => {
    expect(
      resolveDatabaseDriver("postgresql://u:p@ep-abc-123.us-east-2.aws.neon.tech/formo")
    ).toBe("neon");
  });

  it("respects explicit overrides", () => {
    const neonUrl = "postgresql://u:p@ep-abc.neon.tech/formo";
    expect(resolveDatabaseDriver(neonUrl, "pg")).toBe("pg");
    expect(resolveDatabaseDriver("postgresql://u:p@localhost/formo", "neon")).toBe("neon");
  });

  it("fails closed to pg for an unparseable URL", () => {
    expect(resolveDatabaseDriver("not-a-url")).toBe("pg");
  });
});
