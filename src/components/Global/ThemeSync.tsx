"use client";
import { useEffect } from "react";
import { applyTheme, getStoredTheme, THEME_STORAGE_KEY } from "@/lib/theme";

/**
 * Keeps the root `.dark` class in sync with the stored preference. In "system"
 * mode it follows the device live; explicit light/dark choices are left alone.
 */
export default function ThemeSync() {
  useEffect(() => {
    applyTheme(getStoredTheme());

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onSystemChange = () => {
      if (getStoredTheme() === "system") applyTheme("system", true);
    };
    const onStorage = (event: StorageEvent) => {
      if (event.key === THEME_STORAGE_KEY) applyTheme(getStoredTheme(), true);
    };

    media.addEventListener("change", onSystemChange);
    window.addEventListener("storage", onStorage);
    return () => {
      media.removeEventListener("change", onSystemChange);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  return null;
}
