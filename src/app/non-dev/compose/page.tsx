"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import NonDevShell from "@/components/Non-Developer/NonDevShell";
import Layout from "@/components/Developer/Modals/Layout";
import FormButton from "@/components/Global/FormButton";
import { Icon } from "@/components/Global/Icon";
import { InputField } from "@/components/Global/InputField";
import { SelectField } from "@/components/Global/SelectField";
import { TextAreaField } from "@/components/Global/TextAreaField";
import Tooltip from "@/components/Global/Tooltip";
import { useToast } from "@/components/Global/Toast";
import type {
  ContactListView,
  ContactView,
  TemplateDetail,
  TemplateView,
} from "@/lib/non-dev/types";

type TemplatesResponse = { templates: TemplateView[] };
type ContactsResponse = { items: ContactView[] };
type ListsResponse = { lists: ContactListView[] };
type ValidationResponse = { error?: string; code?: string; fields?: Record<string, string[]> };
type CreateResponse = { message?: { id: string } };

const EMAIL_RE = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;

const cardClass =
  "grid grid-cols-1 gap-4 rounded-3xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950 sm:p-6";
const subheading =
  "text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400";
const checkRow =
  "flex min-w-0 items-start gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-900/50";
const pickListClass =
  "grid max-h-52 grid-cols-1 gap-0.5 overflow-y-auto rounded-xl border border-zinc-200 p-1 dark:border-zinc-800";

