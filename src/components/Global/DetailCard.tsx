import { Icon } from "./Icon";
import * as LucideIcons from "lucide-react";
import { Squares } from "./Squares";

type Props = {
    title: string
    desc: string,
    icon: keyof typeof LucideIcons,
    
}
const DetailCard = ({title, icon, desc}: Props) => {
    return (
        <div className="relative border dark:border-zinc-800 border-zinc-200 overflow-hidden rounded-xl">
            <Squares parLength={100} />
            <div className=" card-content relative z-10 bg-gradient-to-br to-30% 
            from-transparent to-black  flex  flex-col gap-3 p-6">
                <div className="flex flex-wrap gap-4 ">
                    <div className="icon flex p-5 border dark:border-yellow-700/5 rounded-full bg-yellow-800/5">
                     <Icon name={icon} size={20} className="text-yellow-700" />
                    </div>
                    <div className="title">
                  <h1 className="font-semibold text-lg py-2 text-zinc-950 dark:text-zinc-200">{title}</h1>
                    </div>
                    
                </div>
                <div className="px-3 justify-center">
                <p className="pb-5 text-zinc-700 dark:text-zinc-500 text-base">
                        {desc}
                    </p>
                </div>
                 
            </div>
        </div>
    );
}

export default DetailCard;