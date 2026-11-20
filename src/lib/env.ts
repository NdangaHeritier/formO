import { z } from "zod";

const serverEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().url("DATABASE_URL must be a valid PostgreSQL connection URL"),
  // Explicit FormO connection string. Takes priority over DATABASE_URL because
  // some hosts inject their own DATABASE_URL (e.g. a pris:// Accelerate URL).
  FORMO_DATABASE_URL: z.string().url().optional(),
  // Direct (unpooled) Neon URL used only by Prisma CLI for migrations.
  // Locally this is unset and DATABASE_URL is used instead.
  DATABASE_URL_UNPOOLED: z.string().url().optional(),
  // Override the driver when Neon is reached through a custom domain.
  DATABASE_DRIVER: z.enum(["auto", "neon", "pg"]).default("auto"),
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.string().url().default("http://localhost:3000"),
  FORMO_ENCRYPTION_KEY: z.string().min(32),
  FORMO_HMAC_PEPPER: z.string().min(32),
  SMTP_HOST: z.string().default("127.0.0.1"),
  SMTP_PORT: z.coerce.number().int().min(1).max(65535).default(1025),
  SMTP_SECURE: z.enum(["true", "false"]).default("false"),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().default("FormO <noreply@localhost>"),
  CRON_SECRET: z.string().min(24).optional(),
  TURNSTILE_SECRET_KEY: z.string().optional(),
  // GitHub OAuth app credentials for social sign-in (optional: the provider is
  // only registered when both are present).
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),
  // Google OAuth client credentials for social sign-in (optional).
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  // Number of trusted reverse-proxy hops in X-Forwarded-For. 0 ignores the
  // header entirely because clients can spoof it.
  TRUSTED_PROXY_HOPS: z.coerce.number().int().min(0).max(10).default(0),
  // How many months of range partitions the maintenance job keeps ahead.
  PARTITION_MONTHS_AHEAD: z.coerce.number().int().min(2).max(24).default(6),
  // Local SMTP sinks are only reachable with an explicit opt-in.
  FORMO_ALLOW_LOCAL_SMTP: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
  // Comma-separated additional browser origins trusted by better-auth.
  TRUSTED_ORIGINS: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.NODE_ENV !== "production") return;
  const required = [
    "BETTER_AUTH_SECRET",
    "FORMO_ENCRYPTION_KEY",
    "FORMO_HMAC_PEPPER",
    "CRON_SECRET",
  ] as const;
  for (const key of required) {
    if ((process.env[key]?.trim().length ?? 0) < 32) {
      ctx.addIssue({
        code: "custom",
        path: [key],
        message: `${key} must be at least 32 characters in production`,
      });
    }
  }
  if (process.env.FORMO_ALLOW_DEV_SECRETS === "1") {
    ctx.addIssue({
      code: "custom",
      path: ["FORMO_ALLOW_DEV_SECRETS"],
      message: "FORMO_ALLOW_DEV_SECRETS=1 is not allowed in production",
    });
  }
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;
export type DatabaseDriver = ServerEnv["DATABASE_DRIVER"];

let cachedEnv: ServerEnv | null = null;

/**
 * Parses and validates server environment variables once per process.
 * Throws a clear diagnostic error when required variables are missing or malformed.
 */
export function getServerEnv(): ServerEnv {
  if (cachedEnv) return cachedEnv;

  const parsed = serverEnvSchema.safeParse(process.env);
  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `${issue.path.join(".") || "env"}: ${issue.message}`)
      .join("; ");
    throw new Error(`Invalid server environment configuration: ${details}`);
  }

  cachedEnv = parsed.data;
  return cachedEnv;
}

/** Test-only helper: clears the cached parse after env vars are changed. */
export function resetServerEnvCache(): void {
  cachedEnv = null;
}

export function isDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim());
}
