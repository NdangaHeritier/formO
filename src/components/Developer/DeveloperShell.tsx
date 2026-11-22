"use client";
import Link from "next/link";
import Header from "@/components/Header";
import PrivateRouter from "@/components/Global/privateRouter";
import { Icon, type LucideIconName } from "@/components/Global/Icon";
import { usePathname } from "next/navigation";
import { canManageWorkspace, useWorkspaceRole } from "@/lib/hooks/use-workspace-role";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIconName;
  adminOnly?: boolean;
};

const NAV: NavItem[] = [
  { href: "/developer", label: "Overview", icon: "LayoutDashboard" },
  { href: "/developer/projects", label: "Projects", icon: "FolderOpen" },
  { href: "/developer/forms", label: "Forms", icon: "SquareCode" },
  { href: "/developer/templates", label: "Templates", icon: "FileText" },
  { href: "/developer/analytics", label: "Analytics", icon: "ChartNoAxesColumn" },
  { href: "/developer/settings", label: "Settings", icon: "Settings", adminOnly: true },
];

const MOBILE_NAV = NAV.filter((item) => item.href !== "/developer");

const activeClass =
  "flex items-center justify-center gap-2 rounded-xl bg-zinc-100 p-2 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100";
const idleClass =
  "flex items-center justify-center gap-2 rounded-xl p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-900 dark:hover:text-zinc-200";

/** Shared app shell for developer routes: header, desktop rail, mobile tabs. */
export default function DeveloperShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const role = useWorkspaceRole();
  const canManage = canManageWorkspace(role);
  const visible = NAV.filter((item) => !item.adminOnly || canManage);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <div className="app-viewport h-dvh overflow-hidden bg-background">
      <PrivateRouter>
        <section className="flex h-full w-full flex-col text-zinc-700 dark:text-zinc-400">
          <Header />
          <div className="flex min-h-0 flex-1">
            <nav
              aria-label="Developer sections"
              className="grid grid-cols-1 h-full w-20 shrink-0 content-start overflow-y-auto border-r border-zinc-200 bg-white p-2 dark:border-zinc-800 dark:bg-zinc-950 max-md:hidden"
            >
              <div className="flex flex-col items-center justify-start gap-3 p-3">
                {visible.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-label={item.label}
                    aria-current={isActive(item.href) ? "page" : undefined}
                    className={isActive(item.href) ? activeClass : idleClass}
                  >
                    <Icon name={item.icon} size={20} strokeWidth={2} />
                  </Link>
                ))}
              </div>
            </nav>
            <div className="min-h-0 flex-1 overflow-y-auto">
              <div className="grid grid-cols-1 p-4 pb-28 sm:p-6 sm:pb-28 lg:p-10 lg:pb-10">{children}</div>
            </div>
          </div>

          <nav
            aria-label="Developer navigation"
            className="fixed bottom-4 left-1/2 z-40 flex -translate-x-1/2 items-center gap-1 rounded-2xl border border-zinc-200 bg-white/95 p-1.5 shadow-lg backdrop-blur-md md:hidden dark:border-zinc-800 dark:bg-zinc-950/95"
          >
            {MOBILE_NAV.filter((item) => !item.adminOnly || canManage).map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive(item.href) ? "page" : undefined}
                className={`flex min-w-16 flex-col items-center gap-1 rounded-xl px-3 py-2 text-[11px] font-medium transition-colors ${
                  isActive(item.href)
                    ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
                    : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-900 dark:hover:text-zinc-200"
                }`}
              >
                <Icon name={item.icon} size={18} strokeWidth={2} />
                {item.label}
              </Link>
            ))}
          </nav>
        </section>
      </PrivateRouter>
    </div>
  );
}
