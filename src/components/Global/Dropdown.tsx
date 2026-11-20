"use client";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import SmallBtn from "./smallBtn";
import { Icon } from "./Icon";
import type { LucideIconName } from "./Icon";

type Option = {
  label: string;
  value: string;
};

type Props = {
  label: string;
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  selectedLabel?: string;
  icon?: LucideIconName;
  className?: string;
};

/**
 * Project-styled dropdown, shared by studio controls. The menu is portalled to
 * document.body so device frames/toolbar scroll areas cannot clip it.
 */
export default function Dropdown({
  label,
  options,
  value,
  onChange,
  selectedLabel,
  icon,
  className = "",
}: Props) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 160, maxHeight: 300 });
  const triggerRef = useRef<HTMLDivElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const selected = options.find((option) => option.value === value) ?? options[0];

  useEffect(() => {
    if (!open) return;
    const closeOnOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!triggerRef.current?.contains(target) && !menuRef.current?.contains(target)) {
        setOpen(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    const dismissOnViewportChange = (event: Event) => {
      if (!menuRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    window.addEventListener("resize", dismissOnViewportChange);
    window.addEventListener("scroll", dismissOnViewportChange, true);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
      window.removeEventListener("resize", dismissOnViewportChange);
      window.removeEventListener("scroll", dismissOnViewportChange, true);
    };
  }, [open]);

  const toggle = () => {
    if (!open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const width = Math.max(rect.width, 168);
      const estimatedHeight = Math.min(options.length * 40 + 12, 300, window.innerHeight - 16);
      const fitsBelow = rect.bottom + estimatedHeight + 16 < window.innerHeight;
      setPosition({
        top: fitsBelow
          ? Math.min(rect.bottom + 6, window.innerHeight - estimatedHeight - 8)
          : Math.max(8, rect.top - estimatedHeight - 6),
        left: Math.max(8, Math.min(rect.left, window.innerWidth - width - 8)),
        width: Math.min(width, window.innerWidth - 16),
        maxHeight: Math.max(120, estimatedHeight),
      });
    }
    setOpen((current) => !current);
  };

  return (
    <div ref={triggerRef} className={`relative shrink-0 ${className}`}>
      <SmallBtn variant="secondary" onClick={toggle}>
        {icon && <Icon name={icon} size={13} />}
        <span className="min-w-0 max-w-24 truncate">{selectedLabel ?? selected?.label ?? label}</span>
        <Icon name="ChevronDown" size={13} />
      </SmallBtn>
      {open && createPortal(
        <div
          ref={menuRef}
          role="listbox"
          aria-label={label}
          className="studio-scroll fixed z-[80] overflow-y-auto rounded-xl border border-zinc-200 bg-white p-1 shadow-xl dark:border-zinc-800 dark:bg-zinc-950"
          style={position}
        >
          {options.map((option) => (
            <SmallBtn
              key={option.value}
              variant={option.value === value ? "primary" : "ghost"}
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
            >
              <span className="min-w-0 flex-1 truncate text-left">{option.label}</span>
              {option.value === value && <Icon name="Check" size={13} className="shrink-0" />}
            </SmallBtn>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
}
