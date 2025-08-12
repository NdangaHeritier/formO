import { IconType } from "@/types/Icon"
import { Icon } from "../Global/Icon"

type AnalyticProps={
    title: string,
    icon: IconType,
    desc: string,
    data: {amount: number, period: "Month"|"Day"|"Year", rate: number}
}

export const AnalyticCard = ( {title, icon, desc, data}:AnalyticProps) => {
    const dataRate= ((data.amount*100)/data.rate);
    return (
        <div className="rounded-2xl grid grid-cols-1 gap-5 p-5 border-zinc-300 border dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 shadow-lg hover:border-zinc-600">
            <div className="flex items-center justify-between">
              <h1 className="font-bold text-2xl">
                {title}
              </h1>
              <div className="flex items-center justify-right">
                <span className="h-12 w-12 flex items-center justify-center rounded-full bg-yellow-600/20 text-yellow-600">
                  <Icon name={icon} strokeWidth={2} size={18} />
                </span>
              </div>
            </div>
            <p className="text-zinc-600 dark:text-zinc-500">
                {desc}
            </p>
            <div className="analytic grid grid-cols-1 gap-3">
                <div className="amount flex items-center justify-start gap-1">
                    <span className="text-5xl font-bold p-2">
                        {data.amount}
                    </span>
                    <Icon name="Slash" size={12} className="text-zinc-600 dark:text-zinc-500" />
                    <span className="period text-zinc-600 dark:text-zinc-500 text-base">
                        {data.period}
                    </span>
                </div>
                <div className="status text-zinc-800 dark:text-zinc-200 text-sm">
                    {dataRate>=50 ? <div><span className="text-green-600 dark:text-green-500">{dataRate}%</span> Increase compared to last {data.period}</div> : <div><span className="text-red-600  dark:text-red-500">{dataRate}%</span> Decrease compared to last {data.period}</div>}
                </div>
            </div>
        </div>
    )
}