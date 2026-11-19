/**
 * Next.js server startup hook. Validates environment configuration once before
 * the process serves requests. Production fails fast on missing or short
 * secrets; development logs the validation result.
 */
import { getServerEnv } from "@/lib/env";

export function validateServerEnv(): void {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  try {
    getServerEnv();
    if (process.env.NODE_ENV !== "production") {
      console.info("[env] development configuration validated");
    }
  } catch (error) {
    if (process.env.NODE_ENV === "production") throw error;
    console.warn(
      "[env] development configuration incomplete:",
      error instanceof Error ? error.message : "unknown"
    );
  }
}

validateServerEnv();