/** Compose an outbound message from templates, contacts, lists and ad-hoc emails. */
export default function ComposePage() {
  const router = useRouter();
  const toast = useToast();

  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [htmlBody, setHtmlBody] = useState("");
  const [textBody, setTextBody] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [templates, setTemplates] = useState<TemplateView[]>([]);
  const [contacts, setContacts] = useState<ContactView[]>([]);
  const [lists, setLists] = useState<ContactListView[]>([]);
  const [contactIds, setContactIds] = useState<string[]>([]);
  const [listIds, setListIds] = useState<string[]>([]);
  const [emails, setEmails] = useState<string[]>([]);
  const [emailInput, setEmailInput] = useState("");
  const [templateLoading, setTemplateLoading] = useState(false);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [audienceOpen, setAudienceOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.all([
      fetch("/api/non-dev/templates").then(async (res) =>
        res.ok ? ((await res.json()) as TemplatesResponse) : null
      ),
      fetch("/api/non-dev/contacts?limit=100").then(async (res) =>
        res.ok ? ((await res.json()) as ContactsResponse) : null
      ),
      fetch("/api/non-dev/lists").then(async (res) =>
        res.ok ? ((await res.json()) as ListsResponse) : null
      ),
    ])
      .then(([tpl, con, lst]) => {
        if (!active) return;
        if (tpl?.templates) setTemplates(tpl.templates);
        if (con?.items) setContacts(con.items);
        if (lst?.lists) setLists(lst.lists);
      })
      .catch(() => {
        if (active) toast.error("Could not load compose options.");
      })
      .finally(() => {
        if (active) setOptionsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [toast]);

  const chooseTemplate = (value: string) => {
    setTemplateId(value);
    if (!value) return;
    setTemplateLoading(true);
    fetch(`/api/non-dev/templates/${encodeURIComponent(value)}`)
      .then((res) =>
        res.ok
          ? (res.json() as Promise<{ template: TemplateDetail }>)
          : Promise.reject(new Error("template"))
      )
      .then((data) => {
        setSubject(data.template.subjectTemplate);
        setHtmlBody(data.template.htmlTemplate);
      })
      .catch(() => toast.error("Could not load this template."))
      .finally(() => setTemplateLoading(false));
  };

  const toggleContact = (id: string) =>
    setContactIds((current) =>
      current.includes(id) ? current.filter((value) => value !== id) : [...current, id]
    );

  const toggleList = (id: string) =>
    setListIds((current) =>
      current.includes(id) ? current.filter((value) => value !== id) : [...current, id]
    );

  const addEmail = () => {
    const value = emailInput.trim().toLowerCase();
    if (!EMAIL_RE.test(value)) {
      toast.error("Enter a valid email address.");
      return;
    }
    if (emails.some((email) => email.toLowerCase() === value)) {
      toast.error("That email address is already added.");
      return;
    }
    setEmails((current) => [...current, value]);
    setEmailInput("");
  };

  const removeEmail = (value: string) =>
    setEmails((current) => current.filter((email) => email !== value));

  const recipientCount = contactIds.length + listIds.length + emails.length;
  const selectedListNames = lists
    .filter((list) => listIds.includes(list.id))
    .map((list) => list.name);
  const selectedContactNames = contacts
    .filter((contact) => contactIds.includes(contact.id))
    .map((contact) => contact.name ?? contact.email);

  const queueMessage = async () => {
    if (!name.trim()) {
      toast.error("Give this message a name.");
      return;
    }
    if (!subject.trim()) {
      toast.error("Add a subject.");
      return;
    }
    if (!htmlBody.trim()) {
      toast.error("Add a message body.");
      return;
    }
    if (recipientCount === 0) {
      toast.error("Choose at least one recipient.");
      return;
    }

    setSending(true);
    try {
      const payload = {
        name: name.trim(),
        subject: subject.trim(),
        htmlBody,
        ...(textBody.trim() ? { textBody: textBody.trim() } : {}),
        ...(templateId ? { templateId } : {}),
        contactIds,
        listIds,
        emails,
      };
      const res = await fetch("/api/non-dev/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json().catch(() => null)) as
        | (CreateResponse & ValidationResponse)
        | null;
      if (!res.ok) {
        toast.error(data?.error ?? "Could not queue this message.");
        return;
      }
      const id = data?.message?.id;
      if (!id) {
        toast.error("Could not queue this message.");
        return;
      }
      toast.success("Message queued for delivery.");
      router.push(`/non-dev/messages/${id}`);
    } catch {
      toast.error("Could not queue this message. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <NonDevShell>
      <section className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-5">
        <div className="grid grid-cols-1 gap-1">
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Compose message</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Write a message, pick a template and choose who should receive it.
          </p>
        </div>

        <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div className={cardClass}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <InputField
                type="text"
                name="name"
                id="compose-name"
                label="Message name"
                placeholder="e.g. August newsletter"
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
              <div className="grid grid-cols-1 gap-1">
                <SelectField
                  name="templateId"
                  id="compose-template"
                  label="Template"
                  value={templateId}
                  onChange={(event) => chooseTemplate(event.target.value)}
                >
                  <option value="">Start from scratch</option>
                  {templates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
                </SelectField>
                {templateLoading && (
                  <span className="flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400">
                    <Icon name="Loader" size={12} className="animate-spin" /> Loading template…
                  </span>
                )}
              </div>
            </div>

            <InputField
              type="text"
              name="subject"
              id="compose-subject"
              label="Subject"
              placeholder="Your subject line"
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
            />
            <TextAreaField
              name="htmlBody"
              id="compose-html"
              label="HTML body"
              placeholder="<p>Hello,</p>"
              rows={12}
              value={htmlBody}
              onChange={(event) => setHtmlBody(event.target.value)}
            />
            <TextAreaField
              name="textBody"
              id="compose-text"
              label="Plain-text body (optional)"
              placeholder="A plain-text version for recipients who prefer it"
              rows={3}
              value={textBody}
              onChange={(event) => setTextBody(event.target.value)}
            />
          </div>

          <aside className="grid grid-cols-1 gap-3 rounded-3xl border border-zinc-200 bg-zinc-50/60 p-5 dark:border-zinc-800 dark:bg-zinc-900/30">
            <div className="grid grid-cols-1 gap-1">
              <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Audience</h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Contacts, lists and individual addresses are deduplicated before sending.
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950">
              <span className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
                {recipientCount}
              </span>
              <span className="ml-2 text-xs text-zinc-500 dark:text-zinc-400">
                recipient{recipientCount === 1 ? "" : "s"} selected
              </span>
            </div>

            <div className="grid min-w-0 grid-cols-1 gap-2 text-xs text-zinc-600 dark:text-zinc-300">
              {selectedListNames.length > 0 && (
                <p className="min-w-0 break-words"><span className={subheading}>Lists:</span> {selectedListNames.join(", ")}</p>
              )}
              {selectedContactNames.length > 0 && (
                <p className="min-w-0 break-words"><span className={subheading}>Contacts:</span> {selectedContactNames.join(", ")}</p>
              )}
              {emails.length > 0 && (
                <p className="min-w-0 break-all"><span className={subheading}>Emails:</span> {emails.join(", ")}</p>
              )}
              {recipientCount === 0 && (
                <p className="text-zinc-500 dark:text-zinc-400">No recipients selected yet.</p>
              )}
            </div>

            <FormButton variant="secondary" onClick={() => setAudienceOpen(true)}>
              <Icon name="Users" size={15} /> {recipientCount === 0 ? "Choose audience" : "Edit audience"}
            </FormButton>
          </aside>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
          <p className="flex min-w-0 items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
            <Icon name="ShieldCheck" size={14} className="shrink-0" />
            Delivery is managed by your workspace. You can cancel or retry from the message detail page.
          </p>
          <div className="flex items-center gap-2">
            <FormButton variant="secondary" disabled={!htmlBody.trim()} onClick={() => setPreviewOpen(true)}>
              <Icon name="FileText" size={15} /> Preview
            </FormButton>
            <FormButton disabled={sending} onClick={() => void queueMessage()}>
              {sending ? (
                <><Icon name="Loader" size={15} className="animate-spin" /> Queueing…</>
              ) : (
                <><Icon name="Send" size={15} /> Queue message</>
              )}
            </FormButton>
          </div>
        </div>
      </section>

      {audienceOpen && (
        <Layout onClick={() => setAudienceOpen(false)} label="Choose audience">
          <section className="grid max-h-[85vh] w-full max-w-3xl grid-cols-1 gap-4 overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl dark:bg-zinc-950 sm:p-8">
            <div className="grid grid-cols-1 gap-1">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Choose audience</h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Pick contacts, lists and individual addresses. Duplicates are removed automatically.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="grid min-w-0 grid-cols-1 gap-2">
                <h3 className={subheading}>Contacts</h3>
                <div className={pickListClass}>
                  {optionsLoading ? (
                    <p className="p-3 text-sm text-zinc-500 dark:text-zinc-400">Loading contacts…</p>
                  ) : contacts.length === 0 ? (
                    <p className="p-3 text-sm text-zinc-500 dark:text-zinc-400">No contacts yet.</p>
                  ) : (
                    contacts.map((contact) => (
                      <label key={contact.id} className={checkRow}>
                        <input
                          type="checkbox"
                          checked={contactIds.includes(contact.id)}
                          onChange={() => toggleContact(contact.id)}
                          className="mt-0.5 size-4 shrink-0 accent-zinc-900 dark:accent-zinc-100"
                        />
                        <span className="grid min-w-0 grid-cols-1 gap-0.5">
                          <span className="truncate font-medium text-zinc-800 dark:text-zinc-200">
                            {contact.name ?? contact.email}
                          </span>
                          {contact.name && (
                            <span className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                              {contact.email}
                            </span>
                          )}
                        </span>
                      </label>
                    ))
                  )}
                </div>
              </div>

              <div className="grid min-w-0 grid-cols-1 gap-2">
                <h3 className={subheading}>Lists</h3>
                <div className={pickListClass}>
                  {optionsLoading ? (
                    <p className="p-3 text-sm text-zinc-500 dark:text-zinc-400">Loading lists…</p>
                  ) : lists.length === 0 ? (
                    <p className="p-3 text-sm text-zinc-500 dark:text-zinc-400">No lists yet.</p>
                  ) : (
                    lists.map((list) => (
                      <label key={list.id} className={checkRow}>
                        <input
                          type="checkbox"
                          checked={listIds.includes(list.id)}
                          onChange={() => toggleList(list.id)}
                          className="mt-0.5 size-4 shrink-0 accent-zinc-900 dark:accent-zinc-100"
                        />
                        <span className="grid min-w-0 grid-cols-1 gap-0.5">
                          <span className="truncate font-medium text-zinc-800 dark:text-zinc-200">
                            {list.name}
                          </span>
                          <span className="text-xs text-zinc-500 dark:text-zinc-400">
                            {list.contactCount} contact(s)
                          </span>
                        </span>
                      </label>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="grid min-w-0 grid-cols-1 gap-2">
              <h3 className={subheading}>Add email address</h3>
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <input
                  type="email"
                  aria-label="Add email address"
                  placeholder="name@example.com"
                  value={emailInput}
                  onChange={(event) => setEmailInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      addEmail();
                    }
                  }}
                  className="min-w-0 flex-1 rounded-xl border border-zinc-200 bg-zinc-100/80 px-4 py-2 text-sm text-zinc-800 outline-0 focus:border-zinc-900 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-200 dark:focus:border-zinc-100"
                />
                <FormButton variant="secondary" onClick={addEmail}>Add</FormButton>
              </div>
              {emails.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {emails.map((email) => (
                    <span
                      key={email}
                      className="flex min-w-0 items-center gap-1 rounded-full border border-zinc-200 bg-zinc-50 py-1 pl-3 pr-1 text-xs text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200"
                    >
                      <span className="max-w-[12rem] truncate">{email}</span>
                      <Tooltip label="Remove email address">
                        <button
                          type="button"
                          aria-label={`Remove ${email}`}
                          onClick={() => removeEmail(email)}
                          className="cursor-pointer rounded-full p-1 text-zinc-400 hover:bg-zinc-200 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                        >
                          <Icon name="X" size={12} />
                        </button>
                      </Tooltip>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <FormButton onClick={() => setAudienceOpen(false)}>Done</FormButton>
            </div>
          </section>
        </Layout>
      )}

      {previewOpen && (
        <Layout onClick={() => setPreviewOpen(false)} label="Message preview">
          <section className="grid max-h-[85vh] w-full max-w-3xl grid-cols-1 gap-4 overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl dark:bg-zinc-950 sm:p-8">
            <div className="grid grid-cols-1 gap-1">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Message preview</h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                <span className="font-medium text-zinc-700 dark:text-zinc-300">Subject:</span> {subject || "—"}
              </p>
            </div>
            <iframe
              title="Message preview"
              sandbox=""
              srcDoc={htmlBody}
              className="h-[24rem] w-full rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800"
            />
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              The preview is sandboxed; scripts in the HTML body do not run here.
            </p>
          </section>
        </Layout>
      )}
    </NonDevShell>
  );
}
