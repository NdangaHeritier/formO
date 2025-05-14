import Image from "next/image"
import Link from "next/link";
import React from "react";
import { Icon } from "../Icon";

export const Hero : React.FC = () => {
    return(
        <section className="hero-section relative p-20 bg-zinc-950 rounded-4xl flex flex-col items-center justify-center w-full bg-right-bottom bg-no-repeat" style={{backgroundImage: "url('./Assets/mail.png')"}}>
            <h2 className="text-zinc-500 uppercase text-lg mb-3">
                <span className="text-zinc-00 animate-bounce">
                    <Icon name="Send" className="text-yellow-400/70" />
                </span>
                     — Effortless Form Submission and Email Handling
            </h2>
            <h1 className="text-6xl font-extrabold text-zinc-300 pb-5 tracking-tight text-center">
                <span className="stroke text-transparent pb-10 text-7xl">Streamline Your Workflow</span>
                <br/> with Our Effortless Emailing Solution.
            </h1>
            <p className="text-lg text-zinc-400 py-6 text-center">
                FormO is a powerful email integration solution that makes sending emails easy and efficient. We provide a simple API that allows you to send emails with just a few lines of code. Our goal is to make your coding experience faster and more enjoyable.
                With FormO, you can send emails in just a few lines of code, making your coding experience faster and more enjoyable.
            </p>
           
           {/* feature comparations */}
           <div className="grid grid-cols-3 gap-5 w-full max-sm:grid-cols-1 relative z-10 border-t border-dotted border-t-zinc-800 py-5 mt-2">
            <div className="for-devs flex items-start flex-col gap-5 justify-center pb-5">
                <span className="flex px-3 py-2 border border-zinc-700 bg-black gap-x-2 rounded-full text-sm font-medium">
                    <Icon name={`Code`} className="text-zinc-400 h-5 w-5 p-1 rounded-full border border-zinc-100/10 bg-zinc-100/5" />
                    <span className="text-zinc-400">For Developers</span>   
                </span>
                <h2 className="text-2xl font-bold text-zinc-300">Codding Simplified</h2>
                <div className="text-base text-zinc-400">FormO empowers developers to simplify form submissions by providing a no-backend-required solution. Just submit your data to a generated API endpoint like:
                    <div className="border border-zinc-800 rounded-md overflow-hidden bg-zinc-900/10 my-1">
                        <div className="head border-b border-b-zinc-800 bg-zinc-900/50 p-1">
                            <Icon name="Link" className="text-zinc-400 text-sm" size={14} />
                        </div>
                        <code className="text-zinc-500 flex items-center gap-1 text-sm p-2">
                            <Icon name="Terminal" className="text-zinc-400 text-sm" size={15} />
                            https://formo.io/api/send/form:[formId]
                        </code>
                    </div>
                    , and let FormO handle the rest.
                </div>
                <p className="text-base text-zinc-400">With FormO, you can focus on building your application while we take care of the email integration, making your development process faster and more efficient.</p>
                <Link href="/#start" className="font-semibold bg-white hover:bg-white/70 duration-300 text-zinc-900 px-4 py-2 rounded-xl text-sm flex items-center justify-center gap-2">
                    <Icon name={`CodeXml`} className="text-zinc-700" size={16} />
                    Generate Endpoint                    
                </Link>
           </div>
            
           <div className="flex items-center">
             <div className="bg-zinc-900 border border-zinc-700 rounded-xl overflow-hidden">
                <div className="head bg-zinc-950 border-b border-zinc-700 flex items-center justify-start p-2 gap-2">
                    <span className="h-3 w-3 bg-zinc-900 border border-zinc-800 rounded-full"></span>
                    <span className="h-3 w-3 bg-zinc-900 border border-zinc-800 rounded-full"></span>
                    <span className="h-3 w-3 bg-zinc-900 border border-zinc-800 rounded-full"></span>
                </div>
                <Image
                    src={
                        `/Assets/avatar3.png`
                    }
                    className={
                        `w-auto h-auto`
                    }
                    height={250}
                    width={350}
                    alt="Hero Banner"
                />
            </div>
           </div>

            <div className="non-dev-side flex items-start flex-col gap-5 justify-start pb-5">
                <span className="flex px-3 py-2 border border-zinc-700 bg-black gap-x-2 rounded-full text-sm font-medium">
                    <Icon name={`ReceiptText`} className="text-zinc-400 h-5 w-5 p-1 rounded-full border border-zinc-100/10 bg-zinc-100/5" />
                    <span className="text-zinc-400">For Marketers</span>   
                </span>
                <h2 className="text-2xl font-bold text-zinc-300">Effortless Email Campaigns</h2>
                <p className="text-lg text-zinc-400">
                    FormO empowers marketers, advertisers, and organizations to send newsletters and emails effortlessly. Customize pre-built templates with ease—adjust text, colors, and fonts to match your brand, and reach your audience in just a few clicks.
                </p>
                <p className="py-4 text-zinc-200">
                    No further setup to bore you. Just your name and where to send. Start customizing and sending with FormO now!
                </p>
                <Link href="/#start" className="font-light bg-black hover:bg-zinc-200/5 text-zinc-200 border border-zinc-700 px-4 py-2 rounded-xl text-sm backdrop-blur-md flex items-center justify-center gap-2">
                    Get Started
                    <Icon name={`ChevronRight`} className="text-zinc-200" />
                </Link>
            </div>
           </div>
            <div className="absolute mx-auto my-auto flex items-center justify-center -z-0">
                <div className="relative flex border-2 ring-4 ring-yellow-200/10 border-zinc-300/10 bg-gradient-to-br from-yellow-700/20 to-zinc-950 self-start content-start h-20 w-20 rounded-full font-medium text-sm items-center justify-center gap-x-2">
                    <span className="h-40 absolute mx-auto w-40 bg-yellow-200/5 rounded-full grid grid-cols-2 gap-5">
                        <Icon name="User" size={48} className="p-2 bg-black border-2 border-yellow-200/10 rounded-full text-zinc-500"/>
                        <Icon name="Mail" size={38} className="p-2 bg-black border-2 border-yellow-200/10 rounded-full text-zinc-500"/>
                        <Icon name="AtSign" size={48} className="p-2 bg-zinc-950 border-2 border-yellow-200/10 rounded-full text-zinc-500"/>
                        <Icon name="MailCheck" size={38} className="p-2 bg-zinc-950 border-2 border-yellow-200/10 rounded-full text-zinc-500"/>
                    </span>
                    <Image src="/Assets/formo.png" alt="logo" height={100} width={100} className="h-14 w-14 opacity-30 object-cover" />
                </div>
            </div>
        </section>
    )
}