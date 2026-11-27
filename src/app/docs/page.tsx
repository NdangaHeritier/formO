import Link from "next/link";
import { Icon } from "@/components/Global/Icon";
import Callout from "@/components/Docs/Callout";
import DocsShell from "@/components/Docs/DocsShell";
import { docsPageAt } from "@/lib/docs/manifest";

export const metadata = {
  title: "Documentation | FormO",
  description: "How FormO collects form data and delivers email, from first project to production.",
};

const page = docsPageAt("/docs")!;

const paths = [
  {
    title: "Developer API",
    description: "Generate an endpoint, post form data from any site, and let FormO deliver the notification email.",
    href: "/docs/quickstart",
    icon: "Code2" as const,
  },
  {
    title: "Non-developer workspace",
    description: "Build an audience, compose a message from a template, and watch delivery outcomes without touching code.",
    href: "/docs/delivery",
    icon: "Send" as const,
  },
  {
    title: "Self-hosted control",
    description: "Own the transport: configure SMTP, set a workspace default, and keep credentials encrypted in your own database.",
    href: "/docs/delivery",
    icon: "Server" as const,
  },
];

export default function DocsOverviewPage() {
  return (
    <DocsShell page={page}>
      <section className="grid grid-cols-1 gap-3">
        <h2 id="what-is-formo" className="scroll-mt-20 text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          What FormO is
        </h2>
        <p className="text-[15px] leading-7 text-zinc-600 dark:text-zinc-400">
          FormO is a self-hosted form-to-email platform. A public endpoint accepts
          submissions from any website, stores them in your workspace, and queues
          one email delivery per recipient. A single worker sends everything —
          form notifications and audience broadcasts alike — through the SMTP
          sender you control.
        </p>
        <p className="text-[15px] leading-7 text-zinc-600 dark:text-zinc-400">
          There are no inline sends on the request path. Accepting a submission is
          fast; delivery happens immediately afterwards in the background, with
          a scheduled cron job as a safety net. That separation is what makes
          retries, delivery logs and idempotency possible.
        </p>
      </section>

      <section className="mt-10 grid grid-cols-1 gap-4">
        <h2 id="three-paths" className="scroll-mt-20 text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          Three paths
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {paths.map((path) => (
            <Link
              key={path.title}
              href={path.href}
              className="grid content-start gap-2 rounded-xl border border-zinc-200 p-5 transition-colors hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700"
            >
              <Icon name={path.icon} size={18} className="text-amber-700 dark:text-amber-500" />
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">{path.title}</span>
              <span className="text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                {path.description}
              </span>
            </Link>
          ))}
        </div>
        <Callout tone="note" title="Choosing an audience">
          The audience is picked once at sign-up and locked. A non-developer
          account cannot open the developer dashboard, and a developer account
          cannot open the non-developer workspace.
        </Callout>
      </section>

      <section className="mt-10 grid grid-cols-1 gap-3">
        <h2 id="next-steps" className="scroll-mt-20 text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          Next steps
        </h2>
        <ul className="grid grid-cols-1 gap-2 text-[15px] leading-7 text-zinc-600 dark:text-zinc-400">
          <li>
            <Link href="/docs/quickstart" className="font-medium text-zinc-900 underline dark:text-zinc-100">
              Quickstart
            </Link>{" "}
            — create a project and a form, then send your first submission.
          </li>
          <li>
            <Link href="/docs/forms/embed" className="font-medium text-zinc-900 underline dark:text-zinc-100">
              Embed a form
            </Link>{" "}
            — ready-to-paste HTML, fetch and cURL examples.
          </li>
          <li>
            <Link href="/docs/delivery" className="font-medium text-zinc-900 underline dark:text-zinc-100">
              Delivery
            </Link>{" "}
            — understand the queue, retries and sender verification.
          </li>
        </ul>
      </section>
    </DocsShell>
  );
}
