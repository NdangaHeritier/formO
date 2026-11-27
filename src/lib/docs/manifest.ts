/** Single source for docs navigation, search and prev/next links. */

export type DocsHeading = { id: string; label: string };

export type DocsPage = {
  href: string;
  title: string;
  description: string;
  section: string;
  keywords: string[];
  headings: DocsHeading[];
};

export const docsSections = [
  "Getting started",
  "Guides",
] as const;

export const docsPages: DocsPage[] = [
  {
    href: "/docs",
    title: "Overview",
    description: "What FormO is, who it is for, and where to go next.",
    section: "Getting started",
    keywords: ["home", "introduction", "self-hosted", "overview", "developer", "non-developer"],
    headings: [
      { id: "what-is-formo", label: "What FormO is" },
      { id: "three-paths", label: "Three paths" },
      { id: "next-steps", label: "Next steps" },
    ],
  },
  {
    href: "/docs/quickstart",
    title: "Quickstart",
    description: "From an empty workspace to your first delivered submission.",
    section: "Getting started",
    keywords: ["quickstart", "project", "form", "endpoint", "first submission", "setup"],
    headings: [
      { id: "before-you-start", label: "Before you start" },
      { id: "create-a-project", label: "Create a project" },
      { id: "create-a-form", label: "Create a form" },
      { id: "allow-your-origin", label: "Allow your origin" },
      { id: "send-a-submission", label: "Send a submission" },
      { id: "check-delivery", label: "Check delivery" },
    ],
  },
  {
    href: "/docs/forms/embed",
    title: "Embed a form",
    description: "HTML, fetch and cURL examples for the public form endpoint.",
    section: "Guides",
    keywords: ["embed", "html", "fetch", "curl", "redirect", "thanks", "idempotency", "cors", "honeypot"],
    headings: [
      { id: "public-endpoint", label: "The public endpoint" },
      { id: "html-form", label: "HTML form" },
      { id: "javascript-fetch", label: "JavaScript fetch" },
      { id: "curl", label: "cURL" },
      { id: "fields", label: "Fields and headers" },
      { id: "thanks-page", label: "Thank-you page" },
    ],
  },
  {
    href: "/docs/delivery",
    title: "Delivery",
    description: "How submissions become email, and what to do when they do not.",
    section: "Guides",
    keywords: ["delivery", "queue", "worker", "cron", "smtp", "retry", "dead letter", "pending", "failed", "verification"],
    headings: [
      { id: "one-pipeline", label: "One pipeline" },
      { id: "lifecycle", label: "Delivery lifecycle" },
      { id: "sending", label: "Instant and scheduled sending" },
      { id: "senders", label: "Sender selection" },
      { id: "retries", label: "Retries and dead letter" },
      { id: "troubleshooting", label: "Troubleshooting" },
    ],
  },
];

export function docsPageAt(href: string): DocsPage | undefined {
  return docsPages.find((page) => page.href === href);
}

export function docsNeighbours(href: string) {
  const index = docsPages.findIndex((page) => page.href === href);
  return {
    previous: index > 0 ? docsPages[index - 1] : undefined,
    next: index >= 0 && index < docsPages.length - 1 ? docsPages[index + 1] : undefined,
  };
}

export function searchDocs(query: string): DocsPage[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return [];
  return docsPages.filter((page) =>
    [page.title, page.description, page.section, ...page.keywords, ...page.headings.map((h) => h.label)]
      .join(" ")
      .toLowerCase()
      .includes(needle)
  );
}
