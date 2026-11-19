import { z } from "zod";

export const SUBMISSION_STATUSES = ["pending", "sent", "failed", "spam"] as const;

export const listSubmissionsSchema = z
  .object({
    status: z.enum(SUBMISSION_STATUSES).optional(),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    cursor: z.string().min(1).max(500).optional(),
  })
  .strict();

export const listPaginationSchema = z
  .object({
    limit: z.coerce.number().int().min(1).max(100).default(20),
    cursor: z.string().min(1).max(500).optional(),
  })
  .strict();

export type SubmissionCursor = { createdAt: string; id: string };

/** Opaque keyset cursor for the composite (created_at, id) primary key. */
export function encodeCursor(cursor: SubmissionCursor): string {
  return Buffer.from(JSON.stringify(cursor)).toString("base64url");
}

export function decodeCursor(raw: string | undefined): SubmissionCursor | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(Buffer.from(raw, "base64url").toString("utf8"));
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      !("createdAt" in parsed) ||
      !("id" in parsed) ||
      typeof parsed.createdAt !== "string" ||
      typeof parsed.id !== "string" ||
      Number.isNaN(Date.parse(parsed.createdAt))
    ) {
      return null;
    }
    return { createdAt: parsed.createdAt, id: parsed.id };
  } catch {
    return null;
  }
}

export type ParsedQuery<T> = { ok: true; value: T } | { ok: false; message: string };

export function parseListQuery<T>(
  schema: z.ZodType<T>,
  params: URLSearchParams
): ParsedQuery<T> {
  const parsed = schema.safeParse(Object.fromEntries(params));
  if (parsed.success) return { ok: true, value: parsed.data };
  return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid query" };
}
