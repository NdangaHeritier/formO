"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import NonDevShell from "@/components/Non-Developer/NonDevShell";
import { Icon } from "@/components/Global/Icon";
import { SkeletonListRows, SkeletonMetricCard } from "@/components/Global/Skeleton";
import { useToast } from "@/components/Global/Toast";
import { relativeTime } from "@/lib/format";
import {
  type Analytics,
  type DeliveryView,
  pillClass,
  statusClasses,
} from "@/lib/non-dev/types";

export default function AnalyticsPage() {
  const toast = useToast();
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [deliveries, setDeliveries] = useState<DeliveryView[]>([]);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch("/api/non-dev/analytics")
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("analytics"))))
      .then((data: Analytics) => setAnalytics(data))
      .catch(() => {
        setError(true);
        toast.error("Could not load your delivery analytics.");
      });
    fetch("/api/non-dev/deliveries?limit=10")
      .then((res) => (res.ok ? res.json() : { deliveries: [] }))
      .then((data: { deliveries: DeliveryView[] }) => setDeliveries(data.deliveries))
      .catch(() => {});
  }, [toast]);

  const metrics = analytics
    ? [
        { label: "Messages", value: analytics.messages.total },
        { label: "Delivered", value: analytics.recipients.sent },
        { label: "Pending", value: analytics.recipients.pending },
        { label: "Failed", value: analytics.recipients.failed },
      ]
    : [];

  return (
    <NonDevShell>
      <section className="grid grid-cols-1 gap-card">
        <div className="grid grid-cols-1 gap-1">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Delivery analytics</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Outcomes for messages sent to your audience. Engagement tracking is not available yet.
          </p>
        </div>

        {error ? (
          <p className="text-sm text-red-600 dark:text-red-400">Could not load analytics.</p>
        ) : !analytics ? (
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
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Message breakdown</h2>
              <div className="flex flex-wrap gap-2">
                {(["queued", "sending", "sent", "failed", "canceled"] as const).map((status) => (
                  <span key={status} className={`${pillClass} ${statusClasses[status] ?? statusClasses.queued}`}>
                    {status}: {analytics.messages[status]}
                  </span>
                ))}
              </div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Last delivery {relativeTime(analytics.lastSentAt)}
              </p>
            </div>
          </>
        )}

        <div className="grid grid-cols-1 gap-3 rounded-3xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Recent deliveries</h2>
            <Link
              href="/non-dev/messages"
              className="inline-flex items-center gap-1 text-sm font-medium text-zinc-700 underline dark:text-zinc-200"
            >
              All messages <Icon name="ArrowRight" size={14} />
            </Link>
          </div>
          {deliveries.length === 0 ? (
            <SkeletonListRows rows={3} />
          ) : (
            <ul className="grid grid-cols-1 gap-2">
              {deliveries.map((delivery) => (
                <li
                  key={delivery.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-zinc-50 px-4 py-3 dark:bg-zinc-900/40"
                >
                  <span className="flex min-w-0 flex-col gap-0.5">
                    <span className="min-w-0 break-all text-sm font-medium text-zinc-800 dark:text-zinc-200">
                      {delivery.recipientEmail}
                    </span>
                    <span className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                      {delivery.messageName ?? "Message"} · {relativeTime(delivery.createdAt)}
                    </span>
                  </span>
                  <span className={`${pillClass} ${statusClasses[delivery.status] ?? statusClasses.queued}`}>
                    {delivery.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </NonDevShell>
  );
}
