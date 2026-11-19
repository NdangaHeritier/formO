import type { NextRequest } from "next/server";
import { HttpError } from "@/server/auth/authorization";

export const MAX_FIELDS = 100;
export const MAX_KEY_LENGTH = 100;
export const MAX_VALUE_LENGTH = 10_000;
export const MAX_NESTING = 3;

const RESERVED_STATIC = ["_redirect", "_subject", "cf-turnstile-response"] as const;
const UNSAFE_KEYS = new Set(["__proto__", "constructor", "prototype"]);

export type ParsedSubmission = {
  /** Clean string-only fields, safe to persist and interpolate. */
  data: Record<string, string>;
  reserved: {
    honeypot?: string;
    redirect?: string;
    subject?: string;
    turnstile?: string;
  };
  /** Number of ignored multipart file parts. Logged as a count, never a value. */
  fileParts: number;
  wasJson: boolean;
};

/** Reads the body a chunk at a time and aborts as soon as the cap is crossed. */
export async function readBodyBytes(request: NextRequest, cap: number): Promise<Uint8Array<ArrayBuffer>> {
  const declared = Number(request.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > cap) {
    throw new HttpError(413, "Submission body is too large");
  }

  const reader = request.body?.getReader();
  if (!reader) return new Uint8Array(0);

  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > cap) {
        await reader.cancel().catch(() => undefined);
        throw new HttpError(413, "Submission body is too large");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const output = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    output.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return output;
}

function assertDepth(value: unknown, depth: number): void {
  const isContainer =
    Array.isArray(value) || (value !== null && typeof value === "object");
  if (isContainer && depth > MAX_NESTING) {
    throw new HttpError(422, "Submission data is nested too deeply");
  }
  if (Array.isArray(value)) {
    for (const item of value) assertDepth(item, depth + 1);
  } else if (value !== null && typeof value === "object") {
    for (const nested of Object.values(value as Record<string, unknown>)) {
      assertDepth(nested, depth + 1);
    }
  }
}

/** Flattens any JSON value to a bounded string; nested objects use JSON syntax. */
function flattenValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") {
    if (value.length > MAX_VALUE_LENGTH) {
      throw new HttpError(422, "Submission field value is too long");
    }
    return value;
  }
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  const json = JSON.stringify(value);
  if (json === undefined) return "";
  if (json.length > MAX_VALUE_LENGTH) {
    throw new HttpError(422, "Submission field value is too long");
  }
  return json;
}

function assignField(
  target: Record<string, unknown>,
  key: string,
  value: string,
  seen: Set<string>
): void {
  if (UNSAFE_KEYS.has(key)) return;
  if (key.length > MAX_KEY_LENGTH) throw new HttpError(422, "Submission field name is too long");
  if (!seen.has(key)) {
    if (seen.size >= MAX_FIELDS) throw new HttpError(422, "Too many submission fields");
    seen.add(key);
  }
  target[key] = value;
}

/**
 * Parses JSON, urlencoded or multipart bodies under a hard byte budget.
 * File parts in multipart bodies are counted but never read into `data`.
 */
export async function parseSubmissionBody(
  request: NextRequest,
  maxBytes: number,
  honeypotField: string | null | undefined,
  preloadedBytes?: Uint8Array<ArrayBuffer>
): Promise<ParsedSubmission> {
  const contentType = request.headers.get("content-type")?.toLowerCase() ?? "";
  const bytes = preloadedBytes ?? (await readBodyBytes(request, maxBytes));

  let raw: Record<string, unknown> = Object.create(null) as Record<string, unknown>;
  let fileParts = 0;
  let wasJson = false;

  if (contentType.includes("multipart/form-data")) {
    // Rebuilding a Request keeps the multipart boundary while still enforcing
    // the byte cap above; request.formData() itself buffers without a cap.
    const replay = new Request(request.url, {
      method: "POST",
      headers: { "content-type": request.headers.get("content-type") ?? "" },
      body: new Blob([bytes]),
    });
    let form: FormData;
    try {
      form = await replay.formData();
    } catch {
      throw new HttpError(400, "Malformed multipart body");
    }
    const seen = new Set<string>();
    let fieldCount = 0;
    for (const [key, value] of form.entries()) {
      if (typeof value !== "string") {
        fileParts += 1;
        continue;
      }
      fieldCount += 1;
      if (fieldCount > MAX_FIELDS) throw new HttpError(422, "Too many submission fields");
      assignField(raw, key, value, seen);
    }
  } else {
    const text = new TextDecoder().decode(bytes);

    if (contentType.includes("application/json")) {
      wasJson = true;
      try {
        const parsed: unknown = JSON.parse(text || "{}");
        if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
          throw new HttpError(400, "Submission must be a JSON object");
        }
        assertDepth(parsed, 1);
        raw = parsed as Record<string, unknown>;
      } catch (error) {
        if (error instanceof HttpError) throw error;
        throw new HttpError(400, "Malformed JSON body");
      }
    } else if (contentType.includes("application/x-www-form-urlencoded")) {
      raw = Object.create(null) as Record<string, unknown>;
      try {
        for (const [key, value] of new URLSearchParams(text)) {
          raw[key] = value;
        }
      } catch {
        throw new HttpError(400, "Malformed form body");
      }
    } else {
      throw new HttpError(415, "Unsupported Content-Type");
    }
  }

  let count = 0;
  for (const key of Object.keys(raw)) {
    if (UNSAFE_KEYS.has(key)) continue;
    count += 1;
    if (count > MAX_FIELDS) throw new HttpError(422, "Too many submission fields");
  }

  const data: Record<string, string> = Object.create(null) as Record<string, string>;
  const seen = new Set<string>();
  const reserved: ParsedSubmission["reserved"] = {};

  for (const [key, value] of Object.entries(raw)) {
    if (UNSAFE_KEYS.has(key)) continue;
    const text = flattenValue(value);
    if (honeypotField && key === honeypotField) {
      reserved.honeypot = text;
      continue;
    }
    if ((RESERVED_STATIC as readonly string[]).includes(key)) {
      if (key === "_redirect") reserved.redirect = text;
      else if (key === "_subject") reserved.subject = text;
      else reserved.turnstile = text;
      continue;
    }
    assignField(data, key, text, seen);
  }

  return { data, reserved, fileParts, wasJson };
}
