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
  const { isOriginAllowed, normalizeOrigin } = await import("../src/server/submissions/origin");
  const { retryDelayMinutes } = await import("../src/server/services/delivery.service");
  const { stripCrlf } = await import("../src/server/submissions/render-email");

  await t.test("server-to-server submissions do not require an Origin header", () => {
    assert.equal(isOriginAllowed({ allowedOrigins: ["https://app.example.com"] }, null), true);
  });

  await t.test("origins match exactly and tolerate a trailing slash", () => {
    const form = { allowedOrigins: ["https://app.example.com/forms"] };
    assert.equal(isOriginAllowed(form, "https://app.example.com/forms/"), true);
    assert.equal(isOriginAllowed(form, "https://evil.example.com"), false);
    assert.equal(normalizeOrigin("https://app.example.com/forms/"), "https://app.example.com");
  });

  await t.test("a wildcard explicitly permits any browser origin", () => {
    assert.equal(isOriginAllowed({ allowedOrigins: ["*"] }, "https://anywhere.example"), true);
  });

  await t.test("email subject header control characters cannot be injected", () => {
    assert.equal(
      stripCrlf("New submission\r\nBCC: victim@example.com\n").trim(),
      "New submission BCC: victim@example.com"
    );
  });

  await t.test("delivery retries use the documented minute schedule", () => {
    assert.deepEqual([1, 2, 3, 4, 5, 10].map(retryDelayMinutes), [1, 5, 30, 120, 360, 360]);
  });
});
