import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { HttpError } from "@/server/auth/authorization";
import type { TemplateDesign } from "@/lib/template-design";
import { sanitizeTemplateHtml, sanitizeTemplateSubject } from "@/lib/template-sanitize";

export type UpdateEmailTemplateInput = {
  name?: string;
  subjectTemplate?: string;
  htmlTemplate?: string;
  design?: TemplateDesign;
  isDefault?: boolean;
};

export async function getWorkspaceEmailTemplate(templateId: string, organizationId: string) {
  const template = await prisma.emailTemplate.findFirst({
    where: { id: templateId, organizationId },
  });
  if (!template) throw new HttpError(404, "Email template not found");

  return {
    ...template,
    createdAt: template.createdAt.toISOString(),
    updatedAt: template.updatedAt.toISOString(),
  };
}

export async function updateWorkspaceEmailTemplate(params: {
  templateId: string;
  organizationId: string;
  actorUserId: string;
  input: UpdateEmailTemplateInput;
}) {
  const { templateId, organizationId, actorUserId, input } = params;

  return prisma.$transaction(async (tx) => {
    const existing = await tx.emailTemplate.findFirst({
      where: { id: templateId, organizationId },
      select: { id: true },
    });
    if (!existing) throw new HttpError(404, "Email template not found");

    if (input.isDefault === true) {
      await tx.emailTemplate.updateMany({
        where: { organizationId, isDefault: true, id: { not: templateId } },
        data: { isDefault: false },
      });
    }

    const template = await tx.emailTemplate.update({
      where: { id: templateId },
      data: {
        ...(input.name !== undefined ? { name: input.name.trim() } : {}),
        ...(input.subjectTemplate !== undefined
          ? { subjectTemplate: sanitizeTemplateSubject(input.subjectTemplate) }
          : {}),
        ...(input.htmlTemplate !== undefined
          ? { htmlTemplate: sanitizeTemplateHtml(input.htmlTemplate) }
          : {}),
        ...(input.design !== undefined
          ? { design: input.design as Prisma.InputJsonValue }
          : {}),
        ...(input.isDefault !== undefined ? { isDefault: input.isDefault } : {}),
      },
    });

    await tx.auditLog.create({
      data: {
        organizationId,
        actorUserId,
        action: "email_template.updated",
        targetType: "email_template",
        targetId: template.id,
        metadata: { updatedFields: Object.keys(input) },
      },
    });

    return {
      ...template,
      createdAt: template.createdAt.toISOString(),
      updatedAt: template.updatedAt.toISOString(),
    };
  });
}
