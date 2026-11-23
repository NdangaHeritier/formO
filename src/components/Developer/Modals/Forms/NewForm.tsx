"use client";
import { useEffect, useState } from "react";
import FormButton from "@/components/Global/FormButton";
import Layout from "../Layout";
import { Icon } from "@/components/Global/Icon";
import { InputField } from "@/components/Global/InputField";
import { TextAreaField } from "@/components/Global/TextAreaField";
import { SelectField } from "@/components/Global/SelectField";
import { useToast } from "@/components/Global/Toast";
import Tooltip from "@/components/Global/Tooltip";

type Props = {
  /** Project id. When set, the form is created in this project and the picker is hidden. */
  project?: string;
  projectName?: string;
  onClick: () => void;
  onSuccess?: (form: { id: string; endpoint: string }) => void;
};

type Recipient = { email: string; type: "cc" | "bcc" };

type AdvancedSettings = {
  allowedOrigins: string[];
  honeypotField: string;
  requireTurnstile: boolean;
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

export default function NewForm({ project, projectName, onClick, onSuccess }: Props) {
  const scopedToProject = Boolean(project);
  const [formData, setFormData] = useState({
    projectId: project ?? "",
    title: "",
    description: "",
    emailTo: "",
  });
  const [projects, setProjects] = useState<Array<{ id: string; name: string }>>([]);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [advanced, setAdvanced] = useState<AdvancedSettings>({
    allowedOrigins: [],
    honeypotField: "_gotcha",
    requireTurnstile: false,
  });
  const [originInput, setOriginInput] = useState("");
  const [previousOrigins, setPreviousOrigins] = useState<string[]>([]);
  const toast = useToast();
  const [loading, setLoading] = useState(false);

  const allowAnyOrigin = advanced.allowedOrigins.includes("*");

  useEffect(() => {
    if (scopedToProject) return;
    fetch("/api/projects")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { projects?: Array<{ id: string; name: string }> } | null) => {
        const list = data?.projects ?? [];
        setProjects(list);
        setFormData((current) => ({
          ...current,
          projectId: current.projectId || list[0]?.id || "",
        }));
      })
      .catch(() => toast.error("Could not load projects."));
  }, [scopedToProject, toast]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  function updateAdvanced<K extends keyof AdvancedSettings>(key: K, value: AdvancedSettings[K]) {
    setAdvanced((current) => ({ ...current, [key]: value }));
  }

  const addOrigins = () => {
    if (allowAnyOrigin) return;
    const parsed = normalizeOrigins(originInput);
    if (!parsed) {
      toast.error("Enter comma-separated http(s) origins or *.");
      return;
    }
    const combined = [...advanced.allowedOrigins, ...parsed];
    if (combined.includes("*")) {
      setPreviousOrigins(advanced.allowedOrigins.filter((origin) => origin !== "*"));
      updateAdvanced("allowedOrigins", ["*"]);
    } else {
      const unique = Array.from(new Set(combined));
      if (unique.length > 25) {
        toast.error("You can add up to 25 allowed origins.");
        return;
      }
      updateAdvanced("allowedOrigins", unique);
    }
    setOriginInput("");
  };

  const toggleAllowAnyOrigin = (checked: boolean) => {
    if (checked) {
      setPreviousOrigins(advanced.allowedOrigins.filter((origin) => origin !== "*"));
      updateAdvanced("allowedOrigins", ["*"]);
    } else {
      updateAdvanced("allowedOrigins", previousOrigins);
    }
    setOriginInput("");
  };

  const removeOrigin = (origin: string) => {
    if (origin === "*") {
      updateAdvanced("allowedOrigins", previousOrigins);
      return;
    }
    updateAdvanced(
      "allowedOrigins",
      advanced.allowedOrigins.filter((item) => item !== origin)
    );
  };

  const updateRecipient = (index: number, patch: Partial<Recipient>) => {
    setRecipients((current) =>
      current.map((recipient, i) => (i === index ? { ...recipient, ...patch } : recipient))
    );
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formData.projectId || !formData.title.trim() || !formData.emailTo.trim()) {
      toast.error("Choose a project and provide a title and recipient email.");
      return;
    }

    const cleaned = recipients
      .map((recipient) => ({ ...recipient, email: recipient.email.trim().toLowerCase() }))
      .filter((recipient) => recipient.email !== "");
    if (cleaned.some((recipient) => !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(recipient.email))) {
      toast.error("Every additional recipient needs a valid email address.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${encodeURIComponent(formData.projectId)}/forms`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title.trim(),
          description: formData.description.trim() || null,
          emailTo: formData.emailTo.trim().toLowerCase(),
          recipients: cleaned,
          allowedOrigins: advanced.allowedOrigins,
          honeypotField: advanced.honeypotField.trim() || null,
          requireTurnstile: advanced.requireTurnstile,
        }),
      });
      const data = (await res.json().catch(() => null)) as {
        form?: { id: string; endpoint: string };
        error?: string;
      } | null;
      if (!res.ok || !data?.form) {
        toast.error(data?.error ?? "Could not create the form.");
        return;
      }
      toast.success("Form created successfully");
      onSuccess?.(data.form);
      onClick();
    } catch {
      toast.error("Could not create the form.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout onClick={onClick} label="Create form">
      <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 p-6 rounded-3xl shadow-lg max-w-md w-full">
        <h2 className="text-lg font-semibold mb-4 text-black dark:text-white">Create New Form</h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-6">
          {scopedToProject
            ? `This form will be created in ${projectName ?? "this project"}.`
            : "A FormO form is the backend your real form posts to. The primary recipient is always the address below; add CC or BCC recipients as needed."}
        </p>

        <form onSubmit={handleSubmit} className="pt-5 grid grid-cols-1 gap-5">
          {scopedToProject ? (
            <div className="grid grid-cols-1 gap-1">
              <span className="text-zinc-900 dark:text-zinc-100 font-semibold capitalize">Project</span>
              <div className="flex items-center gap-2 rounded-md border border-zinc-200 bg-zinc-100/80 px-3 py-2 text-sm text-zinc-800 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-200">
                <Icon name="Folder" size={15} className="text-zinc-500" />
                {projectName ?? "Current project"}
              </div>
            </div>
          ) : (
            <SelectField
              name="projectId"
              value={formData.projectId}
              onChange={handleChange}
              id="project"
              label="Project"
            >
              <option value="">Select a project…</option>
              {projects.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </SelectField>
          )}

          <InputField
            type="text"
            name="title"
            id="title"
            value={formData.title}
            placeholder="Form Title"
            onChange={handleChange}
            label="Title"
          />
          <InputField
            type="email"
            name="emailTo"
            id="new-form-email"
            value={formData.emailTo}
            placeholder="recipient@company.com"
            onChange={handleChange}
            label="Primary recipient"
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
              <Icon name="SlidersHorizontal" size={16} />
              <span className="min-w-0 flex-1">Advanced settings</span>
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
                id="new-origin-input"
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
              {advanced.allowedOrigins.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {advanced.allowedOrigins.map((origin, index) => (
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
                  id="new-allow-any-origin"
                  type="checkbox"
                  checked={allowAnyOrigin}
                  onChange={(event) => toggleAllowAnyOrigin(event.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-zinc-900 dark:accent-zinc-100"
                />
                <label
                  htmlFor="new-allow-any-origin"
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
              id="new-honeypot"
              value={advanced.honeypotField}
              placeholder="_gotcha"
              onChange={(event) => updateAdvanced("honeypotField", event.target.value)}
              label="Honeypot field name"
            />

            <div className="grid grid-cols-1 gap-2">
              <div className="flex items-start gap-2">
                <input
                  id="new-require-turnstile"
                  type="checkbox"
                  checked={advanced.requireTurnstile}
                  onChange={(event) => updateAdvanced("requireTurnstile", event.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-zinc-900 dark:accent-zinc-100"
                />
                <label
                  htmlFor="new-require-turnstile"
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
          </details>

          <div className="actions grid grid-cols-2 gap-3">
            <FormButton onClick={onClick} variant="danger" type="button">
              Close
            </FormButton>
            <FormButton type="submit" disabled={loading}>
              {loading ? (
                <Icon name="Loader" size={16} className="animate-spin" />
              ) : (
                <Icon name="Plus" size={16} strokeWidth={2} />
              )}
              Add Form
            </FormButton>
          </div>
        </form>
      </div>
    </Layout>
  );
}
