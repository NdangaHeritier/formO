import { Icon } from "../Global/Icon";
import { Squares } from "../Global/Squares";
import YellowBorderedSpan from "../Global/YellowBorderedSpan";
import LinkButton from "../Global/LinkButton";
import { IconType } from "@/types/Icon";

type feature ={
        icon: IconType,
        title: string,
        desc: string,
    }
const nonDevFeatures:feature[] = [
    {
      icon: "Mail",
      title: "Email Templates",
      desc: "Pre-designed emails you can tweak without code."
    },
    {
      icon: "Palette",
      title: "Brand Styling",
      desc: "Pick colors & fonts that match your brand in clicks."
    },
    {
      icon: "Layout",
      title: "Drag & Drop Builder",
      desc: "Customize emails visually—no coding needed."
    },
    {
      icon: "Send",
      title: "Send & Schedule",
      desc: "Send emails instantly or schedule for later."
    },
    {
      icon: "BarChart",
      title: "Insights & Reports",
      desc: "Track performance with simple analytics."
    },
];

const NonDevSolutions: React.FC = () => {
    return (
        <section className="relative max-sm:flex max-sm:flex-col-reverse overflow-hidden border border-t-0 border-zinc-300 dark:border-zinc-900 ">
            <Squares parLength={120} />
        {/* Background Mockups */}
        <div className="sm:absolute sm:right-10 sm:top-10 flex flex-col gap-8 sm:w-[35%] max-sm:p-5 pointer-events-none z-0">
            <div className="bg-zinc-100 dark:bg-zinc-900/80 rounded-xl shadow-xl border border-zinc-300 dark:border-zinc-700 p-4">
            <div className="flex items-center justify-between mb-2">
                <div className="flex gap-2">
                <span className="w-3 h-3 bg-red-500 rounded-full" />
                <span className="w-3 h-3 bg-yellow-500 rounded-full" />
                <span className="w-3 h-3 bg-green-500 rounded-full" />
                </div>
                <span className="text-sm text-zinc-400 font-semibold">Template Preview</span>
            </div>
            <div className="h-40 bg-white dark:bg-zinc-950 rounded-lg p-4">
                <div className="theme overflow-hidden max-h-32 w-full border border-zinc-400 dark:border-zinc-700 shadow rounded-t-lg">
                    <div className="image h-10 p-2 gap-2 text-zinc-800 dark:text-zinc-200 w-full bg-zinc-100 dark:bg-zinc-900 text-xs border-b border-zinc-200 dark:border-zinc-800 flex items-end justify-between">
                        <div className="flex items-center gap-1">
                            <Icon name="Layout" className="text-green-600" size={16} /> 10X
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-zinc-700 dark:text-zinc-400">Choose Theme</span>
                            <div className="flex gap-1 p-1">
                                <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                                <div className="w-4 h-4 bg-pink-500 rounded-full"></div>
                                <div className="w-4 h-4 bg-zinc-950 border border-zinc-300 rounded-full"></div>
                            </div>
                        </div>
                    </div>
                    <div className="p-2 m-2 bg-green-600/8 border border-zinc-300 dark:border-zinc-700 rounded-t-lg">
                        <h2 className="text-green-600 font-bold text-base pb-1 flex items-center jujustify-between gap-x-2">
                            Introduce Formo Editor
                            <span className="bg-green-600 text-xs text-white rounded-full px-2 py-0.5">New</span>
                        </h2>
                        <p className="dark:text-zinc-400 text-zinc-700 text-xs">
                            Formo is here to introduce new template email editor that help marketers to send beautifull and engaging emails for free with ease.
                        </p>
                    </div>
                </div>
                
            </div>
            </div>

            <div className="bg-zinc-100 dark:bg-zinc-900/80 rounded-xl shadow-xl border border-zinc-300 dark:border-zinc-700 p-4">
            <div className="flex items-center justify-between mb-2">
                <div className="flex gap-2">
                <span className="w-3 h-3 bg-red-500 rounded-full" />
                <span className="w-3 h-3 bg-yellow-500 rounded-full" />
                <span className="w-3 h-3 bg-green-500 rounded-full" />
                </div>
                <span className="text-sm text-zinc-400 font-semibold">Dashboard View</span>
            </div>
            <div className="h-40 bg-white dark:bg-zinc-950/80 rounded-lg p-4 flex flex-col justify-between">
                <div>
                <p className="text-sm text-zinc-700 dark:text-zinc-300 font-bold">Campaign Stats</p>
                <p className="text-xs text-zinc-400">Open rate: <span className="text-green-600">65%</span> • Clicks: <span className="text-red-500">24%</span></p>
                </div>
                <LinkButton variant="primary" href="#">
                    View Full Report
                </LinkButton>
            </div>
            </div>
        </div>

        {/* Foreground Content */}
        <div className="relative grid grid-cols-1 sm:grid-cols-2 z-10 bg-gradient-to-r from-zinc-50 to-white/30 dark:from-zinc-950/80 dark:to-black/30 p-10 max-sm:px-4 py-20">
           <div className="flex flex-col items-start justiffy-start gap-5">
                <YellowBorderedSpan title="For Non-Developers Who Need Speed" />
                <div className="w-full md:w-2/3 mb-10">
                <h1 className="text-5xl md:text-6xl font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight mb-4">
                    Easy for Everyone
                </h1>
                <p className="text-lg md:text-xl text-zinc-600 dark:text-zinc-400">
                    Whether you&rsquo;re a marketer, teacher, or business owner—Formo is made for you.
                </p>
                </div>

                <div className="flex flex-wrap gap-3 mb-6">
                {['Marketers', 'Influencers', 'Teachers', 'Business Owners'].map((role) => (
                    <div key={role} className="bg-zinc-100 flex items-center justify-center gap-1 dark:bg-zinc-900/40 border border-zinc-300 dark:border-zinc-800 pl-1 pe-3 py-1 rounded-full text-sm text-zinc-600 dark:text-zinc-300">
                        <Icon name="User" size={20} className="border border-yellow-600 text-yellow-600 rounded-full p-1 shadow-2xl" />
                        <span className="">{role}</span>
                    </div>
                ))}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-2 gap-4 max-sm:gap-2 mb-7">
                {nonDevFeatures.map(({ icon, title, desc }) => (
                    <div key={title} className="flex max-sm:flex-col items-start gap-2 sm:gap-4 border border-zinc-200 dark:border-zinc-900 rounded-xl p-2 sm:p-4 bg-gradient-to-tr from-yellow-600/20 to-30% to-white dark:from-yellow-950/90 dark:to-zinc-950">
                        <div className="bg-yellow-600/20 dark:bg-yellow-950/30 text-yellow-700 p-2 rounded-full">
                            <Icon name={icon} size={20} className="text-yellow-700" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 text-base mb-1">{title}</h3>
                            <p className="text-sm text-zinc-600 dark:text-zinc-400">{desc}</p>
                        </div>
                    </div>
                ))}
                </div>
           </div>
        </div>
    </section>
    );
}

export default NonDevSolutions;
