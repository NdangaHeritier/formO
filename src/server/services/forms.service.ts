import nodemailer from "nodemailer";
import type { Prisma } from "@/generated/prisma/client";
import {
  decryptSecret,
  encryptSecret,
  generateApiKey,
  generateFormEndpoint,
} from "@/lib/crypto";
import { prisma } from "@/lib/prisma";
import type {
  CreateApiKeyInput,
  CreateEmailTemplateInput,
  CreateFormInput,
  CreateSmtpConfigInput,
  UpdateFormInput,
} from "@/lib/validation/forms";
import { HttpError } from "@/server/auth/authorization";
import { isUniqueConstraintError } from "@/lib/prisma";
import { getPreset, renderPresetHtml } from "@/server/services/template-presets";
import { getCachedTransporter } from "@/server/services/delivery.service";
import { stripCrlf } from "@/server/submissions/render-email";
import {
  assertSmtpEndpoint,
  connectionTarget,
  resolveSmtpEndpoint,
  SmtpEndpointError,
} from "@/lib/smtp-guard";
import { getServerEnv } from "@/lib/env";
import { sanitizeTemplateHtml, sanitizeTemplateSubject } from "@/lib/template-sanitize";

async function assertSmtpAllowed(host: string, port: number): Promise<void> {
  try {
    await assertSmtpEndpoint(host, port, {
      allowLocal: getServerEnv().FORMO_ALLOW_LOCAL_SMTP,
    });
  } catch (error) {
    if (error instanceof SmtpEndpointError) throw new HttpError(400, error.message);
    throw error;
  }
}

const SMTP_ERROR_MAX_LENGTH = 300;

/**
 * SMTP servers often echo parts of the conversation — sometimes credentials —
 * in their error text. Never hand a raw transport error to the UI: flatten line
 * breaks, cap the length and redact password-like values first.
 */
export function sanitizeSmtpError(raw: unknown): string {
  const original =
    raw instanceof Error
      ? raw.message
      : typeof raw === "string"
        ? raw
        : raw === null || raw === undefined
          ? ""
          : String(raw);

  const flattened = stripCrlf(original).replace(/\s+/g, " ").trim();
  if (!flattened) return "Unable to connect to the SMTP server";

  return flattened
    .replace(/\b(pass(?:word)?|pwd|secret|token)\b\s*[:=]\s*["']?[^\s"',;]+/gi, "$1=[redacted]")
    .replace(/\b(AUTH\s+(?:PLAIN|LOGIN|XOAUTH2?))\s+[A-Za-z0-9+/=]+/gi, "$1 [redacted]")
    .replace(/\b[A-Za-z0-9+/=_-]{24,}\b/g, "[redacted]")
    .slice(0, SMTP_ERROR_MAX_LENGTH);
}

/** Pure verification gate shared by default-sender and form-sender assignment. */
export function canAssignSmtpSender(sender: { isVerified: boolean } | null): boolean {
  return sender !== null && sender.isVerified === true;
}

export function unverifiedSenderMessage(
  sender: { name: string; isVerified: boolean },
  usage: "workspace default sender" | "form sender"
): string {
  return `Sender "${sender.name}" is not verified. Verify it before assigning it as the ${usage}.`;
}

type SmtpVerificationTarget = {
  host: string;
  port: number;
  secure: boolean;
  username: string;
  encryptedPassword: Uint8Array;
  iv: Uint8Array;
  authTag: Uint8Array;
  keyVersion: number;
};

type SmtpVerificationOutcome = { ok: true } | { ok: false; message: string };

/**
 * Attempts a handshake without ever throwing a transport failure back into a
 * caller. The socket is pinned to the address the SSRF guard validated, so the
 * hostname cannot be re-resolved to a private address between check and connect.
 */
async function attemptSmtpVerification(
  target: SmtpVerificationTarget
): Promise<SmtpVerificationOutcome> {
  try {
    const endpoint = await resolveSmtpEndpoint(target.host, target.port, {
      allowLocal: getServerEnv().FORMO_ALLOW_LOCAL_SMTP,
    });
    const { host: pinnedHost, servername } = connectionTarget(endpoint);
    const transporter = nodemailer.createTransport({
      host: stripCrlf(pinnedHost),
      port: target.port,
      secure: target.secure,
      auth: {
        user: stripCrlf(target.username),
        pass: decryptSecret({
          ciphertext: target.encryptedPassword,
          iv: target.iv,
          authTag: target.authTag,
          keyVersion: target.keyVersion,
        }),
      },
      ...(servername ? { tls: { servername } } : {}),
      connectionTimeout: 8_000,
      greetingTimeout: 8_000,
      socketTimeout: 12_000,
    });

    try {
      await transporter.verify();
      return { ok: true };
    } finally {
      transporter.close();
    }
  } catch (error) {
    if (error instanceof SmtpEndpointError) {
      return { ok: false, message: error.message };
    }
    return { ok: false, message: `SMTP handshake failed: ${sanitizeSmtpError(error)}` };
  }
}

async function markSmtpVerified(
  smtpId: string,
  organizationId: string,
  actorUserId: string
): Promise<void> {
  await prisma.$transaction([
    prisma.smtpConfig.update({
      where: { id: smtpId },
      data: { isVerified: true },
    }),
    prisma.auditLog.create({
      data: {
        organizationId,
        actorUserId,
        action: "smtp_config.verified",
        targetType: "smtp_config",
        targetId: smtpId,
      },
    }),
  ]);
}

async function allocateUniqueEndpoint(
  tx: Prisma.TransactionClient,
  requestedEndpoint?: string
): Promise<string> {
  if (requestedEndpoint) {
    try {
      const existing = await tx.projectForm.findUnique({
        where: { endpoint: requestedEndpoint },
        select: { id: true },
      });
      if (existing) {
        throw new HttpError(409, `Form endpoint "${requestedEndpoint}" is already in use`);
      }
      return requestedEndpoint;
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new HttpError(409, `Form endpoint "${requestedEndpoint}" is already in use`);
      }
      throw error;
    }
  }

  for (let attempt = 0; attempt < 8; attempt++) {
    const candidate = generateFormEndpoint();
    try {
      const existing = await tx.projectForm.findUnique({
        where: { endpoint: candidate },
        select: { id: true },
      });
      if (!existing) {
        return candidate;
      }
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        continue;
      }
      throw error;
    }
  }

  throw new HttpError(500, "Failed to allocate a unique form endpoint");
}

