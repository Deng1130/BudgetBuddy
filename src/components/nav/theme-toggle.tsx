"use client";

import React from "react";
import { useTheme } from "@/lib/theme/use-theme";
import { useMounted } from "@/lib/hooks/use-mounted";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const { mode, toggleMode } = useTheme();
  const mounted = useMounted();

  if (!mounted) {
    return (
      <div
        className="w-16 h-8 rounded-full bg-bg-card/90 backdrop-blur-md border border-border p-1 shadow-sm"
        aria-hidden="true"
      />
    );
  }

  const isDark = mode === "dark";

  return (
    <button
      type="button"
      onClick={toggleMode}
      aria-label={`Switch to ${isDark ? "light" : "dark"} theme`}
      title={`Switch to ${isDark ? "light" : "dark"} theme`}
      className="relative w-16 h-8 rounded-full bg-bg-card/90 backdrop-blur-md border border-border p-1 transition-all duration-300 hover:border-accent-500/50 shadow-sm hover:shadow focus:outline-none focus:ring-2 focus:ring-accent-500/50 cursor-pointer"
    >
      {/* Background track icons */}
      <div className="absolute inset-0 flex items-center justify-between px-2 pointer-events-none text-text-muted/60">
        <Sun className="w-3.5 h-3.5" />
        <Moon className="w-3.5 h-3.5" />
      </div>

      {/* Sliding Knob */}
      <div
        className={`absolute top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 ${
          isDark
            ? "left-[34px] bg-accent-500 text-white shadow-sm"
            : "left-1 bg-white text-yellow-500 shadow-sm"
        }`}
      >
        {isDark ? (
          <Moon className="w-3.5 h-3.5" />
        ) : (
          <Sun className="w-3.5 h-3.5" />
        )}
      </div>
    </button>
  );
}
