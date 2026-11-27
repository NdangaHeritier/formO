"use client";
import { useState } from "react";
import { Icon } from "@/components/Global/Icon";
import HighlightedCode from "@/components/Global/HighlightedCode";
import { useToast } from "@/components/Global/Toast";
import type { Language } from "prism-react-renderer";

export default function CodeBlock({
  code,
  language,
}: {
  code: string;
  language: Language;
}) {
  const toast = useToast();
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success("Code copied to clipboard");
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Could not copy this code");
    }
  };

  return (
    <div className="my-5 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900">
      <div className="flex items-center justify-between px-4 py-2">
        <span className="font-mono text-[11px] uppercase tracking-wide text-zinc-400">
          {language}
        </span>
        <button
          type="button"
          onClick={copy}
          className="flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-1 text-xs text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500"
        >
          <Icon name={copied ? "Check" : "Copy"} size={13} />
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <div className="px-4 pb-4">
        <HighlightedCode code={code} language={language} />
      </div>
    </div>
  );
}
