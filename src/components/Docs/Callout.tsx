import type { ReactNode } from "react";
import { Icon } from "@/components/Global/Icon";

const tones = {
  note: {
    wrapper:
      "border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/40",
    icon: "text-zinc-500 dark:text-zinc-400",
    name: "HelpCircle" as const,
  },
  warning: {
    wrapper:
      "border-amber-200 bg-amber-50 dark:border-amber-500/30 dark:bg-amber-500/10",
    icon: "text-amber-700 dark:text-amber-400",
    name: "BellDot" as const,
  },
  danger: {
    wrapper:
      "border-red-200 bg-red-50 dark:border-red-500/30 dark:bg-red-500/10",
    icon: "text-red-600 dark:text-red-400",
    name: "Lock" as const,
  },
};

export default function Callout({
  tone = "note",
  title,
  children,
}: {
  tone?: keyof typeof tones;
  title: string;
  children: ReactNode;
}) {
  const config = tones[tone];
  return (
    <div className={`my-5 rounded-xl border p-4 ${config.wrapper}`}>
      <div className="flex items-start gap-3">
        <Icon name={config.name} size={17} className={`mt-0.5 shrink-0 ${config.icon}`} />
        <div className="grid min-w-0 grid-cols-1 gap-1">
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{title}</p>
          <div className="text-sm leading-6 text-zinc-700 dark:text-zinc-300">{children}</div>
        </div>
      </div>
    </div>
  );
}
