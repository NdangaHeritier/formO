"use client";
import { useState } from "react";
import Layout from "@/components/Developer/Modals/Layout";
import { Icon } from "@/components/Global/Icon";
import FormButton from "@/components/Global/FormButton";
import { InputField } from "@/components/Global/InputField";
import { useToast } from "@/components/Global/Toast";

type Props = {
  onClose: () => void;
  onCreated: () => void;
};

/** Creates a key, then reveals it once in a focused, copyable panel. */
export default function NewApiKeyModal({ onClose, onCreated }: Props) {
  const [name, setName] = useState("");
  const [rawKey, setRawKey] = useState("");
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/settings/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      const data = (await res.json().catch(() => null)) as {
        apiKey?: { rawKey?: string };
        error?: string;
      } | null;
      if (!res.ok || !data?.apiKey) throw new Error(data?.error ?? "Could not create API key");
      setRawKey(data.apiKey.rawKey ?? "");
      toast.success("API key created");
      onCreated();
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Could not create API key");
    } finally {
      setSaving(false);
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(rawKey);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  const done = () => {
    onCreated();
    onClose();
  };

  return (
    <Layout onClick={done} label="Create API key">
      <section
        aria-labelledby="new-key-title"
        className="w-full max-w-md rounded-card bg-white p-card shadow-2xl dark:bg-zinc-950 sm:p-6"
      >
        {rawKey ? (
          <div className="grid grid-cols-1 gap-4">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-green-600/15 text-green-600">
                <Icon name="Check" size={16} strokeWidth={2} aria-hidden="true" />
              </span>
              <h2 id="new-key-title" className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                Key created
              </h2>
            </div>
            <p className="text-xs leading-5 text-zinc-500 dark:text-zinc-400">
              Copy it now. FormO stores only a hash, so this is the one time you can see it.
            </p>
            <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900/40">
              <code className="block break-all font-mono text-xs leading-5 text-zinc-800 dark:text-zinc-200">
                {rawKey}
              </code>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <FormButton type="button" variant="secondary" onClick={() => void copy()}>
                <Icon name="Copy" size={14} aria-hidden="true" />
                {copied ? "Copied" : "Copy key"}
              </FormButton>
              <FormButton type="button" onClick={done}>Done</FormButton>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-1">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-600/20 text-yellow-600">
                  <Icon name="Key" size={16} strokeWidth={2} aria-hidden="true" />
                </span>
                <h2 id="new-key-title" className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                  Create API key
                </h2>
              </div>
              <p className="text-xs leading-5 text-zinc-500 dark:text-zinc-400">
                The key inherits the <code className="font-mono">forms:read</code> and{" "}
                <code className="font-mono">emails:send</code> scopes by default.
              </p>
            </div>
            <form onSubmit={submit} className="mt-5 grid grid-cols-1 gap-4">
              <InputField type="text" name="name" id="api-key-name" label="Label" placeholder="Production integration" value={name} onChange={(e) => setName(e.target.value)} />
              <div className="grid grid-cols-2 gap-3">
                <FormButton type="button" variant="secondary" onClick={done}>Cancel</FormButton>
                <FormButton type="submit" disabled={!name.trim() || saving}>
                  {saving ? <Icon name="Loader" size={16} className="animate-spin" aria-hidden="true" /> : "Create key"}
                </FormButton>
              </div>
            </form>
          </>
        )}
      </section>
    </Layout>
  );
}
