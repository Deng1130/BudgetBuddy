"use client";

import React from "react";
import { BottomTabBar } from "./bottom-tab-bar";
import { SideRail } from "./side-rail";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { ThemeToggle } from "./theme-toggle";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const isSettingsPage = pathname === "/dashboard/settings" || pathname.startsWith("/dashboard/settings/");

  // If we wanted route transitions, we can use framer-motion here
  return (
    <div className="flex min-h-screen bg-bg-secondary selection:bg-accent-500/30">
      <SideRail />
      <BottomTabBar />

      {/* Floating Theme Mode Switch at Upper Right (hidden on Settings page to avoid redundancy) */}
      {!isSettingsPage && (
        <div className="fixed top-4 right-4 md:top-6 md:right-8 z-40">
          <ThemeToggle />
        </div>
      )}
      
      {/* Main content area */}
      <main className="flex-1 md:pl-20 pb-24 md:pb-0 w-full overflow-x-hidden relative">
        <motion.div
          key={pathname}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="min-h-full"
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}
