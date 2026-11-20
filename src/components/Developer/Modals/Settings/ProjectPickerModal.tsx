"use client";
import { useEffect, useState } from "react";
import Layout from "@/components/Developer/Modals/Layout";
import { Icon } from "@/components/Global/Icon";

type Project = { id: string; name: string };

/** First step of the shell's Plus action: choose where the new form lives. */
export default function ProjectPickerModal({
  onPick,
  onClose,
}: {
  onPick: (projectId: string) => void;
  onClose: () => void;
}) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    fetch("/api/projects")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { projects?: Project[] } | null) => setProjects(data?.projects ?? []))
      .catch(() => setError("Could not load projects."));
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <Layout onClick={onClose}>
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="pick-project-title"
        className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl dark:bg-zinc-950 sm:p-6"
      >
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-600/20 text-yellow-600">
            <Icon name="FolderPlus" size={16} strokeWidth={2} aria-hidden="true" />
          </span>
          <h2 id="pick-project-title" className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            New form — choose a project
          </h2>
        </div>
        <p className="mt-2 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
          The form will be created inside the project you pick.
        </p>
        <div className="mt-4 grid max-h-64 grid-cols-1 gap-2 overflow-y-auto">
          {projects.map((project) => (
            <button
              key={project.id}
              type="button"
              onClick={() => onPick(project.id)}
              className="flex cursor-pointer items-center gap-2 rounded-lg bg-zinc-50 px-4 py-3 text-left text-sm font-medium text-zinc-800 hover:bg-zinc-100 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              <Icon name="Folder" size={15} className="text-zinc-400" aria-hidden="true" />
              {project.name}
            </button>
          ))}
          {projects.length === 0 && !error && (
            <p className="py-6 text-center text-sm text-zinc-500">No projects yet.</p>
          )}
          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>
      </section>
    </Layout>
  );
}
