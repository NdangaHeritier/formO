"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Layout from "@/components/Developer/Modals/Layout";
import FormButton from "@/components/Global/FormButton";
import { Icon } from "@/components/Global/Icon";
import Tooltip from "@/components/Global/Tooltip";
import { faqs, type Faq, type FaqAudience } from "./assistant-faq";

type RankedFaq = Faq & { rank: number };

function audienceFor(pathname: string): FaqAudience {
  if (pathname.startsWith("/non-dev")) return "nonDeveloper";
  if (pathname.startsWith("/developer")) return "developer";
  return "public";
}

export default function AssistantButton() {
  const pathname = usePathname();
  const audience = audienceFor(pathname);
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const results = useMemo<RankedFaq[]>(() => {
    const needle = query.trim().toLowerCase();
    const items: RankedFaq[] = [];
    for (const faq of faqs) {
      const haystack = [faq.question, faq.answer, ...faq.keywords].join(" ").toLowerCase();
      if (needle && !haystack.includes(needle)) continue;
      const relevant = faq.audiences.includes(audience);
      const titleMatch = needle && faq.question.toLowerCase().includes(needle);
      items.push({ ...faq, rank: (relevant ? 0 : 2) + (titleMatch ? -1 : 0) });
    }
    return items.sort((a, b) => a.rank - b.rank);
  }, [query, audience]);

  const close = () => {
    setIsOpen(false);
    setQuery("");
    setOpenId(null);
  };

  return (
    <>
      <Tooltip label="FormO assistant" placement="left">
        <button
          type="button"
          aria-label="FormO assistant"
          aria-expanded={isOpen}
          onClick={() => setIsOpen(true)}
          className="flex cursor-pointer items-center justify-center rounded-full bg-yellow-100 p-3 text-yellow-800 shadow-lg transition-colors duration-200 hover:bg-yellow-50 dark:bg-yellow-600/20 dark:text-yellow-500 dark:hover:bg-yellow-600/30"
        >
          <Icon name="Bot" size={25} strokeWidth={2} />
        </button>
      </Tooltip>

      {isOpen ? (
        <Layout onClick={close} label="FormO assistant">
          <section className="grid max-h-[85vh] w-full max-w-xl grid-cols-1 gap-4 overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl dark:bg-zinc-950 sm:p-6">
            <div className="grid grid-cols-1 gap-1">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                <Icon name="Bot" size={18} className="text-amber-700 dark:text-amber-500" />
                FormO assistant
              </h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Search common questions. Answers are specific to this workspace.
              </p>
            </div>

            <div className="relative">
              <Icon
                name="Search"
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
              />
              <input
                type="search"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setOpenId(null);
                }}
                aria-label="Search FormO help"
                placeholder="Try SMTP, embed, pending…"
                className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 py-2.5 pl-10 pr-3 text-sm text-zinc-800 outline-none placeholder:text-zinc-400 focus-visible:border-zinc-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-100"
              />
            </div>

            {results.length === 0 ? (
              <div className="grid grid-cols-1 justify-items-center gap-2 py-6 text-center">
                <Icon name="Search" size={22} className="text-zinc-400" />
                <p className="text-sm text-zinc-600 dark:text-zinc-300">
                  No answer found. Try a different word.
                </p>
              </div>
            ) : (
              <ul className="grid grid-cols-1 border-t border-zinc-200 dark:border-zinc-800">
                {results.map((faq) => {
                  const expanded = openId === faq.id;
                  return (
                    <li key={faq.id} className="border-b border-zinc-200 dark:border-zinc-800">
                      <button
                        type="button"
                        aria-expanded={expanded}
                        onClick={() => setOpenId(expanded ? null : faq.id)}
                        className="flex w-full cursor-pointer items-center justify-between gap-3 py-3 text-left text-sm font-medium text-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600 dark:text-zinc-100"
                      >
                        <span className="min-w-0 break-words">{faq.question}</span>
                        <Icon
                          name="ChevronDown"
                          size={16}
                          className={`shrink-0 text-zinc-400 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
                        />
                      </button>
                      {expanded && (
                        <div className="grid grid-cols-1 gap-3 pb-4">
                          <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                            {faq.answer}
                          </p>
                          {faq.href && faq.hrefLabel && (
                            <Link
                              href={faq.href}
                              onClick={close}
                              className="inline-flex w-fit items-center gap-1 text-sm font-medium text-zinc-800 underline dark:text-zinc-100"
                            >
                              {faq.hrefLabel} <Icon name="ArrowRight" size={14} />
                            </Link>
                          )}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {results.length} answer{results.length === 1 ? "" : "s"}
              </p>
              <div className="flex items-center gap-2">
                <Link
                  href="/#docs"
                  onClick={close}
                  className="text-xs font-medium text-zinc-600 underline dark:text-zinc-300"
                >
                  Browse docs
                </Link>
                <FormButton variant="secondary" onClick={close}>
                  Close
                </FormButton>
              </div>
            </div>
          </section>
        </Layout>
      ) : null}
    </>
  );
}
