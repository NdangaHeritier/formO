"use client";
import { useCallback, useEffect, useState } from "react";
import NonDevShell from "@/components/Non-Developer/NonDevShell";
import Layout from "@/components/Developer/Modals/Layout";
import ConfirmDialog from "@/components/Global/ConfirmDialog";
import FormButton from "@/components/Global/FormButton";
import { Icon } from "@/components/Global/Icon";
import { InputField } from "@/components/Global/InputField";
import { SkeletonListRows } from "@/components/Global/Skeleton";
import { TextAreaField } from "@/components/Global/TextAreaField";
import { useToast } from "@/components/Global/Toast";
import Tooltip from "@/components/Global/Tooltip";
import { relativeTime } from "@/lib/format";
import {
  pillClass,
  type ContactListView,
  type ContactView,
  type ListMemberView,
  type PageResult,
} from "@/lib/non-dev/types";

const ICON_BUTTON =
  "cursor-pointer rounded-lg p-2.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-40 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100";

type ListModalState = { mode: "create" } | { mode: "edit"; list: ContactListView } | null;
type MemberBusy = { action: "add" | "remove"; id: string } | null;
type ErrorResponse = { error?: string } | null;

/** Audience-safe contact lists: cards, members, create, edit and delete. */
export default function ListsPage() {
  const toast = useToast();

  const [lists, setLists] = useState<ContactListView[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const [listModal, setListModal] = useState<ListModalState>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<ContactListView | null>(null);

  const [memberList, setMemberList] = useState<ContactListView | null>(null);
  const [contacts, setContacts] = useState<ContactView[]>([]);
  const [members, setMembers] = useState<ListMemberView[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [membersError, setMembersError] = useState(false);
  const [memberBusy, setMemberBusy] = useState<MemberBusy>(null);

  const load = useCallback(() => {
    fetch("/api/non-dev/lists")
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("lists"))))
      .then((data: { lists: ContactListView[] }) => {
        setLists(data.lists);
        setLoadError(false);
      })
      .catch(() => setLoadError(true))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const reload = () => {
    setLoading(true);
    setLoadError(false);
    load();
  };

  const openCreate = () => {
    setName("");
    setDescription("");
    setListModal({ mode: "create" });
  };

  const openEdit = (list: ContactListView) => {
    setName(list.name);
    setDescription(list.description ?? "");
    setListModal({ mode: "edit", list });
  };

  const saveList = async () => {
    if (!listModal || saving) return;
    const trimmedName = name.trim();
    if (!trimmedName) {
      toast.error("Enter a list name.");
      return;
    }
    const isEdit = listModal.mode === "edit";
    const url = isEdit ? `/api/non-dev/lists/${listModal.list.id}` : "/api/non-dev/lists";

    setSaving(true);
    try {
      const res = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmedName, description: description.trim() || null }),
      });
      if (!res.ok) {
        const data: ErrorResponse = await res.json().catch(() => null);
        throw new Error(
          data?.error ?? (isEdit ? "Could not update this list." : "Could not create this list.")
        );
      }
      toast.success(
        isEdit ? `List “${trimmedName}” updated.` : `List “${trimmedName}” created.`
      );
      setListModal(null);
      reload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save this list.");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    try {
      const res = await fetch(`/api/non-dev/lists/${pendingDelete.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data: ErrorResponse = await res.json().catch(() => null);
        throw new Error(data?.error ?? "Could not delete this list.");
      }
      toast.success(`List “${pendingDelete.name}” deleted.`);
      if (memberList?.id === pendingDelete.id) setMemberList(null);
      setPendingDelete(null);
      reload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not delete this list.");
    }
  };

  const openMembers = (list: ContactListView) => {
    setMemberList(list);
    setSelectedIds([]);
    setContacts([]);
    setMembers([]);
    setMembersLoading(true);
    setMembersError(false);

    Promise.all([
      fetch("/api/non-dev/contacts?limit=100").then((res) =>
        res.ok ? res.json() : Promise.reject(new Error("contacts"))
      ),
      fetch(`/api/non-dev/lists/${list.id}/members`).then((res) =>
        res.ok ? res.json() : Promise.reject(new Error("members"))
      ),
    ])
      .then(
        ([contactData, memberData]: [PageResult<ContactView>, { members: ListMemberView[] }]) => {
          setContacts(contactData.items);
          setMembers(memberData.members);
        }
      )
      .catch(() => {
        setMembersError(true);
        toast.error("Could not load contacts and members.");
      })
      .finally(() => setMembersLoading(false));
  };

  const refreshMembership = (list: ContactListView) => {
    reload();
    openMembers(list);
  };

  const addMembers = async () => {
    if (!memberList || selectedIds.length === 0 || memberBusy) return;
    setMemberBusy({ action: "add", id: "" });
    try {
      const res = await fetch(`/api/non-dev/lists/${memberList.id}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contactIds: selectedIds }),
      });
      if (!res.ok) throw new Error("add");
      const data = (await res.json()) as { added: number };
      toast.success(`Added ${data.added} contact(s) to ${memberList.name}.`);
      refreshMembership(memberList);
    } catch {
      toast.error("Could not add contacts to this list.");
    } finally {
      setMemberBusy(null);
    }
  };

  const removeMember = async (member: ListMemberView) => {
    if (!memberList || memberBusy) return;
    setMemberBusy({ action: "remove", id: member.id });
    try {
      const res = await fetch(`/api/non-dev/lists/${memberList.id}/members`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contactIds: [member.id] }),
      });
      if (!res.ok) throw new Error("remove");
      toast.success(`${member.email} removed from ${memberList.name}.`);
      refreshMembership(memberList);
    } catch {
      toast.error("Could not remove this contact.");
    } finally {
      setMemberBusy(null);
    }
  };

  const available = contacts.filter(
    (contact) => !members.some((member) => member.id === contact.id)
  );

  return (
    <NonDevShell>
      <section className="grid grid-cols-1 gap-card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="grid min-w-0 grid-cols-1 gap-1">
            <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Lists</h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Group contacts so you can send to the right people.
            </p>
          </div>
          <FormButton onClick={openCreate} disabled={loading}>
            <Icon name="Plus" size={14} /> New list
          </FormButton>
        </div>

        {loading ? (
          <div className="rounded-card border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
            <SkeletonListRows rows={3} />
          </div>
        ) : loadError ? (
          <div className="grid grid-cols-1 justify-items-center gap-3 rounded-card border border-zinc-200 bg-white p-10 text-center dark:border-zinc-800 dark:bg-zinc-950">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Could not load lists.</p>
            <FormButton variant="secondary" onClick={reload}>Retry</FormButton>
          </div>
        ) : lists.length === 0 ? (
          <div className="grid grid-cols-1 justify-items-center gap-3 rounded-card border border-zinc-200 bg-white p-10 text-center dark:border-zinc-800 dark:bg-zinc-950">
            <Icon name="List" size={28} className="text-zinc-400" />
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              No lists yet — create one to organize your contacts.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-card sm:grid-cols-2 lg:grid-cols-3">
            {lists.map((list) => (
              <article
                key={list.id}
                className="grid min-w-0 grid-cols-1 gap-3 rounded-card border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950"
              >
                <div className="flex min-w-0 flex-wrap items-start justify-between gap-2">
                  <h2 className="max-w-full min-w-0 truncate font-semibold text-zinc-900 dark:text-zinc-100">
                    {list.name}
                  </h2>
                  <span
                    className={`${pillClass} bg-zinc-200/70 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300`}
                  >
                    {list.contactCount} {list.contactCount === 1 ? "contact" : "contacts"}
                  </span>
                </div>
                <p className="line-clamp-2 min-w-0 text-sm text-zinc-500 dark:text-zinc-400">
                  {list.description || "No description."}
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Created {relativeTime(list.createdAt)}
                </p>
                <div className="flex flex-wrap items-center gap-2 border-t border-zinc-100 pt-3 dark:border-zinc-800">
                  <FormButton variant="secondary" onClick={() => openMembers(list)}>
                    <Icon name="Users" size={14} /> Manage members
                  </FormButton>
                  <Tooltip label="Edit list" placement="top">
                    <button
                      type="button"
                      aria-label={`Edit list ${list.name}`}
                      onClick={() => openEdit(list)}
                      className={ICON_BUTTON}
                    >
                      <Icon name="Settings" size={15} />
                    </button>
                  </Tooltip>
                  <Tooltip label="Delete list" placement="top">
                    <button
                      type="button"
                      aria-label={`Delete list ${list.name}`}
                      onClick={() => setPendingDelete(list)}
                      className={`${ICON_BUTTON} hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400`}
                    >
                      <Icon name="Trash" size={15} />
                    </button>
                  </Tooltip>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {listModal && (
        <Layout
          onClick={() => setListModal(null)}
          label={listModal.mode === "create" ? "New list" : "Edit list"}
        >
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void saveList();
            }}
            className="grid w-full max-w-md grid-cols-1 gap-4 rounded-3xl bg-white p-6 shadow-2xl dark:bg-zinc-950 sm:p-8"
          >
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              {listModal.mode === "create" ? "New list" : "Edit list"}
            </h2>
            <InputField
              id="list-name"
              name="name"
              type="text"
              label="Name"
              placeholder="Newsletter subscribers"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
            <TextAreaField
              id="list-description"
              name="description"
              label="Description (optional)"
              placeholder="Who is on this list?"
              rows={3}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
            <div className="flex flex-wrap justify-end gap-2">
              <FormButton variant="secondary" disabled={saving} onClick={() => setListModal(null)}>
                Cancel
              </FormButton>
              <FormButton type="submit" disabled={saving}>
                {saving ? (
                  <>
                    <Icon name="Loader" size={15} className="animate-spin" /> Saving…
                  </>
                ) : listModal.mode === "create" ? (
                  "Create list"
                ) : (
                  "Save changes"
                )}
              </FormButton>
            </div>
          </form>
        </Layout>
      )}

      {memberList && (
        <Layout
          onClick={() => setMemberList(null)}
          label={`Members of ${memberList.name}`}
        >
          <section className="grid max-h-[85vh] w-full max-w-lg grid-cols-1 gap-4 overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl dark:bg-zinc-950 sm:p-8">
            <div className="grid min-w-0 grid-cols-1 gap-1">
              <h2 className="truncate text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                Members · {memberList.name}
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Add contacts to this list, or remove existing members.
              </p>
            </div>

            {membersLoading ? (
              <SkeletonListRows rows={4} />
            ) : membersError ? (
              <div className="grid grid-cols-1 justify-items-start gap-3 rounded-2xl bg-zinc-50 p-4 dark:bg-zinc-900/40">
                <p className="text-sm text-zinc-600 dark:text-zinc-300">
                  Could not load contacts and members.
                </p>
                <FormButton variant="secondary" onClick={() => openMembers(memberList)}>
                  Retry
                </FormButton>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-2">
                  <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                    Add contacts
                  </h3>
                  {available.length === 0 ? (
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                      All contacts are already members.
                    </p>
                  ) : (
                    <>
                      <div className="max-h-56 overflow-y-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
                        <ul className="grid grid-cols-1 divide-y divide-zinc-100 dark:divide-zinc-900">
                          {available.map((contact) => (
                            <li key={contact.id} className="flex min-w-0 items-center gap-3 px-3 py-2">
                              <input
                                type="checkbox"
                                id={`member-${contact.id}`}
                                aria-label={`Add ${contact.email} to ${memberList.name}`}
                                checked={selectedIds.includes(contact.id)}
                                onChange={(event) => {
                                  const checked = event.target.checked;
                                  setSelectedIds((current) =>
                                    checked
                                      ? [...current, contact.id]
                                      : current.filter((id) => id !== contact.id)
                                  );
                                }}
                                className="h-4 w-4 shrink-0 accent-zinc-900 dark:accent-zinc-100"
                              />
                              <label htmlFor={`member-${contact.id}`} className="grid min-w-0 grid-cols-1">
                                <span className="truncate text-sm text-zinc-800 dark:text-zinc-200">
                                  {contact.name ?? contact.email}
                                </span>
                                <span className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                                  {contact.email}
                                </span>
                              </label>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="flex justify-end">
                        <FormButton
                          disabled={selectedIds.length === 0 || memberBusy !== null}
                          onClick={() => {
                            void addMembers();
                          }}
                        >
                          {memberBusy?.action === "add" ? (
                            <>
                              <Icon name="Loader" size={15} className="animate-spin" /> Adding…
                            </>
                          ) : (
                            `Add selected (${selectedIds.length})`
                          )}
                        </FormButton>
                      </div>
                    </>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-2 border-t border-zinc-100 pt-3 dark:border-zinc-800">
                  <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                    Current members ({members.length})
                  </h3>
                  {members.length === 0 ? (
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">No members yet.</p>
                  ) : (
                    <ul className="grid grid-cols-1 gap-2">
                      {members.map((member) => (
                        <li
                          key={member.id}
                          className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-zinc-50 px-3 py-2 dark:bg-zinc-900/40"
                        >
                          <span className="grid min-w-0 grid-cols-1">
                            <span className="truncate text-sm text-zinc-800 dark:text-zinc-200">
                              {member.name ?? member.email}
                            </span>
                            <span className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                              {member.email} · added {relativeTime(member.addedAt)}
                            </span>
                          </span>
                          <FormButton
                            variant="danger"
                            disabled={memberBusy !== null}
                            onClick={() => {
                              void removeMember(member);
                            }}
                          >
                            {memberBusy?.action === "remove" && memberBusy.id === member.id ? (
                              <Icon name="Loader" size={14} className="animate-spin" />
                            ) : (
                              <>
                                <Icon name="Trash" size={14} /> Remove
                              </>
                            )}
                          </FormButton>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </>
            )}
          </section>
        </Layout>
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete this list?"
        description={`This permanently deletes “${pendingDelete?.name ?? ""}” and removes its member assignments. Contacts are not deleted. This cannot be undone.`}
        confirmLabel="Delete list"
        tone="danger"
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          void confirmDelete();
        }}
      />
    </NonDevShell>
  );
}
