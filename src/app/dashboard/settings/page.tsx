"use client";

import { useTheme } from "@/lib/theme/use-theme";
import { ACCENT_COLORS, AccentName } from "@/lib/theme/colors";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Moon, Sun, Check, LogOut } from "lucide-react";
import { signOut } from "@/app/login/actions";

export default function SettingsPage() {
  const { mode, toggleMode, accent, setAccent } = useTheme();

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto space-y-8">
      <header className="space-y-1">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Settings</h1>
        <p className="text-text-secondary">Manage your preferences and account</p>
      </header>

      <div className="space-y-6">
        {/* Appearance Settings */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold px-2">Appearance</h2>
          
          <Card className="p-6 space-y-8">
            {/* Theme Mode */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Theme Mode</h3>
                <p className="text-sm text-text-muted">Switch between light and dark themes</p>
              </div>
              <button 
                onClick={toggleMode}
                className="relative w-16 h-8 rounded-full bg-bg-secondary border border-border p-1 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-accent-500"
              >
                <div className={`absolute top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 ${mode === 'dark' ? 'left-[34px] bg-accent-500 text-white' : 'left-1 bg-white text-yellow-500 shadow-sm'}`}>
                  {mode === 'dark' ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
                </div>
              </button>
            </div>

            <hr className="border-border/50" />

            {/* Accent Color */}
            <div>
              <div className="mb-4">
                <h3 className="font-medium">Accent Color</h3>
                <p className="text-sm text-text-muted">Choose your brand color</p>
              </div>
              <div className="flex flex-wrap gap-4">
                {(Object.entries(ACCENT_COLORS) as [AccentName, any][]).map(([name, palette]) => {
                  const isActive = accent === name;
                  return (
                    <button
                      key={name}
                      onClick={() => setAccent(name)}
                      className="group flex flex-col items-center gap-2 focus:outline-none"
                    >
                      <div 
                        className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${isActive ? 'scale-110 shadow-lg' : 'hover:scale-105'}`}
                        style={{ 
                          backgroundColor: palette[500],
                          boxShadow: isActive ? `0 0 0 2px var(--color-bg-card), 0 0 0 4px ${palette[500]}` : 'none'
                        }}
                      >
                        {isActive && <Check className="w-5 h-5 text-white drop-shadow-md" />}
                      </div>
                      <span className={`text-xs font-medium capitalize ${isActive ? 'text-text-primary' : 'text-text-muted group-hover:text-text-primary'}`}>
                        {name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </Card>
        </section>

        {/* Account Settings */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold px-2">Account</h2>
          
          <Card className="p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="font-medium">Signed In As</h3>
                <p className="text-sm text-text-muted">user@example.com</p>
              </div>
              
              <Button variant="danger" size="sm" className="gap-2 self-start md:self-auto" onClick={() => signOut()}>
                <LogOut className="w-4 h-4" />
                Sign Out
              </Button>
            </div>
          </Card>
        </section>
        
      </div>
    </div>
  );
}
