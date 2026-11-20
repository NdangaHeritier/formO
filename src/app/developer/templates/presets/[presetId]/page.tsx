import { notFound } from "next/navigation";
import { TemplateEditor } from "@/components/Developer/Templates/TemplateEditor";
import DeveloperShell from "@/components/Developer/DeveloperShell";
import { getPreset } from "@/server/services/template-presets";
import { requireActiveWorkspace } from "@/server/auth/authorization";

export default async function PresetTemplateEditorPage({
  params,
}: {
  params: Promise<{ presetId: string }>;
}) {
  const { presetId } = await params;
  const preset = getPreset(presetId);
  if (!preset) notFound();
  const workspace = await requireActiveWorkspace("member");

  return (
    <DeveloperShell>
      <TemplateEditor mode="preset" preset={preset} siteName={workspace.organization.name} />
    </DeveloperShell>
  );
}
