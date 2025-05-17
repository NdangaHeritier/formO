import { Sun, Moon, ScreenShare } from "lucide-react";
import { Icon } from "./Global/Icon";
import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="flex items-center justify-center flex-col p-4 bg-zinc-100  dark:bg-zinc-900/10  dark:text-zinc-500 dark:border-t  dark:border-zinc-800 text-whitep-10">
        <div className="footer-row grid grid-cols-4 p-5 gap-8">
            <div className="logo-and-desc-about-formo flex flex-col items-center justify-start gap-3 px-5">
                <Image src="/Assets/formo-dark.png" alt="logo" height="50" width="50" className="w-1/4 opacity-60 dark:hidden" />
                <Image src="/Assets/formo.png" alt="logo" height="50" width="50" className="w-1/4 opacity-60 hidden dark:flex" />
                <h2 className="text-2xl font-semibold text-zinc-700 dark:text-zinc-400">FormO</h2>
                <p className="text-sm text-zinc-600 dark:text-zinc-500">FormO simplifies your email workflows with ease and efficiency.</p>
            </div>
            <div className="quick-links flex flex-col justify-start items-start gap-3">
            <h3 className="text-lg font-semibold text-zinc-700 dark:text-zinc-400">Quick Links</h3>
            <ul className="list-none flex flex-col gap-2 text-sm text-zinc-600 dark:text-zinc-500">
                <li><Link href="/#start" className="hover:underline">Documentation</Link></li>
                <li><Link href="/#start" className="hover:underline">API Reference</Link></li>
                <li><Link href="/#start" className="hover:underline">Support</Link></li>
                <li><Link href="/#start" className="hover:underline">Contact Us</Link></li>
                <li><Link href="/#start" className="hover:underline">Privacy Policy</Link></li>
                <li><Link href="/#start" className="hover:underline">Terms of Service</Link></li>
                <li><Link href="/#start" className="hover:underline">Blog</Link></li>
                
                <li><Link href="/#start" className="hover:underline">Pricing</Link></li>
            </ul>
            </div>
            <div className="get-started-and-reach-out flex flex-col justify-start items-start gap-3">
                <h3 className="text-lg font-semibold text-zinc-700 dark:text-zinc-400">Our Community</h3>
                <ul className="list-none flex flex-col gap-2 text-sm text-zinc-600 dark:text-zinc-500">
                    <li><Link href="/#start" className="hover:underline">Community</Link></li>
                    <li><Link href="/#start" className="hover:underline">API Status</Link></li>
                    <li><Link href="/#start" className="hover:underline">Changelog</Link></li>
                    <li><Link href="/#start" className="hover:underline">FAQ</Link></li>
                    <li><Link href="/#start" className="hover:underline">Feedback</Link></li>
                    <li><Link href="/#start" className="hover:underline">Careers</Link></li>
                    <li><Link href="/#start" className="hover:underline">Press</Link></li>
                    <li><Link href="/#start" className="hover:underline">Partners</Link></li>
                    <li><Link href="/#company" className="hover:underline">Our Team</Link></li>
                </ul>
                
            </div>
            <div className="reach-out-through-our-social-media-account flex flex-col justify-start items-start gap-3 px-5">
                <h3 className="text-lg font-semibold text-zinc-700 dark:text-zinc-400">Follow Us</h3>
                <ul className="list-none grid grid-cols-2 gap-3 text-zinc-600 dark:text-zinc-500">
                    <li className="flex items-center justify-start"><Link href="https://facebook.com" target="_blank" className="hover:underline text-sm flex items-center justify-center gap-2">
                        <Icon name="Facebook" size={15} className="text-zinc-200 dark:text-zinc-900 bg-zinc-900 dark:bg-zinc-100 rounded-md h-8 w-8 p-2 flex items-center justify-center"/>
                        Facebook
                    </Link></li>
                    <li className="flex items-center justify-start"><Link href="https://twitter.com" target="_blank" className="hover:underline text-sm flex items-center justify-center gap-2">
                        <Icon name="Twitter" size={15} className="text-zinc-200 dark:text-zinc-900 bg-zinc-900 dark:bg-zinc-100 rounded-md h-8 w-8 p-2 flex items-center justify-center"/>
                        Twitter
                    </Link></li>
                    <li className="flex items-center justify-start"><Link href="https://linkedin.com" target="_blank" className="hover:underline text-sm flex items-center justify-center gap-2">
                        <Icon name="Linkedin" size={15} className="text-zinc-200 dark:text-zinc-900 bg-zinc-900 dark:bg-zinc-100 rounded-md h-8 w-8 p-2 flex items-center justify-center"/>
                        LinkedIn
                    </Link></li>
                    <li className="flex items-center justify-start">
                        <Link href="https://instagram.com" target="_blank" className="hover:underline text-sm flex items-center justify-center gap-2">
                        <Icon name="Instagram" size={15} className="text-zinc-200 dark:text-zinc-900 dark:bg-zinc-100 bg-zinc-900 rounded-md h-8 w-8 p-2 flex items-center justify-center"/>
                        Instagram
                        </Link>
                    </li>
                </ul>
                <h3 className="text-lg font-semibold text-zinc-700 dark:text-zinc-400">Get Started</h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-500">Ready to start sending emails with FormO? <Link href="#" className="text-zinc-900 dark:text-zinc-200 hover:underline font-medium">Sign up</Link> now and get started!</p>
                <p className="text-sm text-zinc-600 dark:text-zinc-500">Kickstart your journey with FormO today!</p>
                <Link href="/#start" className="bg-zinc-900/10 dark:bg-black border border-zinc-400 dark:border-zinc-700 font-semibold px-4 py-2 rounded-xl text-sm text-zinc-900 dark:text-zinc-200">Sign Up</Link>
            </div>
        </div>
        {/* Copyright */}
        <div className="text-sm w-full grid grid-cols-3 p-5 border-t border-t-zinc-300  dark:border-zinc-800 mt-3">

            {/* Theme button */}
            <div className="themes-toggling-buttons inline-flex items-center justify-start">
                    
                <div className="grid grid-cols-3 gap-1 bg-black/2 dark:bg-white/2 rounded-md p-1 shadow border border-black/10  dark:border-white/10">
                    <button className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-950/2 text-zinc-900 dark:text-zinc-100 hover:border border-zinc-300 dark:border-zinc-800 h-8 w-8 justify-center rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-950">
                        <Sun size={16} />
                    </button>
                    <button className="flex items-center gap-2 bg-zinc-900/10 dark:bg-zinc-100/10 text-zinc-900 dark:text-zinc-100 h-8 w-8 justify-center rounded-md hover:bg-black dark:hover:border border-zinc-500">
                        <ScreenShare size={16} />
                    </button>
                    <button className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-950/2 text-zinc-900 dark:text-zinc-100 hover:border border-zinc-300 dark:border-zinc-800 h-8 w-8 justify-center rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-950">
                        <Moon size={16} />
                    </button>
                </div>
            </div>
            <p>&copy; {new Date().getFullYear()} FormO. All rights reserved.</p>
        </div>
    </footer>
  );
}