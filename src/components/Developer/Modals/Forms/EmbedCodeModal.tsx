"use client";
import { useMemo, useState } from "react";
import Layout from "@/components/Developer/Modals/Layout";
import { Icon, type LucideIconName } from "@/components/Global/Icon";
import FormButton from "@/components/Global/FormButton";
import Tooltip from "@/components/Global/Tooltip";
import { useToast } from "@/components/Global/Toast";

type Props = {
  endpoint: string;
  title?: string;
  onClick: () => void;
};

type Snippet = {
  id: "html" | "js" | "curl";
  label: string;
  icon: LucideIconName;
  code: string;
};

/** Shows production-ready embed examples for a single form's public endpoint. */
export default function EmbedCodeModal({ endpoint, title, onClick }: Props) {
  const [active, setActive] = useState<Snippet["id"]>("html");
  const toast = useToast();

  const copyText = (value: string, label: string) => {
    navigator.clipboard.writeText(value);
    toast.success(`${label} copied to clipboard`);
  };

  const snippets = useMemo<Snippet[]>(() => {
    const origin = typeof window === "undefined" ? "" : window.location.origin;
    const url = `${origin}/api/f/${endpoint}`;

    const html =
      `<!-- Paste into your site. Add your website origin in FormO form settings,\n` +
      `     otherwise the request and the redirect will be blocked. -->\n` +
      `<form action="${url}" method="POST">\n` +
      `  <input name="email" type="email" required />\n` +
      `  <textarea name="message" required></textarea>\n` +
      `\n` +
      `  <!-- Honeypot — keep hidden. Bots that fill it are rejected. -->\n` +
      `  <input name="_gotcha" type="text" tabindex="-1" autocomplete="off" hidden />\n` +
      `\n` +
      `  <!-- Point to your thank-you page (HTTPS + allowed origin).\n` +
      `       Add your site origin in the form settings in FormO. -->\n` +
      `  <input type="hidden" name="_redirect" value="https://your-site.com/thank-you" />\n` +
      `\n` +
      `  <button type="submit">Send</button>\n` +
      `</form>`;

    const js =
      `const url = "${url}";\n` +
      `\n` +
      `try {\n` +
      `  const res = await fetch(url, {\n` +
      `    method: "POST",\n` +
      `    headers: {\n` +
      `      "Content-Type": "application/json",\n` +
      `      "Accept": "application/json",\n` +
      `      "Idempotency-Key": crypto.randomUUID(),\n` +
      `    },\n` +
      `    body: JSON.stringify({\n` +
      `      email: "visitor@example.com",\n` +
      `      message: "Hello from my website",\n` +
      `    }),\n` +
      `  });\n` +
      `\n` +
      `  const data = await res.json();\n` +
      `  if (!res.ok) {\n` +
      `    throw new Error(data?.error ?? "Submission failed");\n` +
      `  }\n` +
      `\n` +
      `  if (data.duplicate) {\n` +
      `    console.log("Duplicate — already submitted:", data.id);\n` +
      `  } else {\n` +
      `    console.log("Submitted:", data.id);\n` +
      `  }\n` +
      `} catch (error) {\n` +
      `  console.error(error instanceof Error ? error.message : "Could not submit the form");\n` +
      `}`;

    const curl =
      `curl -X POST "${url}" ` +
      `-H "Content-Type: application/json" ` +
      `-H "Accept: application/json" ` +
      `-d '{"email":"visitor@example.com","message":"Hello from my website"}'`;

    return [
      { id: "html", label: "HTML form", icon: "CodeXml", code: html },
      { id: "js", label: "JavaScript", icon: "Code2", code: js },
      { id: "curl", label: "cURL", icon: "Terminal", code: curl },
    ];
  }, [endpoint]);

  const current = snippets.find((snippet) => snippet.id === active) ?? snippets[0];

  return (
    <Layout onClick={onClick} label="Embed form code">
      <section
        aria-labelledby="embed-code-title"
        className="w-full max-w-2xl rounded-card bg-white p-card shadow-2xl dark:bg-zinc-950 sm:p-6"
      >
        <div className="grid grid-cols-1 gap-4">
          <div className="grid grid-cols-1 gap-1">
            <div className="flex items-center gap-2">
              <h2 id="embed-code-title" className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                Embed form
              </h2>
              <Tooltip label="Why do I need to allow my origin?">
                <button
                  type="button"
                  aria-label="Why allow your website origin"
                  className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
                >
                  <Icon name="HelpCircle" size={15} aria-hidden="true" />
                </button>
              </Tooltip>
            </div>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Copy the code below and paste it into your website. This submits to the form&apos;s
              public endpoint.
            </p>
            {title ? (
              <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{title}</p>
            ) : null}
          </div>

          <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
            Allow your website origin in the form settings, otherwise the browser will block the
            request. Empty allowlist currently permits any origin.
          </p>

          <div role="tablist" aria-label="Embed code examples" className="flex flex-wrap gap-1 border-b border-zinc-200 dark:border-zinc-800">
            {snippets.map((snippet) => (
              <button
                key={snippet.id}
                type="button"
                role="tab"
                id={`embed-tab-${snippet.id}`}
                aria-selected={active === snippet.id}
                onClick={() => setActive(snippet.id)}
                className={`flex items-center gap-2 rounded-t-lg px-3 py-2 text-xs font-semibold cursor-pointer transition ${
                  active === snippet.id
                    ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
                    : "text-zinc-500 hover:text-zinc-800 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-zinc-900"
                }`}
              >
                <Icon name={snippet.icon} size={14} aria-hidden="true" />
                {snippet.label}
              </button>
            ))}
          </div>

          <div
            key={current.id}
            role="tabpanel"
            id={`embed-panel-${current.id}`}
            aria-labelledby={`embed-tab-${current.id}`}
            className="grid min-w-0 grid-cols-1 gap-2"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                {current.label}
              </p>
              <FormButton type="button" variant="secondary" onClick={() => copyText(current.code, current.label)}>
                <Icon name="Copy" size={14} aria-hidden="true" />
                Copy
              </FormButton>
            </div>
            <pre className="max-h-72 max-w-full overflow-auto rounded-xl bg-zinc-900 p-4 text-xs leading-5 text-zinc-100 dark:bg-black">
              <code className="whitespace-pre font-mono">{current.code}</code>
            </pre>
          </div>

          <div className="flex justify-end">
            <FormButton type="button" variant="secondary" onClick={onClick}>
              Close
            </FormButton>
          </div>
        </div>
      </section>
    </Layout>
  );
}
