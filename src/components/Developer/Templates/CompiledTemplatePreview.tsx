"use client";
import { useEffect, useState } from "react";
import Layout from "@/components/Developer/Modals/Layout";
import SmallBtn from "@/components/Global/smallBtn";
import FormButton from "@/components/Global/FormButton";
import { Icon } from "@/components/Global/Icon";
import type { TemplateValues } from "@/lib/template-design";
import { DeviceFrame } from "./editor/DeviceFrame";

type Props = {
  presetId?: string;
  values: TemplateValues;
  sourceHtml?: string;
  subject: string;
  unsaved: boolean;
  onClose: () => void;
};

/** Read-only preview of the compiled email, rendered from the current editor document. */
export function CompiledTemplatePreview({
  presetId,
  values,
  sourceHtml,
  subject,
  unsaved,
  onClose,
}: Props) {
  const [html, setHtml] = useState(sourceHtml ?? "");
  const [loading, setLoading] = useState(Boolean(presetId));
  const [error, setError] = useState("");
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    if (!presetId) return;
    let cancelled = false;

    // This fetch happens only when Preview opens (or Retry is requested),
    // independently of the background preview used while editing.
    fetch("/api/templates/preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ presetId, ...values }),
    })
      .then(async (res) => {
        const data = (await res.json()) as { html?: string; error?: string };
        if (!res.ok || !data.html) throw new Error(data.error || "Unable to render the preview.");
        return data.html;
      })
      .then((compiled) => {
        if (!cancelled) setHtml(compiled);
      })
      .catch((error: unknown) => {
        if (!cancelled) setError(error instanceof Error ? error.message : "Unable to render the preview.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [presetId, values, sourceHtml, retry]);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  return (
    <Layout onClick={onClose} label="Compiled email preview">
      <section
        className="grid max-h-[calc(100vh-3rem)] w-full max-w-5xl grid-cols-1 gap-card overflow-y-auto rounded-card bg-zinc-50 p-card shadow-2xl sm:p-6 dark:bg-zinc-950"
      >
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div className="grid min-w-0 grid-cols-1 gap-1">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              <Icon name="Monitor" size={18} className="text-yellow-600" />
              Email preview
            </h2>
            <p className="truncate text-sm text-zinc-500 dark:text-zinc-400">
              Subject: {subject || "No subject yet"}
            </p>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              {unsaved ? "Preview of unsaved changes. Nothing was saved to your library." : "Read-only recipient preview."}
            </p>
          </div>
          <div className="flex gap-2">
            <SmallBtn variant={device === "desktop" ? "primary" : "secondary"} onClick={() => setDevice("desktop")}>
              <Icon name="Monitor" size={14} /> Desktop
            </SmallBtn>
            <SmallBtn variant={device === "mobile" ? "primary" : "secondary"} onClick={() => setDevice("mobile")}>
              <Icon name="Smartphone" size={14} /> Mobile
            </SmallBtn>
          </div>
        </header>

        {error ? (
          <div className="grid justify-items-center gap-3 py-12 text-center text-sm text-zinc-500">
            {error}
            <FormButton variant="secondary" onClick={() => {
              setLoading(true);
              setError("");
              setRetry((attempt) => attempt + 1);
            }}>
              <Icon name="RefreshCcw" size={15} /> Try again
            </FormButton>
          </div>
        ) : (
          <DeviceFrame device={device}>
            {loading ? (
              <div className="flex h-64 items-center justify-center">
                <Icon name="Loader" size={28} className="animate-spin text-zinc-500" />
              </div>
            ) : (
              <div className="mx-auto h-full min-h-[440px] w-full max-w-2xl overflow-hidden rounded-lg bg-white shadow-lg">
                <iframe
                  title="Compiled template preview"
                  sandbox=""
                  srcDoc={html}
                  className="h-full min-h-[440px] w-full border-0"
                />
              </div>
            )}
          </DeviceFrame>
        )}
      </section>
    </Layout>
  );
}

