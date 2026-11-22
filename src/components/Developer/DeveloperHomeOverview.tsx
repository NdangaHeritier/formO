"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Icon, type LucideIconName } from "@/components/Global/Icon";
import { useToast } from "@/components/Global/Toast";
import { relativeTime } from "@/lib/format";

type Overview = {
  attention: {
    failedSubmissions: number;
    deadLetters: number;
    unverifiedSenders?: number;
    revokedKeys?: number;
  };
  recentSubmissions: Array<{
    id: string;
    status: string;
    createdAt: string;
    formTitle: string;
    projectSlug: string;
    projectName: string;
  }>;
};

type AttentionItem = {
  key: string;
  label: string;
  count: number;
  href: string;
  icon: LucideIconName;
};

const statusClasses: Record<string, string> = {
  sent: "bg-green-600/15 text-green-600 dark:text-green-400",
  failed: "bg-red-600/15 text-red-600 dark:text-red-400",
  pending: "bg-yellow-600/15 text-yellow-600 dark:text-yellow-400",
  spam: "bg-zinc-500/15 text-zinc-500 dark:text-zinc-400",
};

const quickActions: Array<{ href: string; label: string; desc: string; icon: LucideIconName }> = [
  { href: "/developer/projects", label: "Projects", desc: "Organise forms by project", icon: "FolderOpen" },
  { href: "/developer/forms?new=project", label: "New form", desc: "Create a form and get an endpoint", icon: "SquareCode" },
  { href: "/developer/templates", label: "Templates", desc: "Shape the notification email", icon: "FileText" },
  { href: "/developer/analytics", label: "Analytics", desc: "Inspect submission trends", icon: "ChartNoAxesColumn" },
];

/** Operations band for the developer home: attention, recent activity, actions. */
export default function DeveloperHomeOverview() {
  const toast = useToast();
  const [overview, setOverview] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/developer/overview")
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("overview"))))
      .then((data: Overview) => setOverview(data))
      .catch(() => toast.error("Could not load your workspace overview."))
      .finally(() => setLoading(false));
  }, [toast]);

  const attention: AttentionItem[] = overview
    ? [
        { key: "failed", label: "Failed submissions", count: overview.attention.failedSubmissions, href: "/developer/forms", icon: "Activity" as const },
        { key: "dead", label: "Dead-letter deliveries", count: overview.attention.deadLetters, href: "/developer/forms", icon: "Mail" as const },
        ...(overview.attention.unverifiedSenders !== undefined
          ? [{ key: "senders", label: "Unverified senders", count: overview.attention.unverifiedSenders, href: "/developer/settings", icon: "Server" as const }]
          : []),
        ...(overview.attention.revokedKeys !== undefined
          ? [{ key: "keys", label: "Revoked API keys", count: overview.attention.revokedKeys, href: "/developer/settings", icon: "Key" as const }]
          : []),
      ].filter((item) => item.count > 0)
    : [];

  return (
    <div className="grid grid-cols-1 gap-5">
      <section className="rounded-3xl border border-zinc-100 bg-white p-5 dark:border-zinc-900 dark:bg-zinc-950 sm:p-6">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Needs attention</h2>
        {loading ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Checking your workspace…</p>
        ) : attention.length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Nothing needs attention. Delivery is healthy.</p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {attention.map((item) => (
              <Link
                key={item.key}
                href={item.href}
                className="flex items-center justify-between gap-3 rounded-xl bg-zinc-50 p-4 hover:bg-zinc-100 dark:bg-zinc-900/40 dark:hover:bg-zinc-900"
              >
                <span className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                  <Icon name={item.icon} size={16} /> {item.label}
                </span>
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">{item.count}</span>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-zinc-100 bg-white p-5 dark:border-zinc-900 dark:bg-zinc-950 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Recent submissions</h2>
          <Link href="/developer/forms" className="inline-flex items-center gap-1 text-sm font-medium text-zinc-600 underline dark:text-zinc-300">
            All forms <Icon name="ArrowUpRight" size={14} />
          </Link>
        </div>
        {loading ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading submissions…</p>
        ) : overview?.recentSubmissions.length ? (
          <ul className="grid grid-cols-1 gap-2">
            {overview.recentSubmissions.map((submission) => (
              <li key={submission.id}>
                <Link
                  href={`/developer/projects/${submission.projectSlug}`}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-zinc-50 p-3 hover:bg-zinc-100 dark:bg-zinc-900/40 dark:hover:bg-zinc-900"
                >
                  <span className="grid min-w-0 grid-cols-1 gap-0.5">
                    <span className="truncate text-sm font-medium text-zinc-800 dark:text-zinc-200">{submission.formTitle}</span>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">{submission.projectName} · {relativeTime(submission.createdAt)}</span>
                  </span>
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${statusClasses[submission.status] ?? statusClasses.pending}`}>
                    {submission.status}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">No submissions yet. Share a form endpoint to start collecting.</p>
        )}
      </section>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {quickActions.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="grid grid-cols-1 gap-2 rounded-2xl border border-zinc-100 bg-white p-4 hover:bg-zinc-50 dark:border-zinc-900 dark:bg-zinc-950 dark:hover:bg-zinc-900"
          >
            <Icon name={action.icon} size={18} className="text-yellow-600 dark:text-yellow-400" />
            <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{action.label}</span>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">{action.desc}</span>
          </Link>
        ))}
      </section>
    </div>
  );
}
