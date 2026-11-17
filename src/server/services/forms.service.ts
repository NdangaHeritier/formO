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

async function allocateUniqueEndpoint(
  tx: Prisma.TransactionClient,
  requestedEndpoint?: string
): Promise<string> {
  if (requestedEndpoint) {
    // Check across ALL ProjectForm rows (including soft-deleted) because endpoint is permanently unique
    const existing = await tx.projectForm.findUnique({
      where: { endpoint: requestedEndpoint },
      select: { id: true },
    });
    if (existing) {
      throw new HttpError(409, `Form endpoint "${requestedEndpoint}" is already in use`);
    }
    return requestedEndpoint;
  }

  for (let attempt = 0; attempt < 8; attempt++) {
    const candidate = generateFormEndpoint();
    const existing = await tx.projectForm.findUnique({
      where: { endpoint: candidate },
      select: { id: true },
    });
    if (!existing) {
      return candidate;
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
    emailTo: form.emailTo,
    email_to: form.emailTo,
    replyToField: form.replyToField,
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
    emailTo: form.emailTo,
    email_to: form.emailTo,
    replyToField: form.replyToField,
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
      ...created,
      email_to: created.emailTo,
      createdAt: created.createdAt.toISOString(),
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

    if (input.recipients !== undefined || input.emailTo !== undefined) {
      const recipientSet = new Map<string, { email: string; type: "to" | "cc" | "bcc" }>();
      recipientSet.set(`to:${updated.emailTo}`, { email: updated.emailTo, type: "to" });
      for (const r of input.recipients ?? []) {
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
      ...updated,
      email_to: updated.emailTo,
      createdAt: updated.createdAt.toISOString(),
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
