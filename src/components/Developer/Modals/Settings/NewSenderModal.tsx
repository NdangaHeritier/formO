"use client";
import { useState } from "react";
import Layout from "@/components/Developer/Modals/Layout";
import { Icon } from "@/components/Global/Icon";
import FormButton from "@/components/Global/FormButton";
import { InputField } from "@/components/Global/InputField";
import { useToast } from "@/components/Global/Toast";

export type SenderSummary = {
  id: string;
  name: string;
  host: string;
  port: number;
  secure: boolean;
  username: string;
  fromEmail: string;
  isVerified: boolean;
};

type Props = {
  onClose: () => void;
  onCreated: () => void;
  /** When present the dialog edits this sender instead of creating a new one. */
  sender?: SenderSummary;
};

type CreatedConfig = {
  verified?: boolean;
  verificationError?: string | null;
};

/** Focused SMTP sender creation/edit — follows DESIGN.md's dialog pattern. */
export default function NewSenderModal({ onClose, onCreated, sender }: Props) {
  const isEdit = Boolean(sender);
  const [form, setForm] = useState({
    name: sender?.name ?? "",
    host: sender?.host ?? "",
    port: String(sender?.port ?? 587),
    username: sender?.username ?? "",
    password: "",
    fromEmail: sender?.fromEmail ?? "",
  });
  const toast = useToast();
  const [saving, setSaving] = useState(false);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(isEdit ? `/api/settings/smtp/${sender!.id}` : "/api/settings/smtp", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          port: Number(form.port),
          secure: sender?.secure ?? false,
          // Blank password in edit mode means "keep the stored credential".
          ...(!isEdit || form.password ? { password: form.password } : {}),
        }),
      });
      const data = (await res.json().catch(() => null)) as
        | { error?: string; smtpConfig?: CreatedConfig }
        | null;
      if (!res.ok) {
        throw new Error(data?.error ?? (isEdit ? "Could not update SMTP sender" : "Could not add SMTP sender"));
      }

      if (isEdit) {
        toast.success("SMTP sender updated", {
          description: "Verification was reset. Verify this sender before assigning it.",
        });
        onCreated();
        onClose();
        return;
      }

      const created = data?.smtpConfig;
      if (created?.verified) {
        toast.success("SMTP sender added and verified", {
          description: "The SMTP handshake succeeded. This sender is ready to assign.",
        });
      } else {
        toast.warning("SMTP sender added, but verification failed", {
          description:
            created?.verificationError ??
            "The SMTP server could not be reached. Verify this sender from settings before assigning it.",
          duration: 8000,
        });
      }
      onCreated();
      onClose();
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Could not save SMTP sender");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout onClick={onClose} label={isEdit ? "Edit SMTP sender" : "Add SMTP sender"}>
      <section className="w-full max-w-md rounded-card bg-white p-card shadow-2xl dark:bg-zinc-950 sm:p-6">
        <div className="grid grid-cols-1 gap-1">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-600/20 text-yellow-600">
              <Icon name="Server" size={16} strokeWidth={2} aria-hidden="true" />
            </span>
            <h2
              id="new-sender-title"
              className="text-lg font-semibold text-zinc-900 dark:text-zinc-100"
            >
              {isEdit ? "Edit SMTP sender" : "Add SMTP sender"}
            </h2>
          </div>
          <p className="text-xs leading-5 text-zinc-500 dark:text-zinc-400">
            {isEdit
              ? "Credentials are encrypted before they are stored. Leave the password blank to keep the current one."
              : "Credentials are encrypted before they are stored."}
          </p>
        </div>

        <form onSubmit={submit} className="mt-5 grid grid-cols-1 gap-4">
          <InputField type="text" name="name" id="sender-name" label="Label" placeholder="Primary sender" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <InputField type="text" name="host" id="sender-host" label="Host" placeholder="smtp.example.com" value={form.host} onChange={(e) => setForm({ ...form, host: e.target.value })} />
            <InputField type="number" name="port" id="sender-port" label="Port" placeholder="587" value={form.port} onChange={(e) => setForm({ ...form, port: e.target.value })} />
          </div>
          <InputField type="email" name="fromEmail" id="sender-from" label="From address" placeholder="noreply@example.com" value={form.fromEmail} onChange={(e) => setForm({ ...form, fromEmail: e.target.value })} />
          <InputField type="text" name="username" id="sender-user" label="Username" placeholder="username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
          <InputField type="password" name="password" id="sender-pass" label={isEdit ? "New password (optional)" : "Password"} placeholder="••••••••" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />


          <div className="grid grid-cols-2 gap-3 pt-1">
            <FormButton type="button" variant="secondary" onClick={onClose}>
              Cancel
            </FormButton>
            <FormButton type="submit" disabled={saving}>
              {saving ? <Icon name="Loader" size={16} className="animate-spin" aria-hidden="true" /> : isEdit ? "Save changes" : "Save sender"}
            </FormButton>
          </div>
        </form>
      </section>
    </Layout>
  );
}
