"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import FormButton from "@/components/Global/FormButton";
import { Icon } from "@/components/Global/Icon";
import { InputField } from "@/components/Global/InputField";
import Dropdown from "@/components/Global/Dropdown";
import type { TemplateValues } from "@/lib/template-design";

type Sender = { id: string; name: string; fromEmail: string };

type Props = {
  presetId?: string;
  values?: TemplateValues;
  templateId?: string;
  canSend: boolean;
};

export function TestSendPanel({ presetId, values, templateId, canSend }: Props) {
  const [senders, setSenders] = useState<Sender[]>([]);
  const [allowed, setAllowed] = useState(true);
  const [loading, setLoading] = useState(true);
  const [senderId, setSenderId] = useState("");
  const [recipient, setRecipient] = useState("");
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    fetch("/api/settings/smtp")
      .then((res) => {
        setAllowed(res.ok);
        return res.ok ? res.json() : null;
      })
      .then((data: { smtpConfigs?: Sender[] } | null) => {
        const configs = data?.smtpConfigs ?? [];
        setSenders(configs);
        setSenderId((current) => current || configs[0]?.id || "");
      })
      .catch(() => setMessage({ ok: false, text: "Unable to load SMTP senders." }))
      .finally(() => setLoading(false));
  }, []);

  const sendTest = async () => {
    setSending(true);
    setMessage(null);
    try {
      const res = await fetch("/api/templates/test-send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: recipient,
          smtpConfigId: senderId,
          ...(presetId ? { presetId, ...values } : { templateId }),
        }),
      });
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      setMessage({
        ok: res.ok,
        text: res.ok ? "Test email sent — check the inbox." : data?.error || "Unable to send test email.",
      });
    } catch {
      setMessage({ ok: false, text: "Unable to send test email." });
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="grid grid-cols-1 gap-4 pt-1">
      <div className="grid grid-cols-1 gap-1">
        <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Test delivery</h3>
        <p className="text-xs leading-5 text-zinc-500 dark:text-zinc-400">
          Send the current preview to your inbox before linking it to a form.
        </p>
      </div>
      {loading ? (
        <Icon name="Loader" size={20} className="animate-spin text-zinc-400" />
      ) : !allowed ? (
        <p className="text-xs leading-5 text-zinc-500 dark:text-zinc-400">
          Test delivery is available to workspace admins.
        </p>
      ) : senders.length === 0 ? (
        <p className="text-xs leading-5 text-zinc-500 dark:text-zinc-400">
          Add a sending identity in <Link href="/developer/settings" className="underline">Settings</Link> to send a test.
        </p>
      ) : (
        <>
          <Dropdown
            label="SMTP sender"
            value={senderId}
            options={senders.map((sender) => ({
              label: `${sender.name} (${sender.fromEmail})`,
              value: sender.id,
            }))}
            onChange={setSenderId}
          />
          <InputField
            type="email"
            name="template-test-recipient"
            id="template-test-recipient"
            label="Send to"
            placeholder="you@company.com"
            value={recipient}
            onChange={(event) => setRecipient(event.target.value)}
          />
          <FormButton
            variant="secondary"
            disabled={sending || !canSend || !recipient.trim() || !senderId}
            onClick={sendTest}
          >
            {sending ? <Icon name="Loader" size={16} className="animate-spin" /> : <Icon name="Send" size={15} />}
            Send test email
          </FormButton>
          {!canSend && (
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Save this template before testing raw HTML.</p>
          )}
          {message && (
            <p className={`text-xs ${message.ok ? "text-green-600" : "text-red-500"}`}>{message.text}</p>
          )}
        </>
      )}
    </section>
  );
}
