"use client";
import Link from "next/link";
import Header from "@/components/Header";
import PrivateRouter from "@/components/Global/privateRouter";
import { Icon } from "@/components/Global/Icon";
import Tooltip from "@/components/Global/Tooltip";
import { usePathname, useRouter } from "next/navigation";

const NAV = [
  { href: "/non-dev", label: "Overview", icon: "LayoutDashboard" },
  { href: "/non-dev/contacts", label: "Contacts", icon: "Users" },
  { href: "/non-dev/lists", label: "Lists", icon: "List" },
  { href: "/non-dev/messages", label: "Messages", icon: "Mail" },
  { href: "/non-dev/analytics", label: "Analytics", icon: "ChartNoAxesColumn" },
] as const;

/**
 * Shared app shell for non-developer routes: the same header and workbench
 * geometry as the developer shell, but without endpoints, keys or SMTP.
 */
export default function NonDevShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const isActive = (href: string) =>
    href === "/non-dev" ? pathname === "/non-dev" : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <div className="app-viewport h-dvh overflow-hidden bg-background">
      <PrivateRouter>
        <section className="flex h-full w-full flex-col text-zinc-700 dark:text-zinc-400">
          <Header />
          <div className="flex min-h-0 flex-1">
            <aside className="grid h-full w-20 shrink-0 grid-cols-1 justify-between overflow-y-auto border-r border-zinc-200 bg-white p-2 dark:border-zinc-800 dark:bg-zinc-950 max-md:hidden">
              <div className="flex flex-col items-center gap-3 p-3">
                {NAV.map((item) => {
                  const active = isActive(item.href);
                  return (
                    <Tooltip key={item.href} label={item.label} placement="right">
                      <Link
                        href={item.href}
                        aria-label={item.label}
                        aria-current={active ? "page" : undefined}
                        className={`flex h-11 w-11 items-center justify-center rounded-xl transition-colors ${
                          active
                            ? "bg-zinc-200 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
                            : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-900 dark:hover:text-zinc-200"
                        }`}
                      >
                        <Icon name={item.icon} size={20} strokeWidth={2} />
                      </Link>
                    </Tooltip>
                  );
                })}
              </div>
              <div className="flex flex-col items-center p-2">
                <Tooltip label="Compose message" placement="right">
                  <button
                    type="button"
                    aria-label="Compose message"
                    onClick={() => router.push("/non-dev/compose")}
                    className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-zinc-100 text-zinc-500 hover:bg-zinc-200 hover:text-zinc-900 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                  >
                    <Icon name="Plus" size={22} strokeWidth={2} />
                  </button>
                </Tooltip>
              </div>
            </aside>
            <div className="min-h-0 flex-1 overflow-y-auto">
              <div key={pathname} className="page-enter grid grid-cols-1 p-4 pb-32 sm:p-6 sm:pb-32 lg:p-10 lg:pb-10">
                {children}
              </div>
            </div>
          </div>

          <nav
            aria-label="Workspace navigation"
            className="fixed bottom-3 left-1/2 z-40 flex w-[calc(100%-1.5rem)] max-w-lg -translate-x-1/2 items-stretch justify-between gap-1 rounded-3xl border border-zinc-200 bg-white/95 p-2 shadow-xl backdrop-blur-md md:hidden dark:border-zinc-800 dark:bg-zinc-950/95"
          >
            {NAV.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-label={item.label}
                  aria-current={active ? "page" : undefined}
                  className={`group flex min-w-0 flex-1 flex-col items-center gap-1 rounded-2xl px-1 py-2.5 text-[11px] font-semibold transition-all duration-300 ease-out active:scale-95 ${
                    active
                      ? "bg-zinc-200/70 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
                      : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-200"
                  }`}
                >
                  <span
                    className={`transition-transform duration-300 ease-out ${
                      active ? "-translate-y-0.5 scale-110" : "group-hover:scale-105"
                    }`}
                  >
                    <Icon name={item.icon} size={20} strokeWidth={active ? 2.4 : 2} />
                  </span>
                  <span className="w-full truncate text-center">{item.label}</span>
                </Link>
              );
            })}
            <button
              type="button"
              aria-label="Compose message"
              onClick={() => router.push("/non-dev/compose")}
              className="flex min-w-0 flex-1 cursor-pointer flex-col items-center gap-1 rounded-2xl px-1 py-2.5 text-[11px] font-semibold text-zinc-500 transition-all duration-300 ease-out active:scale-95 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-200"
            >
              <Icon name="Plus" size={20} strokeWidth={2} />
              <span className="w-full truncate text-center">Compose</span>
            </button>
          </nav>
        </section>
      </PrivateRouter>
    </div>
  );
}
