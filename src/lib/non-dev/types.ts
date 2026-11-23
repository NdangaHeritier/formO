/** Client-side shapes for the audience-safe /api/non-dev/* responses. */

export type ContactView = {
  id: string;
  email: string;
  name: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lists: Array<{ id: string; name: string }>;
  deliveryCount: number;
};

export type ContactListView = {
  id: string;
  name: string;
  description: string | null;
  contactCount: number;
  createdAt: string;
  updatedAt: string;
};

export type ListMemberView = {
  id: string;
  email: string;
  name: string | null;
  isActive: boolean;
  addedAt: string;
};

export type TemplateView = {
  id: string;
  name: string;
  updatedAt: string;
};

export type TemplateDetail = TemplateView & {
  subjectTemplate: string;
  htmlTemplate: string;
};

export type DeliveryView = {
  id: string;
  recipientEmail: string;
  status: string;
  attemptCount: number;
  nextRetryAt?: string;
  errorMessage: string | null;
  createdAt: string;
  contact?: { id: string; name: string | null } | null;
  messageId?: string | null;
  messageName?: string | null;
};

export type MessageView = {
  id: string;
  name: string;
  subject: string;
  status: "draft" | "queued" | "sending" | "sent" | "failed" | "canceled";
  scheduledAt: string | null;
  sentAt: string | null;
  createdAt: string;
  updatedAt: string;
  recipientCount: number;
  sentCount: number;
  failedCount: number;
  deliveries?: DeliveryView[];
};

export type PageResult<T> = {
  items: T[];
  total: number;
  hasMore: boolean;
  nextCursor: string | null;
};

export type Overview = {
  forms: Array<{
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
  }>;
  templates: Array<{ id: string; name: string }>;
  audience: { contacts: number; lists: number };
  messages: { total: number; queued: number; sent: number; failed: number };
  delivery: {
    managedBy: "workspace";
    sent: number;
    failed: number;
    pending: number;
    lastSentAt: string | null;
  };
};

export type Analytics = {
  messages: {
    total: number;
    queued: number;
    sending: number;
    sent: number;
    failed: number;
    canceled: number;
  };
  recipients: { total: number; pending: number; sent: number; failed: number };
  lastSentAt: string | null;
};

export const statusClasses: Record<string, string> = {
  sent: "bg-green-600/15 text-green-600 dark:text-green-400",
  active: "bg-green-600/15 text-green-600 dark:text-green-400",
  queued: "bg-yellow-600/15 text-yellow-600 dark:text-yellow-400",
  pending: "bg-yellow-600/15 text-yellow-600 dark:text-yellow-400",
  retrying: "bg-yellow-600/15 text-yellow-600 dark:text-yellow-400",
  waiting: "bg-blue-600/15 text-blue-600 dark:text-blue-400",
  sending: "bg-blue-600/15 text-blue-600 dark:text-blue-400",
  processing: "bg-blue-600/15 text-blue-600 dark:text-blue-400",
  failed: "bg-red-600/15 text-red-600 dark:text-red-400",
  dead_letter: "bg-red-600/15 text-red-600 dark:text-red-400",
  attention: "bg-yellow-600/15 text-yellow-600 dark:text-yellow-400",
  canceled: "bg-zinc-500/15 text-zinc-500 dark:text-zinc-400",
  paused: "bg-zinc-500/15 text-zinc-500 dark:text-zinc-400",
  spam: "bg-zinc-500/15 text-zinc-500 dark:text-zinc-400",
};

export const pillClass =
  "rounded-full px-2 py-0.5 text-[11px] font-medium whitespace-nowrap";
