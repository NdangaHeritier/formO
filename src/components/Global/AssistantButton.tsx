"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Layout from "@/components/Developer/Modals/Layout";
import { Icon } from "@/components/Global/Icon";
import Tooltip from "@/components/Global/Tooltip";
import { useToast } from "@/components/Global/Toast";
import type { FaqAudience } from "@/lib/assistant/knowledge";
import type { AssistantReply } from "@/server/services/assistant.service";

type Message = {
  id: string;
  role: "user" | "assistant";
  text: string;
  href?: string;
  hrefLabel?: string;
  suggestions?: string[];
};

const STARTERS = [
  "Why are my submissions pending?",
  "How do I embed a form on my website?",
  "How do I verify SMTP?",
];

function audienceFor(pathname: string): FaqAudience {
  if (pathname.startsWith("/non-dev")) return "nonDeveloper";
  if (pathname.startsWith("/developer")) return "developer";
  return "public";
}

export default function AssistantButton() {
  const pathname = usePathname();
  const toast = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages, sending]);

  useEffect(() => {
    const element = textareaRef.current;
    if (!element) return;
    element.style.height = "auto";
    element.style.height = `${Math.min(element.scrollHeight, 160)}px`;
  }, [input, isOpen]);

  const close = () => {
    setIsOpen(false);
    setInput("");
    setSending(false);
  };

  const send = async (raw: string) => {
    const question = raw.trim();
    if (!question || sending) return;

    setMessages((current) => [
      ...current,
      { id: crypto.randomUUID(), role: "user", text: question },
    ]);
    setInput("");
    setSending(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 350));
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          audience: audienceFor(pathname),
          pathname,
        }),
      });
      if (!res.ok) throw new Error("assistant");
      const data = (await res.json()) as { reply: AssistantReply };
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          text: data.reply.text,
          suggestions: data.reply.suggestions,
          href: data.reply.href,
          hrefLabel: data.reply.hrefLabel,
        },
      ]);
    } catch {
      toast.error("The assistant could not answer right now.");
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          text: "I couldn't reach the answer right now. Please try again.",
        },
      ]);
    } finally {
      setSending(false);
    }
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
          <section className="flex h-[86dvh] w-[calc(100%-1rem)] max-w-6xl flex-col overflow-hidden rounded-[28px] bg-white shadow-[0_30px_90px_-20px_rgba(0,0,0,0.35)] dark:bg-zinc-950 sm:w-5/6">
            <header className="flex flex-wrap items-center justify-between gap-3 px-5 pb-4 pt-5 sm:px-7">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-500">
                  <Icon name="Bot" size={19} />
                </span>
                <div className="grid grid-cols-1 gap-0.5">
                  <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    FormO assistant
                  </h2>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Ask about delivery, forms, SMTP and your workspace
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
                  Local answers
                </span>
                {messages.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setMessages([])}
                    className="cursor-pointer text-xs font-medium text-zinc-600 underline dark:text-zinc-300"
                  >
                    New chat
                  </button>
                )}
              </div>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-7">
              {messages.length === 0 ? (
                <div className="grid h-full content-center justify-items-center gap-5 text-center">
                  <span className="flex h-14 w-14 items-center justify-center rounded-3xl bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-500">
                    <Icon name="Bot" size={26} />
                  </span>
                  <div className="grid grid-cols-1 gap-2">
                    <h3 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                      What can I help with?
                    </h3>
                    <p className="max-w-[48ch] text-sm text-zinc-500 dark:text-zinc-400">
                      Answers come from your workspace documentation. Try one of these to start.
                    </p>
                  </div>
                  <div className="flex flex-wrap justify-center gap-2">
                    {STARTERS.map((starter) => (
                      <button
                        key={starter}
                        type="button"
                        onClick={() => void send(starter)}
                        className="cursor-pointer rounded-full bg-zinc-100 px-4 py-2 text-xs text-zinc-700 transition-colors hover:bg-zinc-200 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
                      >
                        {starter}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="mx-auto grid w-full max-w-3xl grid-cols-1 gap-5">
                  {messages.map((message) =>
                    message.role === "user" ? (
                      <div key={message.id} className="flex justify-end">
                        <p className="max-w-[80%] rounded-[22px] rounded-br-md bg-zinc-900 px-4 py-3 text-sm leading-6 text-white dark:bg-zinc-100 dark:text-zinc-900">
                          {message.text}
                        </p>
                      </div>
                    ) : (
                      <div key={message.id} className="flex items-start gap-3">
                        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-500">
                          <Icon name="Bot" size={16} />
                        </span>
                        <div className="grid min-w-0 max-w-[80%] grid-cols-1 gap-3 rounded-[22px] rounded-bl-md bg-zinc-100 px-4 py-3 dark:bg-zinc-900/70">
                          <p className="whitespace-pre-wrap text-sm leading-6 text-zinc-700 dark:text-zinc-200">
                            {message.text}
                          </p>
                          {message.href && message.hrefLabel && (
                            <Link
                              href={message.href}
                              onClick={close}
                              className="inline-flex w-fit items-center gap-1 text-sm font-medium text-zinc-900 underline dark:text-zinc-100"
                            >
                              {message.hrefLabel} <Icon name="ArrowRight" size={14} />
                            </Link>
                          )}
                          {message.suggestions && message.suggestions.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {message.suggestions.map((suggestion) => (
                                <button
                                  key={suggestion}
                                  type="button"
                                  onClick={() => void send(suggestion)}
                                  className="cursor-pointer rounded-full bg-white px-3 py-1.5 text-xs text-zinc-600 transition-colors hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
                                >
                                  {suggestion}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  )}
                  {sending && (
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-500">
                        <Icon name="Bot" size={16} />
                      </span>
                      <div className="flex items-center gap-1.5 rounded-[22px] rounded-bl-md bg-zinc-100 px-4 py-4 dark:bg-zinc-900/70">
                        {[0, 1, 2].map((dot) => (
                          <span
                            key={dot}
                            className="h-1.5 w-1.5 animate-pulse rounded-full bg-zinc-400"
                            style={{ animationDelay: `${dot * 150}ms` }}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                  <div ref={endRef} />
                </div>
              )}
            </div>

            <div className="px-5 pb-5 pt-1 sm:px-7">
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  void send(input);
                }}
                className="mx-auto w-full max-w-3xl rounded-[24px] bg-zinc-100 px-4 py-3 dark:bg-zinc-900"
              >
                <textarea
                  ref={textareaRef}
                  value={input}
                  rows={1}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      void send(input);
                    }
                  }}
                  aria-label="Message the FormO assistant"
                  placeholder="Ask FormO anything…"
                  className="max-h-40 w-full resize-none bg-transparent text-sm leading-6 text-zinc-800 outline-none placeholder:text-zinc-400 dark:text-zinc-100"
                />
                <div className="flex items-center justify-between gap-3 pt-2">
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    Enter to send · Shift + Enter for a new line
                  </p>
                  <button
                    type="submit"
                    disabled={sending || !input.trim()}
                    aria-label="Send message"
                    className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full bg-zinc-900 text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900"
                  >
                    <Icon name="Send" size={16} />
                  </button>
                </div>
              </form>
            </div>
          </section>
        </Layout>
      ) : null}
    </>
  );
}
