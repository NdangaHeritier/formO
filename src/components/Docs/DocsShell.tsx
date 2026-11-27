"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import Header from "@/components/Header";
import { Icon } from "@/components/Global/Icon";
import DocsSidebar from "./DocsSidebar";
import PrevNext from "./PrevNext";
import type { DocsPage } from "@/lib/docs/manifest";

export default function DocsShell({
  page,
  children,
}: {
  page: DocsPage;
  children: React.ReactNode;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [menuOpen]);

  return (
    <div className="min-h-dvh bg-white text-zinc-700 dark:bg-zinc-950 dark:text-zinc-300">
      <Header />
      <div className="flex h-11 items-center gap-2 border-b border-zinc-200 px-4 dark:border-zinc-800 lg:hidden">
        <button
          type="button"
          aria-label="Open documentation menu"
          onClick={() => setMenuOpen(true)}
          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900"
        >
          <Icon name="Menu" size={18} />
        </button>
        <span className="text-xs font-medium text-zinc-700 dark:text-zinc-200">Documentation</span>
      </div>

      {menuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close documentation menu"
            onClick={() => setMenuOpen(false)}
            className="absolute inset-0 cursor-pointer bg-black/50"
          />
          <div className="absolute inset-y-0 left-0 w-72 max-w-[85vw] overflow-y-auto border-r border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
            <DocsSidebar activeHref={page.href} onNavigate={() => setMenuOpen(false)} />
          </div>
        </div>
      )}

      <div className="mx-auto flex w-full max-w-[1600px]">
        <aside className="sticky top-14 hidden h-[calc(100dvh-3.5rem)] w-64 shrink-0 overflow-y-auto border-r border-zinc-200 px-4 py-8 dark:border-zinc-800 lg:block">
          <DocsSidebar activeHref={page.href} />
        </aside>

        <main className="min-w-0 flex-1 px-5 py-10 sm:px-8 xl:px-12">
          <div className="mx-auto w-full max-w-3xl">
            <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-xs text-zinc-400">
              <Link href="/docs" className="hover:text-zinc-700 dark:hover:text-zinc-200">Docs</Link>
              <span>/</span>
              <span>{page.section}</span>
              <span>/</span>
              <span className="text-zinc-600 dark:text-zinc-300">{page.title}</span>
            </nav>
            <h1 className="mt-6 text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-4xl">
              {page.title}
            </h1>
            <p className="mt-3 max-w-[62ch] text-base leading-7 text-zinc-600 dark:text-zinc-400">
              {page.description}
            </p>
            <div className="mt-10">{children}</div>
            <PrevNext href={page.href} />
          </div>
        </main>

        <aside className="sticky top-14 hidden h-[calc(100dvh-3.5rem)] w-56 shrink-0 overflow-y-auto px-4 py-10 xl:block">
          <p className="pb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-400">
            On this page
          </p>
          <ul className="grid grid-cols-1 gap-2">
            {page.headings.map((heading) => (
              <li key={heading.id}>
                <a
                  href={`#${heading.id}`}
                  className="block text-sm text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                >
                  {heading.label}
                </a>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </div>
  );
}
