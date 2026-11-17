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
            <section className="flex flex-col min-h-screen w-full text-zinc-400">
                <Header />
                <div className="flex h-full flex-1">
                    <div className="grid grid-cols-1 sticky bottom-0 p-2 bg-zinc-950 w-20 h-screen overflow-auto border-r border-zinc-800">
                        <div className="items-center justify-start flex-col p-3 flex gap-3">
                            <Link href="/developer" className="text-zinc-500 hover:text-zinc-300 rounded-xl p-2 flex items-center justify-center cursor-pointer gap-2 hover:bg-zinc-900">
                                <Icon name="LayoutDashboard" size={20} strokeWidth={2} />
                            </Link>
                            <Link href="/developer/projects" className="text-zinc-500 hover:text-zinc-300 rounded-xl p-2 flex items-center justify-center cursor-pointer gap-2 hover:bg-zinc-900">
                                <Icon name="Folder" size={20} strokeWidth={2} />
                            </Link>
                            <Link href="/developer/forms" className="text-zinc-500 hover:text-zinc-300 rounded-xl p-2 flex items-center justify-center cursor-pointer gap-2 hover:bg-zinc-900">
                                <Icon name="SquareCode" size={20} strokeWidth={2} />
                            </Link>
                            <Link href="/developer/analytics" className="text-zinc-500 hover:text-zinc-300 rounded-xl p-2 flex items-center justify-center cursor-pointer gap-2 hover:bg-zinc-900">
                                <Icon name="ChartNoAxesColumn" size={20} strokeWidth={2} />
                            </Link>
                            <Link href="/developer/settings" className="text-zinc-500 hover:text-zinc-300 rounded-xl p-2 flex items-center justify-center cursor-pointer gap-2 hover:bg-zinc-900">
                                <Icon name="Settings" size={20} strokeWidth={2} />
                            </Link>
                        </div>
                        <div className="flex self-end items-center justify-end flex-col gap-3 p-3 h-full rounded-full bg-black">
                            <button className="bg-zinc-900/60 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 rounded-full flex h-12 w-12 flex items-center justify-center cursor-pointer">
                                <Icon name="Plus" strokeWidth={2} size={22} />
                            </button>
                            <button className="bg-zinc-900/60 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 rounded-full flex h-12 w-12 flex items-center justify-center cursor-pointer">
                                <Icon name="FolderOpen" strokeWidth={2} size={22} />
                            </button>
                            <button className="bg-zinc-900/60 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 rounded-full flex h-12 w-12 flex items-center justify-center cursor-pointer">
                                <Icon name="Bolt" strokeWidth={2} size={22} />
                            </button>
                        </div>
                    </div>
                    <div className="re-size relative h-screen">
                        <button className="absolute top-20 -left-3">
                            <Icon name="FlipHorizontal" className="h-6 w-6 p-1 flex items-center justify-center rounded-full bg-black border border-zinc-800 text-zinc-500 hover:text-zinc-300 cursor-col-resize" />
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