async function verifyOrgResources(
  tx: Prisma.TransactionClient,
  organizationId: string,
  smtpConfigId?: string | null,
  emailTemplateId?: string | null
) {
  if (smtpConfigId) {
    const smtp = await tx.smtpConfig.findFirst({
      where: { id: smtpConfigId, organizationId },
      select: { id: true, name: true, isVerified: true },
    });
    if (!smtp) {
      throw new HttpError(400, "Selected SMTP configuration does not belong to this workspace");
    }
    if (!canAssignSmtpSender(smtp)) {
      throw new HttpError(400, unverifiedSenderMessage(smtp, "form sender"));
    }
  }

  if (emailTemplateId) {
    const tpl = await tx.emailTemplate.findFirst({
      where: { id: emailTemplateId, organizationId },
      select: { id: true },
    });
    if (!tpl) {
      throw new HttpError(400, "Selected email template does not belong to this workspace");
    }
  }
}

export async function listProjectForms(projectId: string) {
  const forms = await prisma.projectForm.findMany({
    where: {
      projectId,
      deletedAt: null,
    },
    include: {
      recipients: {
        where: { isActive: true },
        orderBy: { createdAt: "asc" },
      },
      _count: {
        select: { submissions: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return forms.map((form) => ({
    id: form.id,
    projectId: form.projectId,
    title: form.title,
    description: form.description,
    endpoint: form.endpoint,
    emailTo: form.emailTo,    replyToField: form.replyToField,
    customSubject: form.customSubject,
    allowedOrigins: form.allowedOrigins,
    honeypotField: form.honeypotField,
    requireTurnstile: form.requireTurnstile,
    maxPayloadBytes: form.maxPayloadBytes,
    isActive: form.isActive,
    smtpConfigId: form.smtpConfigId,
    emailTemplateId: form.emailTemplateId,
    recipients: form.recipients,
    submissionsCount: form._count.submissions,
    createdAt: form.createdAt.toISOString(),
    updatedAt: form.updatedAt.toISOString(),
    created: form.createdAt.toISOString(),
    updated: form.updatedAt.toISOString(),
  }));
}

/** Every form lookup is scoped to the caller's workspace, never just the id. */
function scopedFormWhere(formId: string, organizationId: string) {
  return { id: formId, deletedAt: null, project: { organizationId } } as const;
}

export async function getProjectFormDetail(formId: string, organizationId: string) {
  const form = await prisma.projectForm.findFirst({
    where: scopedFormWhere(formId, organizationId),
    include: {
      recipients: {
        orderBy: { createdAt: "asc" },
      },
      _count: {
        select: { submissions: true },
      },
    },
  });

  if (!form) {
    throw new HttpError(404, "Form not found");
  }

  return {
    id: form.id,
    projectId: form.projectId,
    title: form.title,
    description: form.description,
    endpoint: form.endpoint,
    emailTo: form.emailTo,    replyToField: form.replyToField,
    customSubject: form.customSubject,
    allowedOrigins: form.allowedOrigins,
    honeypotField: form.honeypotField,
    requireTurnstile: form.requireTurnstile,
    maxPayloadBytes: form.maxPayloadBytes,
    isActive: form.isActive,
    smtpConfigId: form.smtpConfigId,
    emailTemplateId: form.emailTemplateId,
    recipients: form.recipients,
    submissionsCount: form._count.submissions,
    createdAt: form.createdAt.toISOString(),
    updatedAt: form.updatedAt.toISOString(),
  };
}

export async function createProjectForm(params: {
  projectId: string;
  organizationId: string;
  actorUserId: string;
  input: CreateFormInput;
}) {
  const { projectId, organizationId, actorUserId, input } = params;

  return prisma.$transaction(async (tx) => {
    await verifyOrgResources(tx, organizationId, input.smtpConfigId, input.emailTemplateId);
    const endpoint = await allocateUniqueEndpoint(tx, input.endpoint?.trim() || undefined);

    const created = await tx.projectForm.create({
      data: {
        projectId,
        title: input.title.trim(),
        description: input.description?.trim() || null,
        endpoint,
        emailTo: input.emailTo.trim().toLowerCase(),
        replyToField: input.replyToField?.trim() || null,
        customSubject: input.customSubject?.trim() || null,
        allowedOrigins: input.allowedOrigins ?? [],
        honeypotField:
          input.honeypotField === undefined ? "_gotcha" : input.honeypotField?.trim() || null,
        requireTurnstile: input.requireTurnstile ?? false,
        maxPayloadBytes: input.maxPayloadBytes ?? 65536,
        isActive: input.isActive ?? true,
        smtpConfigId: input.smtpConfigId ?? null,
        emailTemplateId: input.emailTemplateId ?? null,
      },
    });

    const recipientSet = new Map<string, { email: string; type: "to" | "cc" | "bcc" }>();
    recipientSet.set(`to:${created.emailTo}`, { email: created.emailTo, type: "to" });
    for (const r of input.recipients ?? []) {
      const normalized = r.email.trim().toLowerCase();
      recipientSet.set(`${r.type}:${normalized}`, { email: normalized, type: r.type });
    }

    await tx.formRecipient.createMany({
      data: Array.from(recipientSet.values()).map((r) => ({
        formId: created.id,
        email: r.email,
        type: r.type,
        isActive: true,
      })),
    });

    await tx.auditLog.create({
      data: {
        organizationId,
        actorUserId,
        action: "form.created",
        targetType: "project_form",
        targetId: created.id,
        metadata: {
          projectId,
          title: created.title,
          endpoint: created.endpoint,
        },
      },
    });

    return {
      ...created,      createdAt: created.createdAt.toISOString(),
      updatedAt: created.updatedAt.toISOString(),
    };
  });
}

export async function updateProjectForm(params: {
  formId: string;
  organizationId: string;
  actorUserId: string;
  input: UpdateFormInput;
}) {
  const { formId, organizationId, actorUserId, input } = params;

  return prisma.$transaction(async (tx) => {
    const scoped = await tx.projectForm.findFirst({
      where: scopedFormWhere(formId, organizationId),
      select: { id: true },
    });
    if (!scoped) throw new HttpError(404, "Form not found");

    await verifyOrgResources(tx, organizationId, input.smtpConfigId, input.emailTemplateId);

    // Read the old primary address BEFORE the update; reading it afterwards
    // returns the new value and would create a duplicate `to` recipient.
    const previousEmailTo =
      input.emailTo !== undefined && input.recipients === undefined
        ? (
            await tx.projectForm.findUnique({
              where: { id: formId },
              select: { emailTo: true },
            })
          )?.emailTo
        : undefined;

    const updated = await tx.projectForm.update({
      where: { id: formId },
      data: {
        ...(input.title !== undefined ? { title: input.title.trim() } : {}),
        ...(input.description !== undefined
          ? { description: input.description?.trim() || null }
          : {}),
        ...(input.emailTo !== undefined ? { emailTo: input.emailTo.trim().toLowerCase() } : {}),
        ...(input.replyToField !== undefined
          ? { replyToField: input.replyToField?.trim() || null }
          : {}),
        ...(input.customSubject !== undefined
          ? { customSubject: input.customSubject?.trim() || null }
          : {}),
        ...(input.allowedOrigins !== undefined ? { allowedOrigins: input.allowedOrigins } : {}),
        ...(input.honeypotField !== undefined
          ? { honeypotField: input.honeypotField?.trim() || null }
          : {}),
        ...(input.requireTurnstile !== undefined
          ? { requireTurnstile: input.requireTurnstile }
          : {}),
        ...(input.maxPayloadBytes !== undefined ? { maxPayloadBytes: input.maxPayloadBytes } : {}),
        ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
        ...(input.smtpConfigId !== undefined ? { smtpConfigId: input.smtpConfigId } : {}),
        ...(input.emailTemplateId !== undefined ? { emailTemplateId: input.emailTemplateId } : {}),
      },
    });

    if (input.recipients !== undefined) {
      // Recipients were explicitly provided: replace the entire recipient list.
      const recipientSet = new Map<string, { email: string; type: "to" | "cc" | "bcc" }>();
      recipientSet.set(`to:${updated.emailTo}`, { email: updated.emailTo, type: "to" });
      for (const r of input.recipients) {
        const normalized = r.email.trim().toLowerCase();
        recipientSet.set(`${r.type}:${normalized}`, { email: normalized, type: r.type });
      }

      await tx.formRecipient.deleteMany({ where: { formId } });
      await tx.formRecipient.createMany({
        data: Array.from(recipientSet.values()).map((r) => ({
          formId,
          email: r.email,
          type: r.type,
          isActive: true,
        })),
      });
    } else if (input.emailTo !== undefined) {
      // Only the primary "to" address changed: update the existing "to" row,
      // leaving CC and BCC recipients untouched.
      const newEmail = updated.emailTo.trim().toLowerCase();
      const oldEmail = previousEmailTo?.trim().toLowerCase();
      if (oldEmail && oldEmail !== newEmail) {
        await tx.formRecipient
          .update({
            where: {
              formId_email_type: { formId, email: oldEmail, type: "to" },
            },
            data: { email: newEmail },
          })
          .catch(async () => {
            // Old row gone (e.g. earlier partial write): make sure exactly one
            // primary recipient exists at the new address.
            await tx.formRecipient.upsert({
              where: { formId_email_type: { formId, type: "to", email: newEmail } },
              create: { formId, email: newEmail, type: "to", isActive: true },
              update: {},
            });
          });
      } else {
        await tx.formRecipient.upsert({
          where: { formId_email_type: { formId, type: "to", email: newEmail } },
          create: { formId, email: newEmail, type: "to", isActive: true },
          update: {},
        });
      }
    }

    await tx.auditLog.create({
      data: {
        organizationId,
        actorUserId,
        action: "form.updated",
        targetType: "project_form",
        targetId: updated.id,
        metadata: {
          updatedFields: Object.keys(input),
        },
      },
    });

    return {
      ...updated,      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };
  });
}

export async function deleteProjectForm(params: {
  formId: string;
  organizationId: string;
  actorUserId: string;
}) {
  const { formId, organizationId, actorUserId } = params;
  const now = new Date();

  return prisma.$transaction(async (tx) => {
    const scoped = await tx.projectForm.findFirst({
      where: scopedFormWhere(formId, organizationId),
      select: { id: true },
    });
    if (!scoped) throw new HttpError(404, "Form not found");

    const updated = await tx.projectForm.update({
      where: { id: formId },
      data: {
        isActive: false,
        deletedAt: now,
      },
    });

    await tx.auditLog.create({
      data: {
        organizationId,
        actorUserId,
        action: "form.deleted",
        targetType: "project_form",
        targetId: formId,
        metadata: {
          title: updated.title,
          endpoint: updated.endpoint,
        },
      },
    });

    return {
      id: formId,
      deletedAt: now.toISOString(),
    };
  });
}

export async function rotateProjectFormEndpoint(params: {
  formId: string;
  organizationId: string;
  actorUserId: string;
}) {
  const { formId, organizationId, actorUserId } = params;

  return prisma.$transaction(async (tx) => {
    const existing = await tx.projectForm.findFirst({
      where: scopedFormWhere(formId, organizationId),
      select: { id: true, endpoint: true },
    });

    if (!existing) {
      throw new HttpError(404, "Form not found");
    }

    const newEndpoint = await allocateUniqueEndpoint(tx);

    const updated = await tx.projectForm.update({
      where: { id: formId },
      data: { endpoint: newEndpoint },
    });

    await tx.auditLog.create({
      data: {
        organizationId,
        actorUserId,
        action: "form.endpoint_rotated",
        targetType: "project_form",
        targetId: formId,
        metadata: {
          previousEndpoint: existing.endpoint,
          newEndpoint,
        },
      },
    });

    return {
      id: updated.id,
      endpoint: updated.endpoint,
      updatedAt: updated.updatedAt.toISOString(),
    };
  });
}

export async function listWorkspaceSmtpConfigs(organizationId: string) {
  return prisma.smtpConfig.findMany({
    where: { organizationId },
    // This list is admin-only: workspace admins own the transport and need the
    // full configuration. Non-admins cannot reach this service through the API.
    select: {
      id: true,
      name: true,
      host: true,
      port: true,
      secure: true,
      username: true,
      fromEmail: true,
      isVerified: true,
      isSystemDefault: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function createWorkspaceSmtpConfig(params: {
  organizationId: string;
  actorUserId: string;
  input: CreateSmtpConfigInput;
}) {
  const { organizationId, actorUserId, input } = params;
  await assertSmtpAllowed(input.host, input.port);
  const sealed = encryptSecret(input.password);

  // Creation (and its audit log) stays in one transaction. Verification runs
  // afterwards so an unreachable SMTP server can never roll back the sender.
  const smtpConfig = await prisma.$transaction(async (tx) => {
    const created = await tx.smtpConfig.create({
      data: {
        organizationId,
        name: input.name.trim(),
        host: input.host.trim(),
        port: input.port,
        secure: input.secure,
        username: input.username.trim(),
        encryptedPassword: sealed.ciphertext,
        iv: sealed.iv,
        authTag: sealed.authTag,
        keyVersion: sealed.keyVersion,
        fromEmail: input.fromEmail.trim().toLowerCase(),
        isVerified: false,
      },
      select: {
        id: true,
        name: true,
        host: true,
        port: true,
        secure: true,
        username: true,
        fromEmail: true,
        isVerified: true,
        createdAt: true,
      },
    });

    await tx.auditLog.create({
      data: {
        organizationId,
        actorUserId,
        action: "smtp_config.created",
        targetType: "smtp_config",
        targetId: created.id,
        metadata: {
          name: created.name,
          host: created.host,
          port: created.port,
        },
      },
    });

    return created;
  });

  const outcome = await attemptSmtpVerification({
    host: input.host.trim(),
    port: input.port,
    secure: input.secure,
    username: input.username.trim(),
    encryptedPassword: sealed.ciphertext,
    iv: sealed.iv,
    authTag: sealed.authTag,
    keyVersion: sealed.keyVersion,
  });

  if (outcome.ok) {
    try {
      await markSmtpVerified(smtpConfig.id, organizationId, actorUserId);
      return {
        ...smtpConfig,
        isVerified: true as const,
        verified: true as const,
        verificationError: null,
      };
    } catch (error) {
      // The sender is saved and the handshake worked: keep it, but never claim
      // a verification we could not record.
      console.error("[smtp] verification could not be recorded", {
        smtpId: smtpConfig.id,
        reason: error instanceof Error ? error.message : "unknown",
      });
      return {
        ...smtpConfig,
        verified: false as const,
        verificationError:
          "SMTP connection succeeded, but verification could not be recorded. Verify this sender again.",
      };
    }
  }

  // The sender is intentionally kept even when verification fails; the route
  // returns 201 with the message so the UI can tell the user what happened.
  return {
    ...smtpConfig,
    isVerified: false as const,
    verified: false as const,
    verificationError: outcome.message,
  };
}

export async function verifyWorkspaceSmtpConfig(params: {
  smtpId: string;
  organizationId: string;
  actorUserId: string;
}) {
  const { smtpId, organizationId, actorUserId } = params;

  const record = await prisma.smtpConfig.findFirst({
    where: { id: smtpId, organizationId },
  });

  if (!record) {
    throw new HttpError(404, "SMTP configuration not found");
  }

  const outcome = await attemptSmtpVerification(record);
  if (!outcome.ok) throw new HttpError(400, outcome.message);

  await markSmtpVerified(smtpId, organizationId, actorUserId);

  return { id: smtpId, verified: true };
}

export async function deleteWorkspaceSmtpConfig(params: {
  smtpId: string;
  organizationId: string;
  actorUserId: string;
}) {
  const { smtpId, organizationId, actorUserId } = params;

  const existing = await prisma.smtpConfig.findFirst({
    where: { id: smtpId, organizationId },
    select: { id: true, name: true },
  });

  if (!existing) {
    throw new HttpError(404, "SMTP configuration not found");
  }
  if ((await prisma.projectForm.count({ where: { smtpConfigId: smtpId } })) > 0) {
    throw new HttpError(409, "SMTP configuration is used by one or more forms");
  }

  await prisma.$transaction([
    prisma.smtpConfig.delete({ where: { id: smtpId } }),
    prisma.auditLog.create({
      data: {
        organizationId,
        actorUserId,
        action: "smtp_config.deleted",
        targetType: "smtp_config",
        targetId: smtpId,
        metadata: { name: existing.name },
      },
    }),
  ]);

  return { id: smtpId };
}

/** Edits a saved sender. Any change invalidates its previous verification. */
export async function updateWorkspaceSmtpConfig(params: {
  smtpId: string;
  organizationId: string;
  actorUserId: string;
  input: Partial<CreateSmtpConfigInput>;
}) {
  const { smtpId, organizationId, actorUserId, input } = params;

  const existing = await prisma.smtpConfig.findFirst({
    where: { id: smtpId, organizationId },
    select: { id: true, name: true, host: true, port: true },
  });
  if (!existing) throw new HttpError(404, "SMTP configuration not found");

  if (input.host !== undefined || input.port !== undefined) {
    await assertSmtpAllowed(input.host?.trim() ?? existing.host, input.port ?? existing.port);
  }

  const sealed = input.password !== undefined ? encryptSecret(input.password) : null;
  const data: Prisma.SmtpConfigUpdateInput = {
    ...(input.name !== undefined ? { name: input.name.trim() } : {}),
    ...(input.host !== undefined ? { host: input.host.trim() } : {}),
    ...(input.port !== undefined ? { port: input.port } : {}),
    ...(input.secure !== undefined ? { secure: input.secure } : {}),
    ...(input.username !== undefined ? { username: input.username.trim() } : {}),
    ...(input.fromEmail !== undefined ? { fromEmail: input.fromEmail.trim().toLowerCase() } : {}),
    ...(sealed
      ? {
          encryptedPassword: sealed.ciphertext,
          iv: sealed.iv,
          authTag: sealed.authTag,
          keyVersion: sealed.keyVersion,
        }
      : {}),
    isVerified: false,
  };

  await prisma.$transaction([
    prisma.smtpConfig.update({ where: { id: smtpId }, data }),
    prisma.auditLog.create({
      data: {
        organizationId,
        actorUserId,
        action: "smtp_config.updated",
        targetType: "smtp_config",
        targetId: smtpId,
        // Field names only — never the password value itself.
        metadata: { name: existing.name, updatedFields: Object.keys(input) },
      },
    }),
  ]);

  return prisma.smtpConfig.findUnique({
    where: { id: smtpId },
    select: {
      id: true,
      name: true,
      host: true,
      port: true,
      secure: true,
      username: true,
      fromEmail: true,
      isVerified: true,
    },
  });
}

/** Set (or clear) the workspace-level sender used when a form has no explicit
 *  sender. System SMTP from the environment remains the final fallback. */
export async function setWorkspaceDefaultSmtp(params: {
  organizationId: string;
  actorUserId: string;
  smtpConfigId: string | null;
}) {
  const { organizationId, actorUserId, smtpConfigId } = params;

  return prisma.$transaction(async (tx) => {
    if (smtpConfigId) {
      const existing = await tx.smtpConfig.findFirst({
        where: { id: smtpConfigId, organizationId },
        select: { id: true, name: true, isVerified: true },
      });
      if (!existing) throw new HttpError(404, "SMTP configuration not found");
      if (!canAssignSmtpSender(existing)) {
        throw new HttpError(400, unverifiedSenderMessage(existing, "workspace default sender"));
      }
    }

    await tx.smtpConfig.updateMany({
      where: { organizationId, isSystemDefault: true },
      data: { isSystemDefault: false },
    });
    if (smtpConfigId) {
      await tx.smtpConfig.update({
        where: { id: smtpConfigId },
        data: { isSystemDefault: true },
      });
    }

    await tx.auditLog.create({
      data: {
        organizationId,
        actorUserId,
        action: "smtp_config.default_changed",
        targetType: "smtp_config",
        targetId: smtpConfigId,
        metadata: { smtpConfigId },
      },
    });

    return { smtpConfigId };
  });
}

export async function listWorkspaceEmailTemplates(organizationId: string) {
  return prisma.emailTemplate.findMany({
    where: { organizationId },
    orderBy: { createdAt: "desc" },
  });
}

export async function createWorkspaceEmailTemplate(params: {
  organizationId: string;
  actorUserId: string;
  input: CreateEmailTemplateInput;
}) {
  const { organizationId, actorUserId, input } = params;

  return prisma.$transaction(async (tx) => {
    if (input.isDefault) {
      await tx.emailTemplate.updateMany({
        where: { organizationId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const template = await tx.emailTemplate.create({
      data: {
        organizationId,
        name: input.name.trim(),
        subjectTemplate: sanitizeTemplateSubject(input.subjectTemplate),
        htmlTemplate: sanitizeTemplateHtml(input.htmlTemplate),
        isDefault: input.isDefault ?? false,
      },
    });

    await tx.auditLog.create({
      data: {
        organizationId,
        actorUserId,
        action: "email_template.created",
        targetType: "email_template",
        targetId: template.id,
        metadata: { name: template.name },
      },
    });

    return template;
  });
}

export async function deleteWorkspaceEmailTemplate(params: {
  templateId: string;
  organizationId: string;
  actorUserId: string;
}) {
  const { templateId, organizationId, actorUserId } = params;

  const existing = await prisma.emailTemplate.findFirst({
    where: { id: templateId, organizationId },
    select: { id: true, name: true },
  });

  if (!existing) {
    throw new HttpError(404, "Email template not found");
  }
  if ((await prisma.projectForm.count({ where: { emailTemplateId: templateId } })) > 0) {
    throw new HttpError(409, "Email template is used by one or more forms");
  }

  await prisma.$transaction([
    prisma.emailTemplate.delete({ where: { id: templateId } }),
    prisma.auditLog.create({
      data: {
        organizationId,
        actorUserId,
        action: "email_template.deleted",
        targetType: "email_template",
        targetId: templateId,
        metadata: { name: existing.name },
      },
    }),
  ]);

  return { id: templateId };
}

export async function listWorkspaceApiKeys(organizationId: string) {
  return prisma.apiKey.findMany({
    where: { organizationId },
    select: {
      id: true,
      name: true,
      keyPrefix: true,
      scopes: true,
      lastUsedAt: true,
      expiresAt: true,
      revokedAt: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function listWorkspaceForms(organizationId: string) {
  return prisma.projectForm.findMany({
    where: {
      deletedAt: null,
      project: {
        organizationId,
        deletedAt: null,
      },
    },
    select: {
      id: true,
      title: true,
      description: true,
      endpoint: true,
      emailTo: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      project: {
        select: { id: true, name: true, slug: true },
      },
      _count: {
        select: { submissions: true, recipients: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function createWorkspaceApiKey(params: {
  organizationId: string;
  actorUserId: string;
  input: CreateApiKeyInput;
}) {
  const { organizationId, actorUserId, input } = params;
  const generated = generateApiKey();

  return prisma.$transaction(async (tx) => {
    const apiKey = await tx.apiKey.create({
      data: {
        organizationId,
        createdById: actorUserId,
        name: input.name.trim(),
        keyPrefix: generated.keyPrefix,
        keyHash: generated.keyHash,
        scopes: input.scopes ?? ["forms:read"],
        expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
      },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        scopes: true,
        expiresAt: true,
        revokedAt: true,
        createdAt: true,
      },
    });

    await tx.auditLog.create({
      data: {
        organizationId,
        actorUserId,
        action: "api_key.created",
        targetType: "api_key",
        targetId: apiKey.id,
        metadata: {
          name: apiKey.name,
          keyPrefix: apiKey.keyPrefix,
        },
      },
    });

    return {
      ...apiKey,
      rawKey: generated.rawKey,
    };
  });
}

export async function revokeWorkspaceApiKey(params: {
  keyId: string;
  organizationId: string;
  actorUserId: string;
}) {
  const { keyId, organizationId, actorUserId } = params;
  const now = new Date();

  const existing = await prisma.apiKey.findFirst({
    where: { id: keyId, organizationId },
    select: { id: true, name: true, keyPrefix: true },
  });

  if (!existing) {
    throw new HttpError(404, "API key not found");
  }

  await prisma.$transaction([
    prisma.apiKey.update({
      where: { id: keyId },
      data: { revokedAt: now },
    }),
    prisma.auditLog.create({
      data: {
        organizationId,
        actorUserId,
        action: "api_key.revoked",
        targetType: "api_key",
        targetId: keyId,
        metadata: {
          name: existing.name,
          keyPrefix: existing.keyPrefix,
        },
      },
    }),
  ]);

  return { id: keyId, revokedAt: now.toISOString() };
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character] ?? character;
  });
}

/** Only {{token}} substitution — no template logic or expression evaluation. */
function substituteTestValues(input: string, values: Record<string, unknown>, forHtml: boolean): string {
  return input.replace(/\{\{\s*([\w.\-]+)\s*\}\}/g, (_match, token: string) => {
    const raw = values[token];
    const text = raw === null || raw === undefined ? "" : String(raw);
    return forHtml ? escapeHtml(text) : text;
  });
}

/**
 * Sends a test delivery for a saved template or a preset. Uses the workspace's
 * own SMTP config; nothing is sent on the public submission path.
 */
/** Fixed sample data only — never values from the request body. */
const TEST_SAMPLE_VALUES: Record<string, string> = {
  name: "Sample Sender",
  email: "sample@example.test",
  message: "This is sample data used to preview this template.",
};

export async function sendTemplateTestEmail(params: {
  organizationId: string;
  actorUserId: string;
  userEmail: string;
  presetId?: string;
  templateId?: string;
  smtpConfigId: string;
}): Promise<{ sent: true; messageId: string | null }> {
  const smtp = await prisma.smtpConfig.findFirst({
    where: { id: params.smtpConfigId, organizationId: params.organizationId },
  });
  if (!smtp) throw new HttpError(404, "SMTP configuration not found");

  // The destination is the caller's own verified address; a body-supplied
  // recipient is never read, so this endpoint cannot become an open relay.
  const to = stripCrlf(params.userEmail).trim();
  if (!to || !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(to)) {
    throw new HttpError(400, "A verified email address is required");
  }

  let subject: string;
  let html: string;
  const sample = { ...TEST_SAMPLE_VALUES };

  if (params.templateId) {
    const template = await prisma.emailTemplate.findFirst({
      where: { id: params.templateId, organizationId: params.organizationId },
    });
    if (!template) throw new HttpError(404, "Template not found");
    subject = substituteTestValues(template.subjectTemplate, sample, false);
    html = substituteTestValues(template.htmlTemplate, sample, true);
  } else if (params.presetId) {
    const preset = getPreset(params.presetId);
    if (!preset) throw new HttpError(404, "Preset not found");
    subject = substituteTestValues(preset.subject, sample, false);
    html = await renderPresetHtml(params.presetId, {
      ...sample,
      siteName: "FormO",
    });
  } else {
    throw new HttpError(400, "A preset or template is required");
  }

  await assertSmtpAllowed(smtp.host, smtp.port);
  const cache = new Map<string, Awaited<ReturnType<typeof getCachedTransporter>>>();
  const transporter = await getCachedTransporter(cache, smtp);

  try {
    const info = await transporter.sendMail({
      from: stripCrlf(smtp.fromEmail),
      to,
      subject: stripCrlf(subject).trim().slice(0, 200) || "FormO test email",
      html,
      text: html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 20_000),
    });

    await prisma.auditLog.create({
      data: {
        organizationId: params.organizationId,
        actorUserId: params.actorUserId,
        action: "email_template.test_sent",
        targetType: "email_template",
        targetId: params.templateId ?? params.presetId ?? null,
        metadata: { to },
      },
    });

    return { sent: true, messageId: info.messageId ?? null };
  } finally {
    transporter.close();
  }
}
