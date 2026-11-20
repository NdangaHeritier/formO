import { describe, expect, it } from "vitest";
import { authErrorMessage } from "../src/lib/auth-error";
import {
  existingAccountMessage,
  methodLabel,
  rejectSocialSignIn,
  SOCIAL_SIGNIN_EXISTING_ACCOUNT,
} from "../src/server/auth/social-signin";

describe("social sign-in with an existing email", () => {
  it("names the method the account already uses", () => {
    expect(methodLabel("credential")).toBe("email and password");
    expect(methodLabel("google")).toBe("Google");
    expect(methodLabel("github")).toBe("GitHub");
    expect(existingAccountMessage(["credential"])).toBe(
      "An account with this email already exists. Please sign in with email and password instead."
    );
    expect(existingAccountMessage(["google"])).toContain("Google");
    expect(existingAccountMessage(["github", "google"])).toContain("GitHub or Google");
  });

  it("throws a coded API error carrying our message", () => {
    expect(() => rejectSocialSignIn(["credential"])).toThrowError(existingAccountMessage(["credential"]));
    try {
      rejectSocialSignIn(["credential"]);
    } catch (error) {
      const apiError = error as { body?: { code?: string; message?: string } };
      expect(apiError.body?.code).toBe(SOCIAL_SIGNIN_EXISTING_ACCOUNT);
      expect(apiError.body?.message).toContain("email and password");
    }
  });

  it("turns Better Auth redirect params into a display message", () => {
    const message = existingAccountMessage(["google"]);
    expect(authErrorMessage({ error: SOCIAL_SIGNIN_EXISTING_ACCOUNT, error_description: message })).toBe(message);
    expect(authErrorMessage({ error: "account_not_linked" })).toContain("method you used originally");
    expect(authErrorMessage({})).toBeUndefined();
  });
});
