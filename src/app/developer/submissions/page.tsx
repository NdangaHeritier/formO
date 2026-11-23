"use client";
import { useCallback, useEffect, useState } from "react";
import DeveloperShell from "@/components/Developer/DeveloperShell";
import Layout from "@/components/Developer/Modals/Layout";
import ConfirmDialog from "@/components/Global/ConfirmDialog";
import FormButton from "@/components/Global/FormButton";
import { Icon } from "@/components/Global/Icon";
import { SkeletonLine, SkeletonSubmissionDetail, SkeletonTableRows } from "@/components/Global/Skeleton";
import { useToast } from "@/components/Global/Toast";
import Tooltip from "@/components/Global/Tooltip";
import { relativeTime } from "@/lib/format";
import { canManageWorkspace, useWorkspaceRole } from "@/lib/hooks/use-workspace-role";

type SubmissionItem = {
  id: string;
  status: string;
  createdAt: string;
  sentAt: string | null;
  formId: string;
  formTitle: string;
  formDeleted: boolean;
  projectName: string;
  projectSlug: string;
  deliveryCount: number;
};

type Delivery = {
  id: string;
  recipientEmail: string;
  status: string;
  attemptCount: number;
  nextRetryAt: string | null;
  errorMessage: string | null;
  events: Array<{ id: string; eventType: string; createdAt: string }>;
};

type SubmissionDetail = {
  id: string;
  form: { title: string; endpoint: string };
  formDeleted: boolean;
  status: string;
  data: Record<string, unknown>;
  origin: string | null;
  createdAt: string;
  sentAt: string | null;
  errorMessage: string | null;
  deliveries: Delivery[];
};

const statusClasses: Record<string, string> = {
  sent: "bg-green-600/15 text-green-600 dark:text-green-400",
  failed: "bg-red-600/15 text-red-600 dark:text-red-400",
  pending: "bg-yellow-600/15 text-yellow-600 dark:text-yellow-400",
  spam: "bg-zinc-500/15 text-zinc-500 dark:text-zinc-400",
};

const FILTER_CLASS =
  "rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200";

