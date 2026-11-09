import { Icon } from "./Icon";
import { IconType } from "@/types/Icon";
import { CircleBlur } from "./Circle";

type Props = {
    title: string
    desc: string,
    icon: IconType,
    subDesc?: string,
    color?: "orange" | "yellow" | "green" | "pink" | "violet",
}
const GuideCard = ({title, icon, desc, subDesc, color="yellow" }: Props) => {
    const colors ={
        yellow: {bg: "bg-yellow-500", text: "text-yellow-600"},
        violet: {bg: "bg-violet-500", text: "text-violet-600"},
        pink: {bg: "bg-pink-500", text: "text-pink-500"},
        orange: {bg: "bg-orange-500", text: "text-orange-600"},
        green: {bg: "bg-green-500", text: "text-green-600"}
    }
    let picked = color == "yellow" ? colors.yellow : colors.pink;
    picked = color == "yellow" || color== "pink" ? picked : colors.orange;
    picked= color == "yellow" || color== "pink" || color== "orange" ? picked : colors.green;
    return (
        <div className="relative border shadow-2xs dark:border-zinc-800 border-zinc-200 overflow-hidden rounded-xl">
            <CircleBlur color={picked.bg} angle="top-0 right-0" />
            <div className="h-full backdrop-blur-2xl card-content relative z-10 bg-gradient-to-br to-30% from-transparent to-zinc-50 dark:to-black  pt-10 flex items-center justify-center flex-col gap-10">
                <div className={`icon h-20 w-20 border border-zinc-500/30 bg-${color}/10 text-${color} rounded-full flex items-center justify-center`}>
                    <Icon name={icon} size={30} className={picked.text} />
                </div>
                <div className="flex-2/3 text-content border-t border-zinc-200 bg-zinc-200/50 dark:bg-zinc-950 dark:border-zinc-800 p-5">
                    <h1 className="title font-semibold text-lg py-2 text-zinc-950 dark:text-zinc-100">
                        {title}
                        <Icon name="ArrowUpRight" className="text-zinc-500 dark:text-zinc-600 inline-flex ms-1" size={16} strokeWidth={2} />
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

export default GuideCard;