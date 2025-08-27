"use client";
import Image from "next/image";
import { Icon } from "./Global/Icon";
import Link from "next/link";
import LinkButton from "./Global/LinkButton";
import { useAuth } from "@/lib/Auth_context";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import SkeletonBox from "./skeleton"
type prop={border?: string; py?: string};
export default function Header({border="border-b", py="py-3"}:prop) {

    // changing header links into user profile and settings if user is logged in
    // and showing login and signup if not logged in...
    const { currentUser, signout, authLoading } = useAuth();
    const [isOpeningUserMenu, setIsOpeningUserMenu] = useState(false)
    const [isNavOpen, setIsNavOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const router = useRouter();

    useEffect(() => {
        setMounted(true);
    }, [currentUser, authLoading, signout]);

  return (
    <header className={`w-full sticky top-0 left-0 right-0 z-40 ${border} border-zinc-800 ${py} px-10 max-sm:px-5 flex items-center justify-between gap-5 bg-zinc-950 bg-zinc-50 backdrop-blur-2xl`}>
        <div className="">
            {mounted ? (
                <Image src="/Assets/formo-coloured.png" alt="logo" className="w-10 h-10" height="50" width="50" />
            ):(
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
                <ul className={`flex items-center justify-center max-sm:flex-col max-sm:justify-start gap-5 max-sm:gap-0 max-sm:fixed max-sm:top-16 max-sm:left-0 max-sm:right-0 max-sm:bottom-0 max-sm:bg-zinc-950 max-sm:p-3 max-sm:min-h-screen max-sm:pb-20 ${isNavOpen ? `max-sm:visible` : `max-sm:invisible max-sm:h-0`}`}>
                    <li className="list-item max-sm:w-full sm:px-1 max-sm:border-b max-sm:border-zinc-800 max-sm:grid max-sm:grid-cols-1">
                        <Link href="/#about" className="text-zinc-400 font-medium max-sm:py-4 flex items-center justify-between">
                            <span className="">Home</span>
                            <Icon name="ArrowRight" size={15} strokeWidth={2} className="text-zinc-500 max-sm:block hidden" />
                        </Link>
                    </li>
                    <li className="list-item max-sm:w-full sm:px-1 max-sm:border-b max-sm:border-zinc-800 max-sm:grid max-sm:grid-cols-1">
                        <Link href="/#docs" className="text-zinc-400 font-medium max-sm:py-4 flex items-center justify-between">
                            <span className="">Docs</span>
                            <Icon name="ArrowRight" size={15} strokeWidth={2} className="text-zinc-500 max-sm:block hidden" />
                        </Link>
                    </li>
                    <li className="list-item max-sm:w-full sm:px-1 max-sm:border-b max-sm:border-zinc-800 max-sm:grid max-sm:grid-cols-1">
                        <Link href="/#team" className="text-zinc-400 font-medium max-sm:py-4 flex items-center justify-between">
                            <span className="">Team</span>
                            <Icon name="ArrowRight" size={15} strokeWidth={2} className="text-zinc-500 max-sm:block hidden" />
                        </Link>
                    </li>
                    <li className="list-item max-sm:w-full sm:px-1 max-sm:border-b max-sm:border-zinc-800 max-sm:grid max-sm:grid-cols-1">
                        <Link href="/#integrations" className="text-zinc-400 font-medium max-sm:py-4 flex items-center justify-between">
                            <span className="">Integrations</span>
                            <Icon name="ArrowRight" size={15} strokeWidth={2} className="text-zinc-500 max-sm:block hidden" />
                        </Link>
                    </li>
                    <li className="list-item max-sm:w-full sm:px-1 max-sm:border-b max-sm:border-zinc-800 max-sm:grid max-sm:grid-cols-1">
                        <Link href="/#Career" className="text-zinc-400 font-medium max-sm:py-4 flex items-center justify-between">
                            <span className="">Career</span>
                            <Icon name="ArrowRight" size={15} strokeWidth={2} className="text-zinc-500 max-sm:block hidden" />
                        </Link>
                    </li>
                    <li className="list-item max-sm:w-full sm:hidden sm:px-1 py-4">
                        <LinkButton href="/#Career" variant="secondary">
                            Sign In
                        </LinkButton>
                    </li>
                    <li className="list-item max-sm:w-full sm:hidden sm:px-1">
                        <LinkButton href="/#Career" variant="primary">
                            Get Started
                        </LinkButton>
                    </li>
                </ul>
            ) : `` }
            <div className="ctas flex items-center justify-center gap-3 relative">
                <LinkButton href="/developer" variant="primary">
                    <Icon name="Webhook" size={15} className="text-zinc-300 dark:text-zinc-700 max-sm:hidden" />
                    Get API
                </LinkButton>
                <LinkButton href="/non-dev" variant="secondary">
                    <Icon name="Text" size={15} className="text-zinc-300 max-sm:hidden" />
                    Send Emails
                </LinkButton>
                {currentUser ? (
                    <button
                        onClick={() => setIsOpeningUserMenu(!isOpeningUserMenu)}
                        type="button"
                        className="h-10 w-10 cursor-pointer bg-violet-500/20 p-0.5 rounded-full hover:bg-violet-200/30 dark:hover:bg-violet-800/30 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-zinc-300 dark:focus:ring-zinc-800">
                        <Image
                            src={currentUser.photoURL || "/Assets/Avatars/Night Landscape.png"}
                            alt=""
                            className="h-9 w-9 focus:border border-zinc-700 dark:hover:bg-zinc-800 rounded-full transition-colors duration-300 flex items-center justify-center"
                            height={50}
                            width={50}
                        />
                    </button>
                ) : ``}

                {isOpeningUserMenu && currentUser && mounted && typeof window !== "undefined"
                  ? createPortal(
                      <div className="user-menu fixed z-[9999] top-16 right-10 bg-white dark:bg-zinc-900 border border-zinc-200 shadow dark:border-zinc-800 rounded-xl shadow-lg p-3 flex flex-col gap-3">
                        <div className="container-user-top-menu p-3 flex items-center justify-center gap-2">
                            <Image
                                src={currentUser.photoURL || "/Assets/Avatars/Sleep Mode.png"}
                                alt=""
                                className="h-10 w-10 rounded-full bg-zinc-300 dark:bg-zinc-800 flex items-center justify-center"
                                height={50}
                                width={50}
                            />
                            <div className="flex flex-col pt-3">
                                <h1 className="text-lg font-semibold text-zinc-800 dark:text-zinc-200">{currentUser.displayName || currentUser.email}</h1>
                                <p className="text-sm text-zinc-500 dark:text-zinc-400">{currentUser.email}</p>
                            </div>
                        </div>

                        {/* links */}
                        <div className="links relative rounded-xl bg-zinc-950 p-2">
                            <ul className="list-none text-sm">
                                <li className="list-item">
                                    <a href="#" className="text-zinc-500 p-2 rounded-lg hover:text-zinc-400 flex items-center justify-start gap-2 hover:bg-zinc-900">
                                        <Icon name="User" size={17} />
                                        Profile
                                    </a>
                                </li>
                                <li className="list-item">
                                    <a href="#" className="text-zinc-500 p-2 rounded-lg hover:text-zinc-400 flex items-center justify-start gap-2 hover:bg-zinc-900">
                                        <Icon name="Settings" strokeWidth={2} size={17} />
                                        Settings
                                    </a>
                                </li>
                                <li className="list-item">
                                    <a href="#" className="text-zinc-500 p-2 rounded-lg hover:text-zinc-400 flex items-center justify-start gap-2 hover:bg-zinc-900">
                                        <Icon name="FolderOpen" strokeWidth={2} size={17} />
                                        Projects
                                    </a>
                                </li>
                                <li className="list-item">
                                    <a href="#" className="text-zinc-500 p-2 rounded-lg hover:text-zinc-400 flex items-center justify-start gap-2 hover:bg-zinc-900">
                                        <Icon name="GitCompare" strokeWidth={2} size={17} />
                                        Submissions
                                    </a>
                                </li>
                                <li className="list-item">
                                    <a href="#" className="text-zinc-500 p-2 rounded-lg hover:text-zinc-400 flex items-center justify-start gap-2 hover:bg-zinc-900">
                                        <Icon name="GitCommit" strokeWidth={2} size={17} />
                                        Integrations
                                    </a>
                                </li>
                                <li className="pt-1 grid grid-cols-2 gap-2">
                                    <button
                                        onClick={() => {
                                            signout();
                                            router.push("/login");
                                            setIsOpeningUserMenu(false);
                                        }}
                                        className="text-zinc-900 font-semibold cursor-pointer p-2 flex items-center justify-center rounded-sm gap-2 bg-zinc-50 hover:bg-zinc-100"
                                    >
                                        <Icon name="ArrowRightLeft" strokeWidth={2} size={16} />
                                        <span className="">Switch</span>
                                    </button>
                                    <button
                                        onClick={() => {
                                            signout();
                                            router.push("/login");
                                            setIsOpeningUserMenu(false);
                                        }}
                                        className="font-semibold cursor-pointer p-2 flex items-center justify-center rounded-sm text-red-600 dark:text-red-400 gap-2 bg-red-500/10 hover:bg-red-500/20"
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
        <div className={`navbar-toogle ${currentUser? `hidden` : `hidden max-sm:flex`}`}>
            <button type="button" className="toggleNav" onClick={() => setIsNavOpen(!isNavOpen)}>
                <Icon name={!isNavOpen ? "PanelRightOpen" : "X"} className="text-zinc-500 hover:text-zinc-300 duration-500 cursor-pointer" size={20} strokeWidth={2}/>
            </button>
        </div>
    </header>
  );
}