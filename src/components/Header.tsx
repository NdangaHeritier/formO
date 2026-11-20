"use client";
import Image from "next/image";
import { Icon } from "./Global/Icon";
import Link from "next/link";
import LinkButton from "./Global/LinkButton";
import { signOut, useSession } from "@/lib/auth-client";
import { useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import SkeletonBox from "./skeleton";

type prop = { border?: string; py?: string };

// Change these if your auth routes are named differently.
const LOGIN_HREF = "/login";
const SIGNUP_HREF = "/signup";

const NAV_LINKS = [
    { label: "Home", href: "/#about" },
    { label: "Docs", href: "/#docs" },
    { label: "Team", href: "/#team" },
    { label: "Integrations", href: "/#integrations" },
    { label: "Career", href: "/#Career" },
];

const MENU_LINKS = [
    { label: "Profile", icon: "User", strokeWidth: undefined },
    { label: "Settings", icon: "Settings", strokeWidth: 2 },
    { label: "Projects", icon: "FolderOpen", strokeWidth: 2 },
    { label: "Submissions", icon: "GitCompare", strokeWidth: 2 },
    { label: "Integrations", icon: "GitCommit", strokeWidth: 2 },
] as const;

export default function Header({ border = "border-b", py = "py-3" }: prop) {
    // changing header links into user profile and settings if user is logged in
    // and showing login and signup if not logged in...
    const { data: session, isPending: authLoading } = useSession();
    const currentUser = session?.user ?? null;
    const [isOpeningUserMenu, setIsOpeningUserMenu] = useState(false);
    const [isNavOpen, setIsNavOpen] = useState(false);
    const mounted = useSyncExternalStore(
        () => () => { },
        () => true,
        () => false,
    );
    const router = useRouter();

    const closeNav = () => setIsNavOpen(false);

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
                    <ul className={`flex items-center justify-center max-sm:flex-col max-sm:justify-start gap-5 max-sm:gap-0 max-sm:fixed max-sm:top-16 max-sm:left-0 max-sm:right-0 max-sm:bottom-0 max-sm:bg-white dark:max-sm:bg-zinc-950 max-sm:p-3 max-sm:min-h-screen max-sm:pb-20  ${isNavOpen ? `max-sm:visible` : `max-sm:invisible max-sm:h-0`}`}>
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

                         <LinkButton href="/developer" variant="primary">
                        <Icon name="Webhook" size={15} className="text-zinc-500 max-sm:hidden dark:text-zinc-400" />
                        Get API
                    </LinkButton>
                    <LinkButton href="/non-dev" variant="secondary">
                        <Icon name="Text" size={15} className="text-zinc-500 max-sm:hidden dark:text-zinc-400" />
                        Send Emails
                    </LinkButton>

                        <button
                            onClick={() => setIsOpeningUserMenu(!isOpeningUserMenu)}
                            type="button"
                            className="h-10 w-10 cursor-pointer rounded-full bg-zinc-100 p-0.5 transition-colors duration-200 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700">
                            <Image
                                src={currentUser.image || "/Assets/Avatars/Night Landscape.png"}
                                alt=""
                                className="flex h-9 w-9 items-center justify-center rounded-full"
                                height={50}
                                width={50}
                            />
                        </button>
                        </>
                    ) : null}

                    {isOpeningUserMenu && currentUser && mounted && typeof window !== "undefined"
                        ? createPortal(
                            <div className="user-menu fixed z-9999 top-16 right-10 flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-950 shadow-2xl">
                                <div className="container-user-top-menu p-3 flex items-center justify-center gap-2">
                                    <Image
                                        src={currentUser.image || "/Assets/Avatars/Sleep Mode.png"}
                                        alt=""
                                        className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-200 dark:bg-zinc-800"
                                        height={50}
                                        width={50}
                                    />
                                    <div className="flex flex-col pt-3">
                                        <h1 className="text-lg font-semibold text-zinc-800 dark:text-zinc-200">{currentUser.name || currentUser.email}</h1>
                                        <p className="text-sm text-zinc-500 dark:text-zinc-400">{currentUser.email}</p>
                                    </div>
                                </div>

                                {/* links */}
                                <div className="links relative rounded-xl bg-zinc-100 p-2 dark:bg-zinc-900">
                                    <ul className="list-none text-sm">
                                        {MENU_LINKS.map((item) => (
                                            <li key={item.label} className="list-item">
                                                <a href="#" className="flex items-center justify-start gap-2 rounded-lg p-2 text-zinc-600 hover:bg-zinc-200 dark:text-zinc-400 dark:hover:bg-zinc-800">
                                                    <Icon name={item.icon} strokeWidth={item.strokeWidth} size={17} />
                                                    {item.label}
                                                </a>
                                            </li>
                                        ))}
                                        <li className="pt-1 grid grid-cols-2 gap-2">
                                            <button
                                                onClick={handleSignOut}
                                                className="flex cursor-pointer items-center justify-center gap-2 rounded-md bg-white p-2 font-semibold text-zinc-900 hover:bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"
                                            >
                                                <Icon name="ArrowRightLeft" strokeWidth={2} size={16} />
                                                <span className="">Switch</span>
                                            </button>
                                            <button
                                                onClick={handleSignOut}
                                                className="flex cursor-pointer items-center justify-center gap-2 rounded-md bg-red-500/10 p-2 font-semibold text-red-600 hover:bg-red-500/20 dark:text-red-400"
                                            >
                                                <span className="">Logout</span>
                                            </button>
                                        </li>
                                    </ul>
                                </div>
                            </div>,
                            document.body
                        )
                        : <div className="hidden" />
                    }
                </div>
            </div>
            <div className={`navbar-toogle ${currentUser ? `hidden` : `hidden max-sm:flex`}`}>
                <button type="button" className="toggleNav rounded-md p-2 hover:bg-zinc-100 dark:hover:bg-zinc-900" onClick={() => setIsNavOpen(!isNavOpen)}>
                    <Icon name={!isNavOpen ? "PanelRightOpen" : "X"} className="cursor-pointer text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200" size={20} strokeWidth={2} />
                </button>
            </div>
        </header>
    );
}