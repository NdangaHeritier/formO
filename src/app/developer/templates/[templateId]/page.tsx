import { notFound } from "next/navigation";
import { z } from "zod";
import { TemplateEditor } from "@/components/Developer/Templates/TemplateEditor";
import DeveloperShell from "@/components/Developer/DeveloperShell";
import { requireActiveWorkspace } from "@/server/auth/authorization";
import { getWorkspaceEmailTemplate } from "@/server/services/templates.service";
import { parseTemplateDesign } from "@/lib/template-design";

export const dynamic = "force-dynamic";

export default async function SavedTemplateEditorPage({
  params,
}: {
  params: Promise<{ templateId: string }>;
}) {
  const { templateId } = await params;
  if (!z.string().uuid().safeParse(templateId).success) notFound();

  const workspace = await requireActiveWorkspace("member");
  const template = await getWorkspaceEmailTemplate(templateId, workspace.organization.id);

  return (
    <DeveloperShell>
      <TemplateEditor
        mode="saved"
        template={{
          ...template,
          design: parseTemplateDesign(template.design),
        }}
        siteName={workspace.organization.name}
      />
    </DeveloperShell>
  );
}
