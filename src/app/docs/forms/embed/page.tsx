import Link from "next/link";
import Callout from "@/components/Docs/Callout";
import CodeBlock from "@/components/Docs/CodeBlock";
import DocsShell from "@/components/Docs/DocsShell";
import { docsPageAt } from "@/lib/docs/manifest";

export const metadata = {
  title: "Embed a form | FormO Docs",
  description: "Post to a FormO public endpoint from HTML, JavaScript or cURL.",
};

const page = docsPageAt("/docs/forms/embed")!;

const fields = [
  ["Any field name", "Stored in the submission data and rendered into the notification email."],
  ["_gotcha", "Honeypot. Keep it hidden; bots that fill it receive a fake success and no delivery."],
  ["_redirect", "Optional HTTPS URL on an allowed origin. Overrides the default thank-you page."],
  ["cf-turnstile-response", "Required only when the form has Turnstile enabled."],
];

const responses = [
  ["200", "Accepted. JSON body contains ok, id and optionally duplicate."],
  ["303", "HTML form post accepted; browser is redirected to the thank-you page."],
  ["403", "Origin is not allowed for this form."],
  ["410", "Form is inactive or deleted."],
  ["413", "Payload exceeds the form limit (default 64 KiB)."],
  ["422", "Submission is empty."],
  ["429", "Rate limit reached; Retry-After is set."],
];

export default function EmbedPage() {
  return (
    <DocsShell page={page}>
      <section className="grid grid-cols-1 gap-3">
        <h2 id="public-endpoint" className="scroll-mt-20 text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          The public endpoint
        </h2>
        <p className="text-[15px] leading-7 text-zinc-600 dark:text-zinc-400">
          Every form has a unique endpoint on your FormO host:{" "}
          <code className="font-mono text-sm">POST /api/f/{"{endpoint}"}</code>.
          It accepts JSON, urlencoded and multipart bodies. No API key or account
          session is needed — the endpoint itself is the credential. Rotate it
          from the forms list if it leaks; the old URL stops working immediately.
        </p>
        <Callout tone="note" title="Delivery is asynchronous">
          The request only stores the submission. The delivery worker sends the
          email after the response, so a slow SMTP server never blocks your
          visitor.
        </Callout>
      </section>

      <section className="mt-10 grid grid-cols-1 gap-3">
        <h2 id="html-form" className="scroll-mt-20 text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          HTML form
        </h2>
        <p className="text-[15px] leading-7 text-zinc-600 dark:text-zinc-400">
          Paste this into your site and replace the endpoint and thank-you URL.
          Add your site origin in the form settings first.
        </p>
        <CodeBlock
          language="html"
          code={`<form action="https://your-formo-host/api/f/fmo_a1b2c3d4e5f6" method="POST">
  <input name="email" type="email" required />
  <textarea name="message" required></textarea>

  <!-- Honeypot: keep hidden. -->
  <input name="_gotcha" type="text" tabindex="-1" autocomplete="off" hidden />

  <input type="hidden" name="_redirect" value="https://your-site.com/thank-you" />
  <button type="submit">Send</button>
</form>`}
        />
      </section>

      <section className="mt-10 grid grid-cols-1 gap-3">
        <h2 id="javascript-fetch" className="scroll-mt-20 text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          JavaScript fetch
        </h2>
        <p className="text-[15px] leading-7 text-zinc-600 dark:text-zinc-400">
          Use JSON and <code className="font-mono text-sm">Accept: application/json</code>{" "}
          when you want to show your own success state. An{" "}
          <code className="font-mono text-sm">Idempotency-Key</code> makes double
          submits safe for 24 hours.
        </p>
        <CodeBlock
          language="javascript"
          code={`const res = await fetch("https://your-formo-host/api/f/fmo_a1b2c3d4e5f6", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Accept": "application/json",
    "Idempotency-Key": crypto.randomUUID(),
  },
  body: JSON.stringify({
    email: "visitor@example.com",
    message: "Hello from my website",
  }),
});

const data = await res.json();
if (!res.ok) throw new Error(data?.error ?? "Submission failed");
console.log(data.id, data.duplicate);`}
        />
      </section>

      <section className="mt-10 grid grid-cols-1 gap-3">
        <h2 id="curl" className="scroll-mt-20 text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          cURL
        </h2>
        <CodeBlock
          language="bash"
          code={`curl -X POST https://your-formo-host/api/f/fmo_a1b2c3d4e5f6 \\
  -H "Content-Type: application/json" \\
  -H "Accept: application/json" \\
  -d '{"email":"visitor@example.com","message":"Hello"}'`}
        />
      </section>

      <section className="mt-10 grid grid-cols-1 gap-3">
        <h2 id="fields" className="scroll-mt-20 text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          Fields and headers
        </h2>
        <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
          <table className="w-full min-w-[36rem] text-left text-sm">
            <thead className="border-b border-zinc-200 text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800">
              <tr><th className="px-4 py-3 font-medium">Field</th><th className="px-4 py-3 font-medium">Behaviour</th></tr>
            </thead>
            <tbody>
              {fields.map(([name, detail]) => (
                <tr key={name} className="border-b border-zinc-100 last:border-0 dark:border-zinc-900">
                  <td className="px-4 py-3 font-mono text-xs text-zinc-800 dark:text-zinc-200">{name}</td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-sm leading-6 text-zinc-500 dark:text-zinc-400">
          See the{" "}
          <Link href="/docs/delivery" className="underline">delivery guide</Link>{" "}
          for status codes and retry behaviour.
        </p>
      </section>

      <section className="mt-10 grid grid-cols-1 gap-3">
        <h2 id="thanks-page" className="scroll-mt-20 text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          Thank-you page
        </h2>
        <p className="text-[15px] leading-7 text-zinc-600 dark:text-zinc-400">
          A plain HTML post follows a 303 redirect to FormO&apos;s thank-you page.
          That page shows the confirmation, waits three seconds, then returns the
          visitor to the site they came from. A valid <code className="font-mono text-sm">_redirect</code>{" "}
          must be HTTPS and use an allowed origin; an invalid value falls back to
          the FormO page.
        </p>
        <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
          <table className="w-full min-w-[24rem] text-left text-sm">
            <thead className="border-b border-zinc-200 text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800">
              <tr><th className="px-4 py-3 font-medium">Status</th><th className="px-4 py-3 font-medium">Meaning</th></tr>
            </thead>
            <tbody>
              {responses.map(([status, detail]) => (
                <tr key={status} className="border-b border-zinc-100 last:border-0 dark:border-zinc-900">
                  <td className="px-4 py-3 font-mono text-xs text-zinc-800 dark:text-zinc-200">{status}</td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </DocsShell>
  );
}
