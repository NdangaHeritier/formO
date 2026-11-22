"use client";
import Link from "next/link";
import Header from "@/components/Header";
import PrivateRouter from "@/components/Global/privateRouter";
import { Icon } from "@/components/Global/Icon";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import UserAvatar from "@/components/Global/UserAvatar";
import { useState } from "react";
import NewDeveloperForm from "@/components/Developer/Modals/Forms/NewDeveloper";

const MOBILE_NAV = [
  { href: "/developer/projects", label: "Projects", icon: "FolderOpen" },
  { href: "/developer/forms", label: "Forms", icon: "SquareCode" },
  { href: "/developer/analytics", label: "Analytics", icon: "ChartNoAxesColumn" },
  { href: "/developer/settings", label: "Settings", icon: "Settings" },
] as const;

/**
 * Shared app shell for developer routes: a fixed-height viewport, the header,
 * a left icon rail on desktop, and a floating bottom tab bar on phones.
 */
export default function DeveloperShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const [createProjectOpen, setCreateProjectOpen] = useState(false);

  // When the user is inside a project, the new-form modal is scoped to it.
  const projectSlug = pathname.match(/^\/developer\/projects\/([^/]+)/)?.[1];
  const newFormHref = `/developer/forms?new=project${
    projectSlug ? `&project_name=${encodeURIComponent(projectSlug)}` : ""
  }`;

  return (
    <div className="app-viewport h-dvh overflow-hidden bg-background">
      <PrivateRouter>
        <section className="flex h-full w-full flex-col text-zinc-700 dark:text-zinc-400">
          <Header />
          {createProjectOpen && (
            <NewDeveloperForm onClick={() => setCreateProjectOpen(false)} />
          )}
          <div className="flex min-h-0 flex-1">
            <div className="grid grid-cols-1 h-full w-20 shrink-0 overflow-y-auto border-r border-zinc-200 bg-white p-2 dark:border-zinc-800 dark:bg-zinc-950 max-md:hidden">
              <div className="flex flex-col items-center justify-start gap-3 p-3">
                <Link href="/developer/projects" className="flex cursor-pointer items-center justify-center gap-2 rounded-xl p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-900 dark:hover:text-zinc-200">
                  <Icon name="LayoutDashboard" size={20} strokeWidth={2} />
                </Link>
                <Link href="/developer/analytics" className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200">
                  <Icon name="ChartNoAxesColumn" size={20} strokeWidth={2} />
                </Link>
              </div>
              <div className="flex h-full flex-col items-center justify-end gap-2 self-end p-2">
                <button
                  type="button"
                  aria-label="Create form"
                  onClick={() => router.push(newFormHref)}
                  className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-zinc-100 text-zinc-500 hover:bg-zinc-200 hover:text-zinc-900 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                >
                  <Icon name="Plus" strokeWidth={2} size={22} />
                </button>
                <button
                  type="button"
                  aria-label="Create project"
                  onClick={() => setCreateProjectOpen(true)}
                  className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-zinc-100 text-zinc-500 hover:bg-zinc-200 hover:text-zinc-900 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                >
                  <Icon name="FolderOpen" strokeWidth={2} size={22} />
                </button>
                <button
                  type="button"
                  aria-label="Settings"
                  onClick={() => router.push("/developer/settings")}
                  className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-zinc-100 text-zinc-500 hover:bg-zinc-200 hover:text-zinc-900 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                >
                  <Icon name="Bolt" strokeWidth={2} size={22} />
                </button>
                <button
                  type="button"
                  aria-label="Account settings"
                  onClick={() => router.push("/developer/account")}
                  className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800"
                >
                  <UserAvatar
                    src={session?.user?.image}
                    size={44}
                    className="h-11 w-11"
                  />
                </button>
              </div>
            </div>
            <div className="re-size relative h-full w-6 shrink-0 max-lg:hidden">
              <button className="absolute -left-3 top-20">
                <Icon name="FlipHorizontal" className="flex h-6 w-6 cursor-col-resize items-center justify-center rounded-full bg-transparent text-zinc-400 hover:text-zinc-700 dark:bg-zinc-900 dark:hover:text-zinc-200" />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">
              <div className="grid grid-cols-1 p-4 pb-28 sm:p-6 sm:pb-28 lg:p-10 lg:pb-10">{children}</div>
            </div>
          </div>

          <nav
            aria-label="Developer navigation"
            className="fixed bottom-4 left-1/2 z-40 flex -translate-x-1/2 items-center gap-1 rounded-2xl border border-zinc-200 bg-white/95 p-1.5 shadow-lg backdrop-blur-md md:hidden dark:border-zinc-800 dark:bg-zinc-950/95"
          >
            {MOBILE_NAV.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`flex min-w-16 flex-col items-center gap-1 rounded-xl px-3 py-2 text-[11px] font-medium transition-colors ${
                    active
                      ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
                      : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-900 dark:hover:text-zinc-200"
                  }`}
                >
                  <Icon name={item.icon} size={18} strokeWidth={2} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </section>
      </PrivateRouter>
    </div>
  );
}
