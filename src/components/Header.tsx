"use client";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { signOut, useSession } from "@/lib/auth-client";
import { Icon } from "./Global/Icon";
import LinkButton from "./Global/LinkButton";
import SkeletonBox from "./skeleton";
import UserAvatar from "./Global/UserAvatar";
import Tooltip from "./Global/Tooltip";
import SearchDialog from "./Global/SearchDialog";
import { useAudience } from "./Header/audience-context";
import { headerConfig } from "./Header/config";

type prop = { border?: string; py?: string };

const LOGIN_HREF = "/login";
const SIGNUP_HREF = "/signup";

const NAV_LINKS = [
    { label: "Home", href: "/#about" },
    { label: "Docs", href: "/docs" },
    { label: "Team", href: "/#team" },
    { label: "Integrations", href: "/#integrations" },
    { label: "Career", href: "/#team" },
];

export default function Header({ border = "border-b", py = "py-3" }: prop) {
    const { data: session, isPending: authLoading } = useSession();
    const currentUser = session?.user ?? null;
    const router = useRouter();
    const { audience, canManage } = useAudience();
    const config = headerConfig[audience];
    const [isOpeningUserMenu, setIsOpeningUserMenu] = useState(false);
    const [isNavOpen, setIsNavOpen] = useState(false);
    const mounted = useSyncExternalStore(
        () => () => { },
        () => true,
        () => false,
    );

    const closeNav = () => setIsNavOpen(false);

    useEffect(() => {
        if (!isOpeningUserMenu) return;
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") setIsOpeningUserMenu(false);
        };
        document.addEventListener("keydown", onKeyDown);
        return () => document.removeEventListener("keydown", onKeyDown);
    }, [isOpeningUserMenu]);

    const handleSignOut = async () => {
        await signOut({
            fetchOptions: {
                onSuccess: () => {
                    setIsOpeningUserMenu(false);
                    router.push(LOGIN_HREF);
                },
            },
        });
    };

    const workspaceLinks = config.workspaceLinks.filter(
        (item) => !item.adminOnly || (audience === "developer" && canManage)
    );

    return (
        <header className={`sticky top-0 left-0 right-0 z-40 w-full ${border} border-zinc-200 bg-white ${py} px-10 max-sm:px-5 flex items-center justify-between gap-5 dark:border-zinc-900 dark:bg-zinc-950`}>
            <div className="">
                {mounted ? (
                    <span className="relative block h-10 w-10">
                        {/* Filled mark in light theme, outline mark in dark theme. */}
                        <Image src="/Assets/formo-dark.png" alt="FormO" fill sizes="40px" className="object-contain dark:opacity-0" priority />
                        <Image src="/Assets/formo.png" alt="" fill sizes="40px" className="object-contain opacity-0 dark:opacity-100" priority />
                    </span>
                ) : (
                    <SkeletonBox customStyle="w-10 h-10 rounded-md" />
                )}
            </div>
            <div className="links flex items-center justify-end gap-8 max-sm:gap-3 flex-1 overflow-hidden">
                <SearchDialog />
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
                                <Link href={item.href} onClick={closeNav} className="text-zinc-600 font-normal max-sm:py-4 dark:text-zinc-300 flex items-center justify-between text-[15px]">
                                    <span>{item.label}</span>
                                    <Icon name="ArrowRight" size={15} strokeWidth={2} className="text-zinc-400 max-sm:block hidden dark:text-zinc-500" />
                                </Link>
                            </li>
                        ))}
                        <li className="list-item max-sm:w-full sm:hidden sm:px-1 py-4" onClick={closeNav}>
                            <LinkButton href={LOGIN_HREF} variant="secondary">Sign In</LinkButton>
                        </li>
                        <li className="list-item max-sm:w-full sm:hidden sm:px-1" onClick={closeNav}>
                            <LinkButton href={SIGNUP_HREF} variant="primary">Get Started</LinkButton>
                        </li>
                    </ul>
                ) : null}

                <div className="ctas flex items-center justify-center gap-3 relative">
                    {!authLoading && !currentUser ? (
                        <div className="hidden sm:flex items-center justify-center gap-3">
                            <LinkButton href={LOGIN_HREF} variant="secondary">Sign In</LinkButton>
                            <LinkButton href={SIGNUP_HREF} variant="primary">Get Started</LinkButton>
                        </div>
                    ) : null}

                    {currentUser ? (
                        <>
                            <div className="hidden items-center gap-3 sm:flex">
                                {config.ctas.map((cta) => (
                                    <LinkButton key={cta.label} href={cta.href} variant={cta.variant}>
                                        <Icon name={cta.icon} size={15} className="text-zinc-500 dark:text-zinc-400" />
                                        {cta.label}
                                    </LinkButton>
                                ))}
                            </div>

                            <Tooltip label="Account menu">
                                <button
                                    onClick={() => setIsOpeningUserMenu(!isOpeningUserMenu)}
                                    type="button"
                                    aria-label="Open account menu"
                                    aria-expanded={isOpeningUserMenu}
                                    className="user-menu-trigger h-10 w-10 cursor-pointer rounded-full bg-zinc-100 p-0.5 transition-colors duration-200 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700">
                                    <UserAvatar src={currentUser.image} size={36} className="h-9 w-9" />
                                </button>
                            </Tooltip>
                        </>
                    ) : null}

                    {isOpeningUserMenu && currentUser && mounted && typeof window !== "undefined"
                        ? createPortal(
                            <div className="user-menu fixed right-4 top-16 z-9999 flex max-h-[calc(100vh-5rem)] w-[min(20rem,calc(100vw-2rem))] flex-col gap-2 overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-3 shadow-2xl sm:right-10 dark:border-zinc-800 dark:bg-zinc-950">
                                <div className="flex items-center gap-3 border-b border-zinc-200 p-2 pb-3 dark:border-zinc-800">
                                    <UserAvatar src={currentUser.image} size={40} className="h-10 w-10 bg-zinc-200 dark:bg-zinc-800" />
                                    <div className="grid min-w-0 grid-cols-1 gap-0.5">
                                        <p className="truncate text-base font-semibold text-zinc-800 dark:text-zinc-100">
                                            {currentUser.name || currentUser.email}
                                        </p>
                                        <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">{currentUser.email}</p>
                                    </div>
                                </div>

                                {workspaceLinks.length > 0 && (
                                    <div className="grid grid-cols-1 gap-1">
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
                                )}

                                {config.accountSettingsHref && (
                                    <div className="grid grid-cols-1 gap-1 border-t border-zinc-200 pt-2 dark:border-zinc-800">
                                        <p className="px-2 text-[11px] font-semibold uppercase tracking-wide text-zinc-400">Account</p>
                                        <Link
                                            href={config.accountSettingsHref}
                                            onClick={() => setIsOpeningUserMenu(false)}
                                            className="flex items-center gap-2 rounded-lg p-2 text-sm text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900"
                                        >
                                            <Icon name="User" strokeWidth={2} size={17} />
                                            Account settings
                                        </Link>
                                    </div>
                                )}

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
