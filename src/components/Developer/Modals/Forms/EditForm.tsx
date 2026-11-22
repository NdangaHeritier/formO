"use client";
import FormButton from "@/components/Global/FormButton";
import Layout from "../Layout";
import { Icon } from "@/components/Global/Icon";
import { InputField } from "@/components/Global/InputField";
import { TextAreaField } from "@/components/Global/TextAreaField";
import React, { useState } from "react";
import { FormType } from "@/types/Project";

type Props = {
  form: FormType;
  onClick: () => void;
  onSuccess?: () => void;
};

type Recipient = { email: string; type: "cc" | "bcc" };

export default function EditForm({ form, onClick, onSuccess }: Props) {
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
  const [error, setError] = useState("");
  const [notification, setNotification] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setError("");
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const updateRecipient = (index: number, patch: Partial<Recipient>) => {
    setError("");
    setRecipients((current) =>
      current.map((recipient, i) => (i === index ? { ...recipient, ...patch } : recipient))
    );
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    if (!formData.title.trim()) {
      setError("Form title is required");
      setLoading(false);
      return;
    }

    const cleaned = recipients
      .map((recipient) => ({ ...recipient, email: recipient.email.trim().toLowerCase() }))
      .filter((recipient) => recipient.email !== "");
    if (cleaned.some((recipient) => !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(recipient.email))) {
      setError("Every additional recipient needs a valid email address.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`/api/forms/${form.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          emailTo: formData.emailTo,
          // A full list replaces all recipients; the primary `to` row is
          // derived from emailTo by the service.
          recipients: cleaned,
        }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(json.error || "Failed to update form");
        setLoading(false);
        return;
      }
      setNotification("Form updated successfully");
      setLoading(false);
      onSuccess?.();
      setTimeout(() => {
        setNotification("");
        onClick();
      }, 1500);
    } catch {
      setError("Failed to update form");
      setLoading(false);
    }
  };

  return (
    <Layout onClick={onClick}>
      {notification && (
        <div
          role="status"
          className="fixed top-5 z-50 p-3 rounded-lg right-5 inline-flex justify-start items-center gap-2 bg-white border border-zinc-300 shadow-lg dark:bg-black backdrop-blur-2xl dark:border-green-800"
        >
          <Icon name="CheckCircle" size={16} className="inline-flex self-center text-green-500" />
          <div className="text-green-500">{notification}</div>
        </div>
      )}
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
