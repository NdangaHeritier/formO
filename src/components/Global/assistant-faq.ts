/** Deterministic, product-grounded answers. No AI or backend involved. */

export type FaqAudience = "public" | "developer" | "nonDeveloper";

export type Faq = {
  id: string;
  question: string;
  answer: string;
  keywords: string[];
  audiences: FaqAudience[];
  href?: string;
  hrefLabel?: string;
};

export const faqs: Faq[] = [
  {
    id: "pending",
    question: "Why are my submissions still pending?",
    answer:
      "Submissions are queued, never sent inline. The delivery worker drains the queue when /api/cron/deliver runs. On Vercel Hobby that schedule is daily at 04:00 UTC — use an external scheduler every minute or two for faster delivery.",
    keywords: ["pending", "queued", "cron", "delivery", "slow", "worker", "schedule"],
    audiences: ["developer", "nonDeveloper"],
  },
  {
    id: "unverified",
    question: "Why does my SMTP sender say Unverified?",
    answer:
      "A sender starts unverified. FormO attempts a handshake when you add it; if the server cannot be reached, the sender is saved but flagged. Use Verify on the sender row to retry. A sender must be verified before it can become the workspace default or a form sender.",
    keywords: ["smtp", "unverified", "verify", "sender", "credentials", "handshake"],
    audiences: ["developer"],
    href: "/developer/settings",
    hrefLabel: "Open settings",
  },
  {
    id: "embed",
    question: "How do I put a FormO form on my website?",
    answer:
      "Create a form, copy its public endpoint from the forms list, add your website origin in Form settings, then paste the HTML or fetch snippet from the Embed dialog. On success visitors land on FormO's thank-you page and return to your site after 3 seconds.",
    keywords: ["embed", "website", "contact form", "endpoint", "html", "fetch", "origin", "redirect"],
    audiences: ["public", "developer"],
    href: "/developer/forms",
    hrefLabel: "Open forms",
  },
  {
    id: "origin",
    question: "Why is my form rejected from my website?",
    answer:
      "The browser blocks cross-origin posts unless your site's origin is allowed. Open the form's settings and add the exact origin (scheme and host, e.g. https://your-site.com). An empty allowlist currently permits any origin.",
    keywords: ["origin", "cors", "blocked", "403", "allowed", "rejected"],
    audiences: ["developer"],
    href: "/developer/forms",
    hrefLabel: "Open forms",
  },
  {
    id: "verify-meaning",
    question: "What does verifying SMTP actually check?",
    answer:
      "It opens an SMTP connection and authenticates using the stored credentials. It does not send a test email, so it confirms the server is reachable but not that a provider will accept your message.",
    keywords: ["smtp", "verify", "test", "auth", "handshake", "email"],
    audiences: ["developer"],
  },
  {
    id: "managed",
    question: "What does 'Managed by your workspace' mean?",
    answer:
      "Non-developers see delivery status, recipients and outcomes, but never SMTP hosts, credentials, endpoints or API keys. Transport is owned by a workspace admin, configured once in developer settings.",
    keywords: ["managed", "workspace", "non-developer", "read-only", "smtp", "status"],
    audiences: ["nonDeveloper"],
    href: "/non-dev",
    hrefLabel: "Open workspace",
  },
  {
    id: "broadcast",
    question: "How do I send a message to my audience?",
    answer:
      "Use Compose. Pick a template or write your own subject and body, choose contacts, lists or individual addresses, then queue the message. Each recipient becomes a delivery in the same pipeline as form submissions.",
    keywords: ["compose", "send", "audience", "contacts", "lists", "broadcast", "message"],
    audiences: ["nonDeveloper"],
    href: "/non-dev/compose",
    hrefLabel: "Compose a message",
  },
  {
    id: "logs",
    question: "Where can I see delivery results?",
    answer:
      "Developers get the Delivery tab in workspace settings with recent attempts and errors. Non-developers get delivery outcomes in Analytics. Analytics covers sent, pending and failed — open and click tracking is not implemented.",
    keywords: ["logs", "delivery", "analytics", "failed", "bounced", "opens", "clicks"],
    audiences: ["developer", "nonDeveloper"],
    href: "/non-dev/analytics",
    hrefLabel: "Open analytics",
  },
  {
    id: "rotate",
    question: "How do I rotate a form endpoint?",
    answer:
      "Use the rotate action on the form row in the forms list. The old URL stops accepting submissions immediately, so update every site that embeds it before rotating.",
    keywords: ["rotate", "endpoint", "url", "security", "form"],
    audiences: ["developer"],
    href: "/developer/forms",
    hrefLabel: "Open forms",
  },
  {
    id: "delete",
    question: "How do I delete a submission?",
    answer:
      "Admins can delete a single submission from the inbox row or bulk-delete all submissions for a form. Deleting a submission also removes its delivery logs and events, and the action is recorded in the audit log.",
    keywords: ["delete", "submission", "inbox", "audit", "remove"],
    audiences: ["developer"],
    href: "/developer/submissions",
    hrefLabel: "Open inbox",
  },
  {
    id: "api-key",
    question: "What can API keys do?",
    answer:
      "Keys created in the dashboard carry the forms:read scope and authenticate GET /api/v1/forms. There is no API-key send-email route; user-initiated sends go through the non-developer composer.",
    keywords: ["api key", "scope", "token", "v1", "integration", "send"],
    audiences: ["developer", "public"],
    href: "/developer/settings",
    hrefLabel: "Open settings",
  },
  {
    id: "switch",
    question: "Can I switch between developer and non-developer views?",
    answer:
      "No. The audience is chosen at onboarding and locked, so a non-developer account can never open the developer dashboard and a developer account cannot open the non-developer workspace. Contact an admin if your account has the wrong audience.",
    keywords: ["switch", "view", "audience", "interest", "role", "developer", "non-developer"],
    audiences: ["public", "developer", "nonDeveloper"],
  },
];
