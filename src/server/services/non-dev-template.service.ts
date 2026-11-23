import { prisma } from "@/lib/prisma";
import { HttpError } from "@/server/auth/authorization";

/** Template content for non-dev compose. Transport config is never included. */
export async function listNonDevTemplates(organizationId: string) {
  const templates = await prisma.emailTemplate.findMany({
    where: { organizationId },
    select: { id: true, name: true, updatedAt: true },
    orderBy: { createdAt: "desc" },
  });
  return {
    templates: templates.map((template) => ({
      id: template.id,
      name: template.name,
      updatedAt: template.updatedAt.toISOString(),
    })),
  };
}

export async function getNonDevTemplate(id: string, organizationId: string) {
  const template = await prisma.emailTemplate.findFirst({
    where: { id, organizationId },
    select: {
      id: true,
      name: true,
      subjectTemplate: true,
      htmlTemplate: true,
      updatedAt: true,
    },
  });
  if (!template) throw new HttpError(404, "Template not found");
  return {
    id: template.id,
    name: template.name,
    subjectTemplate: template.subjectTemplate,
    htmlTemplate: template.htmlTemplate,
    updatedAt: template.updatedAt.toISOString(),
  };
}
