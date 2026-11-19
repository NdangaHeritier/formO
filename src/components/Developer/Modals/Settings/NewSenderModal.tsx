"use client";
import { useEffect, useState } from "react";
import Layout from "@/components/Developer/Modals/Layout";
import { Icon } from "@/components/Global/Icon";
import FormButton from "@/components/Global/FormButton";
import { InputField } from "@/components/Global/InputField";

type Props = {
  onClose: () => void;
  onCreated: () => void;
};

/** Focused SMTP sender creation — follows DESIGN.md's dialog pattern. */
export default function NewSenderModal({ onClose, onCreated }: Props) {
  const [form, setForm] = useState({
    name: "",
    host: "",
    port: "587",
    username: "",
    password: "",
    fromEmail: "",
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    document.getElementById("sender-name")?.focus();
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSaving(true);
    try {
      const res = await fetch("/api/settings/smtp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, port: Number(form.port), secure: false }),
      });
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) throw new Error(data?.error ?? "Could not add SMTP sender");
      onCreated();
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not add SMTP sender");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout onClick={onClose}>
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-sender-title"
        className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl dark:bg-zinc-950 sm:p-6"
      >
        <div className="grid grid-cols-1 gap-1">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-600/20 text-yellow-600">
              <Icon name="Server" size={16} strokeWidth={2} aria-hidden="true" />
            </span>
            <h2
              id="new-sender-title"
              className="text-lg font-semibold text-zinc-900 dark:text-zinc-100"
            >
              Add SMTP sender
            </h2>
          </div>
          <p className="text-xs leading-5 text-zinc-500 dark:text-zinc-400">
            Credentials are encrypted before they are stored.
          </p>
        </div>

        <form onSubmit={submit} className="mt-5 grid grid-cols-1 gap-4">
          <InputField type="text" name="name" id="sender-name" label="Label" placeholder="Primary sender" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <InputField type="text" name="host" id="sender-host" label="Host" placeholder="smtp.example.com" value={form.host} onChange={(e) => setForm({ ...form, host: e.target.value })} />
            <InputField type="number" name="port" id="sender-port" label="Port" placeholder="587" value={form.port} onChange={(e) => setForm({ ...form, port: e.target.value })} />
          </div>
          <InputField type="email" name="fromEmail" id="sender-from" label="From address" placeholder="noreply@example.com" value={form.fromEmail} onChange={(e) => setForm({ ...form, fromEmail: e.target.value })} />
          <InputField type="text" name="username" id="sender-user" label="Username" placeholder="username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
          <InputField type="password" name="password" id="sender-pass" label="Password" placeholder="••••••••" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />

          {error && (
            <p role="alert" className="text-xs text-red-600 dark:text-red-400">{error}</p>
          )}

          <div className="grid grid-cols-2 gap-3 pt-1">
            <FormButton type="button" variant="secondary" onClick={onClose}>
              Cancel
            </FormButton>
            <FormButton type="submit" disabled={saving}>
              {saving ? <Icon name="Loader" size={16} className="animate-spin" aria-hidden="true" /> : "Save sender"}
            </FormButton>
          </div>
        </form>
      </section>
    </Layout>
  );
}
