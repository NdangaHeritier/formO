import Link from "next/link";
import Callout from "@/components/Docs/Callout";
import CodeBlock from "@/components/Docs/CodeBlock";
import DocsShell from "@/components/Docs/DocsShell";
import { docsPageAt } from "@/lib/docs/manifest";

export const metadata = {
  title: "Quickstart | FormO Docs",
  description: "From an empty workspace to your first delivered submission in six steps.",
};

const page = docsPageAt("/docs/quickstart")!;

const checklist = [
  ["Account created", "Sign up and choose the Developer view at onboarding."],
  ["Sender ready", "Add an SMTP sender in /developer/settings and set it as the workspace default."],
  ["Workspace access", "You need the developer view; workspace role decides who can change settings."],
];

export default function QuickstartPage() {
  return (
    <DocsShell page={page}>
      <section className="grid grid-cols-1 gap-3">
        <h2 id="before-you-start" className="scroll-mt-20 text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          Before you start
        </h2>
        <p className="text-[15px] leading-7 text-zinc-600 dark:text-zinc-400">
          A form works without any SMTP configuration — submissions will be
          stored — but no email will leave until a sender is available. Do this
          once and every form in the workspace can use it.
        </p>
        <div className="my-2 overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
          <table className="w-full min-w-[30rem] text-left text-sm">
            <thead className="border-b border-zinc-200 text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800">
              <tr>
                <th className="px-4 py-3 font-medium">Requirement</th>
                <th className="px-4 py-3 font-medium">What to do</th>
              </tr>
            </thead>
            <tbody>
              {checklist.map(([name, detail]) => (
                <tr key={name} className="border-b border-zinc-100 last:border-0 dark:border-zinc-900">
                  <td className="px-4 py-3 font-medium text-zinc-800 dark:text-zinc-200">{name}</td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Callout tone="warning" title="Verified means reachable">
          Verification opens an SMTP connection and authenticates. It does not
          send a test email, so it cannot prove a provider will accept your
          message — only that the server answers and the credentials work.
        </Callout>
      </section>

      <section className="mt-10 grid grid-cols-1 gap-3">
        <h2 id="create-a-project" className="scroll-mt-20 text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          1. Create a project
        </h2>
        <p className="text-[15px] leading-7 text-zinc-600 dark:text-zinc-400">
          Go to <code className="font-mono text-sm">/developer</code> and choose{" "}
          <strong className="font-medium text-zinc-800 dark:text-zinc-200">Add Project</strong>.
          A project groups related forms and keeps their submissions together in
          the overview and analytics.
        </p>
      </section>

      <section className="mt-10 grid grid-cols-1 gap-3">
        <h2 id="create-a-form" className="scroll-mt-20 text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          2. Create a form
        </h2>
        <p className="text-[15px] leading-7 text-zinc-600 dark:text-zinc-400">
          Open the project and choose{" "}
          <strong className="font-medium text-zinc-800 dark:text-zinc-200">Add Form</strong>, or use{" "}
          <code className="font-mono text-sm">/developer/forms</code>. Set the{" "}
          <strong className="font-medium text-zinc-800 dark:text-zinc-200">Email to</strong>{" "}
          address — that is where notifications land. FormO generates a unique
          endpoint such as <code className="font-mono text-sm">fmo_a1b2c3d4e5f6</code>.
        </p>
      </section>

      <section className="mt-10 grid grid-cols-1 gap-3">
        <h2 id="allow-your-origin" className="scroll-mt-20 text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          3. Allow your origin
        </h2>
        <p className="text-[15px] leading-7 text-zinc-600 dark:text-zinc-400">
          Edit the form and open <strong className="font-medium text-zinc-800 dark:text-zinc-200">Form settings</strong>.
          Add the exact origin your site sends from — scheme and host, for example{" "}
          <code className="font-mono text-sm">https://your-site.com</code>. An
          empty allowlist currently accepts any origin, but setting it explicitly
          prevents another site from posting to your endpoint.
        </p>
      </section>

      <section className="mt-10 grid grid-cols-1 gap-3">
        <h2 id="send-a-submission" className="scroll-mt-20 text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          4. Send a submission
        </h2>
        <p className="text-[15px] leading-7 text-zinc-600 dark:text-zinc-400">
          Copy the public URL from the forms list and post to it. The quickest
          check is a JSON request:
        </p>
        <CodeBlock
          language="bash"
          code={`curl -X POST https://your-formo-host/api/f/fmo_a1b2c3d4e5f6 \\
  -H "Content-Type: application/json" \\
  -H "Accept: application/json" \\
  -d '{"email":"visitor@example.com","message":"Hello"}'`}
        />
        <p className="text-[15px] leading-7 text-zinc-600 dark:text-zinc-400">
          Success returns <code className="font-mono text-sm">200 {"{ \"ok\": true, \"id\": \"…\" }"}</code>.
          Full embed examples are in the{" "}
          <Link href="/docs/forms/embed" className="font-medium text-zinc-900 underline dark:text-zinc-100">
            embed guide
          </Link>
          .
        </p>
      </section>

      <section className="mt-10 grid grid-cols-1 gap-3">
        <h2 id="check-delivery" className="scroll-mt-20 text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          5. Check delivery
        </h2>
        <p className="text-[15px] leading-7 text-zinc-600 dark:text-zinc-400">
          Open <code className="font-mono text-sm">/developer/submissions</code> to
          see the record and its delivery attempts. The worker runs right after
          the response, so a healthy sender usually shows <em>sent</em> within
          seconds. If it is still <em>pending</em>, the scheduled cron will pick
          it up; if it is <em>failed</em>, the row shows the SMTP error.
        </p>
      </section>
    </DocsShell>
  );
}
