"use client";

import React, { createContext, useContext, useEffect, useState, useSyncExternalStore } from 'react';
import { ACCENT_COLORS, AccentName } from './colors';

type ThemeMode = 'light' | 'dark';

interface ThemeContextType {
  mode: ThemeMode;
  accent: AccentName;
  toggleMode: () => void;
  setAccent: (name: AccentName) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const emptySubscribe = () => () => {};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);

  const [mode, setModeState] = useState<ThemeMode>(() => {
    if (typeof window === 'undefined') return 'light';
    const savedMode = localStorage.getItem('budgetbuddy-theme-mode') as ThemeMode;
    if (savedMode) return savedMode;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  const [accent, setAccentState] = useState<AccentName>(() => {
    if (typeof window === 'undefined') return 'emerald';
    const savedAccent = localStorage.getItem('budgetbuddy-accent') as AccentName;
    return savedAccent && Object.keys(ACCENT_COLORS).includes(savedAccent) ? savedAccent : 'emerald';
  });

  // Update DOM when mode/accent changes
  useEffect(() => {
    if (!mounted) return;

    const root = document.documentElement;
    
    // Set theme mode
    root.setAttribute('data-theme', mode);
    localStorage.setItem('budgetbuddy-theme-mode', mode);
    
    // Set accent colors
    const palette = ACCENT_COLORS[accent];
    Object.entries(palette).forEach(([shade, color]) => {
      root.style.setProperty(`--accent-${shade}`, color);
    });
    localStorage.setItem('budgetbuddy-accent', accent);
    
  }, [mode, accent, mounted]);

  const toggleMode = () => {
    setModeState((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const setAccent = (name: AccentName) => {
    setAccentState(name);
  };

  return (
    <ThemeContext.Provider value={{ mode, accent, toggleMode, setAccent }}>
      {/* Hide children until client has hydrated to prevent flash of unstyled content */}
      <div style={{ visibility: mounted ? 'visible' : 'hidden' }}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
