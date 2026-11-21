"use client";
import { createElement } from "react";
import { Toast as HeroToast, toast as herouiToast } from "@heroui/react";
import { Icon, type LucideIconName } from "./Icon";

type HeroOptions = NonNullable<Parameters<typeof herouiToast>[1]>;

export type ToastType = "success" | "error" | "info" | "warning" | "loading";

export type ToastOptions = {
  description?: string;
  /** Auto-dismiss in ms; 0 keeps it open (loading toasts are persistent by default). */
  duration?: number;
  className?: string;
  icon?: LucideIconName;
};

export type PromiseMessages<T> = {
  loading: string;
  success: string | ((data: T) => string);
  error: string | ((error: Error) => string);
};

function heroOptions(type: ToastType, options: ToastOptions): HeroOptions {
  const variant = type === "error" ? "danger" : type === "loading" ? "default" : type;
  return {
    description: options.description,
    className: options.className,
    indicator: options.icon ? createElement(Icon, { name: options.icon, size: 18 }) : undefined,
    isLoading: type === "loading",
    timeout: options.duration ?? (type === "loading" ? 0 : 4000),
    variant,
  } as HeroOptions;
}

function show(type: ToastType, title: string, options: ToastOptions = {}): string {
  return herouiToast(title, heroOptions(type, options));
}

const success = (title: string, options: ToastOptions = {}) => show("success", title, options);
const error = (title: string, options: ToastOptions = {}) => show("error", title, options);
const info = (title: string, options: ToastOptions = {}) => show("info", title, options);
const warning = (title: string, options: ToastOptions = {}) => show("warning", title, options);
const loading = (title: string, options: ToastOptions = {}) => show("loading", title, options);
const dismiss = (id: string) => herouiToast.close(id);

async function promise<T>(
  input: Promise<T> | (() => Promise<T>),
  messages: PromiseMessages<T>
): Promise<T> {
  const pending = typeof input === "function" ? input() : input;
  const id = herouiToast(messages.loading, { isLoading: true, timeout: 0 });
  try {
    const result = await pending;
    const text =
      typeof messages.success === "function" ? messages.success(result) : messages.success;
    herouiToast.update(id, text, { variant: "success", timeout: 4000 } as HeroOptions);
    return result;
  } catch (cause) {
    const text =
      typeof messages.error === "function"
        ? messages.error(cause instanceof Error ? cause : new Error(String(cause)))
        : messages.error;
    herouiToast.update(id, text, { variant: "danger", timeout: 4000 } as HeroOptions);
    throw cause;
  }
}

/**
 * Thin wrapper around HeroUI's toaster keeping FormO's toast API:
 * toast.success/error/info/warning/loading/dismiss/promise.
 */
export const toast = { show, success, error, info, warning, loading, dismiss, promise };

export function ToastProvider() {
  return <HeroToast.Provider placement="bottom" />;
}

export function useToast() {
  return toast;
}
