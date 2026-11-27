"use client";
import Link from "next/link";
import { docsPages, docsSections } from "@/lib/docs/manifest";

export default function DocsSidebar({
  activeHref,
  onNavigate,
}: {
  activeHref: string;
  onNavigate?: () => void;
}) {
  return (
    <nav aria-label="Documentation navigation" className="grid grid-cols-1 gap-7">
      {docsSections.map((section) => (
        <div key={section} className="grid grid-cols-1 gap-1">
          <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-400">
            {section}
          </p>
          {docsPages
            .filter((page) => page.section === section)
            .map((page) => {
              const active = page.href === activeHref;
              return (
                <Link
                  key={page.href}
                  href={page.href}
                  aria-current={active ? "page" : undefined}
                  onClick={onNavigate}
                  className={`rounded-r-lg border-l py-2 pl-3 pr-2 text-sm transition-colors ${
                    active
                      ? "border-amber-600 bg-zinc-100 font-medium text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100"
                      : "border-transparent text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900/50 dark:hover:text-zinc-100"
                  }`}
                >
                  {page.title}
                </Link>
              );
            })}
        </div>
      ))}
    </nav>
  );
}
