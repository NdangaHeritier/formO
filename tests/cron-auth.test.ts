import { NextRequest } from "next/server";
import { afterEach, describe, expect, it } from "vitest";
import { HttpError } from "@/server/auth/authorization";
import { requireCronSecret } from "@/server/auth/cron";

const original = process.env.CRON_SECRET;
afterEach(() => {
  if (original === undefined) delete process.env.CRON_SECRET;
  else process.env.CRON_SECRET = original;
});

function req(authorization?: string) {
  return new NextRequest("http://localhost/api/cron/maintenance", {
    headers: authorization ? { authorization } : {},
  });
}

function statusOf(authorization?: string): number {
  try {
    requireCronSecret(req(authorization));
    return 200;
  } catch (error) {
    return error instanceof HttpError ? error.status : -1;
  }
}

describe("requireCronSecret", () => {
  it("returns 503 when the secret is unset or empty", () => {
    delete process.env.CRON_SECRET;
    expect(statusOf("Bearer anything")).toBe(503);
    process.env.CRON_SECRET = "   ";
    expect(statusOf("Bearer anything")).toBe(503);
  });

  it("returns 401 for a wrong or missing bearer token", () => {
    process.env.CRON_SECRET = "a-very-long-cron-secret-value-32chars";
    expect(statusOf()).toBe(401);
    expect(statusOf("Bearer wrong")).toBe(401);
  });

  it("accepts the correct bearer token", () => {
    const secret = "a-very-long-cron-secret-value-32chars";
    process.env.CRON_SECRET = secret;
    expect(statusOf(`Bearer ${secret}`)).toBe(200);
  });

  it("throws an HttpError instance", () => {
    delete process.env.CRON_SECRET;
    try {
      requireCronSecret(req());
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(HttpError);
    }
  });
});
