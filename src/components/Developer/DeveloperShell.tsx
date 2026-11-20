"use client";
import Link from "next/link";
import Image from "next/image";
import Header from "@/components/Header";
import PrivateRouter from "@/components/Global/privateRouter";
import { Icon } from "@/components/Global/Icon";

/**
 * Shared app shell for developer routes: a fixed-height viewport, the header,
 * a left icon rail, and a single scrollable content column.
 *
 * The `app-viewport` marker tells the root layout's CSS to drop the marketing
 * footer and lock document scrolling for these routes. Without it the footer
 * pushes the shell below the fold and the page gets a second scrollbar.
 */
export default function DeveloperShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-viewport h-dvh overflow-hidden bg-background">
      <PrivateRouter>
        <section className="flex h-full w-full flex-col text-zinc-700 dark:text-zinc-400">
          <Header />
          <div className="flex min-h-0 flex-1">
            <div className="grid grid-cols-1 h-full w-20 shrink-0 overflow-y-auto border-r border-zinc-200 bg-white p-2 dark:border-zinc-800 dark:bg-zinc-950">
              <div className="flex flex-col items-center justify-start gap-3 p-3">
                <Link href="/developer/projects" className="flex cursor-pointer items-center justify-center gap-2 rounded-xl p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-900 dark:hover:text-zinc-200">
                  <Icon name="LayoutDashboard" size={20} strokeWidth={2} />
                </Link>
                <Link href="/developer/analytics" className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200">
                  <Icon name="ChartNoAxesColumn" size={20} strokeWidth={2} />
                </Link>
              </div>
              <div className="flex h-full flex-col items-center justify-end gap-2 self-end p-2">
                <button className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-zinc-100 text-zinc-500 hover:bg-zinc-200 hover:text-zinc-900 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100">
                  <Icon name="Plus" strokeWidth={2} size={22} />
                </button>
                <button className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-zinc-100 text-zinc-500 hover:bg-zinc-200 hover:text-zinc-900 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100">
                  <Icon name="FolderOpen" strokeWidth={2} size={22} />
                </button>
                <button className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-zinc-100 text-zinc-500 hover:bg-zinc-200 hover:text-zinc-900 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100">
                  <Icon name="Bolt" strokeWidth={2} size={22} />
                </button>
                <button className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800">
                  <Image
                    src="/Assets/Avatars/Sleep Mode.png"
                    alt=""
                    width={60}
                    height={60}
                    className="rounded-full"
                  />
                </button>
              </div>
            </div>
            <div className="re-size relative h-full shrink-0">
              <button className="absolute -left-3 top-20">
                <Icon name="FlipHorizontal" className="flex h-6 w-6 cursor-col-resize items-center justify-center rounded-full bg-transparent text-zinc-400 hover:text-zinc-700 dark:bg-zinc-900 dark:hover:text-zinc-200" />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">
              <div className="grid grid-cols-1 p-10">{children}</div>
            </div>
          </div>
        </section>
      </PrivateRouter>
    </div>
  );
}
