"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/Global/Icon";
import { useToast } from "@/components/Global/Toast";

type FormView = {
  id: string;
  title: string;
  project: string;
  recipients: string[];
  delivery: {
    status: "active" | "paused" | "attention" | "waiting";
    lastSentAt: string | null;
    sent: number;
    failed: number;
    pending: number;
    spam: number;
  };
};

type Overview = {
  forms: FormView[];
  templates: Array<{ id: string; name: string }>;
  delivery: {
    managedBy: "workspace";
    sent: number;
    failed: number;
    pending: number;
    lastSentAt: string | null;
  };
};

const statusLabels: Record<FormView["delivery"]["status"], string> = {
  active: "Delivery active",
  paused: "Paused",
  attention: "Needs attention",
  waiting: "Waiting for first submission",
};

const statusClasses: Record<FormView["delivery"]["status"], string> = {
  active: "bg-green-600/15 text-green-600 dark:text-green-400",
  paused: "bg-zinc-500/15 text-zinc-500 dark:text-zinc-400",
  attention: "bg-yellow-600/15 text-yellow-600 dark:text-yellow-400",
  waiting: "bg-blue-600/15 text-blue-600 dark:text-blue-400",
};

function formatWhen(value: string | null) {
  if (!value) return "Not yet";
  return new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Calm, read-only view for non-developers. No endpoints, keys or SMTP details. */
export default function DashboardOverview() {
  const toast = useToast();
  const [overview, setOverview] = useState<Overview | null>(null);
  const [canSwitch, setCanSwitch] = useState(false);

  useEffect(() => {
    fetch("/api/non-dev/overview")
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("overview"))))
      .then((data: Overview) => setOverview(data))
      .catch(() => toast.error("Could not load your delivery overview."));

    fetch("/api/auth/workspace")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { role?: string } | null) =>
        setCanSwitch(data?.role === "admin" || data?.role === "owner")
      )
      .catch(() => {});
  }, [toast]);

  return (
    <section className="grid grid-cols-1 gap-card py-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="grid grid-cols-1 gap-1">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Your forms</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Submissions and delivery at a glance. Email delivery is managed by your workspace — nothing to configure here.
          </p>
        </div>
        {canSwitch && (
          <Link
            href="/developer"
            className="inline-flex items-center gap-2 text-sm font-medium text-zinc-700 underline dark:text-zinc-300"
          >
            Switch to developer view <Icon name="ArrowRight" size={14} />
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          { label: "Delivered", value: overview?.delivery.sent ?? "—" },
          { label: "Pending", value: overview?.delivery.pending ?? "—" },
          { label: "Last delivery", value: overview ? formatWhen(overview.delivery.lastSentAt) : "—" },
        ].map((metric) => (
          <div
            key={metric.label}
            className="rounded-card border border-zinc-200 bg-white p-card dark:border-zinc-800 dark:bg-zinc-950"
          >
            <div className="text-xs text-zinc-500 dark:text-zinc-400">{metric.label}</div>
            <div className="mt-1 break-words text-base font-semibold text-zinc-900 dark:text-zinc-100 sm:text-xl">{metric.value}</div>
          </div>
        ))}
      </div>

      <div className="inline-flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
        <Icon name="ShieldCheck" size={14} />
        Managed by your workspace — read-only
      </div>

      {overview && overview.forms.length === 0 ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          No forms yet. Ask a workspace developer to create one; you will see submissions here automatically.
        </p>
      ) : (
        <ul className="grid grid-cols-1 gap-3">
          {overview?.forms.map((form) => (
            <li
              key={form.id}
              className="rounded-card border border-zinc-200 bg-white p-card dark:border-zinc-800 dark:bg-zinc-950"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="grid min-w-0 grid-cols-1 gap-1">
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">{form.title}</span>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">{form.project}</span>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${statusClasses[form.delivery.status]}`}>
                  {statusLabels[form.delivery.status]}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400">
                <span className="inline-flex items-center gap-1">
                  <Icon name="Mail" size={13} /> {form.recipients.join(", ")}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Icon name="CheckCircle" size={13} /> {form.delivery.sent} sent
                </span>
                <span className="inline-flex items-center gap-1">
                  <Icon name="Inbox" size={13} /> Last sent {formatWhen(form.delivery.lastSentAt)}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}

      {overview && overview.templates.length > 0 && (
        <div className="grid grid-cols-1 gap-2">
          <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Available templates</h2>
          <div className="flex flex-wrap gap-2">
            {overview.templates.map((template) => (
              <span
                key={template.id}
                className="rounded-full bg-zinc-100 px-3 py-1 text-xs text-zinc-600 dark:bg-zinc-900 dark:text-zinc-300"
              >
                {template.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
