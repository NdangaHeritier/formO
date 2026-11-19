// Importing the auth/prisma helpers touches env validation at module load.
// Pure unit tests need valid-shaped values but never open a database connection.
process.env.DATABASE_URL ??= "postgresql://postgres:postgres@127.0.0.1:5432/formo";
process.env.BETTER_AUTH_SECRET ??= "vitest-better-auth-secret-32chars";
process.env.FORMO_ENCRYPTION_KEY ??= "vitest-encryption-key-at-least-32";
process.env.FORMO_HMAC_PEPPER ??= "vitest-hmac-pepper-at-least-32-chars";
process.env.NODE_ENV ??= "test";
