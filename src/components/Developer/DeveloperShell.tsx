"use client";
import Link from "next/link";
import Header from "@/components/Header";
import PrivateRouter from "@/components/Global/privateRouter";
import { Icon } from "@/components/Global/Icon";

/**
 * Shared developer shell: left icon rail + drag grip + main scrollable
 * column. Used by the Forms / Analytics / Settings routes so they match the
 * project routes' layout.
 */
export default function DeveloperShell({ children }: { children: React.ReactNode }) {
    return (
        <PrivateRouter>
            <section className="flex min-h-screen w-full flex-col text-zinc-700 dark:text-zinc-400">
                <Header />
                <div className="flex h-full flex-1">
                    <div className="sticky bottom-0 grid h-screen w-20 grid-cols-1 overflow-auto border-r border-zinc-200 bg-white p-2 dark:border-zinc-800 bg-surface">
                        <div className="items-center justify-start flex-col p-3 flex gap-3">
                            <Link href="/developer" className="flex cursor-pointer items-center justify-center gap-2 rounded-xl p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-900 dark:hover:text-zinc-200">
                                <Icon name="LayoutDashboard" size={20} strokeWidth={2} />
                            </Link>
                            <Link href="/developer/projects" className="flex cursor-pointer items-center justify-center gap-2 rounded-xl p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-900 dark:hover:text-zinc-200">
                                <Icon name="Folder" size={20} strokeWidth={2} />
                            </Link>
                            <Link href="/developer/forms" className="flex cursor-pointer items-center justify-center gap-2 rounded-xl p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-900 dark:hover:text-zinc-200">
                                <Icon name="SquareCode" size={20} strokeWidth={2} />
                            </Link>
                            <Link href="/developer/analytics" className="flex cursor-pointer items-center justify-center gap-2 rounded-xl p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-900 dark:hover:text-zinc-200">
                                <Icon name="ChartNoAxesColumn" size={20} strokeWidth={2} />
                            </Link>
                            <Link href="/developer/settings" className="flex cursor-pointer items-center justify-center gap-2 rounded-xl p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-900 dark:hover:text-zinc-200">
                                <Icon name="Settings" size={20} strokeWidth={2} />
                            </Link>
                            <Link href="/developer/templates" className="flex cursor-pointer items-center justify-center gap-2 rounded-xl p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-900 dark:hover:text-zinc-200">
                                <Icon name="Mail" size={20} strokeWidth={2} />
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
                        </div>
                    </div>
                    <div className="re-size relative h-screen">
                        <button className="absolute -left-3 top-20">
                            <Icon name="FlipHorizontal" className="flex h-6 w-6 cursor-col-resize items-center justify-center rounded-full bg-zinc-100 text-zinc-400 hover:text-zinc-700 dark:bg-zinc-900 dark:hover:text-zinc-200" />
                        </button>
                    </div>
                    <div className="flex-1 h-screen overflow-auto block">
                        <div className="p-10 grid grid-cols-1">{children}</div>
                    </div>
                </div>
            </section>
        </PrivateRouter>
    );
}
