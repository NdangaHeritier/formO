import { strict as assert } from "node:assert";
import { test } from "node:test";

// Service imports initialize the Prisma adapter but never create a connection
// for these pure checks. No database is used by this test file.
process.env.DATABASE_URL ??= "postgresql://postgres:postgres@127.0.0.1:5432/formo";
process.env.BETTER_AUTH_SECRET ??= "unittests-better-auth-secret-32chars";
process.env.FORMO_ENCRYPTION_KEY ??= "unittests-encryption-key-at-least-32";
process.env.FORMO_HMAC_PEPPER ??= "unittests-hmac-pepper-at-least-32-chars";
process.env.NODE_ENV ??= "test";

test("submission and delivery policies", async (t) => {
  const { assertSubmissionOriginAllowed } = await import("../src/server/services/submission.service");
  const { retryDelayMinutes, sanitizedSubject } = await import(
    "../src/server/services/email-delivery.service"
  );

  await t.test("server-to-server submissions do not require an Origin header", () => {
    assert.equal(assertSubmissionOriginAllowed({ allowedOrigins: [] }, null), null);
  });

  await t.test("origins match exactly and tolerate a trailing slash", () => {
    const form = { allowedOrigins: ["https://app.example.com/forms"] };
    assert.equal(
      assertSubmissionOriginAllowed(form, "https://app.example.com/forms/"),
      "https://app.example.com/forms"
    );
    assert.throws(
      () => assertSubmissionOriginAllowed(form, "https://evil.example.com"),
      /not allowed/
    );
  });

  await t.test("a wildcard explicitly permits any browser origin", () => {
    assert.equal(
      assertSubmissionOriginAllowed({ allowedOrigins: ["*"] }, "https://anywhere.example"),
      "https://anywhere.example"
    );
  });

  await t.test("email subject header control characters cannot be injected", () => {
    assert.equal(
      sanitizedSubject("New submission\r\nBCC: victim@example.com\n"),
      "New submission BCC: victim@example.com"
    );
  });

  await t.test("delivery retries use bounded exponential backoff", () => {
    assert.deepEqual(
      [1, 2, 3, 4, 5, 10].map(retryDelayMinutes),
      [15, 30, 60, 120, 240, 240]
    );
  });
});
