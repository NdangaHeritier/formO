import { describe, expect, it } from "vitest";
import { defaultErrorCode, errorBody, HttpError, validationHttpError } from "@/server/auth/authorization";

describe("unified error envelope", () => {
  it("maps status codes to stable machine codes", () => {
    expect(defaultErrorCode(400)).toBe("BAD_REQUEST");
    expect(defaultErrorCode(401)).toBe("UNAUTHORIZED");
    expect(defaultErrorCode(404)).toBe("NOT_FOUND");
    expect(defaultErrorCode(409)).toBe("CONFLICT");
    expect(defaultErrorCode(429)).toBe("RATE_LIMITED");
  });

  it("keeps HttpError message and code together", () => {
    expect(errorBody(new HttpError(404, "Form not found"))).toEqual({
      status: 404,
      body: { error: "Form not found", code: "NOT_FOUND" },
    });
  });

  it("includes validation fields", () => {
    const error = validationHttpError({
      issues: [
        { path: ["limit"], message: "Too big" },
        { path: ["status"], message: "Unknown status" },
      ],
    });
    expect(errorBody(error)).toEqual({
      status: 422,
      body: {
        error: "Validation failed",
        code: "VALIDATION",
        fields: { limit: ["Too big"], status: ["Unknown status"] },
      },
    });
  });

  it("maps Prisma errors without exposing internals", () => {
    expect(errorBody({ code: "P2002" })).toEqual({
      status: 409,
      body: { error: "That value is already in use", code: "CONFLICT" },
    });
    expect(errorBody({ code: "P2025" })).toEqual({
      status: 404,
      body: { error: "Resource not found", code: "NOT_FOUND" },
    });
  });

  it("turns unexpected errors into a generic 500", () => {
    expect(errorBody(new Error("DATABASE_URL=secret"))).toEqual({
      status: 500,
      body: { error: "Internal server error", code: "INTERNAL" },
    });
  });
});
