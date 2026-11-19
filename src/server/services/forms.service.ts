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
import { isUniqueConstraintError } from "@/server/services/submission.service";
import { getPreset, renderPresetHtml } from "@/server/services/template-presets";

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
      select: { id: true },
    });
    if (!smtp) {
      throw new HttpError(400, "Selected SMTP configuration does not belong to this workspace");
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

export async function getProjectFormDetail(formId: string) {
  const form = await prisma.projectForm.findFirst({
    where: {
      id: formId,
      deletedAt: null,
    },
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
    await verifyOrgResources(tx, organizationId, input.smtpConfigId, input.emailTemplateId);

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
      const previous = await tx.projectForm.findUnique({
        where: { id: formId },
        select: { emailTo: true, recipients: { select: { email: true, type: true } } },
      });
      const newEmail = updated.emailTo.trim().toLowerCase();

      const oldToRow = previous?.recipients.find(
        (r) => r.type === "to" && r.email.trim().toLowerCase() === previous.emailTo.trim().toLowerCase()
      );
      if (oldToRow) {
        await tx.formRecipient.update({
          where: { formId_email_type: { formId, email: oldToRow.email, type: oldToRow.type } },
          data: { email: newEmail },
        });
      } else {
        await tx.formRecipient.upsert({
          where: { formId_email_type: { formId, type: "to", email: newEmail } },
          create: { formId, email: newEmail, type: "to", isActive: true },
          update: { email: newEmail },
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
      where: { id: formId, deletedAt: null },
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
  const sealed = encryptSecret(input.password);

  return prisma.$transaction(async (tx) => {
    const smtpConfig = await tx.smtpConfig.create({
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
        targetId: smtpConfig.id,
        metadata: {
          name: smtpConfig.name,
          host: smtpConfig.host,
          port: smtpConfig.port,
        },
      },
    });

    return smtpConfig;
  });
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

  const password = decryptSecret({
    ciphertext: record.encryptedPassword,
    iv: record.iv,
    authTag: record.authTag,
    keyVersion: record.keyVersion,
  });

  const transporter = nodemailer.createTransport({
    host: record.host,
    port: record.port,
    secure: record.secure,
    auth: {
      user: record.username,
      pass: password,
    },
    connectionTimeout: 8_000,
    greetingTimeout: 8_000,
    socketTimeout: 10_000,
  });

  try {
    await transporter.verify();
  } catch (error) {
    throw new HttpError(
      400,
      `SMTP handshake failed: ${error instanceof Error ? error.message : "Unable to connect"}`
    );
  }

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
        subjectTemplate: input.subjectTemplate.trim(),
        htmlTemplate: input.htmlTemplate,
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
        select: { submissions: true },
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
        scopes: input.scopes ?? ["forms:write", "emails:send"],
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
export async function sendTemplateTestEmail(params: {
  organizationId: string;
  actorUserId: string;
  presetId?: string;
  templateId?: string;
  values: Record<string, unknown>;
  to: string;
  smtpConfigId: string;
}): Promise<{ sent: true; messageId: string | null }> {
  const smtp = await prisma.smtpConfig.findFirst({
    where: { id: params.smtpConfigId, organizationId: params.organizationId },
  });
  if (!smtp) throw new HttpError(404, "SMTP configuration not found");

  let subject: string;
  let html: string;

  if (params.templateId) {
    const template = await prisma.emailTemplate.findFirst({
      where: { id: params.templateId, organizationId: params.organizationId },
    });
    if (!template) throw new HttpError(404, "Template not found");
    subject = substituteTestValues(template.subjectTemplate, params.values, false);
    html = substituteTestValues(template.htmlTemplate, params.values, true);
  } else if (params.presetId) {
    const preset = getPreset(params.presetId);
    if (!preset) throw new HttpError(404, "Preset not found");
    subject = substituteTestValues(preset.subject, params.values, false);
    html = await renderPresetHtml(params.presetId, {
      ...(params.values as Record<string, string>),
      siteName: String(params.values.siteName ?? "FormO"),
    });
  } else {
    throw new HttpError(400, "A preset or template is required");
  }

  const password = decryptSecret({
    ciphertext: smtp.encryptedPassword,
    iv: smtp.iv,
    authTag: smtp.authTag,
    keyVersion: smtp.keyVersion,
  });
  const transporter = nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.secure,
    auth: { user: smtp.username, pass: password },
    connectionTimeout: 8_000,
    greetingTimeout: 8_000,
    socketTimeout: 12_000,
  });

  try {
    const info = await transporter.sendMail({
      from: smtp.fromEmail,
      to: params.to,
      subject: subject.replace(/[\r\n]+/g, " ").trim().slice(0, 200) || "FormO test email",
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
        metadata: { to: params.to },
      },
    });

    return { sent: true, messageId: info.messageId ?? null };
  } finally {
    transporter.close();
  }
}
