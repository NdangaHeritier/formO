import { Icon } from "./Icon";
import * as LucideIcons from "lucide-react";
import { Squares } from "./Squares";
import { IconType } from "@/types/Icon";

type Props = {
    title: string
    desc: string,
    icon: IconType,
    
}
const DetailCard = ({title, icon, desc}: Props) => {
    return (
        <div className="relative border dark:border-zinc-800 border-zinc-200 overflow-hidden rounded-xl">
            <Squares parLength={100} />
            <div className=" card-content relative z-10 bg-gradient-to-br to-30% 
            from-transparent to-black  flex  flex-col gap-3 p-4">
                <div className="flex  gap-4 ">
                   
                        <div className="icon flex p-5 border dark:border-yellow-700/30 rounded-full bg-yellow-700/10">
                     <Icon name={icon} size={20} className="text-yellow-700" />
                    </div>
                  
                    
                  <h1 className="font-semibold text-lg py-3 text-zinc-950 dark:text-zinc-200 ">{title}</h1>
                  </div>
                    <div className="text-base  justify-center px-3">
                <p className="pb-2 text-zinc-700 dark:text-zinc-500 text-base">
                        {desc}
                    </p>
                </div>
                    
                    
                </div>
              
                 
            </div>
       
    );
}

export default DetailCard;