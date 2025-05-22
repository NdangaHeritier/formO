import Image from "next/image"
import Link from "next/link";
import React from "react";
import { Icon } from "./Icon";
import * as LucideIcons from "lucide-react";
import { Squares } from "./Squares";
import DetailCard from "./DetailCard";

const Solutions: React.FC = () =>{
return(
      <>
            <section className="relative bg-zinc-50 dark:bg-zinc-950 p-10">


            <div className="contain border shadow-2xl border-zinc-900 relative bg-black/90 rounded-3xl p-20 flex flex-col items-center justify-center w-full " >
             
                <h2 className="text-zinc-500 uppercase text-lg mb-3">
                    <span className="text-zinc-00 animate-bounce">
                        <Icon name="Palette" className="text-yellow-600/70" />
                    </span>
                        — Everything You Need. Nothing You Don’t.
                </h2>
                <h1 className="text-5xl font-extrabold text-zinc-300 pb-5 tracking-tight text-center">
                  Why Formo Works for You
                </h1>
                <p className="text-zinc-600 dark:text-zinc-400 text-xl py-7">
                            A full-featured email platform—no subscriptions, no lock-ins<span className="text-green-600">,</span>“Your emails, your contacts, your control”.
                        </p>
               <div className="cards py-5">
                    <div className="grid grid-cols-3 gap-5">
                    <DetailCard title="Easy Template Builder" icon="Palette" desc="Drag-and-drop or edit pre-built designs. No designer needed." />
                     <DetailCard title="Audience Management" icon="Users" desc="Organize contacts, apply tags, and send personalized campaigns." />
                      <DetailCard title="Delivery & Tracking" icon="BarChart3" desc="Track opens, clicks, and bounces in real time" />
                       <DetailCard title="Total Privacy" icon="ShieldCheck" desc="Your data stays on your server — no spying, no selling." />
                        
                    </div>
                    </div>
                    </div>
            </section>
        </>
);
}
export default Solutions;