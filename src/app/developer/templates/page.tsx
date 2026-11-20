"use client";
import { useEffect, useState } from "react";
import { Squares } from "@/components/Global/Squares";
import FormButton from "@/components/Global/FormButton";
import LinkButton from "@/components/Global/LinkButton";
import { Icon } from "@/components/Global/Icon";
import ConfirmDialog from "@/components/Global/ConfirmDialog";
import { SkeletonListRows } from "@/components/Global/Skeleton";
import DeveloperShell from "@/components/Developer/DeveloperShell";
import { relativeTime } from "@/lib/format";
import type { TemplateRecord } from "@/components/Developer/Templates/types";

type PresetCard = {
  id: string;
  name: string;
  description: string;
  subject: string;
};

const rowClass =
  "flex flex-wrap items-center justify-between gap-3 rounded-lg border border-transparent bg-zinc-50 px-4 py-3 text-sm dark:bg-zinc-900/40";

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<TemplateRecord[]>([]);
  const [presets, setPresets] = useState<PresetCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const load = () => {
    Promise.all([
      fetch("/api/templates").then((res) => (res.ok ? res.json() : null)),
      fetch("/api/templates/presets").then((res) => (res.ok ? res.json() : null)),
    ])
      .then(([saved, presetData]) => {
        if (saved?.templates && presetData?.presets) {
          setTemplates(saved.templates);
          setPresets(presetData.presets);
          setLoadError(false);
        } else {
          setLoadError(true);
        }
      })
      .catch(() => setLoadError(true))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const [pendingDelete, setPendingDelete] = useState<TemplateRecord | null>(null);
  const [deleteError, setDeleteError] = useState("");

  const deleteTemplate = async (template: TemplateRecord) => {
    const res = await fetch(`/api/templates/${template.id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      throw new Error(data?.error || "Unable to delete template");
    }
    setTemplates((current) => current.filter((row) => row.id !== template.id));
  };

  return (
    <DeveloperShell>
    <div className="relative rounded-2xl">
      <Squares parLength={100} />
      <div className="projects relative z-10 grid grid-cols-1 gap-5 rounded-2xl bg-gradient-to-tr from-zinc-100 to-zinc-100/50 from-80% to-20% p-8 dark:from-zinc-950 dark:to-zinc-950/50">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div className="grid grid-cols-1 gap-2">
            <h1 className="text-xl font-bold">Email Templates</h1>
            <p className="max-w-xl text-sm text-zinc-500 dark:text-zinc-400">
              Reusable, responsive notification emails. Choose a starting point, customize its content and theme, then link it to a form.
            </p>
          </div>
          <span className="rounded-full bg-zinc-200/60 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
            {templates.length} saved
          </span>
        </header>

        <section className="rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 bg-surface">
          <div className="flex items-center gap-2 border-b border-zinc-200 px-5 py-4 font-semibold text-zinc-800 dark:border-zinc-800 dark:text-zinc-200">
            <Icon name="FileText" size={16} className="text-yellow-600" />
            Your library
          </div>
          <div className="p-3">
            {loading ? (
              <SkeletonListRows rows={2} />
            ) : loadError ? (
              <div className="grid justify-items-center gap-3 py-8 text-center text-zinc-500">
                Couldn&apos;t load templates.
                <FormButton variant="secondary" onClick={load}>
                  <Icon name="RefreshCcw" size={15} /> Retry
                </FormButton>
              </div>
            ) : templates.length === 0 ? (
              <div className="py-8 text-center text-zinc-500">
                No saved templates yet. Choose a pre-designed starting point below.
              </div>
            ) : (
              <ul className="grid grid-cols-1 gap-2">
                {templates.map((template) => (
                  <li key={template.id} className={rowClass}>
                    <div className="flex min-w-0 flex-col gap-1">
                      <div className="flex flex-wrap items-center gap-2 font-medium text-zinc-800 dark:text-zinc-200">
                        {template.name}
                        {template.isDefault && (
                          <span className="rounded-full bg-zinc-950 px-2 py-0.5 text-[11px] text-zinc-100 dark:bg-zinc-50 dark:text-zinc-950">
                            Default
                          </span>
                        )}
                      </div>
                      <span className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                        {template.subjectTemplate}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="hidden text-xs text-zinc-500 sm:block dark:text-zinc-400">
                        {relativeTime(template.updatedAt)}
                      </span>
                      <LinkButton href={`/developer/templates/${template.id}`} variant="secondary">
                        <Icon name="SquareArrowUpRight" size={14} /> Open studio
                      </LinkButton>
                      <FormButton variant="danger" onClick={() => setPendingDelete(template)}>
                        <Icon name="X" size={14} /> Delete
                      </FormButton>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 bg-surface">
          <div className="flex items-center gap-2 border-b border-zinc-200 px-5 py-4 font-semibold text-zinc-800 dark:border-zinc-800 dark:text-zinc-200">
            <Icon name="Sparkles" size={16} className="text-yellow-600" />
            Start from a design
          </div>
          <div className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2 lg:grid-cols-3">
            {(loading ? [] : presets).map((preset) => (
              <article
                key={preset.id}
                className="grid grid-cols-1 gap-3 rounded-xl border border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-800 bg-surface"
              >
                <div className="grid grid-cols-1 gap-2">
                  <h2 className="font-semibold text-zinc-800 dark:text-zinc-200">{preset.name}</h2>
                  <p className="text-xs leading-5 text-zinc-500 dark:text-zinc-400">{preset.description}</p>
                  <p className="truncate text-xs text-zinc-400 dark:text-zinc-500">
                    Subject: {preset.subject}
                  </p>
                </div>
                <LinkButton href={`/developer/templates/presets/${preset.id}`}>
                  <Icon name="SquareArrowUpRight" size={14} /> Customize template
                </LinkButton>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
    <ConfirmDialog
      open={pendingDelete !== null}
      title={`Delete "${pendingDelete?.name ?? ""}"?`}
      description="This template will be removed. Forms using it will fall back to the built-in submission email."
      confirmLabel="Delete template"
      error={deleteError}
      onCancel={() => {
        setDeleteError("");
        setPendingDelete(null);
      }}
      onConfirm={async () => {
        if (!pendingDelete) return;
        try {
          await deleteTemplate(pendingDelete);
          setDeleteError("");
          setPendingDelete(null);
        } catch (error) {
          setDeleteError(error instanceof Error ? error.message : "Unable to delete template");
        }
      }}
    />
    </DeveloperShell>
  );
}