/** Workspace submission inbox with a read-only delivery detail view. */
export default function SubmissionsPage() {
  const toast = useToast();
  const role = useWorkspaceRole();
  const canRetry = canManageWorkspace(role);

  const [forms, setForms] = useState<Array<{ id: string; title: string; project: { name: string } }>>([]);
  const [formId, setFormId] = useState("");
  const [status, setStatus] = useState("");
  const [deletedForms, setDeletedForms] = useState("include");
  const [items, setItems] = useState<SubmissionItem[]>([]);
  const [total, setTotal] = useState(0);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const [detailId, setDetailId] = useState<string | null>(null);
  const [detail, setDetail] = useState<SubmissionDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<SubmissionItem | null>(null);
  const [pendingBulkDelete, setPendingBulkDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetch("/api/forms")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { forms?: Array<{ id: string; title: string; project: { name: string } }> } | null) => {
        if (data?.forms) setForms(data.forms);
      })
      .catch(() => {});
  }, []);

  const load = useCallback(
    (nextCursor?: string) => {
      const params = new URLSearchParams();
      if (formId) params.set("formId", formId);
      if (status) params.set("status", status);
      params.set("deletedForms", deletedForms);
      if (nextCursor) params.set("cursor", nextCursor);
      fetch(`/api/submissions?${params.toString()}`)
        .then((res) => (res.ok ? res.json() : Promise.reject(new Error("submissions"))))
        .then(
          (data: {
            items: SubmissionItem[];
            total: number;
            nextCursor: string | null;
            hasMore: boolean;
          }) => {
            setItems((current) => (nextCursor ? [...current, ...data.items] : data.items));
            setTotal(data.total);
            setCursor(data.nextCursor);
            setHasMore(data.hasMore);
          }
        )
        .catch(() => setLoadError(true))
        .finally(() => setLoading(false));
    },
    [formId, status, deletedForms]
  );

  useEffect(() => {
    load();
  }, [load]);

  const openDetail = (id: string) => {
    setDetailId(id);
    setDetail(null);
    setDetailError(false);
    setDetailLoading(true);
    const includeDeleted = deletedForms !== "exclude" ? "?includeDeleted=1" : "";
    fetch(`/api/submissions/${id}${includeDeleted}`)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("detail"))))
      .then((data: SubmissionDetail) => setDetail(data))
      .catch(() => {
        setDetailError(true);
        toast.error("Could not load this submission.");
      })
      .finally(() => setDetailLoading(false));
  };

  const retry = async () => {
    if (!detailId) return;
    setRetrying(true);
    try {
      const res = await fetch(`/api/submissions/${detailId}/retry`, { method: "POST" });
      if (!res.ok) throw new Error("retry");
      toast.success("Delivery requeued.");
      openDetail(detailId);
      load();
    } catch {
      toast.error("Could not requeue this submission.");
    } finally {
      setRetrying(false);
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/submissions/${pendingDelete.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("delete");
      toast.success("Submission and its delivery logs deleted.");
      if (detailId === pendingDelete.id) setDetailId(null);
      setPendingDelete(null);
      load();
    } catch {
      toast.error("Could not delete this submission.");
    } finally {
      setDeleting(false);
    }
  };

  const confirmBulkDelete = async () => {
    if (!formId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/forms/${formId}/submissions`, { method: "DELETE" });
      if (!res.ok) throw new Error("delete");
      toast.success(`Deleted ${total} submission(s).`);
      setPendingBulkDelete(false);
      setDetailId(null);
      load();
    } catch {
      toast.error("Could not delete these submissions.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <DeveloperShell>
      <section className="grid grid-cols-1 gap-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="grid grid-cols-1 gap-1">
            <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Submissions</h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Incoming form data and delivery status across all projects.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              aria-label="Filter by form"
              className={FILTER_CLASS}
              value={formId}
              onChange={(event) => {
                setLoading(true);
                setLoadError(false);
                setFormId(event.target.value);
              }}
            >
              <option value="">All forms</option>
              {forms.map((form) => (
                <option key={form.id} value={form.id}>{form.title} — {form.project.name}</option>
              ))}
            </select>
            <select
              aria-label="Filter by status"
              className={FILTER_CLASS}
              value={status}
              onChange={(event) => {
                setLoading(true);
                setLoadError(false);
                setStatus(event.target.value);
              }}
            >
              <option value="">All statuses</option>
              <option value="sent">Sent</option>
              <option value="failed">Failed</option>
              <option value="pending">Pending</option>
              <option value="spam">Spam</option>
            </select>
            <select
              aria-label="Filter deleted forms"
              className={FILTER_CLASS}
              value={deletedForms}
              onChange={(event) => {
                setLoading(true);
                setLoadError(false);
                setDeletedForms(event.target.value);
              }}
            >
              <option value="include">All forms (incl. deleted)</option>
              <option value="exclude">Active forms only</option>
              <option value="only">Deleted forms only</option>
            </select>
            {canRetry && formId && !status && !loading && (
              <FormButton variant="secondary" onClick={() => setPendingBulkDelete(true)}>
                Delete all {total} for this form
              </FormButton>
            )}
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
          <table className="w-full min-w-[36rem] text-left text-sm">
            <thead className="border-b border-zinc-200 text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
              <tr>
                <th className="px-4 py-3 font-medium">Form</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Deliveries</th>
                <th className="px-4 py-3 font-medium">Received</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {loading && items.length === 0 ? (
                <tr><td colSpan={5}><SkeletonTableRows rows={5} /></td></tr>
              ) : loadError ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-zinc-500">Could not load submissions.</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-zinc-500">No submissions match these filters.</td></tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className="border-b border-zinc-100 dark:border-zinc-900">
                    <td className="px-4 py-3">
                      <span className="font-medium text-zinc-800 dark:text-zinc-200">{item.formTitle}</span>
                      {item.formDeleted && (
                        <span className="ml-2 rounded-full bg-zinc-200/70 px-2 py-0.5 text-[10px] font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                          Form deleted
                        </span>
                      )}
                      <span className="block text-xs text-zinc-500 dark:text-zinc-400">{item.projectName}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${statusClasses[item.status] ?? statusClasses.pending}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">{item.deliveryCount}</td>
                    <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">{relativeTime(item.createdAt)}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => openDetail(item.id)}
                        className="inline-flex cursor-pointer items-center gap-1 text-sm font-medium text-zinc-700 underline dark:text-zinc-200"
                      >
                        View <Icon name="ArrowRight" size={14} />
                      </button>
                      {canRetry && (
                        <Tooltip label="Delete submission" placement="left">
                          <button
                            type="button"
                            aria-label={`Delete submission from ${item.formTitle}`}
                            onClick={() => setPendingDelete(item)}
                            className="ml-3 cursor-pointer rounded-lg p-1.5 text-zinc-400 hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400"
                          >
                            <Icon name="Trash" size={14} />
                          </button>
                        </Tooltip>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {hasMore && (
          <div className="flex justify-center">
            <FormButton variant="secondary" disabled={loading} onClick={() => { setLoading(true); setLoadError(false); load(cursor ?? undefined); }}>
              {loading ? "Loading…" : "Load more"}
            </FormButton>
          </div>
        )}
      </section>

      {detailId && (
        <Layout onClick={() => setDetailId(null)} label="Submission detail">
          <section className="grid max-h-[85vh] w-full max-w-2xl grid-cols-1 gap-4 overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl dark:bg-zinc-950 sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="grid grid-cols-1 gap-1">
                {detailLoading ? (
                  <>
                    <SkeletonLine width="w-40" className="h-5" />
                    <SkeletonLine width="w-24" className="h-3" />
                  </>
                ) : (
                  <>
                    <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{detail?.form.title ?? "Submission"}</h2>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {detail ? relativeTime(detail.createdAt) : ""}
                    </p>
                  </>
                )}
              </div>
              {canRetry && detail && !detail.formDeleted && detail.deliveries.some((d) => d.status === "failed" || d.status === "dead_letter") && (
                <FormButton variant="secondary" disabled={retrying} onClick={retry}>
                  {retrying ? <><Icon name="Loader" size={15} className="animate-spin" /> Requeueing…</> : "Retry delivery"}
                </FormButton>
              )}
            </div>

            {detailLoading ? (
              <SkeletonSubmissionDetail />
            ) : detailError ? (
              <div className="grid grid-cols-1 justify-items-start gap-3 rounded-2xl bg-zinc-50 p-4 dark:bg-zinc-900/40">
                <p className="text-sm text-zinc-600 dark:text-zinc-300">Could not load this submission.</p>
                <FormButton variant="secondary" onClick={() => openDetail(detailId)}>Try again</FormButton>
              </div>
            ) : detail ? (
              <>
                <div className="rounded-2xl bg-zinc-50 p-4 dark:bg-zinc-900/40">
                  <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Submitted data</h3>
                  <pre className="mt-2 overflow-x-auto text-xs text-zinc-600 dark:text-zinc-300">
                    {JSON.stringify(detail.data, null, 2)}
                  </pre>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Delivery attempts</h3>
                  {detail.deliveries.length === 0 ? (
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">No delivery attempts recorded.</p>
                  ) : (
                    detail.deliveries.map((delivery) => (
                      <div key={delivery.id} className="rounded-xl border border-zinc-200 p-3 text-sm dark:border-zinc-800">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-zinc-800 dark:text-zinc-200">{delivery.recipientEmail}</span>
                          <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${statusClasses[delivery.status] ?? statusClasses.pending}`}>
                            {delivery.status}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                          {delivery.attemptCount} attempt(s) · {delivery.events.map((event) => event.eventType).join(" → ") || "no events"}
                          {delivery.errorMessage ? ` · ${delivery.errorMessage}` : ""}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </>
            ) : null}
          </section>
        </Layout>
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete this submission?"
        description={`This permanently deletes the submission from ${pendingDelete?.formTitle ?? "this form"} and all of its delivery logs and events. This cannot be undone.`}
        confirmLabel={deleting ? "Deleting…" : "Delete submission"}
        onCancel={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
      />
      <ConfirmDialog
        open={pendingBulkDelete}
        title={`Delete ${total} submission(s)?`}
        description="Every submission for this form will be permanently deleted, along with its delivery logs and events. This cannot be undone."
        confirmLabel={deleting ? "Deleting…" : "Delete all submissions"}
        onCancel={() => setPendingBulkDelete(false)}
        onConfirm={confirmBulkDelete}
      />
    </DeveloperShell>
  );
}
