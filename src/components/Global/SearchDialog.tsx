"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "./Icon";
import { searchDocs } from "@/lib/docs/manifest";

export default function SearchDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const results = searchDocs(query).slice(0, 8);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setQuery("");
        setActive(0);
        setOpen(true);
      }
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (open) requestAnimationFrame(() => inputRef.current?.focus());
  }, [open]);

  const go = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  const show = () => {
    setQuery("");
    setActive(0);
    setOpen(true);
  };

  return (
    <>
      <button
        type="button"
        onClick={show}
        aria-label="Search documentation"
        className="flex h-9 items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-2.5 text-xs text-zinc-500 transition-colors hover:border-zinc-300 hover:text-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-400 dark:hover:text-zinc-100 sm:w-56 sm:px-3"
      >
        <Icon name="Search" size={15} className="shrink-0" />
        <span className="hidden truncate sm:inline">Search docs…</span>
        <kbd className="ml-auto hidden rounded border border-zinc-200 px-1.5 py-0.5 font-mono text-[10px] dark:border-zinc-700 sm:inline">
          ⌘K
        </kbd>
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center bg-black/50 p-4 pt-[10vh]">
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Search documentation"
            className="w-full max-w-xl overflow-hidden rounded-3xl bg-white shadow-[0_30px_90px_-20px_rgba(0,0,0,0.35)] dark:bg-zinc-950"
          >
            <div className="flex items-center gap-3 px-4 py-3">
              <Icon name="Search" size={18} className="shrink-0 text-zinc-400" />
              <input
                ref={inputRef}
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setActive(0);
                }}
                onKeyDown={(event) => {
                  if (event.key === "ArrowDown") {
                    event.preventDefault();
                    setActive((value) => Math.min(value + 1, results.length - 1));
                  }
                  if (event.key === "ArrowUp") {
                    event.preventDefault();
                    setActive((value) => Math.max(value - 1, 0));
                  }
                  if (event.key === "Enter" && results[active]) {
                    event.preventDefault();
                    go(results[active].href);
                  }
                }}
                aria-label="Search FormO documentation"
                placeholder="Search FormO docs…"
                className="min-w-0 flex-1 bg-transparent text-sm text-zinc-800 outline-none placeholder:text-zinc-400 dark:text-zinc-100"
              />
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close search"
                className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900"
              >
                <Icon name="X" size={16} />
              </button>
            </div>

            <div className="max-h-[50vh] overflow-y-auto p-2">
              {query.trim() === "" ? (
                <p className="px-3 py-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
                  Type to search guides and delivery topics.
                </p>
              ) : results.length === 0 ? (
                <p className="px-3 py-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
                  No docs match that search.
                </p>
              ) : (
                <ul className="grid grid-cols-1 gap-0.5">
                  {results.map((page, index) => (
                    <li key={page.href}>
                      <button
                        type="button"
                        onMouseEnter={() => setActive(index)}
                        onClick={() => go(page.href)}
                        className={`flex w-full cursor-pointer flex-col gap-0.5 rounded-xl px-3 py-2.5 text-left ${
                          active === index
                            ? "bg-zinc-100 dark:bg-zinc-900"
                            : "hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
                        }`}
                      >
                        <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                          {page.title}
                        </span>
                        <span className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                          {page.description}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="flex items-center justify-between px-4 py-2 text-[11px] text-zinc-400">
              <span>Powered by Devsea search</span>
              <span className="font-mono">↑↓ to navigate · ↵ to open · esc to close</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
