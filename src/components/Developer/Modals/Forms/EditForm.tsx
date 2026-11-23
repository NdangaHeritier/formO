"use client";
import FormButton from "@/components/Global/FormButton";
import Layout from "../Layout";
import { Icon } from "@/components/Global/Icon";
import { InputField } from "@/components/Global/InputField";
import { SelectField } from "@/components/Global/SelectField";
import { useToast } from "@/components/Global/Toast";
import Tooltip from "@/components/Global/Tooltip";
import { TextAreaField } from "@/components/Global/TextAreaField";
import React, { useEffect, useRef, useState } from "react";
import { FormType } from "@/types/Project";

type Props = {
  form: FormType;
  onClick: () => void;
  onSuccess?: () => void;
};

type Recipient = { email: string; type: "cc" | "bcc" };

/** The management API returns these fields even though the shared UI type does not. */
type FormWithSettings = FormType & {
  allowedOrigins?: string[];
  honeypotField?: string | null;
  requireTurnstile?: boolean;
  maxPayloadBytes?: number | null;
  replyToField?: string | null;
  customSubject?: string | null;
  emailTemplateId?: string | null;
};

type SettingsKey =
  | "allowedOrigins"
  | "honeypotField"
  | "requireTurnstile"
  | "maxPayloadBytes"
  | "replyToField"
  | "customSubject"
  | "emailTemplateId"
  | "isActive";

type FormSettings = {
  allowedOrigins: string[];
  honeypotField: string;
  requireTurnstile: boolean;
  maxPayloadBytes: string;
  replyToField: string;
  customSubject: string;
  emailTemplateId: string;
  isActive: boolean;
};

type PatchPayload = {
  title: string;
  description: string;
  emailTo: string;
  recipients: Recipient[];
  allowedOrigins?: string[];
  honeypotField?: string | null;
  requireTurnstile?: boolean;
  maxPayloadBytes?: number;
  replyToField?: string | null;
  customSubject?: string | null;
  emailTemplateId?: string | null;
  isActive?: boolean;
};

/** Returns normalized http(s) origins, or null when any entry is invalid. */
function normalizeOrigins(input: string): string[] | null {
  const parts = input
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length === 0) return null;

  const origins: string[] = [];
  for (const part of parts) {
    if (part === "*") {
      origins.push("*");
      continue;
    }
    try {
      const parsed = new URL(part);
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
      origins.push(parsed.origin);
    } catch {
      return null;
    }
  }
  return origins;
}

