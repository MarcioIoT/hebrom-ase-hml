import { useSyncExternalStore, useCallback } from "react";

type Theme = "light" | "dark";
const KEY = "ase.theme";
const listeners = new Set<() => void>();

function current(): Theme {
  if (typeof document === "undefined") return "light";
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function apply(theme: Theme) {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  try {
    localStorage.setItem(KEY, theme);
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l());
}

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, current, () => "light" as Theme);
  const toggle = useCallback(() => {
    apply(current() === "dark" ? "light" : "dark");
  }, []);
  return { theme, toggle };
}

// Inline script string injected in the document head to prevent theme flash.
export const themeInitScript = `(function(){try{var t=localStorage.getItem("${KEY}");var d=t?t==="dark":window.matchMedia("(prefers-color-scheme: dark)").matches;if(d)document.documentElement.classList.add("dark");}catch(e){}})();`;
