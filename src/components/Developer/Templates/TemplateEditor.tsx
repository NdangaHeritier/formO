"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import FormButton from "@/components/Global/FormButton";
import Layout from "@/components/Developer/Modals/Layout";
import SmallBtn from "@/components/Global/smallBtn";
import { Icon } from "@/components/Global/Icon";
import type { TemplateDesign, TemplateValues } from "@/lib/template-design";
import { relativeTime } from "@/lib/format";
import { TemplatePreview } from "./TemplatePreview";
import { CompiledTemplatePreview } from "./CompiledTemplatePreview";
import { TemplateDetails } from "./TemplateDetails";
import { TestSendPanel } from "./TestSendPanel";
import { StudioCanvas } from "./editor/StudioCanvas";
import type { PresetDefinition, TemplateRecord } from "./types";

type Props = (
  | { mode: "preset"; preset: PresetDefinition; template?: never }
  | { mode: "saved"; template: TemplateRecord; preset?: never }
) & {
  siteName: string;
};

export function TemplateEditor(props: Props) {
  const router = useRouter();
  const preset = props.mode === "preset" ? props.preset : undefined;
  const template = props.mode === "saved" ? props.template : undefined;
  const presetId = template?.design?.presetId ?? preset?.id;
  const hasRawHtmlEditor = Boolean(template && !template.design);

  const [values, setValues] = useState<TemplateValues>(
    template?.design ?? preset?.defaults ?? {}
  );
  const [name, setName] = useState(template?.name ?? preset?.name ?? "Untitled template");
  const [subject, setSubject] = useState(template?.subjectTemplate ?? preset?.subject ?? "");
  const [isDefault, setIsDefault] = useState(template?.isDefault ?? false);
  const [sourceHtml, setSourceHtml] = useState(template?.htmlTemplate ?? "");
  const [html, setHtml] = useState(template?.htmlTemplate ?? "");
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState(template?.updatedAt);
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  const [initialSnapshot, setInitialSnapshot] = useState(() =>
    JSON.stringify({ values, name, subject, isDefault, sourceHtml })
  );
  const snapshot = useMemo(
    () => JSON.stringify({ values, name, subject, isDefault, sourceHtml }),
    [values, name, subject, isDefault, sourceHtml]
  );
  const dirty = snapshot !== initialSnapshot;
  const generation = useRef(0);

  useEffect(() => {
    if (!presetId || hasRawHtmlEditor) return;
    const current = ++generation.current;
    const timer = window.setTimeout(() => {
      setPreviewLoading(true);
      fetch("/api/templates/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ presetId, ...values }),
      })
        .then(async (res) => {
          const data = (await res.json()) as { html?: string; error?: string };
          if (current !== generation.current) return;
          if (!res.ok || !data.html) throw new Error(data.error || "Preview failed");
          setHtml(data.html);
          setPreviewError("");
        })
        .catch((error: unknown) => {
          if (current === generation.current) {
            setPreviewError(error instanceof Error ? error.message : "Preview failed");
          }
        })
        .finally(() => {
          if (current === generation.current) setPreviewLoading(false);
        });
    }, 450);
    return () => window.clearTimeout(timer);
  }, [presetId, values, hasRawHtmlEditor]);

  const save = async () => {
    setSaving(true);
    setMessage(null);
    try {
      let compiledHtml = sourceHtml;
      if (!hasRawHtmlEditor && presetId) {
        const previewRes = await fetch("/api/templates/preview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ presetId, ...values }),
        });
        const preview = (await previewRes.json()) as { html?: string; error?: string };
        if (!previewRes.ok || !preview.html) throw new Error(preview.error || "Unable to compile this template");
        compiledHtml = preview.html;
        setHtml(compiledHtml);
      }

      const payload = {
        name: name.trim(),
        subjectTemplate: subject.trim(),
        htmlTemplate: compiledHtml,
        isDefault,
        design: presetId ? { presetId, ...values } as TemplateDesign : undefined,
      };
      const res = await fetch(template ? `/api/templates/${template.id}` : "/api/templates", {
        method: template ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json().catch(() => null)) as
        | { template?: TemplateRecord; error?: string }
        | null;
      if (!res.ok || !data?.template) throw new Error(data?.error || "Unable to save template");

      setInitialSnapshot(snapshot);
      setLastSavedAt(new Date().toISOString());
      setMessage({ ok: true, text: "Template saved with your latest formatting." });
      if (!template) router.replace(`/developer/templates/${data.template.id}`);
    } catch (error) {
      setMessage({
        ok: false,
        text: error instanceof Error ? error.message : "Unable to save template.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="relative rounded-2xl">
      <div className="projects relative z-10 grid grid-cols-1 gap-5 rounded-2xl bg-gradient-to-tr from-zinc-100 to-zinc-100/50 from-80% to-20% p-4 dark:from-zinc-950 dark:to-zinc-950/50 sm:p-6">
        <header className="flex flex-wrap items-start justify-between gap-4 border-b border-zinc-200 pb-4 dark:border-zinc-800">
          <div className="grid min-w-0 grid-cols-1 gap-2">
            <Link href="/developer/templates" className="flex w-fit items-center gap-1 text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200">
              <Icon name="ArrowRight" size={13} className="rotate-180" /> Back to templates
            </Link>
            <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{name}</h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {preset?.description ?? "Edit text directly on the email and control every format."}
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {dirty ? "Unsaved changes" : lastSavedAt ? `Last saved ${relativeTime(lastSavedAt)}` : "Not saved yet"}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <SmallBtn variant="secondary" onClick={() => setPreviewOpen(true)}>
              <Icon name="Monitor" size={14} /> Preview
            </SmallBtn>
            <SmallBtn variant="ghost" onClick={() => setDetailsOpen(true)}>
              <Icon name="Settings" size={14} /> Details &amp; test
            </SmallBtn>
            <FormButton variant="primary" onClick={save} disabled={saving || !dirty}>
              {saving ? <Icon name="Loader" size={16} className="animate-spin" /> : <Icon name="Check" size={15} />}
              {template ? "Save changes" : "Create template"}
            </FormButton>
          </div>
        </header>

        {previewError && <p className="text-sm text-red-500">{previewError}</p>}
        {message && <p className={`text-sm ${message.ok ? "text-green-600" : "text-red-500"}`}>{message.text}</p>}

        {previewOpen && (
          <CompiledTemplatePreview
            presetId={presetId}
            values={values}
            sourceHtml={hasRawHtmlEditor ? sourceHtml : undefined}
            subject={subject}
            unsaved={dirty}
            onClose={() => setPreviewOpen(false)}
          />
        )}

        {hasRawHtmlEditor ? (
          <TemplatePreview
            html={sourceHtml}
            loading={previewLoading}
            device={device}
            onDeviceChange={setDevice}
          />
        ) : (
          <StudioCanvas values={values} onChange={setValues} siteName={props.siteName} />
        )}

        {detailsOpen && (
          <Layout onClick={() => setDetailsOpen(false)} label="Template details and test delivery">
            <section
              className="grid max-h-[calc(100vh-6rem)] w-full max-w-3xl grid-cols-1 gap-6 overflow-y-auto rounded-card bg-white p-card shadow-2xl sm:p-6 dark:bg-zinc-950 lg:grid-cols-2"
            >
              <TemplateDetails
              name={name}
              subject={subject}
              isDefault={isDefault}
              onNameChange={setName}
              onSubjectChange={setSubject}
              onDefaultChange={setIsDefault}
              sourceHtml={hasRawHtmlEditor ? sourceHtml : undefined}
              onSourceHtmlChange={hasRawHtmlEditor ? setSourceHtml : undefined}
            />
            <TestSendPanel
              presetId={presetId}
              values={values}
              templateId={template?.id}
              canSend={hasRawHtmlEditor ? !dirty : Boolean(html)}
            />
            </section>
          </Layout>
        )}
      </div>
    </div>
  );
}

