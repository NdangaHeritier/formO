export type ThemeMode = "light" | "system" | "dark";

export const THEME_STORAGE_KEY = "formo-theme";
export const THEME_CHANGE_EVENT = "formo-theme-change";

export function getStoredTheme(): ThemeMode {
  try {
    const value = localStorage.getItem(THEME_STORAGE_KEY);
    if (value === "light" || value === "dark" || value === "system") return value;
  } catch {
    // localStorage can be unavailable (private mode / blocked cookies).
  }
  return "system";
}

function systemPrefersDark(): boolean {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

let pendingFrame: number | undefined;
let transitionTimer: number | undefined;

/**
 * Applies a theme mode to the root element. Animations touch only html/body
 * and run inside one frame, so switching stays cheap even on long pages.
 */
export function applyTheme(mode: ThemeMode, animate = false): void {
  const dark = mode === "dark" || (mode === "system" && systemPrefersDark());
  const root = document.documentElement;

  const commit = () => {
    root.classList.toggle("dark", dark);
    root.style.colorScheme = dark ? "dark" : "light";
  };

  if (pendingFrame !== undefined) cancelAnimationFrame(pendingFrame);
  if (transitionTimer !== undefined) window.clearTimeout(transitionTimer);
  pendingFrame = undefined;
  transitionTimer = undefined;

  if (!animate) {
    root.classList.remove("theme-transition");
    commit();
    return;
  }

  // Let the browser commit the transition class before changing colors.
  root.classList.add("theme-transition");
  pendingFrame = requestAnimationFrame(() => {
    pendingFrame = undefined;
    commit();
    transitionTimer = window.setTimeout(() => {
      root.classList.remove("theme-transition");
      transitionTimer = undefined;
    }, 200);
  });
}

/** Persists the user's choice so it survives reloads and the pre-paint script. */
export function setTheme(mode: ThemeMode): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, mode);
  } catch {
    // Still apply the theme for this page view if storage is unavailable.
  }
  applyTheme(mode, true);
  window.dispatchEvent(new CustomEvent<ThemeMode>(THEME_CHANGE_EVENT, { detail: mode }));
}
