"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import NonDevShell from "@/components/Non-Developer/NonDevShell";
import { Icon } from "@/components/Global/Icon";
import { SkeletonTableRows } from "@/components/Global/Skeleton";
import FormButton from "@/components/Global/FormButton";
import Tooltip from "@/components/Global/Tooltip";
import { relativeTime } from "@/lib/format";
import {
  pillClass,
  statusClasses,
  type MessageView,
  type PageResult,
} from "@/lib/non-dev/types";

const FILTER_CLASS =
  "rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200";

/** Paginated message outbox with a status filter. */
export default function MessagesPage() {
  const router = useRouter();

  const [status, setStatus] = useState("");
  const [items, setItems] = useState<MessageView[]>([]);
  const [total, setTotal] = useState(0);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const load = useCallback(
    (nextCursor?: string) => {
      const params = new URLSearchParams();
      params.set("limit", "20");
      if (status) params.set("status", status);
      if (nextCursor) params.set("cursor", nextCursor);
      fetch(`/api/non-dev/messages?${params.toString()}`)
        .then((res) =>
          res.ok
            ? (res.json() as Promise<PageResult<MessageView>>)
            : Promise.reject(new Error("messages"))
        )
        .then((data) => {
          setItems((current) => (nextCursor ? [...current, ...data.items] : data.items));
          setTotal(data.total);
          setCursor(data.nextCursor);
          setHasMore(data.hasMore);
          setLoadError(false);
        })
        .catch(() => setLoadError(true))
        .finally(() => setLoading(false));
    },
    [status]
  );

  useEffect(() => {
    load();
  }, [load]);

  const changeFilter = (value: string) => {
    setLoading(true);
    setLoadError(false);
    setStatus(value);
  };

  const loadMore = () => {
    setLoading(true);
    setLoadError(false);
    load(cursor ?? undefined);
  };

  const open = (id: string) => router.push(`/non-dev/messages/${id}`);

  return (
    <NonDevShell>
      <section className="grid grid-cols-1 gap-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="grid min-w-0 grid-cols-1 gap-1">
            <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Messages</h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Everything queued, sending or sent across the workspace.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-zinc-500 dark:text-zinc-400">{total} total</span>
            <select
              aria-label="Filter by status"
              className={FILTER_CLASS}
              value={status}
              onChange={(event) => changeFilter(event.target.value)}
            >
              <option value="">All</option>
              <option value="queued">Queued</option>
              <option value="sending">Sending</option>
              <option value="sent">Sent</option>
              <option value="failed">Failed</option>
              <option value="canceled">Canceled</option>
            </select>
            <Link
              href="/non-dev/compose"
              className="inline-flex items-center gap-1 rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-900"
            >
              <Icon name="Plus" size={14} /> Compose
            </Link>
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
          <table className="w-full min-w-[36rem] text-left text-sm">
            <thead className="border-b border-zinc-200 text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium">Name</th>
                <th scope="col" className="px-4 py-3 font-medium">Subject</th>
                <th scope="col" className="px-4 py-3 font-medium">Status</th>
                <th scope="col" className="px-4 py-3 font-medium">Recipients</th>
                <th scope="col" className="px-4 py-3 font-medium">Sent</th>
                <th scope="col" className="px-4 py-3 font-medium">Failed</th>
                <th scope="col" className="px-4 py-3 font-medium">Created</th>
                <th scope="col" className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && items.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <SkeletonTableRows rows={5} />
                  </td>
                </tr>
              ) : loadError ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8">
                    <div className="grid grid-cols-1 justify-items-center gap-3 text-center">
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        Could not load messages.
                      </p>
                      <FormButton variant="secondary" onClick={loadMore}>
                        <Icon name="RefreshCcw" size={14} /> Retry
                      </FormButton>
                    </div>
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8">
                    <div className="grid grid-cols-1 justify-items-center gap-3 text-center">
                      <Icon name="Mail" size={26} className="text-zinc-400" />
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        No messages match this filter.
                      </p>
                      <Link
                        href="/non-dev/compose"
                        className="text-sm font-medium text-zinc-700 underline dark:text-zinc-200"
                      >
                        Compose a message
                      </Link>
                    </div>
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => open(item.id)}
                    className="cursor-pointer border-b border-zinc-100 hover:bg-zinc-50 dark:border-zinc-900 dark:hover:bg-zinc-900/40"
                  >
                    <td className="max-w-[14rem] px-4 py-3">
                      <span className="block truncate font-medium text-zinc-800 dark:text-zinc-200">
                        {item.name}
                      </span>
                    </td>
                    <td className="max-w-[16rem] px-4 py-3">
                      <span className="block truncate text-zinc-600 dark:text-zinc-300">
                        {item.subject}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`${pillClass} ${statusClasses[item.status] ?? ""}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-zinc-600 dark:text-zinc-300">
                      {item.recipientCount}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-zinc-600 dark:text-zinc-300">
                      {item.sentCount}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-zinc-600 dark:text-zinc-300">
                      {item.failedCount}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-zinc-500 dark:text-zinc-400">
                      {relativeTime(item.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/non-dev/messages/${item.id}`}
                          onClick={(event) => event.stopPropagation()}
                          className="text-sm font-medium text-zinc-700 underline dark:text-zinc-200"
                        >
                          View
                        </Link>
                        <Tooltip label="View message" placement="left">
                          <button
                            type="button"
                            aria-label={`View message ${item.name}`}
                            onClick={(event) => {
                              event.stopPropagation();
                              open(item.id);
                            }}
                            className="cursor-pointer rounded-lg p-2.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-900 dark:hover:text-zinc-100"
                          >
                            <Icon name="ArrowRight" size={14} />
                          </button>
                        </Tooltip>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {hasMore && (
          <div className="flex justify-center">
            <FormButton variant="secondary" disabled={loading} onClick={loadMore}>
              {loading && items.length > 0 ? (
                <>
                  <Icon name="Loader" size={14} className="animate-spin" /> Loading…
                </>
              ) : (
                "Load more"
              )}
            </FormButton>
          </div>
        )}
      </section>
    </NonDevShell>
  );
}
