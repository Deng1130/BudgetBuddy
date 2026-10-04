"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { ACCENT_COLORS, AccentName } from './colors';

type ThemeMode = 'light' | 'dark';

interface ThemeContextType {
  mode: ThemeMode;
  accent: AccentName;
  toggleMode: () => void;
  setAccent: (name: AccentName) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>('light');
  const [accent, setAccentState] = useState<AccentName>('emerald');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Mount phase
    setMounted(true);
    
    // Load persisted state
    const savedMode = localStorage.getItem('budgetbuddy-theme-mode') as ThemeMode;
    const savedAccent = localStorage.getItem('budgetbuddy-accent') as AccentName;
    
    if (savedMode) {
      setModeState(savedMode);
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setModeState(prefersDark ? 'dark' : 'light');
    }
    
    if (savedAccent && Object.keys(ACCENT_COLORS).includes(savedAccent)) {
      setAccentState(savedAccent);
    }
  }, []);

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

  // Prevent flash of unstyled content
  if (!mounted) {
    return <div style={{ visibility: 'hidden' }}>{children}</div>;
  }

  return (
    <ThemeContext.Provider value={{ mode, accent, toggleMode, setAccent }}>
      {children}
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
