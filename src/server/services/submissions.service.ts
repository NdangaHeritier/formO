import type { NextRequest } from "next/server";
import { hmacDigest } from "@/lib/crypto";
import { prisma } from "@/lib/prisma";
import { HttpError } from "@/server/auth/authorization";
import { ensureMonthlyPartitions } from "@/server/services/partitions.service";
import {
  corsHeaders,
  getRequestOrigin,
  isOriginAllowed,
  isRedirectAllowed,
} from "@/server/submissions/origin";
import { parseSubmissionBody, readBodyBytes } from "@/server/submissions/parse-body";
import { enforceRateLimits, ipHashHex } from "@/server/submissions/rate-limit";
import { verifyTurnstile } from "@/server/submissions/turnstile";

const IDEMPOTENCY_TTL_MS = 24 * 60 * 60_000;
const DEFAULT_THANKS_PATH = "/f/thanks";

export type SubmissionOutcome = {
  status: number;
  body?: Record<string, unknown>;
  headers: Record<string, string>;
  location?: string;
};

function clientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    "unknown"
  );
}

function todayUtc(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

function isUniqueViolation(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "P2002";
}

function outcome(
  status: number,
  headers: Record<string, string>,
  body?: Record<string, unknown>,
  location?: string
): SubmissionOutcome {
  return { status, headers, body, location };
}

/** Active recipients, falling back to the form's primary address. */
function deliveryRecipients(form: {
  emailTo: string;
  recipients: Array<{ email: string; isActive: boolean }>;
}): string[] {
  const active = form.recipients.filter((recipient) => recipient.isActive).map((r) => r.email);
  return active.length > 0 ? [...new Set(active)] : [form.emailTo];
}

/**
 * Public submission entrypoint. Everything is validated and persisted here;
 * no SMTP call happens on the visitor's request path.
 */
export async function acceptSubmission(
  request: NextRequest,
  endpoint: string
): Promise<SubmissionOutcome> {
  const origin = getRequestOrigin(request.headers);
  const headersFor = (allowed: boolean) => corsHeaders(origin, allowed);

  // 1. Form lookup â€” distinguish unknown from disabled/deleted.
  const form = await prisma.projectForm.findUnique({
    where: { endpoint },
    include: {
      recipients: { where: { isActive: true }, orderBy: { createdAt: "asc" } },
      project: { include: { organization: { select: { name: true } } } },
    },
  });
  if (!form) {
    return outcome(404, headersFor(true), { error: "Form not found" });
  }
  if (form.deletedAt || !form.isActive) {
    return outcome(410, headersFor(true), { error: "Form is no longer accepting submissions" });
  }

  const originAllowed = isOriginAllowed(form, origin);
  const baseHeaders = headersFor(originAllowed);
  if (!originAllowed) {
    return outcome(403, baseHeaders, { error: "Origin is not allowed" });
  }

  // 2. Size cap: Content-Length first, then a bounded stream read. Nothing is
  //    parsed until this passes.
  let bodyBytes: Uint8Array<ArrayBuffer>;
  try {
    bodyBytes = await readBodyBytes(request, form.maxPayloadBytes);
  } catch (error) {
    if (error instanceof HttpError) {
      return outcome(error.status, baseHeaders, { error: error.message });
    }
    throw error;
  }

  // 4. Two rate-limit buckets.
  const ip = clientIp(request);
  const retryAfter = await enforceRateLimits(form.id, ip);
  if (retryAfter !== null) {
    return outcome(429, { ...baseHeaders, "Retry-After": String(retryAfter) }, {
      error: "Too many submissions. Please try again later.",
    });
  }

  // 5. Parse by content type; 6. reserved fields are removed in the parser.
  let parsed;
  try {
    parsed = await parseSubmissionBody(request, form.maxPayloadBytes, form.honeypotField, bodyBytes);
  } catch (error) {
    if (error instanceof HttpError) {
      return outcome(error.status, baseHeaders, { error: error.message });
    }
    throw error;
  }
  const { data, reserved, wasJson } = parsed;

  // 7. Honeypot: same success response, spam row, no deliveries.
  if (form.honeypotField && reserved.honeypot && reserved.honeypot.trim() !== "") {
    await ensureMonthlyPartitions(3);
    const spam = await prisma.$transaction(async (tx) => {
      const created = await tx.formSubmission.create({
        data: {
          formId: form.id,
          status: "spam",
          data,
          origin,
          ipHash: Buffer.from(hmacDigest(ip)),
          userAgent: request.headers.get("user-agent")?.slice(0, 255) ?? null,
        },
        select: { id: true },
      });
      await tx.formDailyStat.upsert({
        where: { formId_statDate: { formId: form.id, statDate: todayUtc() } },
        create: { formId: form.id, statDate: todayUtc(), spamCount: 1 },
        update: { spamCount: { increment: 1 } },
      });
      return created;
    });
    // Identical success shape and id so a bot cannot tell spam from real.
    return successOutcome(
      request,
      wasJson,
      baseHeaders,
      form,
      origin,
      { id: spam.id, duplicate: false },
      reserved.redirect
    );
  }

  // 8. Turnstile â€” fail closed.
  if (form.requireTurnstile) {
    try {
      await verifyTurnstile(reserved.turnstile, ip);
    } catch (error) {
      if (error instanceof HttpError) {
        return outcome(error.status, baseHeaders, { error: error.message });
      }
      throw error;
    }
  }

  // 9. A submission must carry at least one non-empty field.
  if (!Object.values(data).some((value) => value.trim() !== "")) {
    return outcome(422, baseHeaders, { error: "Submission is empty" });
  }

  // 11. Idempotency key validation and early replay.
  const rawKey = request.headers.get("idempotency-key")?.trim();
  if (rawKey && (rawKey.length > 128 || /[\u0000-\u001f]/.test(rawKey))) {
    return outcome(400, baseHeaders, { error: "Idempotency-Key is invalid" });
  }
  const idempotencyKey = rawKey || null;

  if (idempotencyKey) {
    const previous = await prisma.submissionIdempotencyKey.findUnique({
      where: { formId_idempotencyKey: { formId: form.id, idempotencyKey } },
      select: { submissionId: true, expiresAt: true },
    });
    if (previous && previous.expiresAt.getTime() > Date.now()) {
      return successOutcome(
        request,
        wasJson,
        baseHeaders,
        form,
        origin,
        { id: previous.submissionId, duplicate: true },
        reserved.redirect
      );
    }
  }

  await ensureMonthlyPartitions(3);

  const recipients = deliveryRecipients(form);
  const userAgent = request.headers.get("user-agent")?.slice(0, 255) ?? null;
  const ipBytes = Buffer.from(hmacDigest(ip));

  try {
    const submission = await prisma.$transaction(
      async (tx) => {
        const created = await tx.formSubmission.create({
          data: {
            formId: form.id,
            status: "pending",
            data,
            origin,
            ipHash: ipBytes,
            userAgent,
          },
          select: { id: true, createdAt: true },
        });

        for (const email of recipients) {
          const delivery = await tx.emailDeliveryLog.create({
            data: {
              submissionId: created.id,
              submissionCreatedAt: created.createdAt,
              recipientEmail: email,
              status: "pending",
              nextRetryAt: new Date(),
            },
            select: { id: true, createdAt: true },
          });
          await tx.emailEvent.create({
            data: {
              deliveryId: delivery.id,
              deliveryCreatedAt: delivery.createdAt,
              eventType: "queued",
            },
          });
        }

        if (idempotencyKey) {
          // An expired row is treated as absent.
          await tx.submissionIdempotencyKey.deleteMany({
            where: { formId: form.id, idempotencyKey, expiresAt: { lte: new Date() } },
          });
          await tx.submissionIdempotencyKey.create({
            data: {
              formId: form.id,
              idempotencyKey,
              submissionId: created.id,
              submissionCreatedAt: created.createdAt,
              expiresAt: new Date(Date.now() + IDEMPOTENCY_TTL_MS),
            },
          });
        }

        await tx.formDailyStat.upsert({
          where: { formId_statDate: { formId: form.id, statDate: todayUtc() } },
          create: { formId: form.id, statDate: todayUtc(), acceptedCount: 1 },
          update: { acceptedCount: { increment: 1 } },
        });

        return created;
      },
      { timeout: 10_000 }
    );

    return successOutcome(
      request,
      wasJson,
      baseHeaders,
      form,
      origin,
      { id: submission.id, duplicate: false },
      reserved.redirect
    );
  } catch (error) {
    if (idempotencyKey && isUniqueViolation(error)) {
      const previous = await prisma.submissionIdempotencyKey.findUnique({
        where: { formId_idempotencyKey: { formId: form.id, idempotencyKey } },
        select: { submissionId: true, expiresAt: true },
      });
      if (previous && previous.expiresAt.getTime() > Date.now()) {
        return successOutcome(
          request,
          wasJson,
          baseHeaders,
          form,
          origin,
          { id: previous.submissionId, duplicate: true },
          reserved.redirect
        );
      }
    }
    throw error;
  }
}

/** JSON for API callers; a safe 303 redirect for plain HTML form posts. */
function successOutcome(
  request: NextRequest,
  wasJson: boolean,
  headers: Record<string, string>,
  form: { allowedOrigins: string[] },
  origin: string | null,
  identity: { id: string; duplicate: boolean } | null,
  redirectTarget: string | undefined
): SubmissionOutcome {
  const acceptsJson = request.headers.get("accept")?.includes("application/json") ?? false;
  if (acceptsJson || wasJson) {
    return outcome(200, headers, {
      ok: true,
      ...(identity ? { id: identity.id, ...(identity.duplicate ? { duplicate: true } : {}) } : {}),
    });
  }

  const allowedRedirect = isRedirectAllowed(
    redirectTarget,
    form,
    origin,
    process.env.NODE_ENV === "development"
  );
  return outcome(303, headers, undefined, allowedRedirect ?? DEFAULT_THANKS_PATH);
}

