import Image from "next/image";
import { Icon } from "./Icon";
import Link from "next/link";

export default function Header() {
  return (
    <header className="h-1/8 w-full p-5 px-10 flex items-center justify-between gap-5">
        <div className="">
            <Image src="/Assets/formo-coloured.png" alt="logo" height="50" width="50" />
        </div>
        <div className="links flex items-center justify-end gap-8">
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
            <div className="ctas flex items-center justify-center gap-3">
                <Link href="" className="bg-zinc-900 px-4 py-2 text-sm rounded-md text-zinc-100 font-semibold flex items-center gap-2">
                    <Icon name="Webhook" size={15} className="text-zinc-400" />
                    Get API
                </Link>
                <Link href="" className="bg-zinc-900 px-4 py-2 text-sm rounded-md text-zinc-100 font-semibold flex items-center gap-2">
                    <Icon name="Text" size={15} className="text-zinc-400" />
                    Send Emails
                </Link>
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