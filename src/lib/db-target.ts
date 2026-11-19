import type { DatabaseDriver } from "./env";

/**
 * Decides which Prisma driver to use. `auto` recognizes Neon by hostname;
 * an explicit override is useful when Neon is behind a custom domain.
 */
export function resolveDatabaseDriver(
  connectionString: string,
  override: DatabaseDriver = "auto"
): "neon" | "pg" {
  if (override === "neon" || override === "pg") return override;

  try {
    const hostname = new URL(connectionString).hostname.toLowerCase();
    if (hostname === "neon.tech" || hostname.endsWith(".neon.tech")) return "neon";
  } catch {
    // An invalid URL is handled by env validation; fail closed to the local driver.
  }
  return "pg";
}
