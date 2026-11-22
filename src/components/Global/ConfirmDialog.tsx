"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "@/components/Global/Icon";
import FormButton from "@/components/Global/FormButton";
import Layout from "@/components/Developer/Modals/Layout";

type Props = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "danger" | "default";
  error?: string | null;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
};

/**
 * Focused confirmation for actions that change or destroy state.
 * Style follows DESIGN.md: Layout overlay, max-w-md rounded-2xl panel,
 * hairline icon badge, one committed action and a secondary Cancel.
 */
export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  tone = "danger",
  error,
  onConfirm,
  onCancel,
}: Props) {
  const [submitting, setSubmitting] = useState(false);
  const actionsRef = useRef<HTMLDivElement | null>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);

  const cancel = useCallback(() => {
    if (!submitting) onCancel();
  }, [onCancel, submitting]);

  const cancelRef = useRef(cancel);

  // Keep the latest callback without mutating a ref during render.
  useEffect(() => {
    cancelRef.current = cancel;
  }, [cancel]);

  useEffect(() => {
    if (!open) return;
    restoreFocusRef.current = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Destructive actions default focus to Cancel so Enter cannot delete.
    actionsRef.current?.querySelector<HTMLButtonElement>("button")?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        cancelRef.current();
      }
    };
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      restoreFocusRef.current?.focus?.();
    };
  }, [open]);

  const confirm = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await onConfirm();
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  const badgeClass =
    tone === "danger"
      ? "h-12 w-12 shrink-0 rounded-full bg-red-500/10 text-red-600 flex items-center justify-center"
      : "h-12 w-12 shrink-0 rounded-full bg-yellow-600/20 text-yellow-600 flex items-center justify-center";

  return (
    <Layout onClick={cancel}>
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="formo-confirm-title"
        aria-describedby="formo-confirm-description"
        className="w-full max-w-md rounded-3xl bg-white p-5 shadow-2xl dark:bg-zinc-950 sm:p-6"
      >
        <div className="flex items-start gap-3">
          <span className={badgeClass} aria-hidden="true">
            <Icon name={tone === "danger" ? "Trash" : "HelpCircle"} size={20} strokeWidth={2} />
          </span>
          <div className="grid grid-cols-1 gap-1">
            <h2
              id="formo-confirm-title"
              className="text-lg font-semibold text-zinc-900 dark:text-zinc-100"
            >
              {title}
            </h2>
            <p
              id="formo-confirm-description"
              className="text-sm leading-5 text-zinc-600 dark:text-zinc-400"
            >
              {description}
            </p>
          </div>
        </div>

        {error && (
          <p role="alert" className="text-xs text-red-600 dark:text-red-400">
            {error}
          </p>
        )}

        <div ref={actionsRef} className="grid grid-cols-2 gap-3 pt-5">
          <FormButton type="button" variant="secondary" onClick={cancel}>
            {cancelLabel}
          </FormButton>
          <FormButton
            type="button"
            variant={tone === "danger" ? "danger" : "primary"}
            onClick={() => void confirm()}
            disabled={submitting}
          >
            {submitting ? (
              <Icon name="Loader" size={16} className="animate-spin" aria-hidden="true" />
            ) : (
              confirmLabel
            )}
          </FormButton>
        </div>
      </section>
    </Layout>
  );
}
