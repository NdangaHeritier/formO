"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import NonDevShell from "@/components/Non-Developer/NonDevShell";
import Layout from "@/components/Developer/Modals/Layout";
import ConfirmDialog from "@/components/Global/ConfirmDialog";
import FormButton from "@/components/Global/FormButton";
import { Icon } from "@/components/Global/Icon";
import { InputField } from "@/components/Global/InputField";
import { SkeletonTableRows } from "@/components/Global/Skeleton";
import { useToast } from "@/components/Global/Toast";
import Tooltip from "@/components/Global/Tooltip";
import { relativeTime } from "@/lib/format";
import {
  pillClass,
  statusClasses,
  type ContactView,
  type PageResult,
} from "@/lib/non-dev/types";

const SEARCH_CLASS =
  "h-9 w-full rounded-md border border-zinc-300 bg-white ps-9 pe-3 text-sm text-zinc-800 outline-none transition placeholder:text-zinc-400 focus:border-zinc-500 sm:w-48 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200";

const ICON_BUTTON =
  "cursor-pointer rounded-lg p-2.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-40 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100";

type ContactModalState = { mode: "create" } | { mode: "edit"; contact: ContactView } | null;
type RowBusy = { id: string; action: "toggle" } | null;
type ErrorResponse = { error?: string } | null;

