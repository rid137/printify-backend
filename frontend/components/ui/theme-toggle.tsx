"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/lib/theme";

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const dark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      aria-pressed={dark}
      className="relative inline-flex h-9 w-16 items-center rounded-full border border-line bg-surface-muted px-1"
    >
      <span
        className={`flex h-7 w-7 items-center justify-center rounded-full bg-surface text-ink-text shadow-[var(--shadow-card)] transition ${
          dark ? "translate-x-7" : "translate-x-0"
        }`}
      >
        {dark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
      </span>
    </button>
  );
}
