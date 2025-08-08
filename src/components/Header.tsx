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
export default function Header({border="border-b", py="py-auto"}:prop) {

    // changing header links into user profile and settings if user is logged in
    // and showing login and signup if not logged in...
    const { currentUser, signout, authLoading } = useAuth();
    const [isOpeningUserMenu, setIsOpeningUserMenu] = useState(false)
    const [mounted, setMounted] = useState(false);
    const router = useRouter();

    useEffect(() => {
        setMounted(true);
    }, [currentUser, authLoading, signout]);

  return (
    <header className={`h-1/8 w-full sticky top-0 left-0 right-0 z-40 ${border} border-zinc-200 dark:border-zinc-800 p-5 ${py} px-10 flex items-center justify-between gap-5 zinc-50/70 dark:bg-zinc-950 bg-zinc-50 backdrop-blur-2xl`}>
        <div className="">
            {mounted ? (
                <Image src="/Assets/formo-coloured.png" alt="logo" height="50" width="50" />
            ):(
                <SkeletonBox customStyle="w-10 h-10 rounded-md" />
            )}
        </div>
        <div className="links flex items-center justify-end gap-8">
            {authLoading ? (
                <div className="grid grid-cols-4 max-sm:grid-cols-1 gap-2">
                    <SkeletonBox customStyle="w-20 h-6 rounded-md" shown={authLoading} />
                    <SkeletonBox customStyle="w-20 h-6 rounded-md" shown={authLoading} />
                    <SkeletonBox customStyle="w-20 h-6 rounded-md" shown={authLoading} />
                    <SkeletonBox customStyle="w-20 h-6 rounded-md" shown={authLoading} />
                </div>
            ) : !currentUser ? (
                <ul className="nav-links list-none flex items-center justify-end gap-5">
                    <li className="list-item px-1">
                        <Link href="/#about" className="text-zinc-700 dark:text-zinc-400 font-medium">Home</Link>
                    </li>
                    <li className="list-item px-1">
                        <Link href="/#start" className="text-zinc-700 dark:text-zinc-400 font-medium">Docs</Link>
                    </li>
                    <li className="list-item px-1">
                        <Link href="/#company" className="text-zinc-700 dark:text-zinc-400 font-medium">Team</Link>
                    </li>
                    <li className="list-item px-1">
                        <Link href="/#start" className="text-zinc-700 dark:text-zinc-400 font-medium">Plans</Link>
                    </li>
                    <li className="list-item px-1">
                        <Link href="/#start" className="text-zinc-700 dark:text-zinc-400 font-medium">Careers</Link>
                    </li>
                </ul>
            ) : `` }
            <div className="ctas flex items-center justify-center gap-3 relative">
                <LinkButton href="/developer" variant="primary">
                    <Icon name="Webhook" size={15} className="text-zinc-300 dark:text-zinc-700" />
                    Get API
                </LinkButton>
                <LinkButton href="/non-dev" variant="secondary">
                    <Icon name="Text" size={15} className="text-zinc-700 dark:text-zinc-300" />
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
                  : ""
                }
            </div>
        </div>
        <div className="navbar-toogle hidden max-sm:block">
            <button type="button" className="toggleNav rounded-md bg-gradient-to-r from-transparent to-zinc-300 border shadow border-zinc-400/70 px-4 py-1 hover:bg-zinc-400/50 duration-300">
                <Icon name="Menu" className="text-zinc-500" size={18} />
            </button>
        </div>
    </header>
  );
}