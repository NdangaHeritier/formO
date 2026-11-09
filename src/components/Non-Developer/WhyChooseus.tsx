// import Image from "next/image"
// import Link from "next/link";
import React from "react";
import { Icon } from "../Global/Icon";
// import * as LucideIcons from "lucide-react";
// import { Squares } from "./Squares";
import DetailCard from "../Global/DetailCard";

const WhyChooseus: React.FC = () =>{
return(
      <>
            <section className="relative bg-zinc-50 dark:bg-zinc-950 p-5">


            <div className="contain border shadow-2xl border-zinc-900 relative bg-black/90 rounded-3xl p-20 flex flex-col items-center justify-center w-full " >
             
                <h2 className="text-zinc-500 uppercase text-lg mb-3">
                    <span className="text-zinc-00 animate-bounce">
                        <Icon name="Palette" className="text-yellow-600/70" />
                    </span>
                      — Built With You in Mind 
                </h2>
                <h1 className="text-5xl font-extrabold text-zinc-300 pb-5 tracking-tight text-center">
                  — Why Non‑Developers Trust Formo
                </h1>
                <p className="text-zinc-600 dark:text-zinc-400 text-xl py-7">
                          Formo is designed for marketers, small businesses, and creators who want control without complexity. No tech jargon. Just results.
                        </p>
               <div className="cards py-5">
                    <div className="grid grid-cols-3 gap-5">
                                   
                    <DetailCard title="No Technical Setup" icon="Zap" desc="You don’t need to know servers or protocols. Start sending in minutes." />
                     <DetailCard title="Your Data = Yours " icon="ShieldCheck" desc="Formo never stores or reads your emails. Everything stays 100% yours." />
                      <DetailCard title=" Self-Hosted Option" icon="Server" desc="Run it your way — on your own server, with no vendor lock-in or hidden fees.

" />
                       <DetailCard title=" Always Improving" icon="RefreshCcw" desc="Formo evolves with feedback from people like you. It just keeps getting better." />
                       <DetailCard title=" Built With Love " icon="Smile" desc="We care about clarity, comfort, and community — not just features." />
                        
                    </div>
                    </div>
                    </div>
            </section>
          
        </>
);
}
export default WhyChooseus;
