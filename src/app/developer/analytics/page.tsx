"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import DeveloperShell from "@/components/Developer/DeveloperShell";
import { Squares } from "@/components/Global/Squares";
import { Icon } from "@/components/Global/Icon";
import AnalyticsGroup from "@/components/Developer/AnalyticsGroup";
import { Skeleton, SkeletonListRows } from "@/components/Global/Skeleton";
import { ProjectType } from "@/types/Project";

type AnalyticsResponse = {
  submissions: {
    total: number;
    thisMonth: number;
    lastMonth: number;
    changeRate: number | null;
    byStatus: { sent: number; failed: number; spam: number; pending: number };
  };
};

const AnalyticsPage = () => {
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null);
  const [projects, setProjects] = useState<ProjectType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/analytics").then((res) => (res.ok ? res.json() : null)),
      fetch("/api/projects").then((res) => (res.ok ? res.json() : null)),
    ])
      .then(([analyticsData, projectsData]) => {
        if (analyticsData) setAnalytics(analyticsData);
        if (projectsData?.projects) setProjects(projectsData.projects);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const topProjects = useMemo(
    () =>
      [...projects]
        .sort((a, b) => (b.submissionsCount ?? 0) - (a.submissionsCount ?? 0))
        .slice(0, 5),
    [projects]
  );

  const byStatus = analytics?.submissions.byStatus;
  const statusBoxes = [
    { label: "Delivered", value: byStatus?.sent ?? 0, dot: "bg-green-600/40" },
    { label: "Failed", value: byStatus?.failed ?? 0, dot: "bg-red-500/40" },
    { label: "Spam", value: byStatus?.spam ?? 0, dot: "bg-yellow-600/30" },
    { label: "Pending", value: byStatus?.pending ?? 0, dot: "bg-zinc-400/40" },
  ];

  return (
    <DeveloperShell>
      <div className="relative rounded-2xl">
        <Squares parLength={100} />
        <div className="projects relative z-10 grid grid-cols-1 gap-5 bg-gradient-to-tr from-zinc-100 to-zinc-100/50 dark:from-zinc-950 from-80% to-20% dark:to-zinc-950/50 rounded-2xl p-8">
          <div className="flex items-center gap-2">
            <div className="title text-xl font-bold">Analytics</div>
            <span className="text-xs font-medium bg-zinc-200/60 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 px-2 py-0.5 rounded-full">
              Workspace
            </span>
          </div>

          {/* headline metrics (real data from /api/analytics) */}
          <AnalyticsGroup />

          {/* submissions by status */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            {statusBoxes.map((box) => (
              <div
                key={box.label}
                className="bg-surface rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 grid grid-cols-1 gap-2"
              >
                <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                  <span className={`w-3 h-3 rounded-md ${box.dot}`} />
                  {box.label}
                </div>
                {loading ? (
                  <Skeleton className="h-8 w-16 block" />
                ) : (
                  <span className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
                    {box.value}
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* top projects by submissions */}
          <div className="rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 bg-surface">
            <div className="head flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 px-5 py-4">
              <div className="flex items-center gap-2 font-semibold text-zinc-800 dark:text-zinc-200">
                <Icon name="BarChart" size={16} className="text-yellow-600" />
                Top Projects by Submissions
              </div>
              <Link
                href="/developer/projects"
                className="text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition"
              >
                View all
              </Link>
            </div>
            <div className="p-3">
              {loading ? (
                <SkeletonListRows rows={3} />
              ) : topProjects.length === 0 ? (
                <div className="text-center text-zinc-500 py-8">No data yet — submissions will appear here.</div>
              ) : (
                <ul className="grid grid-cols-1 gap-2">
                  {topProjects.map((project) => (
                    <li key={project.id}>
                      <Link
                        href={`/developer/projects/${encodeURIComponent(project.slug || project.name)}`}
                        className="flex items-center justify-between text-sm bg-zinc-50 dark:bg-zinc-900/40 hover:bg-zinc-100 dark:hover:bg-zinc-900/70 border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800 rounded-lg px-4 py-3 transition"
                      >
                        <span className="flex items-center gap-2 text-zinc-800 dark:text-zinc-200 truncate">
                          <Icon name="Folder" size={15} className="text-zinc-400 shrink-0" />
                          <span className="truncate">{project.name}</span>
                        </span>
                        <span className="text-xs text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                          {project.submissionsCount ?? 0} submissions
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </DeveloperShell>
  );
};

export default AnalyticsPage;
