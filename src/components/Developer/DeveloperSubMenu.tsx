import Link from "next/link";
import FormButton from "../Global/FormButton";
import { useState } from "react";
import { IconType } from "@/types/Icon";
import { Icon } from "../Global/Icon";

type MenuProps ={
  navs: { label: string; href: string }[];
  onSelect?: (value: string) => void;
  options?: { label: string; value: string; icon: IconType }[];
}
export default function DeveloperSubMenu({
  navs,
  onSelect,
  // Forms are created from inside a project, so the global menu only creates projects.
  options = [
    { label: "New Project", value: "project", icon: "FolderPlus" },
  ],
}: MenuProps) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex p-1 items-center gap-5 justify-between w-full relative">
      <nav className="hidden gap-2 md:flex">        
        {navs.map((nav, i) => (
          <Link
            key={i}
            href={nav.href}
            className="px-3 py-1 rounded-lg border border-transparent text-zinc-700 dark:text-zinc-200 font-normal hover:bg-zinc-500/10 transition"
          >
            {nav.label}
          </Link>
        ))}
      </nav>
        <div className="relative">
          <FormButton
            type="button"
            variant="primary"
            onClick={() => setOpen((v) => !v)}
          >
              Create <Icon name="ChevronDown" className="w-4 h-4" />
          </FormButton>
          {open && (
            <div className="absolute overflow-hidden right-0 mt-2 w-48 p-1 gap-0.5 bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-lg z-10">
            {options.map((opt) => (
                <button
                key={opt.value}
                className="flex items-center justify-start gap-2 w-full text-left px-3 py-2 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-900 transition text-zinc-700 dark:text-zinc-200 text-sm cursor-pointer"
                onClick={() => {
                    setOpen(false);
                    onSelect?.(opt.value);
                }}
                >
                <Icon name={opt.icon} className="w-4 h-4 text-zinc-600 dark:text-zinc-500" strokeWidth={2} />
                {opt.label}
                </button>
            ))}
            </div>
          )}
        </div>
    </div>
  );
}
