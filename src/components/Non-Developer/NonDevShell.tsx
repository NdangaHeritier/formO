"use client";
import Link from "next/link";
import Header from "@/components/Header";
import PrivateRouter from "@/components/Global/privateRouter";
import { Icon } from "@/components/Global/Icon";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import UserAvatar from "@/components/Global/UserAvatar";
import Tooltip from "@/components/Global/Tooltip";

const MOBILE_NAV = [
  { href: "/non-dev", label: "Overview", icon: "LayoutDashboard" },
  { href: "/non-dev/contacts", label: "Contacts", icon: "Users" },
  { href: "/non-dev/lists", label: "Lists", icon: "List" },
  { href: "/non-dev/messages", label: "Messages", icon: "Mail" },
  { href: "/non-dev/analytics", label: "Analytics", icon: "ChartNoAxesColumn" },
  { href: "/non-dev/compose", label: "Compose", icon: "Plus" },
] as const;

/**
 * Shared app shell for non-developer routes. Geometry, styling and behaviour
 * mirror DeveloperShell; only the destinations and actions differ.
 */
export default function NonDevShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();

  return (
    <div className="app-viewport h-dvh overflow-hidden bg-background">
      <PrivateRouter>
        <section className="flex h-full w-full flex-col text-zinc-700 dark:text-zinc-400">
          <Header />
          <div className="flex min-h-0 flex-1">
            <div className="grid grid-cols-1 h-full w-20 shrink-0 overflow-y-auto border-r border-zinc-200 bg-white p-2 dark:border-zinc-800 dark:bg-zinc-950 max-md:hidden">
              <div className="flex flex-col items-center justify-start gap-3 p-3">
                <Tooltip label="Overview" placement="right">
                  <Link href="/non-dev" aria-label="Overview" className="flex cursor-pointer items-center justify-center gap-2 rounded-xl p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-900 dark:hover:text-zinc-200">
                    <Icon name="LayoutDashboard" size={20} strokeWidth={2} />
                  </Link>
                </Tooltip>
                <Tooltip label="Messages" placement="right">
                  <Link href="/non-dev/messages" aria-label="Messages" className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200">
                    <Icon name="Mail" size={20} strokeWidth={2} />
                  </Link>
                </Tooltip>
                <Tooltip label="Analytics" placement="right">
                  <Link href="/non-dev/analytics" aria-label="Analytics" className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200">
                    <Icon name="ChartNoAxesColumn" size={20} strokeWidth={2} />
                  </Link>
                </Tooltip>
              </div>
              <div className="flex h-full flex-col items-center justify-end gap-2 self-end p-2">
                <Tooltip label="Compose message" placement="right">
                  <button
                    type="button"
                    aria-label="Compose message"
                    onClick={() => router.push("/non-dev/compose")}
                    className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-zinc-100 text-zinc-500 hover:bg-zinc-200 hover:text-zinc-900 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                  >
                    <Icon name="Plus" strokeWidth={2} size={22} />
                  </button>
                </Tooltip>
                <Tooltip label="Contacts" placement="right">
                  <button
                    type="button"
                    aria-label="Contacts"
                    onClick={() => router.push("/non-dev/contacts")}
                    className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-zinc-100 text-zinc-500 hover:bg-zinc-200 hover:text-zinc-900 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                  >
                    <Icon name="Users" strokeWidth={2} size={22} />
                  </button>
                </Tooltip>
                <Tooltip label="Lists" placement="right">
                  <button
                    type="button"
                    aria-label="Lists"
                    onClick={() => router.push("/non-dev/lists")}
                    className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-zinc-100 text-zinc-500 hover:bg-zinc-200 hover:text-zinc-900 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                  >
                    <Icon name="List" strokeWidth={2} size={22} />
                  </button>
                </Tooltip>
                <Tooltip label="Account settings" placement="right">
                  <button
                    type="button"
                    aria-label="Account settings"
                    onClick={() => router.push("/non-dev/account")}
                    className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800"
                  >
                    <UserAvatar
                      src={session?.user?.image}
                      size={44}
                      className="h-11 w-11"
                    />
                  </button>
                </Tooltip>
              </div>
            </div>
            <div className="re-size relative h-full w-6 shrink-0 max-lg:hidden">
              <Tooltip label="Resize panel" placement="right">
                <button type="button" aria-label="Resize panel" className="absolute -left-3 top-20">
                  <Icon name="FlipHorizontal" className="flex h-6 w-6 cursor-col-resize items-center justify-center rounded-full bg-transparent text-zinc-400 hover:text-zinc-700 dark:bg-zinc-900 dark:hover:text-zinc-200" />
                </button>
              </Tooltip>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">
              <div key={pathname} className="page-enter grid grid-cols-1 p-4 pb-32 sm:p-6 sm:pb-32 lg:p-10 lg:pb-10">{children}</div>
            </div>
          </div>

          <nav
            aria-label="Non-developer navigation"
            className="fixed bottom-3 left-1/2 z-40 flex w-[calc(100%-1.5rem)] max-w-lg -translate-x-1/2 items-stretch justify-between gap-1 rounded-3xl border border-zinc-200 bg-white/95 p-2 shadow-xl backdrop-blur-md md:hidden dark:border-zinc-800 dark:bg-zinc-950/95"
          >
            {MOBILE_NAV.map((item) => {
              const active =
                item.href === "/non-dev"
                  ? pathname === "/non-dev"
                  : pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-label={item.label}
                  aria-current={active ? "page" : undefined}
                  className={`group flex min-w-0 flex-1 flex-col items-center gap-1 rounded-2xl px-1 py-2.5 text-[11px] font-semibold transition-all duration-300 ease-out active:scale-95 ${
                    active
                      ? "scale-[1.03] bg-zinc-900 text-white shadow-md dark:bg-zinc-100 dark:text-zinc-900"
                      : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100"
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
          </nav>
        </section>
      </PrivateRouter>
    </div>
  );
}
