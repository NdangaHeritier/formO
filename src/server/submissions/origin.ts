/**
 * Origin policy for public form endpoints.
 *
 * DECISION: the owner has not decided whether a form with an empty
 * `allowedOrigins` list should accept browser submissions from any origin or
 * reject all browser submissions. This single constant is the switch: change
 * it to "block" to require an explicit allow-list. Server-to-server requests
 * (no Origin header) are always allowed regardless of this value.
 */
export const EMPTY_ALLOWED_ORIGINS_POLICY: "allow" | "block" = "allow";

export type OriginForm = { allowedOrigins: string[] };

/** Reduces a URL or bare origin to `scheme://host[:port]`, or null if invalid. */
export function normalizeOrigin(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  try {
    const url = new URL(trimmed);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.origin;
  } catch {
    return null;
  }
}

/** Origin header wins; Referer is the fallback for older browsers. */
export function getRequestOrigin(headers: Headers): string | null {
  const fromOrigin = normalizeOrigin(headers.get("origin"));
  if (fromOrigin) return fromOrigin;
  return normalizeOrigin(headers.get("referer"));
}

/**
 * True when `origin` may submit to `form`, and the value to echo in CORS.
 * A literal `["*"]` is the only wildcard form; `*` inside a mixed list is not
 * treated as a wildcard so a typo cannot open up a form.
 */
export function isOriginAllowed(form: OriginForm, origin: string | null | undefined): boolean {
  const normalized = normalizeOrigin(origin);
  if (!normalized) return true; // server-to-server call

  const entries = form.allowedOrigins ?? [];
  if (entries.length === 0) return EMPTY_ALLOWED_ORIGINS_POLICY === "allow";
  if (entries.length === 1 && entries[0]?.trim() === "*") return true;

  return entries.some((entry) => normalizeOrigin(entry) === normalized);
}

/** Headers for both OPTIONS and POST responses. Never includes credentials. */
export function corsHeaders(origin: string | null, allowed: boolean): Record<string, string> {
  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Idempotency-Key",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };

  if (!allowed) return headers;
  if (origin) {
    headers["Access-Control-Allow-Origin"] = origin;
  } else if (EMPTY_ALLOWED_ORIGINS_POLICY === "allow") {
    headers["Access-Control-Allow-Origin"] = "*";
  }
  return headers;
}

/**
 * Redirect target must be https (or http://localhost in development) and its
 * origin must be explicitly allowed or equal the request's own origin. An
 * empty allow-list does NOT permit arbitrary redirects.
 */
export function isRedirectAllowed(
  raw: string | null | undefined,
  form: OriginForm,
  requestOrigin: string | null,
  isDevelopment: boolean
): string | null {
  if (!raw || !raw.trim()) return null;

  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return null;
  }

  if (url.protocol !== "https:") {
    const localhostDev = isDevelopment && url.protocol === "http:" && url.hostname === "localhost";
    if (!localhostDev) return null;
  }

  const targetOrigin = url.origin;
  const allowed = (form.allowedOrigins ?? []).some(
    (entry) => normalizeOrigin(entry) === targetOrigin
  );
  if (!allowed && targetOrigin !== requestOrigin) return null;
  return url.toString();
}
