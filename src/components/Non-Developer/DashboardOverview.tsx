"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Icon } from "@/components/Global/Icon";
import { SkeletonListRows, SkeletonMetricCard } from "@/components/Global/Skeleton";
import { useToast } from "@/components/Global/Toast";
import { relativeTime } from "@/lib/format";
import {
  type Overview,
  pillClass,
  statusClasses,
} from "@/lib/non-dev/types";

const statusLabels: Record<Overview["forms"][number]["delivery"]["status"], string> = {
  active: "Delivery active",
  paused: "Paused",
  attention: "Needs attention",
  waiting: "Waiting for first submission",
};

/** Calm, read-only overview for non-developers. No endpoints, keys or SMTP. */
export default function DashboardOverview() {
  const toast = useToast();
  const [overview, setOverview] = useState<Overview | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch("/api/non-dev/overview")
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("overview"))))
      .then((data: Overview) => setOverview(data))
      .catch(() => {
        setError(true);
        toast.error("Could not load your delivery overview.");
      });
  }, [toast]);

  const metrics = overview
    ? [
        { label: "Delivered", value: overview.delivery.sent },
        { label: "Pending", value: overview.delivery.pending },
        { label: "Contacts", value: overview.audience.contacts },
        { label: "Messages", value: overview.messages.total },
      ]
    : [];

  return (
    <section className="grid grid-cols-1 gap-card">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="grid grid-cols-1 gap-1">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Workspace overview</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Forms, audience and delivery at a glance. Email transport is managed by your workspace — nothing to configure here.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link
          href="/non-dev/compose"
          className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
        >
          <Icon name="Plus" size={16} /> Compose message
        </Link>
        <Link
          href="/non-dev/contacts"
          className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-900"
        >
          <Icon name="Users" size={16} /> Manage contacts
        </Link>
      </div>

      {error ? (
        <div className="grid grid-cols-1 justify-items-start gap-3 rounded-3xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
          <p className="text-sm text-zinc-600 dark:text-zinc-300">Could not load your workspace overview.</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="cursor-pointer text-sm font-medium text-zinc-700 underline dark:text-zinc-200"
          >
            Try again
          </button>
        </div>
      ) : !overview ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((index) => <SkeletonMetricCard key={index} />)}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {metrics.map((metric) => (
              <div
                key={metric.label}
                className="grid grid-cols-1 gap-card rounded-card border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950"
              >
                <div className="text-xs text-zinc-500 dark:text-zinc-400">{metric.label}</div>
                <div className="break-words text-xl font-semibold text-zinc-900 dark:text-zinc-100">{metric.value}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-3 rounded-3xl border border-zinc-200 bg-zinc-50/60 p-5 dark:border-zinc-800 dark:bg-zinc-900/30">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Your forms</h2>
              <span className={pillClass}>
                {overview.delivery.failed} failed · {overview.delivery.pending} pending
              </span>
            </div>
            {overview.forms.length === 0 ? (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                No forms yet. Ask a workspace developer to create one, or use Compose to send directly.
              </p>
            ) : (
              <ul className="grid grid-cols-1 gap-2">
                {overview.forms.map((form) => {
                  const status = form.delivery.status;
                  return (
                    <li
                      key={form.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-transparent bg-white px-4 py-3 dark:bg-zinc-950/60"
                    >
                      <span className="flex min-w-0 flex-col gap-0.5">
                        <span className="truncate font-medium text-zinc-800 dark:text-zinc-200">{form.title}</span>
                        <span className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                          {form.project} · {form.recipients.length} recipient(s) · last sent {relativeTime(form.delivery.lastSentAt)}
                        </span>
                      </span>
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="text-xs text-zinc-500 dark:text-zinc-400">
                          {form.delivery.sent} sent · {form.delivery.failed} failed
                        </span>
                        <span className={`${pillClass} ${statusClasses[status] ?? statusClasses.waiting}`}>
                          {statusLabels[status]}
                        </span>
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {overview.templates.length > 0 && (
            <div className="grid grid-cols-1 gap-3 rounded-3xl border border-zinc-200 bg-zinc-50/60 p-5 dark:border-zinc-800 dark:bg-zinc-900/30">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Templates</h2>
                <Link
                  href="/non-dev/compose"
                  className="inline-flex items-center gap-1 text-sm font-medium text-zinc-700 underline dark:text-zinc-200"
                >
                  Use a template <Icon name="ArrowRight" size={14} />
                </Link>
              </div>
              <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {overview.templates.map((template) => (
                  <li key={template.id} className="flex items-center gap-2 rounded-lg bg-white px-4 py-3 text-sm dark:bg-zinc-950/60">
                    <Icon name="FileText" size={15} className="text-zinc-400" />
                    <span className="truncate text-zinc-800 dark:text-zinc-200">{template.name}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}

      {!overview && !error && <SkeletonListRows rows={3} />}
    </section>
  );
}