/** Audience-safe contact directory: search, paginate, create, edit and toggle. */
export default function ContactsPage() {
  const toast = useToast();

  const [items, setItems] = useState<ContactView[]>([]);
  const [total, setTotal] = useState(0);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const requestRef = useRef(0);

  const [contactModal, setContactModal] = useState<ContactModalState>(null);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [rowBusy, setRowBusy] = useState<RowBusy>(null);
  const [pendingDelete, setPendingDelete] = useState<ContactView | null>(null);

  const load = useCallback(
    (nextCursor?: string, append = false) => {
      const requestId = ++requestRef.current;
      const params = new URLSearchParams();
      const search = query.trim();
      if (search) params.set("query", search);
      if (nextCursor) params.set("cursor", nextCursor);
      const suffix = params.toString();

      fetch(`/api/non-dev/contacts${suffix ? `?${suffix}` : ""}`)
        .then((res) => (res.ok ? res.json() : Promise.reject(new Error("contacts"))))
        .then((data: PageResult<ContactView>) => {
          if (requestId !== requestRef.current) return;
          setItems((current) => (append ? [...current, ...data.items] : data.items));
          setTotal(data.total);
          setCursor(data.nextCursor);
          setHasMore(data.hasMore);
          setLoadError(false);
        })
        .catch(() => {
          if (requestId === requestRef.current) setLoadError(true);
        })
        .finally(() => {
          if (requestId === requestRef.current) setLoading(false);
        });
    },
    [query]
  );

  useEffect(() => {
    load();
  }, [load]);

  const reload = () => {
    setLoading(true);
    setLoadError(false);
    load();
  };

  const openCreate = () => {
    setEmail("");
    setName("");
    setContactModal({ mode: "create" });
  };

  const openEdit = (contact: ContactView) => {
    setEmail(contact.email);
    setName(contact.name ?? "");
    setContactModal({ mode: "edit", contact });
  };

  const saveContact = async () => {
    if (!contactModal || saving) return;
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      toast.error("Enter an email address.");
      return;
    }
    const isEdit = contactModal.mode === "edit";
    const url = isEdit
      ? `/api/non-dev/contacts/${contactModal.contact.id}`
      : "/api/non-dev/contacts";

    setSaving(true);
    try {
      const res = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmedEmail, name: name.trim() || null }),
      });
      if (!res.ok) {
        const data: ErrorResponse = await res.json().catch(() => null);
        throw new Error(
          data?.error ??
            (isEdit ? "Could not update this contact." : "Could not add this contact.")
        );
      }
      toast.success(
        isEdit ? `Contact ${trimmedEmail} updated.` : `Contact ${trimmedEmail} added.`
      );
      setContactModal(null);
      reload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save this contact.");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (contact: ContactView) => {
    if (rowBusy) return;
    setRowBusy({ id: contact.id, action: "toggle" });
    try {
      const res = await fetch(`/api/non-dev/contacts/${contact.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !contact.isActive }),
      });
      if (!res.ok) throw new Error("toggle");
      setItems((current) =>
        current.map((item) =>
          item.id === contact.id ? { ...item, isActive: !contact.isActive } : item
        )
      );
      toast.success(
        contact.isActive ? `${contact.email} deactivated.` : `${contact.email} activated.`
      );
    } catch {
      toast.error("Could not update this contact.");
    } finally {
      setRowBusy(null);
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    try {
      const res = await fetch(`/api/non-dev/contacts/${pendingDelete.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("delete");
      toast.success(`Contact ${pendingDelete.email} deleted.`);
      setPendingDelete(null);
      reload();
    } catch {
      toast.error("Could not delete this contact.");
    }
  };

  return (
    <NonDevShell>
      <section className="grid grid-cols-1 gap-card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="grid min-w-0 grid-cols-1 gap-1">
            <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Contacts</h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              People who can receive your messages. {total} contact{total === 1 ? "" : "s"} in this
              workspace.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Icon
                name="Search"
                size={15}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
              />
              <input
                type="search"
                aria-label="Search contacts"
                value={query}
                placeholder="Search contacts…"
                className={SEARCH_CLASS}
                onChange={(event) => {
                  const next = event.target.value;
                  if (next.trim() !== query.trim()) {
                    setLoading(true);
                    setLoadError(false);
                  }
                  setQuery(next);
                }}
              />
            </div>
            <FormButton onClick={openCreate} disabled={loading}>
              <Icon name="Plus" size={14} /> New contact
            </FormButton>
          </div>
        </div>

        <div className="overflow-x-auto rounded-card border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
          <table className="w-full min-w-[36rem] text-left text-sm">
            <thead className="border-b border-zinc-200 text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium">Name</th>
                <th scope="col" className="px-4 py-3 font-medium">Email</th>
                <th scope="col" className="px-4 py-3 font-medium">Lists</th>
                <th scope="col" className="px-4 py-3 font-medium">Deliveries</th>
                <th scope="col" className="px-4 py-3 font-medium">Added</th>
                <th scope="col" className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && items.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <SkeletonTableRows rows={5} />
                  </td>
                </tr>
              ) : loadError ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center">
                    <div className="grid grid-cols-1 justify-items-center gap-3">
                      <p className="text-zinc-500 dark:text-zinc-400">Could not load contacts.</p>
                      <FormButton variant="secondary" onClick={reload}>Retry</FormButton>
                    </div>
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-zinc-500 dark:text-zinc-400">
                    {query.trim()
                      ? `No contacts match “${query.trim()}”.`
                      : "No contacts yet — add one to get started."}
                  </td>
                </tr>
              ) : (
                items.map((contact) => (
                  <tr
                    key={contact.id}
                    className="border-b border-zinc-100 last:border-0 dark:border-zinc-900"
                  >
                    <td className="px-4 py-3">
                      <div className="flex min-w-0 flex-wrap items-center gap-2">
                        <span className="max-w-[12rem] min-w-0 truncate font-medium text-zinc-800 dark:text-zinc-200">
                          {contact.name ?? "—"}
                        </span>
                        <span
                          className={`${pillClass} ${
                            contact.isActive
                              ? statusClasses.active
                              : "bg-zinc-500/15 text-zinc-500 dark:text-zinc-400"
                          }`}
                        >
                          {contact.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="block max-w-[16rem] min-w-0 truncate text-zinc-700 dark:text-zinc-300">
                        {contact.email}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {contact.lists.length === 0 ? (
                        <span className="text-zinc-400 dark:text-zinc-500">—</span>
                      ) : (
                        <div className="flex max-w-[14rem] flex-wrap gap-1">
                          {contact.lists.slice(0, 2).map((list) => (
                            <span
                              key={list.id}
                              className="max-w-[8rem] truncate rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
                            >
                              {list.name}
                            </span>
                          ))}
                          {contact.lists.length > 2 && (
                            <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                              +{contact.lists.length - 2}
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">
                      {contact.deliveryCount}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-zinc-500 dark:text-zinc-400">
                      {relativeTime(contact.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center justify-end gap-1">
                        <Tooltip
                          label={contact.isActive ? "Deactivate contact" : "Activate contact"}
                          placement="top"
                        >
                          <button
                            type="button"
                            aria-label={`${contact.isActive ? "Deactivate" : "Activate"} ${contact.email}`}
                            disabled={rowBusy !== null}
                            onClick={() => {
                              void toggleActive(contact);
                            }}
                            className={`${ICON_BUTTON} ${
                              contact.isActive
                                ? "hover:text-yellow-600 dark:hover:text-yellow-400"
                                : "hover:text-green-600 dark:hover:text-green-400"
                            }`}
                          >
                            {rowBusy?.id === contact.id && rowBusy.action === "toggle" ? (
                              <Icon name="Loader" size={15} className="animate-spin" />
                            ) : (
                              <Icon name={contact.isActive ? "X" : "Check"} size={15} />
                            )}
                          </button>
                        </Tooltip>
                        <Tooltip label="Edit contact" placement="top">
                          <button
                            type="button"
                            aria-label={`Edit contact ${contact.email}`}
                            disabled={rowBusy !== null}
                            onClick={() => openEdit(contact)}
                            className={ICON_BUTTON}
                          >
                            <Icon name="Settings" size={15} />
                          </button>
                        </Tooltip>
                        <Tooltip label="Delete contact" placement="top">
                          <button
                            type="button"
                            aria-label={`Delete contact ${contact.email}`}
                            disabled={rowBusy !== null}
                            onClick={() => setPendingDelete(contact)}
                            className={`${ICON_BUTTON} hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400`}
                          >
                            <Icon name="Trash" size={15} />
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
            <FormButton
              variant="secondary"
              disabled={loading}
              onClick={() => {
                setLoading(true);
                setLoadError(false);
                load(cursor ?? undefined, true);
              }}
            >
              {loading ? (
                <>
                  <Icon name="Loader" size={15} className="animate-spin" /> Loading…
                </>
              ) : (
                "Load more"
              )}
            </FormButton>
          </div>
        )}
      </section>

      {contactModal && (
        <Layout
          onClick={() => setContactModal(null)}
          label={contactModal.mode === "create" ? "New contact" : "Edit contact"}
        >
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void saveContact();
            }}
            className="grid w-full max-w-md grid-cols-1 gap-4 rounded-3xl bg-white p-6 shadow-2xl dark:bg-zinc-950 sm:p-8"
          >
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              {contactModal.mode === "create" ? "New contact" : "Edit contact"}
            </h2>
            <InputField
              id="contact-email"
              name="email"
              type="email"
              label="Email"
              placeholder="name@example.com"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
            <InputField
              id="contact-name"
              name="name"
              type="text"
              label="Name (optional)"
              placeholder="Jane Doe"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
            <div className="flex flex-wrap justify-end gap-2">
              <FormButton variant="secondary" disabled={saving} onClick={() => setContactModal(null)}>
                Cancel
              </FormButton>
              <FormButton type="submit" disabled={saving}>
                {saving ? (
                  <>
                    <Icon name="Loader" size={15} className="animate-spin" /> Saving…
                  </>
                ) : contactModal.mode === "create" ? (
                  "Create contact"
                ) : (
                  "Save changes"
                )}
              </FormButton>
            </div>
          </form>
        </Layout>
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete this contact?"
        description={`This permanently deletes ${pendingDelete?.email ?? "this contact"} and removes it from every list. This cannot be undone.`}
        confirmLabel="Delete contact"
        tone="danger"
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          void confirmDelete();
        }}
      />
    </NonDevShell>
  );
}
