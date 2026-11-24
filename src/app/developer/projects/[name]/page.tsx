"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import DeveloperShell from "@/components/Developer/DeveloperShell";
import EditProject from "@/components/Developer/Modals/Forms/EditProject";
import NewForm from "@/components/Developer/Modals/Forms/NewForm";
import FormButton from "@/components/Global/FormButton";
import { Icon } from "@/components/Global/Icon";
import { SkeletonLine, SkeletonListRows, SkeletonMetricCard } from "@/components/Global/Skeleton";
import { useToast } from "@/components/Global/Toast";
import { relativeTime } from "@/lib/format";
import type { ProjectType } from "@/types/Project";

const submissionStatusClass = (status: string) =>
  status === "sent"
    ? "bg-green-600/15 text-green-600 dark:text-green-400"
    : status === "failed"
      ? "bg-red-600/15 text-red-600 dark:text-red-400"
      : status === "spam"
        ? "bg-yellow-600/15 text-yellow-600 dark:text-yellow-400"
        : "bg-zinc-500/15 text-zinc-500 dark:text-zinc-400";

const pillClass = "rounded-full px-2 py-0.5 text-[11px] font-medium";

export default function ProjectPage() {
  const { name: slug } = useParams();
  const toast = useToast();
  const [project, setProject] = useState<ProjectType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [createFormOpen, setCreateFormOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!slug) return;
    void Promise.resolve().then(() => {
      setLoading(true);
      setError(false);
    });
    fetch(`/api/projects/slug/${encodeURIComponent(String(slug))}`)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("project"))))
      .then((data: { project?: ProjectType }) => {
        if (data.project) setProject(data.project);
        else setError(true);
      })
      .catch(() => {
        setError(true);
        toast.error("Could not load this project.");
      })
      .finally(() => setLoading(false));
  }, [slug, refreshKey, toast]);

  const stats = project?.submissionsStats;
  const total = stats?.total ?? 0;
  const distribution = [
    { label: "Delivered", value: stats?.sent ?? 0, bar: "bg-green-600", dot: "bg-green-600/40" },
    { label: "Failed", value: stats?.failed ?? 0, bar: "bg-red-500", dot: "bg-red-500/40" },
    { label: "Spam", value: stats?.spam ?? 0, bar: "bg-yellow-500", dot: "bg-yellow-600/30" },
    { label: "Pending", value: stats?.pending ?? 0, bar: "bg-zinc-400", dot: "bg-zinc-300 dark:bg-zinc-700" },
  ];
  const topForms = [...(project?.forms ?? [])]
    .sort((a, b) => (b.submissionsCount ?? 0) - (a.submissionsCount ?? 0))
    .slice(0, 5);
  const recentSubmissions = project?.recentSubmissions ?? [];

  const refresh = () => setRefreshKey((key) => key + 1);

  return (
    <DeveloperShell>
      <div className="grid grid-cols-1 gap-card p-panel">
        <div className="rounded-card bg-white p-panel dark:bg-zinc-950">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="grid min-w-0 grid-cols-1 gap-2">
              <div className="flex items-center gap-2">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-900">
                  <Icon name="Code2" strokeWidth={2} className="h-6 w-6 text-zinc-600 dark:text-zinc-300" />
                </span>
                {loading ? (
                  <SkeletonLine width="w-40" className="h-6" />
                ) : (
                  <h1 className="break-words text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                    {project?.name ?? String(slug)}
                  </h1>
                )}
              </div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                {loading ? "" : project?.description || "No description provided yet."}
              </p>
              {project?.slug && (
                <span className="w-fit rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 dark:bg-zinc-900 dark:text-zinc-300">
                  /{project.slug}
                </span>
              )}
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <FormButton
                  type="button"
                  variant="primary"
                  disabled={!project}
                  onClick={() => setCreateFormOpen(true)}
                >
                  <Icon name="Plus" size={15} /> Add Form
                </FormButton>
                <FormButton
                  type="button"
                  variant="secondary"
                  disabled={!project}
                  onClick={() => setEditOpen(true)}
                >
                  <Icon name="Settings" size={15} /> Edit project
                </FormButton>
                <Link
                  href="/developer/forms"
                  className="inline-flex items-center gap-1 text-sm font-medium text-zinc-700 underline dark:text-zinc-300"
                >
                  View all forms <Icon name="ArrowRight" size={14} />
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-5">
              {[
                { label: "Forms", value: project?.formsCount ?? project?.forms?.length ?? 0 },
                { label: "Submissions", value: total },
                { label: "Delivered", value: stats?.sent ?? 0 },
                { label: "Pending", value: stats?.pending ?? 0 },
              ].map((metric) => (
                <div
                  key={metric.label}
                  className="flex flex-col items-center justify-center gap-1 rounded-lg bg-zinc-100 p-4 dark:bg-zinc-900"
                >
                  {loading ? (
                    <SkeletonLine width="w-10" className="h-7" />
                  ) : (
                    <span className="break-words text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                      {metric.value}
                    </span>
                  )}
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">{metric.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {error ? (
          <div className="grid grid-cols-1 justify-items-start gap-3 rounded-card border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
            <p className="text-sm text-zinc-600 dark:text-zinc-300">
              This project could not be loaded. It may have been deleted or you may not have access.
            </p>
            <FormButton variant="secondary" onClick={refresh}>Try again</FormButton>
          </div>
        ) : loading ? (
          <>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[0, 1, 2, 3].map((index) => <SkeletonMetricCard key={index} />)}
            </div>
            <SkeletonListRows rows={4} />
          </>
        ) : (
          <>
            <section className="grid grid-cols-1 gap-4 rounded-card bg-white p-5 dark:bg-zinc-950 sm:p-6">
              <div className="grid grid-cols-1 gap-1">
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                  Submission outcomes
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {total === 0 ? "No submissions recorded for this project." : `${total} submission(s) across all forms.`}
                </p>
              </div>
              {total > 0 && (
                <>
                  <div
                    role="img"
                    aria-label={distribution.map((item) => `${item.label}: ${item.value}`).join(", ")}
                    className="flex h-4 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-900"
                  >
                    {distribution.map(
                      (item) =>
                        item.value > 0 && (
                          <span
                            key={item.label}
                            className={item.bar}
                            style={{ width: `${(item.value / total) * 100}%` }}
                          />
                        )
                    )}
                  </div>
                  <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {distribution.map((item) => (
                      <li key={item.label} className="flex items-center justify-between gap-2 text-sm">
                        <span className="flex items-center gap-2 text-zinc-600 dark:text-zinc-300">
                          <span className={`h-3 w-3 rounded-sm ${item.dot}`} /> {item.label}
                        </span>
                        <span className="font-medium text-zinc-800 dark:text-zinc-200">
                          {item.value} · {Math.round((item.value / total) * 100)}%
                        </span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </section>

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <section className="grid grid-cols-1 gap-3 rounded-card bg-white p-5 dark:bg-zinc-950 sm:p-6">
                <h2 className="flex items-center gap-2 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                  <Icon name="ClockFading" size={16} /> Most active forms
                </h2>
                {topForms.length === 0 ? (
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    No forms yet. Add a form to start collecting submissions.
                  </p>
                ) : (
                  <ul className="grid grid-cols-1 gap-2">
                    {topForms.map((form) => (
                      <li key={form.id}>
                        <Link
                          href={`/developer/submissions?formId=${encodeURIComponent(form.id)}`}
                          className="flex items-center justify-between gap-3 rounded-lg bg-zinc-50 px-3 py-2 text-sm transition-colors hover:bg-zinc-100 dark:bg-zinc-900/40 dark:hover:bg-zinc-900"
                        >
                          <span className="min-w-0 truncate font-medium text-zinc-800 dark:text-zinc-200">
                            {form.title}
                          </span>
                          <span className="flex shrink-0 items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                            {form.submissionsCount ?? 0} submissions
                            <Icon name="ArrowRight" size={13} />
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section className="grid grid-cols-1 gap-3 rounded-card bg-white p-5 dark:bg-zinc-950 sm:p-6">
                <h2 className="flex items-center gap-2 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                  <Icon name="FileClock" size={16} /> Recent submissions
                </h2>
                {recentSubmissions.length === 0 ? (
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    No submissions received yet.
                  </p>
                ) : (
                  <ul className="grid grid-cols-1 gap-2">
                    {recentSubmissions.map((submission) => (
                      <li
                        key={submission.id}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-zinc-50 px-3 py-2 text-sm dark:bg-zinc-900/40"
                      >
                        <span className="min-w-0 truncate font-medium text-zinc-800 dark:text-zinc-200">
                          {submission.formTitle}
                        </span>
                        <span className="flex items-center gap-2">
                          <span className={`${pillClass} ${submissionStatusClass(submission.status)}`}>
                            {submission.status}
                          </span>
                          <span className="text-xs text-zinc-500 dark:text-zinc-400">
                            {relativeTime(submission.createdAt)}
                          </span>
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
                <Link
                  href={`/developer/submissions?formId=${encodeURIComponent(project?.forms?.[0]?.id ?? "")}`}
                  className="inline-flex w-fit items-center gap-1 text-sm font-medium text-zinc-700 underline dark:text-zinc-300"
                >
                  Open inbox <Icon name="ArrowRight" size={14} />
                </Link>
              </section>
            </div>
          </>
        )}
      </div>

      {createFormOpen && project && (
        <NewForm
          project={project.id}
          projectName={project.name}
          onClick={() => setCreateFormOpen(false)}
          onSuccess={refresh}
        />
      )}
      {editOpen && project && (
        <EditProject
          project={project}
          onClick={() => setEditOpen(false)}
          onSuccess={() => {
            setEditOpen(false);
            refresh();
          }}
        />
      )}
    </DeveloperShell>
  );
}
