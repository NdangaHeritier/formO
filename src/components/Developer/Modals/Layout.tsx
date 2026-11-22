"use client";
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Icon } from "@/components/Global/Icon";

type LayoutProps = {
  children: React.ReactNode;
  onClick?: () => void;
  label?: string;
};

const FOCUSABLE =
  'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Shared dialog shell: labelled overlay, Escape/Tab handling, focus and scroll management. */
const Layout = ({ children, onClick, label = "FormO dialog" }: LayoutProps) => {
  const dialogRef = useRef<HTMLElement>(null);
  const restoreRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    restoreRef.current = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const dialog = dialogRef.current;
    const focusables = Array.from(dialog?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []);
    // Prefer the first field/action in the content over the overlay's close button.
    const first = focusables.find((element) => !element.closest(".closeLink"));
    (first ?? focusables[0] ?? dialog)?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      restoreRef.current?.focus?.();
    };
  }, []);

  const onKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      onClick?.();
      return;
    }
    if (event.key !== "Tab") return;

    const focusables = Array.from(
      dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []
    );
    if (focusables.length === 0) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const dialog = (
    <section
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={label}
      tabIndex={-1}
      onKeyDown={onKeyDown}
      className="fixed inset-0 z-50 overflow-auto bg-black/50 p-3 sm:p-5 flex flex-col items-center justify-center"
    >
      <div className="closeLink inline-flex absolute top-4 right-4 p-2 sm:top-10 sm:right-10 sm:p-5">
        <button
          type="button"
          aria-label="Close dialog"
          className="bg-zinc-100 p-3 hover:bg-zinc-200/80 dark:bg-zinc-900 dark:hover:bg-zinc-800/80 rounded-full cursor-pointer border border-zinc-300 dark:border-zinc-700"
          onClick={onClick}
        >
          <Icon className="text-zinc-700 hover:text-black dark:text-zinc-300 dark:hover:text-white" size={18} name="X" strokeWidth={2} />
        </button>
      </div>
      {children}
    </section>
  );

  // Render into document.body so a transformed page wrapper cannot become the
  // containing block for this fixed, full-viewport overlay.
  return typeof document === "undefined" ? null : createPortal(dialog, document.body);
};

export default Layout;
