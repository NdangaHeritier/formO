"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import NonDevShell from "@/components/Non-Developer/NonDevShell";
import ConfirmDialog from "@/components/Global/ConfirmDialog";
import { Icon } from "@/components/Global/Icon";
import { SkeletonLine, SkeletonTableRows } from "@/components/Global/Skeleton";
import FormButton from "@/components/Global/FormButton";
import { useToast } from "@/components/Global/Toast";
import { relativeTime } from "@/lib/format";
import {
  pillClass,
  statusClasses,
  type DeliveryView,
  type MessageView,
} from "@/lib/non-dev/types";

type ActionResponse = {
  message?: MessageView;
  error?: string;
};

/** Read-only message detail with delivery log and queued/retry controls. */
export default function MessageDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const toast = useToast();

  const [message, setMessage] = useState<MessageView | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [pendingCancel, setPendingCancel] = useState(false);
  const [pendingRetry, setPendingRetry] = useState(false);
  const [acting, setActing] = useState(false);

  const load = useCallback(() => {
    fetch(`/api/non-dev/messages/${encodeURIComponent(id)}`)
      .then((res) =>
        res.ok
          ? (res.json() as Promise<{ message: MessageView }>)
          : Promise.reject(new Error("message"))
      )
      .then((data) => {
        setMessage(data.message);
        setLoadError(false);
      })
      .catch(() => setLoadError(true))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const refresh = () => {
    setLoading(true);
    setLoadError(false);
    load();
  };

  const confirmCancel = async () => {
    setActing(true);
    try {
      const res = await fetch(`/api/non-dev/messages/${encodeURIComponent(id)}/cancel`, {
        method: "POST",
      });
      const data = (await res.json().catch(() => null)) as ActionResponse | null;
      if (!res.ok) throw new Error(data?.error ?? "Could not cancel this message.");
      toast.success("Message canceled.");
      setPendingCancel(false);
      refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not cancel this message.");
    } finally {
      setActing(false);
    }
  };

  const confirmRetry = async () => {
    setActing(true);
    try {
      const res = await fetch(`/api/non-dev/messages/${encodeURIComponent(id)}/retry`, {
        method: "POST",
      });
      const data = (await res.json().catch(() => null)) as ActionResponse | null;
      if (!res.ok) throw new Error(data?.error ?? "Could not retry this message.");
      toast.success("Failed deliveries requeued.");
      setPendingRetry(false);
      refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not retry this message.");
    } finally {
      setActing(false);
    }
  };

  const deliveries: DeliveryView[] = message?.deliveries ?? [];

  return (
    <NonDevShell>
      <section className="grid grid-cols-1 gap-5">
        {loading ? (
          <>
            <div className="grid grid-cols-1 gap-2">
              <SkeletonLine width="w-28" className="h-3" />
              <SkeletonLine width="w-56" className="h-6" />
              <SkeletonLine width="w-72" />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {[0, 1, 2].map((index) => (
                <div
                  key={index}
                  className="grid grid-cols-1 gap-2 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
                >
                  <SkeletonLine width="w-16" className="h-2" />
                  <SkeletonLine width="w-10" className="h-7" />
                </div>
              ))}
            </div>
            <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
              <SkeletonTableRows rows={4} />
            </div>
          </>
        ) : loadError ? (
          <div className="grid grid-cols-1 justify-items-start gap-3 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
            <p className="text-sm text-zinc-600 dark:text-zinc-300">Could not load this message.</p>
            <FormButton variant="secondary" onClick={refresh}>
              <Icon name="RefreshCcw" size={14} /> Retry
            </FormButton>
          </div>
        ) : !message ? (
          <div className="grid grid-cols-1 justify-items-start gap-3 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
            <p className="text-sm text-zinc-600 dark:text-zinc-300">This message is not available.</p>
            <Link
              href="/non-dev/messages"
              className="text-sm font-medium text-zinc-700 underline dark:text-zinc-200"
            >
              Back to messages
            </Link>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="grid min-w-0 grid-cols-1 gap-2">
                <Link
                  href="/non-dev/messages"
                  className="flex w-fit items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                >
                  <Icon name="ArrowRight" size={14} className="rotate-180" /> Back to messages
                </Link>
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <h1 className="min-w-0 break-words text-xl font-bold text-zinc-900 dark:text-zinc-100">
                    {message.name}
                  </h1>
                  <span className={`${pillClass} ${statusClasses[message.status] ?? ""}`}>
                    {message.status}
                  </span>
                </div>
                <p className="min-w-0 break-words text-sm text-zinc-600 dark:text-zinc-300">
                  {message.subject}
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Created {relativeTime(message.createdAt)} · Sent {relativeTime(message.sentAt)}
                  {message.scheduledAt ? ` · Scheduled ${relativeTime(message.scheduledAt)}` : ""}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <FormButton variant="secondary" onClick={refresh} disabled={loading}>
                  <Icon name="RefreshCcw" size={14} /> Refresh
                </FormButton>
                {message.status === "queued" && (
                  <FormButton variant="danger" onClick={() => setPendingCancel(true)}>
                    Cancel message
                  </FormButton>
                )}
                {(message.status === "failed" || message.status === "canceled") && (
                  <FormButton variant="secondary" onClick={() => setPendingRetry(true)}>
                    Retry failed
                  </FormButton>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {[
                { label: "Recipients", value: message.recipientCount },
                { label: "Sent", value: message.sentCount },
                { label: "Failed", value: message.failedCount },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="grid grid-cols-1 gap-1 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
                >
                  <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                    {stat.label}
                  </span>
                  <span className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
                    {stat.value}
                  </span>
                </div>
              ))}
            </div>

            <div className="grid min-w-0 grid-cols-1 gap-2">
              <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                Deliveries
              </h2>
              <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
                <table className="w-full min-w-[36rem] text-left text-sm">
                  <thead className="border-b border-zinc-200 text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                    <tr>
                      <th scope="col" className="px-4 py-3 font-medium">Recipient</th>
                      <th scope="col" className="px-4 py-3 font-medium">Status</th>
                      <th scope="col" className="px-4 py-3 font-medium">Attempts</th>
                      <th scope="col" className="px-4 py-3 font-medium">Last error</th>
                      <th scope="col" className="px-4 py-3 font-medium">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deliveries.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
                          No deliveries recorded for this message.
                        </td>
                      </tr>
                    ) : (
                      deliveries.map((delivery) => (
                        <tr
                          key={delivery.id}
                          className="border-b border-zinc-100 last:border-0 dark:border-zinc-900"
                        >
                          <td className="max-w-[16rem] px-4 py-3">
                            <span className="block min-w-0 break-all text-zinc-800 dark:text-zinc-200">
                              {delivery.recipientEmail}
                            </span>
                            {delivery.contact?.name && (
                              <span className="block truncate text-xs text-zinc-500 dark:text-zinc-400">
                                {delivery.contact.name}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`${pillClass} ${statusClasses[delivery.status] ?? ""}`}>
                              {delivery.status}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-zinc-600 dark:text-zinc-300">
                            {delivery.attemptCount}
                          </td>
                          <td className="max-w-[16rem] px-4 py-3">
                            <span className="block min-w-0 break-words text-zinc-500 dark:text-zinc-400">
                              {delivery.errorMessage ?? "—"}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-zinc-500 dark:text-zinc-400">
                            {relativeTime(delivery.createdAt)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </section>

      <ConfirmDialog
        open={pendingCancel}
        title="Cancel this message?"
        description="Queued deliveries for this message will be stopped. Already-sent deliveries are not affected."
        confirmLabel={acting ? "Canceling…" : "Cancel message"}
        onCancel={() => setPendingCancel(false)}
        onConfirm={confirmCancel}
      />
      <ConfirmDialog
        open={pendingRetry}
        title="Retry failed deliveries?"
        description="Failed and dead-lettered deliveries for this message will be requeued for another attempt."
        confirmLabel={acting ? "Retrying…" : "Retry failed"}
        onCancel={() => setPendingRetry(false)}
        onConfirm={confirmRetry}
      />
    </NonDevShell>
  );
}
