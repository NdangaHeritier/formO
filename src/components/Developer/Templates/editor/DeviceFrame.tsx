import { Icon } from "@/components/Global/Icon";

type Props = {
  device: "desktop" | "mobile";
  children: React.ReactNode;
};

/**
 * Chrome and a scrollable viewport that match the chosen device. The custom
 * scrollbar utility hides the native scrollbar while keeping wheel/touch
 * scrolling available inside the canvas.
 */
export function DeviceFrame({ device, children }: Props) {
  if (device === "mobile") {
    return (
      <div className="mx-auto w-full max-w-[410px] rounded-[44px] border-[7px] border-zinc-800 bg-zinc-950 p-2 shadow-2xl">
        <div className="mx-auto mb-2 flex h-6 items-center justify-center">
          <span className="h-4 w-24 rounded-full bg-zinc-800" />
        </div>
        <div className="studio-scroll @container h-[clamp(480px,72vh,720px)] overflow-y-auto rounded-[32px] bg-zinc-100 p-3">
          {children}
        </div>
        <div className="mx-auto mt-2 h-1.5 w-24 rounded-full bg-zinc-700" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 dark:border-zinc-800 dark:bg-zinc-950">
      <header className="flex items-center gap-3 border-b border-zinc-200 bg-zinc-100 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex gap-1.5" aria-hidden="true">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-yellow-500" />
          <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
        </div>
        <div className="flex min-w-0 flex-1 items-center justify-center gap-2 rounded-md border border-zinc-200 bg-white px-3 py-1 text-xs text-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-400">
          <Icon name="Lock" size={11} />
          <span className="truncate">formo.local/templates/studio</span>
        </div>
        <Icon name="MoreHorizontal" size={16} className="text-zinc-400" />
      </header>
      <div className="studio-scroll @container h-[clamp(500px,72vh,740px)] overflow-y-auto bg-zinc-100 p-4 dark:bg-zinc-950 sm:p-6">
        {children}
      </div>
    </div>
  );
}
