"use client";
import { useCallback, useEffect, useState } from "react";
import { Icon } from "@/components/Global/Icon";
import { relativeTime } from "@/lib/format";

type Log = {
  id: string;
  recipientEmail: string;
  status: string;
  attemptCount: number;
  errorMessage: string | null;
  createdAt: string;
  formTitle: string;
  projectName: string;
};

const statusClasses: Record<string, string> = {
  sent: "bg-green-600/15 text-green-600 dark:text-green-400",
  failed: "bg-red-600/15 text-red-600 dark:text-red-400",
  dead_letter: "bg-red-600/15 text-red-600 dark:text-red-400",
  pending: "bg-yellow-600/15 text-yellow-600 dark:text-yellow-400",
  retrying: "bg-yellow-600/15 text-yellow-600 dark:text-yellow-400",
  processing: "bg-blue-600/15 text-blue-600 dark:text-blue-400",
};

const pillClass =
  "text-[11px] px-2 py-0.5 rounded-full font-medium whitespace-nowrap bg-zinc-200/70 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300";

const rowClass =
  "flex flex-wrap items-center justify-between gap-3 text-sm bg-zinc-50 dark:bg-zinc-900/40 border border-transparent rounded-lg px-4 py-3";

export default function DeliveryLogs() {
  const [status, setStatus] = useState("");
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(() => {
    fetch(`/api/settings/delivery-logs${status ? `?status=${status}` : ""}`)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("logs"))))
      .then((data: { logs: Log[] }) => setLogs(data.logs))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [status]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="grid grid-cols-1 gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Recent delivery attempts</span>
        <select
          aria-label="Filter delivery logs by status"
          value={status}
          onChange={(event) => {
            setLoading(true);
            setError(false);
            setStatus(event.target.value);
          }}
          className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200"
        >
          <option value="">All statuses</option>
          <option value="sent">Sent</option>
          <option value="failed">Failed</option>
          <option value="dead_letter">Dead letter</option>
          <option value="pending">Pending</option>
        </select>
      </div>

      {loading ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading delivery logs…</p>
      ) : error ? (
        <p className="text-sm text-red-600 dark:text-red-400">Could not load delivery logs.</p>
      ) : logs.length === 0 ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">No delivery attempts yet.</p>
      ) : (
        <ul className="grid grid-cols-1 gap-2">
          {logs.map((log) => (
            <li key={log.id} className={rowClass}>
              <span className="flex items-center gap-2 min-w-0">
                <Icon name="Mail" size={15} className="text-zinc-400 shrink-0" />
                <span className="flex flex-col min-w-0">
                  <span className="font-medium text-zinc-800 dark:text-zinc-200 truncate">{log.recipientEmail}</span>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                    {log.formTitle}{log.projectName ? ` · ${log.projectName}` : ""} · {relativeTime(log.createdAt)}
                  </span>
                </span>
              </span>
              <span className="flex items-center gap-2">
                <span className={pillClass}>{log.attemptCount} attempt(s)</span>
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${statusClasses[log.status] ?? statusClasses.pending}`}>
                  {log.status}
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
