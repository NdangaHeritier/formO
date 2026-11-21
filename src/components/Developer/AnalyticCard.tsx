import type { AnalyticType } from "@/types/Project"
import { Icon } from "../Global/Icon"

type AnalyticProps = AnalyticType

export const AnalyticCard = ( {title, icon, desc, data}:AnalyticProps) => {
    // rate is the real % change vs the previous period, computed by the API.
    // null means there is no baseline yet, so no delta is shown.
    const rate = data.rate;
    const hasRate = rate !== null;
    const isIncrease = (rate ?? 0) >= 0;
    return (
        <div className="rounded-3xl grid grid-cols-1 gap-card p-card border border-zinc-200 bg-white dark:border-zinc-900 dark:bg-zinc-950 transition-colors duration-200 hover:border-zinc-300 dark:hover:border-zinc-800">
            <div className="flex items-center justify-between">
              <h1 className="font-semibold text-xl antialiased text-zinc-900 dark:text-zinc-100">
                {title}
              </h1>
              <div className="flex items-center justify-right">
                <span className="h-9 w-9 flex items-center justify-center rounded-full bg-yellow-600/20 text-yellow-600">
                  <Icon name={icon} strokeWidth={2} size={15} />
                </span>
              </div>
            </div>
            <p className="text-sm text-zinc-600 dark:text-zinc-500">
                {desc}
            </p>
            <div className="analytic grid grid-cols-1 gap-3">
                <div className="amount flex items-center justify-start gap-1">
                    <span className="text-4xl font-bold p-1">
                        {data.amount}
                    </span>
                    <Icon name="Slash" size={11} className="text-sm text-zinc-600 dark:text-zinc-500" />
                    <span className="period text-zinc-600 dark:text-zinc-500 text-sm">
                        {data.period}
                    </span>
                </div>
                <div className="status text-zinc-800 dark:text-zinc-200 text-sm">
                    {!hasRate ? (
                        <div className="text-zinc-500 dark:text-zinc-400">No data to compare with last {data.period} yet</div>
                    ) : isIncrease ? (
                        <div><span className="text-green-600 dark:text-green-500">{rate}%</span> Increase compared to last {data.period}</div>
                    ) : (
                        <div><span className="text-red-600  dark:text-red-500">{Math.abs(rate ?? 0)}%</span> Decrease compared to last {data.period}</div>
                    )}
                </div>
            </div>
        </div>
    )
}