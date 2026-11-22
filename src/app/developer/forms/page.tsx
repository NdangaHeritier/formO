"use client";
import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import DeveloperShell from "@/components/Developer/DeveloperShell";
import NewForm from "@/components/Developer/Modals/Forms/NewForm";
import { Squares } from "@/components/Global/Squares";
import { Icon } from "@/components/Global/Icon";
import { relativeTime } from "@/lib/format";
import { SkeletonTableRows } from "@/components/Global/Skeleton";
import { useToast } from "@/components/Global/Toast";

type WorkspaceForm = {
  id: string;
  title: string;
  description: string | null;
  endpoint: string;
  emailTo: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  project: { id: string; name: string; slug: string };
  _count: { submissions: number; recipients: number };
};

const FormsPage = () => {
  const [forms, setForms] = useState<WorkspaceForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [query, setQuery] = useState("");
  const toast = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [resolvedProject, setResolvedProject] = useState<{
    slug: string;
    id: string;
    name: string;
  } | null>(null);

  // Deep link from the shell's "+" button: /developer/forms?new=project&project_name=<slug>
  const newFormOpen = searchParams.get("new") === "project";
  const projectSlug = searchParams.get("project_name");
  const newFormProject =
    resolvedProject && resolvedProject.slug === projectSlug
      ? { id: resolvedProject.id, name: resolvedProject.name }
      : null;

  useEffect(() => {
    if (!newFormOpen || !projectSlug) return;
    let active = true;
    fetch(`/api/projects/slug/${encodeURIComponent(projectSlug)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { project?: { id: string; name: string } } | null) => {
        if (active && data?.project) {
          setResolvedProject({ slug: projectSlug, id: data.project.id, name: data.project.name });
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [newFormOpen, projectSlug]);

  const closeNewForm = () => router.replace("/developer/forms");

  useEffect(() => {
    fetch("/api/forms")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { forms?: WorkspaceForm[] } | null) => {
        if (data?.forms) setForms(data.forms);
        else setLoadError(true);
      })
      .catch(() => setLoadError(true))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return forms;
    return forms.filter(
      (f) =>
        f.title.toLowerCase().includes(q) ||
        f.project.name.toLowerCase().includes(q) ||
        f.endpoint.toLowerCase().includes(q)
    );
  }, [forms, query]);

  const copyText = (value: string, label: string) => {
    navigator.clipboard.writeText(value);
    toast.success(`${label} copied to clipboard`);
  };

  const publicUrl = (endpoint: string) => `/api/f/${endpoint}`;

  const embedSnippet = (endpoint: string) =>
    `<form action="${window.location.origin}/api/f/${endpoint}" method="POST">\n` +
    `  <input name="email" type="email" required />\n` +
    `  <textarea name="message" required></textarea>\n` +
    `  <input name="_gotcha" tabindex="-1" autocomplete="off" hidden />\n` +
    `  <button type="submit">Send</button>\n` +
    `</form>`;

  const sendTestSubmission = (form: WorkspaceForm) =>
    toast.promise(
      async () => {
        const res = await fetch(`/api/f/${form.endpoint}`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({
            name: "FormO dashboard test",
            message: "This submission was sent from the FormO dashboard.",
          }),
        });
        const data = (await res.json().catch(() => null)) as {
          id?: string;
          error?: string;
          duplicate?: boolean;
        } | null;
        if (!res.ok) throw new Error(data?.error ?? "Submission rejected");
        return data;
      },
      {
        loading: "Sending test submission…",
        success: (data) => `Accepted${data?.duplicate ? " (duplicate)" : ""} — ${data?.id ?? "ok"}`,
        error: (error) => error instanceof Error ? error.message : "Could not reach the submission endpoint",
      }
    );

  return (
    <DeveloperShell>
      <div className="relative rounded-2xl">
        <Squares parLength={100} />
        <div className="projects relative z-10 grid grid-cols-1 gap-card bg-gradient-to-tr from-zinc-100 to-zinc-100/50 dark:from-zinc-950 from-80% to-20% dark:to-zinc-950/50 rounded-card p-panel">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <div className="title text-xl font-bold">Forms</div>
              <span className="text-xs font-medium bg-zinc-200/60 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 px-2 py-0.5 rounded-full">
                {forms.length}
              </span>
            </div>
            <div className="relative">
              <Icon name="Search" size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search forms…"
                className="h-9 w-full rounded-md sm:w-52 border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-950 ps-9 pe-3 text-sm text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 outline-none focus:border-zinc-500 transition"
              />
            </div>
          </div>

          {loading ? (
            <div className="overflow-x-auto rounded-2xl border border-zinc-200 dark:border-zinc-900 bg-white dark:bg-black shadow-lg">
              <SkeletonTableRows rows={5} />
            </div>
          ) : loadError ? (
            <div className="text-center text-zinc-500 p-10">Couldn&apos;t load forms.</div>
          ) : filtered.length === 0 ? (
            <div className="text-center text-zinc-500 p-10 flex flex-col items-center gap-3">
              <Icon name="SquareCode" size={28} className="text-zinc-400" />
              {forms.length === 0
                ? "No forms yet — open a project and use Add Form to create one."
                : `No forms match "${query}".`}
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-zinc-200 dark:border-zinc-900 bg-white dark:bg-black shadow-lg">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 text-xs uppercase tracking-wide">
                    <th scope="col" className="px-5 py-3 text-start font-semibold">Form</th>
                    <th scope="col" className="px-5 py-3 text-start font-semibold">Project</th>
                    <th scope="col" className="px-5 py-3 text-start font-semibold">Endpoint</th>
                    <th scope="col" className="px-5 py-3 text-start font-semibold">Recipients</th>
                    <th scope="col" className="px-5 py-3 text-start font-semibold">Submissions</th>
                    <th scope="col" className="px-5 py-3 text-start font-semibold">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((form) => (
                    <tr
                      key={form.id}
                      className="border-b border-zinc-100 dark:border-zinc-900 last:border-0 hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition"
                    >
                      <td className="px-5 py-4 max-w-xs">
                        <div className="font-semibold text-zinc-800 dark:text-zinc-200 truncate">{form.title}</div>
                        <div className="text-xs text-zinc-500 dark:text-zinc-400 truncate">{form.emailTo}</div>
                      </td>
                      <td className="px-5 py-4">
                        <Link
                          href={`/developer/projects/${encodeURIComponent(form.project.slug || form.project.name)}`}
                          className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 hover:underline"
                        >
                          <Icon name="Folder" size={14} className="text-zinc-400 shrink-0" />
                          <span className="truncate">{form.project.name}</span>
                        </Link>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <code
                            className="text-xs font-mono text-zinc-600 dark:text-zinc-400 max-w-[200px] truncate"
                            title={publicUrl(form.endpoint)}
                          >
                            {publicUrl(form.endpoint)}
                          </code>
                          <button
                            type="button"
                            title="Copy public submission URL"
                            aria-label={`Copy public submission URL for ${form.title}`}
                            onClick={() => copyText(`${window.location.origin}${publicUrl(form.endpoint)}`, "Public URL")}
                            className="p-1.5 rounded-lg bg-zinc-100/70 dark:bg-zinc-900/70 hover:bg-zinc-200/70 dark:hover:bg-zinc-900 cursor-pointer"
                          >
                            <Icon name="Copy" size={13} className="text-zinc-500" />
                          </button>
                          <button
                            type="button"
                            title="Copy HTML embed snippet"
                            aria-label={`Copy embed HTML for ${form.title}`}
                            onClick={() => copyText(embedSnippet(form.endpoint), "Embed HTML")}
                            className="p-1.5 rounded-lg bg-zinc-100/70 dark:bg-zinc-900/70 hover:bg-zinc-200/70 dark:hover:bg-zinc-900 cursor-pointer"
                          >
                            <Icon name="Code" size={13} className="text-zinc-500" />
                          </button>
                          <button
                            type="button"
                            title="Send a test submission"
                            aria-label={`Send a test submission to ${form.title}`}
                            onClick={() => { void sendTestSubmission(form).catch(() => {}); }}
                            className="p-1.5 rounded-lg bg-zinc-100/70 dark:bg-zinc-900/70 hover:bg-zinc-200/70 dark:hover:bg-zinc-900 cursor-pointer"
                          >
                            <Icon name="Send" size={13} className="text-zinc-500" />
                          </button>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-zinc-700 dark:text-zinc-400 whitespace-nowrap">
                        {form._count.recipients}
                      </td>
                      <td className="px-5 py-4 text-zinc-700 dark:text-zinc-400 whitespace-nowrap">
                        {form._count.submissions}
                      </td>
                      <td
                        className="px-5 py-4 text-zinc-700 dark:text-zinc-400 whitespace-nowrap"
                        title={new Date(form.createdAt).toLocaleString()}
                      >
                        {relativeTime(form.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      {newFormOpen && (
        <NewForm
          project={newFormProject?.id}
          projectName={newFormProject?.name ?? undefined}
          onClick={closeNewForm}
        />
      )}
    </DeveloperShell>
  );
};

export default function FormsPageWithSuspense() {
  return (
    <Suspense fallback={null}>
      <FormsPage />
    </Suspense>
  );
}
