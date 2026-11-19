import type { NextRequest } from "next/server";
import { getServerEnv } from "@/lib/env";
import { HttpError } from "@/server/auth/authorization";
import { getClientIp, UNKNOWN_IP } from "@/server/submissions/client-ip";

const SITEVERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const TIMEOUT_MS = 5_000;

/**
 * Verifies a Cloudflare Turnstile token. Fail closed: a missing token or a
 * negative verification is a 400; a configuration or network fault is a 503.
 * The remote IP is sent only to Cloudflare and is never logged.
 */
export async function verifyTurnstile(
  token: string | undefined,
  request: NextRequest
): Promise<void> {
  if (!token || !token.trim()) {
    throw new HttpError(400, "Turnstile verification is required");
  }
  const remoteIp = getClientIp(request);

  let secret: string | undefined;
  try {
    secret = getServerEnv().TURNSTILE_SECRET_KEY;
  } catch {
    secret = undefined;
  }
  if (!secret) {
    console.error("[submissions] TURNSTILE_SECRET_KEY is missing for a form that requires Turnstile");
    throw new HttpError(503, "Turnstile verification is not configured");
  }

  const body = new URLSearchParams({ secret, response: token.trim() });
  if (remoteIp !== UNKNOWN_IP) body.set("remoteip", remoteIp);

  let response: Response;
  try {
    response = await fetch(SITEVERIFY_URL, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body,
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: "no-store",
    });
  } catch {
    throw new HttpError(503, "Turnstile verification is temporarily unavailable");
  }

  if (!response.ok) {
    throw new HttpError(503, "Turnstile verification is temporarily unavailable");
  }

  let result: { success?: boolean };
  try {
    result = (await response.json()) as { success?: boolean };
  } catch {
    throw new HttpError(503, "Turnstile verification returned an invalid response");
  }

  if (result.success !== true) {
    throw new HttpError(400, "Turnstile verification failed");
  }
}
