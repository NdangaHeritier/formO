import Link from "next/link";
import Callout from "@/components/Docs/Callout";
import CodeBlock from "@/components/Docs/CodeBlock";
import DocsShell from "@/components/Docs/DocsShell";
import { docsPageAt } from "@/lib/docs/manifest";

export const metadata = {
  title: "Delivery | FormO Docs",
  description: "The single email pipeline: queue, worker, sender tiers, retries and troubleshooting.",
};

const page = docsPageAt("/docs/delivery")!;

const lifecycle = [
  ["pending", "Queued and waiting for the worker. nextRetryAt is due."],
  ["processing", "Claimed by a worker with SKIP LOCKED. Stale claims are recovered after 10 minutes."],
  ["retrying", "A transient failure occurred; a backoff delay is set."],
  ["sent", "SMTP accepted the message. An email_events row records the send."],
  ["failed", "Permanent failure or cancellation. No further attempts."],
  ["dead_letter", "Retries exhausted after five attempts."],
];

const tiers = [
  ["1. Form sender", "A sender attached to the individual form. Highest priority."],
  ["2. Workspace default", "One verified sender chosen in /developer/settings."],
  ["3. System SMTP", "Environment variables, used when neither above is set."],
];

const causes = [
  ["Still pending", "The worker has not claimed the row yet. Check cron or submit again to trigger instant delivery."],
  ["Unauthorized cron request", "The Authorization header is missing or the Bearer value does not match CRON_SECRET."],
  ["SMTP handshake failed", "Host or credentials are wrong, or the port is blocked. Verify the sender again."],
  ["SmtpEndpointError", "The host resolves to a private or loopback address; the SSRF guard blocks it."],
  ["Origin is not allowed", "Add the exact site origin to the form's allowed origins."],
  ["No active recipients", "The form has no recipients and no emailTo address."],
];

export default function DeliveryPage() {
  return (
    <DocsShell page={page}>
      <section className="grid grid-cols-1 gap-3">
        <h2 id="one-pipeline" className="scroll-mt-20 text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          One pipeline
        </h2>
        <p className="text-[15px] leading-7 text-zinc-600 dark:text-zinc-400">
          Form notifications and non-developer broadcasts both become rows in{" "}
          <code className="font-mono text-sm">email_deliveries</code>. There is no
          second SMTP path. The public submission route only validates and
          persists data; all sending happens in{" "}
          <code className="font-mono text-sm">runDeliveryBatch()</code>.
        </p>
      </section>

      <section className="mt-10 grid grid-cols-1 gap-3">
        <h2 id="lifecycle" className="scroll-mt-20 text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          Delivery lifecycle
        </h2>
        <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
          <table className="w-full min-w-[36rem] text-left text-sm">
            <thead className="border-b border-zinc-200 text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800">
              <tr><th className="px-4 py-3 font-medium">Status</th><th className="px-4 py-3 font-medium">Meaning</th></tr>
            </thead>
            <tbody>
              {lifecycle.map(([status, detail]) => (
                <tr key={status} className="border-b border-zinc-100 last:border-0 dark:border-zinc-900">
                  <td className="px-4 py-3 font-mono text-xs text-zinc-800 dark:text-zinc-200">{status}</td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-10 grid grid-cols-1 gap-3">
        <h2 id="sending" className="scroll-mt-20 text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          Instant and scheduled sending
        </h2>
        <p className="text-[15px] leading-7 text-zinc-600 dark:text-zinc-400">
          After a successful submission accepts its response, FormO runs a small
          batch of the same worker via Next.js <code className="font-mono text-sm">after()</code>.
          A visitor normally sees success within seconds. The scheduled endpoint
          remains the safety net for retries and rows left behind.
        </p>
        <CodeBlock
          language="bash"
          code={`curl -X POST https://your-formo-host/api/cron/deliver \\
  -H "Authorization: Bearer <CRON_SECRET>"`}
        />
        <Callout tone="warning" title="External scheduler">
          Vercel Hobby only allows daily cron schedules. Use an external scheduler
          that can call this endpoint every minute, or accept that pending rows
          wait for the daily tick. Keep CRON_SECRET out of client code.
        </Callout>
      </section>

      <section className="mt-10 grid grid-cols-1 gap-3">
        <h2 id="senders" className="scroll-mt-20 text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          Sender selection
        </h2>
        <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
          <table className="w-full min-w-[30rem] text-left text-sm">
            <thead className="border-b border-zinc-200 text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800">
              <tr><th className="px-4 py-3 font-medium">Tier</th><th className="px-4 py-3 font-medium">When it is used</th></tr>
            </thead>
            <tbody>
              {tiers.map(([tier, detail]) => (
                <tr key={tier} className="border-b border-zinc-100 last:border-0 dark:border-zinc-900">
                  <td className="px-4 py-3 font-medium text-zinc-800 dark:text-zinc-200">{tier}</td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[15px] leading-7 text-zinc-600 dark:text-zinc-400">
          A sender must be verified before it can be assigned as a workspace
          default or to a form. Verification checks the SMTP handshake only; see{" "}
          <Link href="/docs/quickstart" className="font-medium text-zinc-900 underline dark:text-zinc-100">
            Quickstart
          </Link>{" "}
          for setup.
        </p>
      </section>

      <section className="mt-10 grid grid-cols-1 gap-3">
        <h2 id="retries" className="scroll-mt-20 text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          Retries and dead letter
        </h2>
        <p className="text-[15px] leading-7 text-zinc-600 dark:text-zinc-400">
          Transient errors retry at 1, 5, 30, 120 and 360 minutes. Permanent
          errors — invalid recipients, SMTP 550-class responses or blocked
          endpoints — stop immediately. After five attempts a row becomes{" "}
          <code className="font-mono text-sm">dead_letter</code>. The worker caps
          each run at 50 seconds and 25 rows, so a large backlog is processed in
          batches.
        </p>
      </section>

      <section className="mt-10 grid grid-cols-1 gap-3">
        <h2 id="troubleshooting" className="scroll-mt-20 text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          Troubleshooting
        </h2>
        <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
          <table className="w-full min-w-[36rem] text-left text-sm">
            <thead className="border-b border-zinc-200 text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800">
              <tr><th className="px-4 py-3 font-medium">Symptom</th><th className="px-4 py-3 font-medium">Likely cause</th></tr>
            </thead>
            <tbody>
              {causes.map(([symptom, detail]) => (
                <tr key={symptom} className="border-b border-zinc-100 last:border-0 dark:border-zinc-900">
                  <td className="px-4 py-3 font-medium text-zinc-800 dark:text-zinc-200">{symptom}</td>
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
