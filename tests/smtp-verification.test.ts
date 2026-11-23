import { describe, expect, it } from "vitest";
import {
  canAssignSmtpSender,
  sanitizeSmtpError,
  unverifiedSenderMessage,
} from "@/server/services/forms.service";

describe("sanitizeSmtpError", () => {
  it("flattens CRLF injection attempts", () => {
    const result = sanitizeSmtpError(
      "535 Auth failed\r\nBcc: attacker@example.com\nSubject: oops"
    );
    expect(result).toBe("535 Auth failed Bcc: attacker@example.com Subject: oops");
    expect(result).not.toMatch(/[\r\n]/);
  });

  it("redacts password-like values and AUTH blobs", () => {
    const result = sanitizeSmtpError(
      "535 password: hunter2 rejected; pass=secret123 AUTH PLAIN dXNlcjpwYXNz"
    );
    expect(result).not.toContain("hunter2");
    expect(result).not.toContain("secret123");
    expect(result).not.toContain("dXNlcjpwYXNz");
    expect(result).toContain("password=[redacted]");
    expect(result).toContain("pass=[redacted]");
    expect(result).toContain("AUTH PLAIN [redacted]");
  });

  it("redacts long opaque tokens", () => {
    const result = sanitizeSmtpError("535 invalid key AAAAAAAAAAAAAAAAAAAAAAAAAAAA");
    expect(result).not.toContain("AAAAAAAAAAAAAAAAAAAAAAAAAAAA");
    expect(result).toContain("[redacted]");
  });

  it("caps very long messages", () => {
    const result = sanitizeSmtpError(Array.from({ length: 120 }, () => "step").join(" "));
    expect(result.length).toBe(300);
  });

  it("falls back to a safe message for empty or unknown errors", () => {
    expect(sanitizeSmtpError(new Error(""))).toBe("Unable to connect to the SMTP server");
    expect(sanitizeSmtpError(null)).toBe("Unable to connect to the SMTP server");
    expect(sanitizeSmtpError(42)).toBe("42");
  });
});

describe("verification-state gate", () => {
  it("allows only verified senders to be assigned", () => {
    expect(canAssignSmtpSender(null)).toBe(false);
    expect(canAssignSmtpSender({ isVerified: false })).toBe(false);
    expect(canAssignSmtpSender({ isVerified: true })).toBe(true);
  });

  it("names the sender and the intended assignment in the error", () => {
    expect(
      unverifiedSenderMessage({ name: "Primary", isVerified: false }, "workspace default sender")
    ).toBe(
      'Sender "Primary" is not verified. Verify it before assigning it as the workspace default sender.'
    );
    expect(
      unverifiedSenderMessage({ name: " forme ", isVerified: false }, "form sender")
    ).toContain("as the form sender.");
  });
});
