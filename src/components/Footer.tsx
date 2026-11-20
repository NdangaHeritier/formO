import { Icon } from "./Global/Icon";
import ThemeToggle from "./Global/ThemeToggle";
import Link from "next/link";
import Image from "next/image";
import LinkButton from "./Global/LinkButton";

export default function Footer() {
  return (
    <footer className="flex items-center justify-center flex-col p-4 bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-t border-zinc-200 dark:border-zinc-800">
        <div className="footer-row grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 p-5 gap-8">
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
                    {
                        [
                            {href: "/#community", title: "Community"},
                            {href: "/#ApiStatus", title: "API Status"},
                            {href: "/#Changelog", title: "Changelog"},
                            {href: "/#FAQ", title: "FAQ"},
                            {href: "/#Feedback", title: "Feedback"},
                            {href: "/#Careers", title: "Careers"},
                            {href: "/#press", title: "Press"},
                            {href: "/#Partners", title: "Partners"},
                            {href: "/#team", title: "Our Team"},
                        ].map(({href, title}, index)=> (
                            <li key={index}>
                                <Link href={href} className="hover:underline text-zinc-700 dark:text-zinc-400 flex items-center justify-start gap-1">
                                    {title}
                                    <Icon name="ArrowUpRight" className="text-zinc-500 dark:text-zinc-600" size={14} strokeWidth={2} />
                                </Link>
                            </li>
                        ))
                    }
                </ul>
                
            </div>
            <div className="reach-out-through-our-social-media-account flex flex-col justify-start items-start gap-3 md:px-5">
                <h3 className="text-lg font-semibold text-zinc-700 dark:text-zinc-400">Follow Us</h3>
                <ul className="list-none grid grid-cols-2 gap-3 text-zinc-600 dark:text-zinc-500">
                    <li className="flex items-center justify-start"><Link href="https://facebook.com" target="_blank" className="hover:underline text-sm flex items-center justify-center gap-2">
                        <Icon name="Facebook" size={15} strokeWidth={2} className="text-zinc-700 dark:text-zinc-400 bg-zinc-200/40 dark:bg-zinc-900/50 border-2 border-white dark:border-black ring-2 ring-zinc-100 dark:ring-zinc-900 rounded-md h-8 w-8 p-1 flex items-center justify-center"/>
                        Facebook
                    </Link></li>
                    <li className="flex items-center justify-start"><Link href="https://twitter.com" target="_blank" className="hover:underline text-sm flex items-center justify-center gap-2">
                        <Icon name="Twitter" size={15} strokeWidth={2} className="text-zinc-700 dark:text-zinc-400 bg-zinc-200/40 dark:bg-zinc-900/50 border-2 border-white dark:border-black ring-2 ring-zinc-100 dark:ring-zinc-900 rounded-md h-8 w-8 p-1 flex items-center justify-center"/>
                        Twitter
                    </Link></li>
                    <li className="flex items-center justify-start"><Link href="https://linkedin.com" target="_blank" className="hover:underline text-sm flex items-center justify-center gap-2">
                        <Icon name="Linkedin" size={15} strokeWidth={2} className="text-zinc-700 dark:text-zinc-400 bg-zinc-200/40 dark:bg-zinc-900/50 border-2 border-white dark:border-black ring-2 ring-zinc-100 dark:ring-zinc-900 rounded-md h-8 w-8 p-1 flex items-center justify-center"/>
                        LinkedIn
                    </Link></li>
                    <li className="flex items-center justify-start">
                        <Link href="https://instagram.com" target="_blank" className="hover:underline text-sm flex items-center justify-center gap-2">
                        <Icon name="Instagram" size={15} strokeWidth={2} className="text-zinc-700 dark:text-zinc-400 bg-zinc-200/40 dark:bg-zinc-900/50 border-2 border-white dark:border-black ring-2 ring-zinc-100 dark:ring-zinc-900 rounded-md h-8 w-8 p-1 flex items-center justify-center"/>
                        Instagram
                        </Link>
                    </li>
                </ul>
                <h3 className="text-lg font-semibold text-zinc-700 dark:text-zinc-400">Get Started</h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-500">Ready to start sending emails with FormO? <Link href="#" className="text-zinc-900 dark:text-zinc-200 hover:underline font-medium">Sign up</Link> now and get started!</p>
                <p className="text-sm text-zinc-600 dark:text-zinc-500">Kickstart your journey with FormO today!</p>
                <LinkButton variant="secondary" href="/sign-up">Sign Up</LinkButton>
            </div>
        </div>
        {/* Copyright */}
        <div className="text-sm w-full grid grid-cols-1 max-sm:gap-5 sm:grid-cols-2 md:grid-cols-3 p-5 border-t border-t-zinc-300  dark:border-zinc-800 mt-3">

            {/* Theme button */}
            <ThemeToggle />
            <p>&copy; {new Date().getFullYear()} FormO. All rights reserved.</p>
        </div>
    </footer>
  );
}