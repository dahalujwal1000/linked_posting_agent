"use client";

import { useCallback, useSyncExternalStore } from "react";
import { Moon, Sun } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "signalpost-theme";

/**
 * Reads the `.dark` class that the inline script in src/app/layout.tsx already resolved before React
 * booted, and mirrors it into React state. Subscribing to the attribute keeps the DOM as the single
 * source of truth, so there is no setState-in-effect and no hydration mismatch.
 */
function subscribe(onStoreChange: () => void) {
  const observer = new MutationObserver(onStoreChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  return () => observer.disconnect();
}

function getSnapshot() {
  return document.documentElement.classList.contains("dark");
}

/** The server cannot know the resolved theme; the inline script corrects this before first paint. */
function getServerSnapshot() {
  return false;
}

export function ThemeToggle({ className }: { className?: string }) {
  const isDark = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const toggle = useCallback(() => {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem(STORAGE_KEY, next ? "dark" : "light");
    } catch {
      /* storage can be unavailable in private modes; the toggle still works for this session */
    }
  }, []);

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      aria-pressed={isDark}
      className={cn("grid size-9 place-items-center rounded-lg hover:bg-black/5 dark:hover:bg-white/5", className)}
    >
      {isDark ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  );
}

