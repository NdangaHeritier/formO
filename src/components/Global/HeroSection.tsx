import Image from "next/image"
import Link from "next/link";
import React from "react";
import { Icon } from "./Icon";


export const HeroSection : React.FC = () => {
    return(
        <section className="hero-section relative p-5 bg-gradient-to-l from-yellow-950/50 from-50% to-50% to-zinc-950">
          
            <div className="contain border shadow-2xl border-zinc-900 relative bg-black/90 rounded-3xl p-20 flex flex-col items-center justify-center w-full bg-right-bottom bg-no-repeat" style={{backgroundImage: "url('./Assets/mail.png')"}}>
             
                <h2 className="text-zinc-500 uppercase text-lg mb-3">
                    <span className="text-zinc-00 animate-bounce">
                        <Icon name="Sparkles" className="text-yellow-600/70" />
                    </span>
                        — No Code. No Problem
                </h2>
                <h1 className="text-6xl font-extrabold text-zinc-300 pb-5 tracking-tight text-center">
                   Send Emails with Zero Code — Seriously.
                </h1>
                <p className="text-lg text-zinc-400 py-6 text-center">
                    Formo gives you a beautiful dashboard to write, design, and send emails to your audience without ever touching code
                </p>
                  <Link href="/NonDev" className="font-light bg-black hover:bg-zinc-200/5 text-zinc-200 border border-zinc-700 px-4 py-2 rounded-xl text-sm backdrop-blur-md flex items-center justify-center gap-2">
                                        Try for Free 
                                        <Icon name={`ChevronRight`} className="text-zinc-200" />
                                    </Link>
            
        
            </div>
        </section>
    );
}