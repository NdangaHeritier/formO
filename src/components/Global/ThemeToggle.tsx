"use client";
import { useEffect, useState } from "react";
import { Moon, ScreenShare, Sun } from "lucide-react";
import Tooltip from "@/components/Global/Tooltip";
import {
  getStoredTheme,
  setTheme,
  THEME_CHANGE_EVENT,
  THEME_STORAGE_KEY,
  type ThemeMode,
} from "@/lib/theme";

const options = [
  { mode: "light", label: "Light theme", Icon: Sun },
  { mode: "system", label: "System theme", Icon: ScreenShare },
  { mode: "dark", label: "Dark theme", Icon: Moon },
] as const;

export default function ThemeToggle() {
  const [mode, setMode] = useState<ThemeMode>("system");

  useEffect(() => {
    const sync = () => setMode(getStoredTheme());
    const onStorage = (event: StorageEvent) => {
      if (event.key === THEME_STORAGE_KEY) sync();
    };
    sync();
    window.addEventListener(THEME_CHANGE_EVENT, sync);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(THEME_CHANGE_EVENT, sync);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  return (
    <div className="themes-toggling-buttons inline-flex items-center justify-start max-sm:justify-center">
      <div className="grid grid-cols-3 gap-1 rounded-md border border-black/10 bg-black/2 p-1 shadow dark:border-white/10 dark:bg-white/2">
        {options.map(({ mode: value, label, Icon }) => {
          const active = mode === value;
          return (
            <Tooltip key={value} label={label}>
              <button
                type="button"
                aria-label={label}
                aria-pressed={active}
                onClick={() => setTheme(value)}
                className={`flex h-8 w-8 cursor-pointer items-center justify-center rounded-md transition-all duration-200 active:scale-95 ${
                  active
                    ? "bg-white text-zinc-900 shadow-sm ring-1 ring-zinc-300 dark:bg-zinc-800 dark:text-zinc-100 dark:ring-zinc-600"
                    : "bg-transparent text-zinc-600 hover:bg-zinc-200/70 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/70 dark:hover:text-zinc-100"
                }`}
              >
                <Icon size={16} />
              </button>
            </Tooltip>
          );
        })}
      </div>
    </div>
  );
}
