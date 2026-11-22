"use client";
import FormButton from "@/components/Global/FormButton";
import Layout from "../Layout";
import { Icon } from "@/components/Global/Icon";
import { InputField } from "@/components/Global/InputField";
import { useToast } from "@/components/Global/Toast";
import { TextAreaField } from "@/components/Global/TextAreaField";
import React, { useState } from "react";
import { ProjectType } from "@/types/Project";

type Props = {
  project: ProjectType;
  onClick: () => void;
  onSuccess?: () => void;
};

export default function EditProject({ project, onClick, onSuccess }: Props) {
  const [formData, setFormData] = useState({
    name: project.name,
    description: project.description ?? "",
  });
  const toast = useToast();
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    if (!formData.name.trim()) {
      toast.error("Project name is required");
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: formData.name, description: formData.description }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) {
        toast.error(json.error || "Failed to update project");
        setLoading(false);
        return;
      }
      toast.success("Project updated successfully");
      setLoading(false);
      onSuccess?.();
    } catch {
      toast.error("Failed to update project");
      setLoading(false);
    }
  };

  return (
    <Layout onClick={onClick} label="Edit project">
      <div className="form-enter-animation bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 p-6 rounded-3xl shadow-lg max-w-md w-full">
        <h2 className="text-lg font-semibold mb-4 text-black dark:text-white">Edit Project</h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-6">Update your project name and description.</p>
        <form onSubmit={handleSubmit} className="pt-5 grid grid-cols-1 gap-5">
          <InputField type="text" name="name" id="name" value={formData.name} placeholder="Project name" onChange={handleChange} label="Project Name" />
          <TextAreaField name="description" cols={5} id="desc" label="Description" placeholder="Description.." value={formData.description} onChange={handleChange} />
          <div className="actions grid grid-cols-2 gap-3">
            <FormButton onClick={onClick} variant="danger">Close</FormButton>
            <FormButton type="submit" variant="primary" disabled={loading}>
              {loading ? <Icon name="Loader" size={20} className="animate-spin" /> : (<><Icon name="Check" size={16} strokeWidth={2} /> Save Changes</>)}
            </FormButton>
          </div>
        </form>
      </div>
    </Layout>
  );
}
