import { Icon } from "./Icon";
import * as LucideIcons from "lucide-react";
import { Squares } from "./Squares";

type Props = {
    title: string
    desc: string,
    icon: keyof typeof LucideIcons,
    subDesc?: string
}
const FeatureCard = ({title, icon, desc, subDesc}: Props) => {
    return (
        <div className="relative border shadow-2xs dark:border-zinc-800 border-zinc-200 overflow-hidden rounded-xl">
            <Squares parLength={120} />
            <div className="h-full card-content relative z-10 bg-gradient-to-br to-30% from-transparent to-white dark:to-black  pt-10 flex items-center justify-center flex-col gap-10">
                <div className="icon h-20 w-20 border border-yellow-700/30 bg-yellow-700/10 text-yellow-700 rounded-full flex items-center justify-center">
                    <Icon name={icon} size={30} className="text-yellow-700" />
                </div>
                <div className="flex-2/3 text-content border-t border-zinc-200 bg-zinc-200/50 dark:bg-zinc-900/30 dark:border-zinc-800 p-5">
                    <h1 className="title font-semibold text-lg py-2 text-zinc-950 dark:text-zinc-100">
                        {title}
                    </h1>
                    <p className="pb-5 text-zinc-700 dark:text-zinc-300 text-base">
                        {desc}
                    </p>
                    <p className="text-zinc-600 dark:text-zinc-500 text-base">
                        {subDesc}
                    </p>
                </div>
            </div>
        </div>
    );
}

export default FeatureCard;