export default function EditForm({ form, onClick, onSuccess }: Props) {
  const initial = form as FormWithSettings;
  const [formData, setFormData] = useState({
    title: form.title,
    description: form.description || "",
    emailTo: form.emailTo || "",
  });
  const [recipients, setRecipients] = useState<Recipient[]>(
    (form.recipients ?? [])
      .filter((recipient) => recipient.type === "cc" || recipient.type === "bcc")
      .map((recipient) => ({ email: recipient.email, type: recipient.type as "cc" | "bcc" }))
  );
  const [settings, setSettings] = useState<FormSettings>({
    allowedOrigins: initial.allowedOrigins ?? [],
    honeypotField:
      initial.honeypotField === undefined ? "_gotcha" : initial.honeypotField ?? "",
    requireTurnstile: initial.requireTurnstile ?? false,
    maxPayloadBytes: String(initial.maxPayloadBytes ?? 65536),
    replyToField: initial.replyToField ?? "",
    customSubject: initial.customSubject ?? "",
    emailTemplateId: initial.emailTemplateId ?? "",
    isActive: initial.isActive ?? true,
  });
  const [originInput, setOriginInput] = useState("");
  const [templates, setTemplates] = useState<Array<{ id: string; name: string }>>([]);
  // Only fields the user actually changed are sent back; untouched settings stay as they are.
  const touchedRef = useRef<Set<SettingsKey>>(new Set());
  const previousOriginsRef = useRef<string[]>(initial.allowedOrigins ?? []);
  const toast = useToast();
  const [loading, setLoading] = useState(false);

  const allowAnyOrigin = settings.allowedOrigins.includes("*");

  useEffect(() => {
    let active = true;
    fetch(`/api/forms/${encodeURIComponent(form.id)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { form?: Partial<FormWithSettings> } | null) => {
        const detail = data?.form;
        if (!active || !detail) return;
        setSettings((current) => {
          const touched = touchedRef.current;
          return {
            allowedOrigins: touched.has("allowedOrigins")
              ? current.allowedOrigins
              : detail.allowedOrigins ?? [],
            honeypotField: touched.has("honeypotField")
              ? current.honeypotField
              : detail.honeypotField === undefined
                ? "_gotcha"
                : detail.honeypotField ?? "",
            requireTurnstile: touched.has("requireTurnstile")
              ? current.requireTurnstile
              : detail.requireTurnstile ?? false,
            maxPayloadBytes: touched.has("maxPayloadBytes")
              ? current.maxPayloadBytes
              : String(detail.maxPayloadBytes ?? 65536),
            replyToField: touched.has("replyToField") ? current.replyToField : detail.replyToField ?? "",
            customSubject: touched.has("customSubject") ? current.customSubject : detail.customSubject ?? "",
            emailTemplateId: touched.has("emailTemplateId")
              ? current.emailTemplateId
              : detail.emailTemplateId ?? "",
            isActive: touched.has("isActive") ? current.isActive : detail.isActive ?? true,
          };
        });
      })
      .catch(() => {
        // The values on the form prop remain usable when the detail fetch fails.
      });
    return () => {
      active = false;
    };
  }, [form.id]);

  useEffect(() => {
    let active = true;
    fetch("/api/templates")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { templates?: Array<{ id: string; name: string }> } | null) => {
        if (active) setTemplates(data?.templates ?? []);
      })
      .catch(() => toast.error("Could not load email templates."));
    return () => {
      active = false;
    };
  }, [toast]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  function updateSetting<K extends keyof FormSettings>(key: K, value: FormSettings[K]) {
    touchedRef.current.add(key as SettingsKey);
    setSettings((current) => ({ ...current, [key]: value }));
  }

  const addOrigins = () => {
    if (allowAnyOrigin) return;
    const parsed = normalizeOrigins(originInput);
    if (!parsed) {
      toast.error("Enter comma-separated http(s) origins or *.");
      return;
    }
    const combined = [...settings.allowedOrigins, ...parsed];
    if (combined.includes("*")) {
      previousOriginsRef.current = settings.allowedOrigins.filter((origin) => origin !== "*");
      updateSetting("allowedOrigins", ["*"]);
    } else {
      const unique = Array.from(new Set(combined));
      if (unique.length > 25) {
        toast.error("You can add up to 25 allowed origins.");
        return;
      }
      updateSetting("allowedOrigins", unique);
    }
    setOriginInput("");
  };

  const toggleAllowAnyOrigin = (checked: boolean) => {
    if (checked) {
      previousOriginsRef.current = settings.allowedOrigins.filter((origin) => origin !== "*");
      updateSetting("allowedOrigins", ["*"]);
    } else {
      updateSetting("allowedOrigins", previousOriginsRef.current);
    }
    setOriginInput("");
  };

  const removeOrigin = (origin: string) => {
    if (origin === "*") {
      updateSetting("allowedOrigins", previousOriginsRef.current);
      return;
    }
    updateSetting(
      "allowedOrigins",
      settings.allowedOrigins.filter((item) => item !== origin)
    );
  };

  const updateRecipient = (index: number, patch: Partial<Recipient>) => {
    setRecipients((current) =>
      current.map((recipient, i) => (i === index ? { ...recipient, ...patch } : recipient))
    );
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    if (!formData.title.trim()) {
      toast.error("Form title is required");
      setLoading(false);
      return;
    }

    const cleaned = recipients
      .map((recipient) => ({ ...recipient, email: recipient.email.trim().toLowerCase() }))
      .filter((recipient) => recipient.email !== "");
    if (cleaned.some((recipient) => !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(recipient.email))) {
      toast.error("Every additional recipient needs a valid email address.");
      setLoading(false);
      return;
    }

    const touched = touchedRef.current;
    if (touched.has("maxPayloadBytes")) {
      const bytes = Number(settings.maxPayloadBytes);
      if (!Number.isInteger(bytes) || bytes < 1024 || bytes > 524288) {
        toast.error("Max payload must be a whole number between 1,024 and 524,288 bytes.");
        setLoading(false);
        return;
      }
    }

    const payload: PatchPayload = {
      title: formData.title,
      description: formData.description,
      emailTo: formData.emailTo,
      // A full list replaces all recipients; the primary `to` row is
      // derived from emailTo by the service.
      recipients: cleaned,
    };
    if (touched.has("allowedOrigins")) payload.allowedOrigins = settings.allowedOrigins;
    if (touched.has("honeypotField")) payload.honeypotField = settings.honeypotField.trim() || null;
    if (touched.has("requireTurnstile")) payload.requireTurnstile = settings.requireTurnstile;
    if (touched.has("maxPayloadBytes")) payload.maxPayloadBytes = Number(settings.maxPayloadBytes);
    if (touched.has("replyToField")) payload.replyToField = settings.replyToField.trim() || null;
    if (touched.has("customSubject")) payload.customSubject = settings.customSubject.trim() || null;
    if (touched.has("emailTemplateId")) payload.emailTemplateId = settings.emailTemplateId || null;
    if (touched.has("isActive")) payload.isActive = settings.isActive;

    try {
      const res = await fetch(`/api/forms/${form.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) {
        toast.error(json.error || "Failed to update form");
        setLoading(false);
        return;
      }
      toast.success("Form updated successfully");
      setLoading(false);
      onSuccess?.();
    } catch {
      toast.error("Failed to update form");
      setLoading(false);
    }
  };

  return (
    <Layout onClick={onClick} label="Edit form">
      <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 p-6 rounded-3xl shadow-lg max-w-md w-full">
        <h2 className="text-lg font-semibold mb-4 text-black dark:text-white">Edit Form</h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-6">
          Update the title, primary recipient and CC/BCC recipients.
        </p>
        <form onSubmit={handleSubmit} className="pt-5 grid grid-cols-1 gap-5">
          <InputField
            type="text"
            name="title"
            id="title"
            value={formData.title}
            placeholder="Form title"
            onChange={handleChange}
            label="Title"
          />
          <TextAreaField
            name="description"
            cols={4}
            id="desc"
            label="Description"
            placeholder="Description.."
            value={formData.description}
            onChange={handleChange}
          />
          <InputField
            type="email"
            name="emailTo"
            id="email"
            value={formData.emailTo}
            placeholder="recipient@email.com"
            onChange={handleChange}
            label="Primary recipient"
          />

          <fieldset className="grid grid-cols-1 gap-2">
            <legend className="text-zinc-900 dark:text-zinc-100 font-semibold capitalize">
              Additional recipients
            </legend>
            {recipients.map((recipient, index) => (
              <div key={index} className="flex flex-wrap items-center gap-2">
                <input
                  type="email"
                  aria-label={`Recipient ${index + 1} email`}
                  value={recipient.email}
                  onChange={(e) => updateRecipient(index, { email: e.target.value })}
                  placeholder="colleague@company.com"
                  className="min-w-0 flex-1 border border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-900/50 text-zinc-800 dark:text-zinc-200 py-2 px-3 rounded-md text-sm w-full"
                />
                <select
                  aria-label={`Recipient ${index + 1} type`}
                  value={recipient.type}
                  onChange={(e) =>
                    updateRecipient(index, { type: e.target.value as "cc" | "bcc" })
                  }
                  className="border border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-900/50 text-zinc-800 dark:text-zinc-200 py-2 px-2 rounded-md text-sm"
                >
                  <option value="cc">CC</option>
                  <option value="bcc">BCC</option>
                </select>
                <Tooltip label="Remove recipient">
                  <button
                    type="button"
                    aria-label={`Remove recipient ${index + 1}`}
                    onClick={() => setRecipients((current) => current.filter((_, i) => i !== index))}
                    className="p-2 text-zinc-500 hover:text-red-600 cursor-pointer"
                  >
                    <Icon name="X" size={15} />
                  </button>
                </Tooltip>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setRecipients((current) => [...current, { email: "", type: "cc" }])}
              className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 cursor-pointer text-left"
            >
              + Add CC / BCC recipient
            </button>
          </fieldset>

          <details className="group grid grid-cols-1 gap-4 rounded-2xl border border-zinc-200 bg-zinc-50/60 p-4 dark:border-zinc-800 dark:bg-zinc-900/30">
            <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100 [&::-webkit-details-marker]:hidden">
              <Icon name="Settings" size={16} />
              <span className="min-w-0 flex-1">Form settings</span>
              <Icon
                name="ChevronDown"
                size={16}
                className="shrink-0 transition-transform group-open:rotate-180"
              />
            </summary>

            <div className="grid grid-cols-1 gap-2">
              <InputField
                type="text"
                name="originInput"
                id="edit-origin-input"
                value={originInput}
                placeholder="https://example.com, https://app.example.com"
                onChange={(event) => setOriginInput(event.target.value)}
                label="Allowed origins"
              />
              <div className="flex flex-wrap items-center gap-2">
                <FormButton
                  type="button"
                  variant="secondary"
                  onClick={addOrigins}
                  disabled={allowAnyOrigin}
                >
                  <Icon name="Plus" size={14} /> Add origin
                </FormButton>
                <span className="min-w-0 break-words text-xs text-zinc-500 dark:text-zinc-400">
                  Comma-separated http(s) origins
                </span>
              </div>
              {settings.allowedOrigins.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {settings.allowedOrigins.map((origin, index) => (
                    <span
                      key={`${origin}-${index}`}
                      className="inline-flex min-w-0 max-w-full items-center gap-1 rounded-full border border-zinc-300 bg-zinc-100 px-2 py-1 text-xs text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
                    >
                      <span className="min-w-0 truncate">{origin}</span>
                      <button
                        type="button"
                        aria-label={`Remove origin ${origin}`}
                        onClick={() => removeOrigin(origin)}
                        className="shrink-0 cursor-pointer text-zinc-500 hover:text-red-600 dark:hover:text-red-400"
                      >
                        <Icon name="X" size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <div className="flex items-start gap-2">
                <input
                  id="edit-allow-any-origin"
                  type="checkbox"
                  checked={allowAnyOrigin}
                  onChange={(event) => toggleAllowAnyOrigin(event.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-zinc-900 dark:accent-zinc-100"
                />
                <label
                  htmlFor="edit-allow-any-origin"
                  className="min-w-0 break-words text-sm text-zinc-800 dark:text-zinc-200"
                >
                  Allow any origin (*)
                </label>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Empty list currently allows any origin.
              </p>
            </div>

            <InputField
              type="text"
              name="honeypotField"
              id="edit-honeypot"
              value={settings.honeypotField}
              placeholder="_gotcha"
              onChange={(event) => updateSetting("honeypotField", event.target.value)}
              label="Honeypot field name"
            />

            <div className="grid grid-cols-1 gap-2">
              <div className="flex items-start gap-2">
                <input
                  id="edit-require-turnstile"
                  type="checkbox"
                  checked={settings.requireTurnstile}
                  onChange={(event) => updateSetting("requireTurnstile", event.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-zinc-900 dark:accent-zinc-100"
                />
                <label
                  htmlFor="edit-require-turnstile"
                  className="min-w-0 break-words text-sm text-zinc-800 dark:text-zinc-200"
                >
                  Turnstile required
                </label>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Requires TURNSTILE_SECRET_KEY on the server and the Cloudflare widget rendered on
                your site.
              </p>
            </div>

            <InputField
              type="text"
              name="replyToField"
              id="edit-reply-to"
              value={settings.replyToField}
              placeholder="email"
              onChange={(event) => updateSetting("replyToField", event.target.value)}
              label="Reply-to field name"
            />
            <InputField
              type="text"
              name="customSubject"
              id="edit-custom-subject"
              value={settings.customSubject}
              placeholder="Contact form submission"
              onChange={(event) => updateSetting("customSubject", event.target.value)}
              label="Custom subject"
            />
            <InputField
              type="number"
              name="maxPayloadBytes"
              id="edit-max-payload"
              value={settings.maxPayloadBytes}
              placeholder="65536"
              onChange={(event) => updateSetting("maxPayloadBytes", event.target.value)}
              label="Max payload bytes"
            />
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Between 1,024 and 524,288 bytes.
            </p>

            <SelectField
              name="emailTemplateId"
              id="edit-template"
              value={settings.emailTemplateId}
              onChange={(event) => updateSetting("emailTemplateId", event.target.value)}
              label="Email template"
            >
              <option value="">Default template</option>
              {settings.emailTemplateId &&
                !templates.some((template) => template.id === settings.emailTemplateId) && (
                  <option value={settings.emailTemplateId}>Current template</option>
                )}
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </SelectField>

            <div className="flex items-start gap-2">
              <input
                id="edit-is-active"
                type="checkbox"
                checked={settings.isActive}
                onChange={(event) => updateSetting("isActive", event.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-zinc-900 dark:accent-zinc-100"
              />
              <label
                htmlFor="edit-is-active"
                className="min-w-0 break-words text-sm text-zinc-800 dark:text-zinc-200"
              >
                Active form
              </label>
            </div>
          </details>

          <div className="actions grid grid-cols-2 gap-3">
            <FormButton onClick={onClick} variant="danger" type="button">
              Close
            </FormButton>
            <FormButton type="submit" disabled={loading}>
              {loading ? (
                <Icon name="Loader" size={20} className="animate-spin" />
              ) : (
                <>
                  <Icon name="Check" size={16} strokeWidth={2} /> Save Changes
                </>
              )}
            </FormButton>
          </div>
        </form>
      </div>
    </Layout>
  );
}
