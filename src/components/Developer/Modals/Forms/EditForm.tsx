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

export default function EditForm({ form, onClick, onSuccess }: Props) {
  const [formData, setFormData] = useState({
    title: form.title,
    description: form.description || "",
    recipientEmail: form.email_to || "",
  });
  const [error, setError] = useState("");
  const [notification, setNotification] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
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
    try {
      const res = await fetch(`/api/forms/${form.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: formData.title, description: formData.description, recipientEmail: formData.recipientEmail }),
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
      setTimeout(() => { setNotification(""); onClick(); }, 1500);
    } catch {
      setError("Failed to update form");
      setLoading(false);
    }
  };

  return (
    <Layout onClick={onClick}>
      {notification && (
        <div className="fixed top-5 z-50 p-3 rounded-lg right-5 inline-flex justify-start items-center gap-2 bg-white border border-zinc-300 shadow-lg dark:bg-black backdrop-blur-2xl dark:border-green-800">
          <Icon name="CheckCircle" size={16} className="inline-flex self-center text-green-500" />
          <div className="text-green-500">{notification}</div>
        </div>
      )}
      <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 p-6 rounded-2xl shadow-lg max-w-md w-full">
        <h2 className="text-lg font-semibold mb-4 text-black dark:text-white">Edit Form</h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-6">Update form title, description and recipient email.</p>
        <form onSubmit={handleSubmit} className="pt-5 grid grid-cols-1 gap-5">
          <InputField type="text" name="title" id="title" value={formData.title} placeholder="Form title" onChange={handleChange} label="Title" />
          <TextAreaField name="description" cols={4} id="desc" label="Description" placeholder="Description.." value={formData.description} onChange={handleChange} />
          <InputField type="email" name="recipientEmail" id="email" value={formData.recipientEmail} placeholder="recipient@email.com" onChange={handleChange} label="Recipient Email" />
          {error && <div className="text-red-500 text-xs">{error}</div>}
          <div className="actions grid grid-cols-2 gap-3">
            <FormButton onClick={onClick} variant="danger">Close</FormButton>
            <FormButton type="submit" variant="primary" disabled={loading || !!error}>
              {loading ? <Icon name="Loader" size={20} className="animate-spin" /> : (<><Icon name="Check" size={16} strokeWidth={2} /> Save Changes</>)}
            </FormButton>
          </div>
        </form>
      </div>
    </Layout>
  );
}
