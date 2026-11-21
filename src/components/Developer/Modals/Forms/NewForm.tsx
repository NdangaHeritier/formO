"use client";
import { useEffect, useState } from "react";
import FormButton from "@/components/Global/FormButton";
import Layout from "../Layout";
import { Icon } from "@/components/Global/Icon";
import { InputField } from "@/components/Global/InputField";
import { TextAreaField } from "@/components/Global/TextAreaField";
import { SelectField } from "@/components/Global/SelectField";

type Props = {
  /** Project id. When set, the form is created in this project and the picker is hidden. */
  project?: string;
  projectName?: string;
  onClick: () => void;
  onSuccess?: (form: { id: string; endpoint: string }) => void;
};

type Recipient = { email: string; type: "cc" | "bcc" };

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
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
      .catch(() => setError("Could not load projects."));
  }, [scopedToProject]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const updateRecipient = (index: number, patch: Partial<Recipient>) => {
    setRecipients((current) =>
      current.map((recipient, i) => (i === index ? { ...recipient, ...patch } : recipient))
    );
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    if (!formData.projectId || !formData.title.trim() || !formData.emailTo.trim()) {
      setError("Choose a project and provide a title and recipient email.");
      return;
    }

    const cleaned = recipients
      .map((recipient) => ({ ...recipient, email: recipient.email.trim().toLowerCase() }))
      .filter((recipient) => recipient.email !== "");
    if (cleaned.some((recipient) => !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(recipient.email))) {
      setError("Every additional recipient needs a valid email address.");
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
        }),
      });
      const data = (await res.json().catch(() => null)) as {
        form?: { id: string; endpoint: string };
        error?: string;
      } | null;
      if (!res.ok || !data?.form) {
        setError(data?.error ?? "Could not create the form.");
        return;
      }
      onSuccess?.(data.form);
      onClick();
    } catch {
      setError("Could not create the form.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout onClick={onClick}>
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
              <div key={index} className="flex items-center gap-2">
                <input
                  type="email"
                  aria-label={`Recipient ${index + 1} email`}
                  value={recipient.email}
                  onChange={(e) => updateRecipient(index, { email: e.target.value })}
                  placeholder="colleague@company.com"
                  className="border border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-900/50 text-zinc-800 dark:text-zinc-200 py-2 px-3 rounded-md text-sm w-full"
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
                <button
                  type="button"
                  aria-label={`Remove recipient ${index + 1}`}
                  onClick={() => setRecipients((current) => current.filter((_, i) => i !== index))}
                  className="p-2 text-zinc-500 hover:text-red-600 cursor-pointer"
                >
                  <Icon name="X" size={15} />
                </button>
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

          {error && <div className="text-red-500 text-xs">{error}</div>}
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
