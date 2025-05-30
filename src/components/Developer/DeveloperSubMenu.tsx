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
  options = [
    { label: "New Project", value: "project", icon: "FolderPlus" },
    { label: "New Form", value: "form", icon: "SquareCode" },
  ],
}: MenuProps) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex p-1 items-center gap-5 justify-between w-full relative">
      <nav className="flex gap-2">        
        {navs.map((nav, i) => (
          <Link
            key={i}
            href={nav.href}
            className="px-3 py-1 rounded-lg border border-transparent text-zinc-700 dark:text-zinc-200 font-medium hover:bg-zinc-500/10 transition"
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
              <Icon name="ChevronDown" className="w-4 h-4" /> Create
          </FormButton>
          {open && (
            <div className="absolute overflow-hidden right-0 mt-2 w-40 bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-lg z-10">
            {options.map((opt) => (
                <button
                key={opt.value}
                className="flex items-center justify-start gap-2 w-full text-left px-3 py-2 hover:bg-zinc-200 dark:hover:bg-zinc-900 transition text-zinc-700 dark:text-zinc-200 text-sm"
                onClick={() => {
                    setOpen(false);
                    onSelect && onSelect(opt.value);
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
