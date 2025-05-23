import { Icon } from "../Global/Icon";
import { Squares } from "../Global/Squares";
import YellowBorderedSpan from "../Global/YellowBorderedSpan";
import LinkButton from "../Global/LinkButton";

const nonDevFeatures = [
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
        <section className="relative overflow-hidden border border-t-0 border-zinc-900 ">
            <Squares parLength={300} />
        {/* Background Mockups */}
        <div className="absolute right-0 top-10 hidden lg:flex flex-col gap-8 w-[40%] pointer-events-none z-0">
            <div className="bg-zinc-100 dark:bg-zinc-800 rounded-xl shadow-xl border border-zinc-300 dark:border-zinc-700 p-4">
            <div className="flex items-center justify-between mb-2">
                <div className="flex gap-2">
                <span className="w-3 h-3 bg-red-500 rounded-full" />
                <span className="w-3 h-3 bg-yellow-500 rounded-full" />
                <span className="w-3 h-3 bg-green-500 rounded-full" />
                </div>
                <span className="text-sm text-zinc-400">Template Preview</span>
            </div>
            <div className="h-40 bg-white dark:bg-zinc-950 rounded-lg p-4">
                <div className="theme overflow-x-hidden max-h-32 w-full border rounded-t-lg">
                    <div className="image h-14 w-full bg-zinc-900 border-b border-zinc-800 flex items-end justify-start">
                        <Icon name="Layout" className="text-green-500" size={16} />
                    </div>
                    <div className="p-2">
                        <h2 className="text-zinc-200 font-bold text-lg pb-1">NewsLetter Today</h2>
                        <p className="text-zinc-500">Start editing your template today with esase.</p>
                    </div>
                </div>
                <div className="mt-2 flex items-center justify-between p-2 border-t border-t-zinc-700">
                    <span className="text-xs text-zinc-400">Choose Theme</span>
                    <div className="flex gap-1 p-3">
                        <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                        <div className="w-4 h-4 bg-pink-500 rounded-full"></div>
                        <div className="w-4 h-4 bg-zinc-950 border border-zinc-800 rounded-full"></div>
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
                <span className="text-sm text-zinc-400">Dashboard View</span>
            </div>
            <div className="h-40 bg-white dark:bg-zinc-950/80 rounded-lg p-4 flex flex-col justify-between">
                <div>
                <p className="text-sm text-zinc-700 dark:text-zinc-300 font-medium">Campaign Stats</p>
                <p className="text-xs text-zinc-400">Open rate: 65% • Clicks: 24%</p>
                </div>
                <LinkButton variant="primary" href="#">
                    View Full Report
                </LinkButton>
            </div>
            </div>
        </div>

        {/* Foreground Content */}
        <div className="relative grid grid-cols-2 z-10 bg-gradient-to-r from-zinc-50 to-transparent dark:from-zinc-950/80 dark:to-black/30 p-10 py-20">
           <div className="flex flex-col items-start justiffy-start gap-5">
                <YellowBorderedSpan title="For Non-Developers Who Need Speed" />
                <div className="w-full md:w-2/3 mb-10">
                <h1 className="text-5xl md:text-6xl font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight mb-4">
                    Easy for Everyone
                </h1>
                <p className="text-lg md:text-xl text-zinc-600 dark:text-zinc-400">
                    Whether you're a marketer, teacher, or business owner—Formo is made for you.
                </p>
                </div>

                <div className="flex flex-wrap gap-3 mb-6">
                {['Marketers', 'Influencers', 'Teachers', 'Business Owners'].map((role) => (
                    <div key={role} className="bg-zinc-100 flex items-center justify-center gap-1 dark:bg-zinc-900/40 border border-zinc-800 px-3 py-1 rounded-full text-sm text-zinc-600 dark:text-zinc-300">
                        <Icon name="User" size={20} className="border border-yellow-600 text-yellow-600 rounded-full p-1" />
                        <span className="">{role}</span>
                    </div>
                ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
                {nonDevFeatures.map(({ icon, title, desc }) => (
                    <div key={title} className="flex items-start gap-4 border border-zinc-200 dark:border-zinc-900 rounded-xl p-4 bg-gradient-to-tr from-white to-yellow-200 dark:from-zinc-950 dark:to-yellow-950">
                        <div className="bg-yellow-100 dark:bg-yellow-950/30 text-yellow-700 p-2 rounded-full">
                            <Icon name={icon as any} size={20} className="text-yellow-700" />
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