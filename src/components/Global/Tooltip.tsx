"use client";
import { useId, useState, type ReactNode } from "react";

type Props = {
  label: string;
  children: ReactNode;
  side?: "right" | "bottom";
};

/** Local tooltip — no library. Works on hover and keyboard focus. */
export default function Tooltip({ label, children, side = "right" }: Props) {
  const [open, setOpen] = useState(false);
  const id = useId();

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      <span aria-describedby={open ? id : undefined} className="inline-flex">
        {children}
      </span>
      {open && (
        <span
          role="tooltip"
          id={id}
          className={`pointer-events-none absolute z-[90] whitespace-nowrap rounded-md border border-zinc-200 bg-white px-2 py-1 text-xs font-medium text-zinc-700 shadow-lg dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 ${
            side === "right"
              ? "left-full top-1/2 ml-2 -translate-y-1/2"
              : "left-1/2 top-full mt-2 -translate-x-1/2"
          }`}
        >
          {label}
        </span>
      )}
    </span>
  );
}
