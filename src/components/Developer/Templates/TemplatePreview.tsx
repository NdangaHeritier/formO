import { Icon } from "@/components/Global/Icon";
import SmallBtn from "@/components/Global/smallBtn";

type Props = {
  html: string;
  loading: boolean;
  device: "desktop" | "mobile";
  onDeviceChange: (device: "desktop" | "mobile") => void;
};

/** Isolated, responsive preview canvas. Scripts never run in template iframes. */
export function TemplatePreview({ html, loading, device, onDeviceChange }: Props) {
  return (
    <section className="rounded-card border border-zinc-200 bg-white dark:border-zinc-800">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
        <div className="flex items-center gap-2 text-sm font-semibold text-zinc-800 dark:text-zinc-200">
          <Icon name="Monitor" size={15} className="text-yellow-600" />
          Live preview
        </div>
        <div className="flex items-center gap-1 rounded-md border border-zinc-200 p-1 dark:border-zinc-800">
          {(["desktop", "mobile"] as const).map((mode) => (
            <SmallBtn
              key={mode}
              variant={device === mode ? "primary" : "secondary"}
              onClick={() => onDeviceChange(mode)}
            >
              {mode}
            </SmallBtn>
          ))}
        </div>
      </header>
      <div className="relative overflow-x-auto bg-zinc-100/70 p-4 sm:p-6 dark:bg-zinc-900/70">
        {loading && (
          <span className="absolute right-5 top-5 z-10 rounded-full p-2 text-zinc-100">
            <Icon name="Loader" size={16} className="animate-spin" />
          </span>
        )}
        <div
          className="mx-auto overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm transition-[width] duration-200 dark:border-zinc-800"
          style={{ width: device === "mobile" ? "390px" : "100%", maxWidth: "100%" }}
        >
          <iframe
            title="Email template live preview"
            sandbox=""
            srcDoc={html}
            className="h-[520px] w-full border-0 sm:h-[65vh] sm:min-h-[560px]"
          />
        </div>
      </div>
    </section>
  );
}

