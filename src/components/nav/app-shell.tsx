"use client";

import React from "react";
import { BottomTabBar } from "./bottom-tab-bar";
import { SideRail } from "./side-rail";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // If we wanted route transitions, we can use framer-motion here
  return (
    <div className="flex min-h-screen bg-bg-secondary selection:bg-accent-500/30">
      <SideRail />
      <BottomTabBar />
      
      {/* Main content area */}
      <main className="flex-1 md:pl-20 pb-24 md:pb-0 w-full overflow-x-hidden relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="min-h-full"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
