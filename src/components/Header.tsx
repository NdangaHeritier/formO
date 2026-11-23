"use client";
import Image from "next/image";
import { Icon } from "./Global/Icon";
import Link from "next/link";
import LinkButton from "./Global/LinkButton";
import { signOut, useSession } from "@/lib/auth-client";
import { useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { canManageWorkspace, useWorkspaceRole } from "@/lib/hooks/use-workspace-role";
import SkeletonBox from "./skeleton";
import UserAvatar from "./Global/UserAvatar";
import Tooltip from "./Global/Tooltip";

type prop = { border?: string; py?: string };

// Change these if your auth routes are named differently.
const LOGIN_HREF = "/login";
const SIGNUP_HREF = "/signup";

const NAV_LINKS = [
    { label: "Home", href: "/#about" },
    { label: "Docs", href: "/#docs" },
    { label: "Team", href: "/#team" },
    { label: "Integrations", href: "/#integrations" },
    { label: "Career", href: "/#team" },
];

const MENU_LINKS = [
    { label: "Overview", href: "/developer", icon: "LayoutDashboard", strokeWidth: 2 },
    { label: "Projects", href: "/developer/projects", icon: "FolderOpen", strokeWidth: 2 },
    { label: "Forms", href: "/developer/forms", icon: "SquareCode", strokeWidth: 2 },
    { label: "Submissions", href: "/developer/submissions", icon: "Activity", strokeWidth: 2 },
    { label: "Templates", href: "/developer/templates", icon: "FileText", strokeWidth: 2 },
    { label: "Analytics", href: "/developer/analytics", icon: "ChartNoAxesColumn", strokeWidth: 2 },
    { label: "Settings", href: "/developer/settings", icon: "Settings", strokeWidth: 2, adminOnly: true },
] as const;

const ACCOUNT_LINKS = [
    { label: "Account settings", href: "/developer/account", icon: "User", strokeWidth: 2 },
] as const;

export default function Header({ border = "border-b", py = "py-3" }: prop) {
    // changing header links into user profile and settings if user is logged in
    // and showing login and signup if not logged in...
    const { data: session, isPending: authLoading } = useSession();
    const currentUser = session?.user ?? null;
    const isDeveloper =
        (currentUser as { interest?: string } | null)?.interest !== "non_developer";
    const [isOpeningUserMenu, setIsOpeningUserMenu] = useState(false);
    const [isNavOpen, setIsNavOpen] = useState(false);
    const mounted = useSyncExternalStore(
        () => () => { },
        () => true,
        () => false,
    );
    const router = useRouter();
    const role = useWorkspaceRole(Boolean(currentUser));
    const canManage = canManageWorkspace(role);
    const workspaceLinks = isDeveloper
        ? MENU_LINKS.filter(
            (item) => !("adminOnly" in item && item.adminOnly) || canManage
        )
        : [];

    const closeNav = () => setIsNavOpen(false);

    useEffect(() => {
        if (!isOpeningUserMenu) return;
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") setIsOpeningUserMenu(false);
        };
        const onPointerDown = (event: PointerEvent) => {
            const target = event.target as HTMLElement | null;
            if (target && !target.closest(".user-menu") && !target.closest(".user-menu-trigger")) {
                setIsOpeningUserMenu(false);
            }
        };
        document.addEventListener("keydown", onKeyDown);
        document.addEventListener("pointerdown", onPointerDown);
        return () => {
            document.removeEventListener("keydown", onKeyDown);
            document.removeEventListener("pointerdown", onPointerDown);
        };
    }, [isOpeningUserMenu]);

    const handleSignOut = async () => {
        await signOut();
        router.push(LOGIN_HREF);
        router.refresh();
        setIsOpeningUserMenu(false);
    };

    return (
        // FIX: removed `backdrop-blur-2xl`. The background is already opaque (bg-zinc-950),
        // so it had no visual effect, but backdrop-filter makes the header the containing
        // block for the `max-sm:fixed` mobile menu and breaks its positioning.
        <header className={`sticky top-0 left-0 right-0 z-40 w-full ${border} border-zinc-200 bg-white ${py} px-10 max-sm:px-5 flex items-center justify-between gap-5 dark:border-zinc-800 dark:bg-zinc-950`}>
            <div className="">
                {mounted ? (
                    <Image src="/Assets/formo-coloured.png" alt="logo" className="w-10 h-10" height="50" width="50" />
                ) : (
                    <SkeletonBox customStyle="w-10 h-10 rounded-md" />
                )}
            </div>
            <div className="links flex items-center justify-end gap-8 max-sm:gap-3 flex-1 overflow-hidden">
                {authLoading ? (
                    <div className="grid-cols-4 max-sm:grid-cols-1 gap-2 hidden sm:grid">
                        <SkeletonBox customStyle="w-20 h-6 rounded-md" shown={authLoading} />
                        <SkeletonBox customStyle="w-20 h-6 rounded-md" shown={authLoading} />
                        <SkeletonBox customStyle="w-20 h-6 rounded-md" shown={authLoading} />
                        <SkeletonBox customStyle="w-20 h-6 rounded-md" shown={authLoading} />
                    </div>
                ) : !currentUser ? (
                    <ul className={`flex items-center justify-center max-sm:flex-col max-sm:justify-start gap-5 max-sm:gap-0 max-sm:fixed max-sm:top-16 max-sm:left-0 max-sm:right-0 max-sm:bottom-0 max-sm:bg-white dark:max-sm:bg-zinc-950 max-sm:p-3 max-sm:h-[calc(100dvh-4rem)] max-sm:pb-20  ${isNavOpen ? `max-sm:visible` : `max-sm:invisible max-sm:h-0`}`}>
                        {NAV_LINKS.map((item) => (
                            <li key={item.label} className="list-item max-sm:w-full sm:px-1 max-sm:border-b max-sm:border-zinc-200 dark:max-sm:border-zinc-800 max-sm:grid max-sm:grid-cols-1">
                                {/* FIX: close the mobile menu after tapping a link */}
                                <Link href={item.href} onClick={closeNav} className="text-zinc-600 font-normal max-sm:py-4 dark:text-zinc-300 flex items-center justify-between text-[15px]">
                                    <span className="">{item.label}</span>
                                    <Icon name="ArrowRight" size={15} strokeWidth={2} className="text-zinc-400 max-sm:block hidden dark:text-zinc-500" />
                                </Link>
                            </li>
                        ))}
                        {/* Mobile-only auth buttons (desktop versions live in the ctas div below) */}
                        <li className="list-item max-sm:w-full sm:hidden sm:px-1 py-4" onClick={closeNav}>
                            {/* FIX: pointed at the login route instead of /#Career */}
                            <LinkButton href={LOGIN_HREF} variant="secondary">
                                Sign In
                            </LinkButton>
                        </li>
                        <li className="list-item max-sm:w-full sm:hidden sm:px-1" onClick={closeNav}>
                            {/* FIX: pointed at the signup route instead of /#Career */}
                            <LinkButton href={SIGNUP_HREF} variant="primary">
                                Get Started
                            </LinkButton>
                        </li>
                    </ul>
                ) : null}
                <div className="ctas flex items-center justify-center gap-3 relative">
                   

                    {/* FIX: desktop Sign In / Get Started for logged-out users (previously missing on sm+) */}
                    {!authLoading && !currentUser ? (
                        <div className="hidden sm:flex items-center justify-center gap-3">
                            <LinkButton href={LOGIN_HREF} variant="secondary">
                                Sign In
                            </LinkButton>
                            <LinkButton href={SIGNUP_HREF} variant="primary">
                                Get Started
                            </LinkButton>
                        </div>
                    ) : null}

                    {currentUser ? (
                        <>

                        <div className="hidden items-center gap-3 sm:flex">
                            {isDeveloper && (
                                <LinkButton href="/developer" variant="primary">
                                    <Icon name="Webhook" size={15} className="text-zinc-500 dark:text-zinc-400" />
                                    Get API
                                </LinkButton>
                            )}
                            {!isDeveloper && (
                                <LinkButton href="/non-dev" variant="secondary">
                                    <Icon name="Text" size={15} className="text-zinc-500 dark:text-zinc-400" />
                                    Send Emails
                                </LinkButton>
                            )}
                        </div>

                        <Tooltip label="Account menu">
                            <button
                                onClick={() => setIsOpeningUserMenu(!isOpeningUserMenu)}
                                type="button"
                                aria-label="Open account menu"
                                aria-expanded={isOpeningUserMenu}
                                className="user-menu-trigger h-10 w-10 cursor-pointer rounded-full bg-zinc-100 p-0.5 transition-colors duration-200 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700">
                                <UserAvatar
                                    src={currentUser.image}
                                    size={36}
                                    className="h-9 w-9"
                                />
                            </button>
                        </Tooltip>
                        </>
                    ) : null}

                    {isOpeningUserMenu && currentUser && mounted && typeof window !== "undefined"
                        ? createPortal(
                            <div className="user-menu fixed right-4 top-16 z-9999 flex max-h-[calc(100vh-5rem)] w-[min(20rem,calc(100vw-2rem))] flex-col gap-2 overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-3 shadow-2xl sm:right-10 dark:border-zinc-800 dark:bg-zinc-950">
                                <div className="flex items-center gap-3 border-b border-zinc-200 p-2 pb-3 dark:border-zinc-800">
                                    <UserAvatar
                                        src={currentUser.image}
                                        size={40}
                                        className="h-10 w-10 bg-zinc-200 dark:bg-zinc-800"
                                    />
                                    <div className="grid min-w-0 grid-cols-1 gap-0.5">
                                        <p className="truncate text-base font-semibold text-zinc-800 dark:text-zinc-100">
                                            {currentUser.name || currentUser.email}
                                        </p>
                                        <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">{currentUser.email}</p>
                                    </div>
                                </div>

                                <div className={`grid grid-cols-1 gap-1 ${workspaceLinks.length === 0 ? "hidden" : ""}`}>
                                    <p className="px-2 pt-1 text-[11px] font-semibold uppercase tracking-wide text-zinc-400">Workspace</p>
                                    {workspaceLinks.map((item) => (
                                        <Link
                                            key={item.label}
                                            href={item.href}
                                            onClick={() => setIsOpeningUserMenu(false)}
                                            className="flex items-center gap-2 rounded-lg p-2 text-sm text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900"
                                        >
                                            <Icon name={item.icon} strokeWidth={item.strokeWidth} size={17} />
                                            {item.label}
                                        </Link>
                                    ))}
                                </div>

                                <div className="grid grid-cols-1 gap-1 border-t border-zinc-200 pt-2 dark:border-zinc-800">
                                    <p className="px-2 text-[11px] font-semibold uppercase tracking-wide text-zinc-400">Account</p>
                                    {ACCOUNT_LINKS.map((item) => (
                                        <Link
                                            key={item.label}
                                            href={isDeveloper ? item.href : "/non-dev/account"}
                                            onClick={() => setIsOpeningUserMenu(false)}
                                            className="flex items-center gap-2 rounded-lg p-2 text-sm text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900"
                                        >
                                            <Icon name={item.icon} strokeWidth={item.strokeWidth} size={17} />
                                            {item.label}
                                        </Link>
                                    ))}
                                </div>

                                <div className="grid grid-cols-1 gap-2 border-t border-zinc-200 pt-2 dark:border-zinc-800">
                                    <button
                                        onClick={handleSignOut}
                                        className="flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-red-500/10 p-2 text-xs font-semibold text-red-600 hover:bg-red-500/20 dark:text-red-400"
                                    >
                                        Logout
                                    </button>
                                </div>
                            </div>,
                            document.body
                        )
                        : <div className="hidden" />
                    }
                </div>
            </div>
            <div className={`navbar-toogle ${currentUser ? `hidden` : `hidden max-sm:flex`}`}>
                <Tooltip label={isNavOpen ? "Close menu" : "Open menu"}>
                    <button type="button" aria-label={isNavOpen ? "Close menu" : "Open menu"} className="toggleNav rounded-md p-2 hover:bg-zinc-100 dark:hover:bg-zinc-900" onClick={() => setIsNavOpen(!isNavOpen)}>
                        <Icon name={!isNavOpen ? "PanelRightOpen" : "X"} className="cursor-pointer text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200" size={20} strokeWidth={2} />
                    </button>
                </Tooltip>
            </div>
        </header>
    );
}