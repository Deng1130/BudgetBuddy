"use client";

import React from "react";
import { BottomTabBar } from "./bottom-tab-bar";
import { SideRail } from "./side-rail";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // If we wanted route transitions, we can use framer-motion here
  return (
    <div className="flex min-h-screen bg-bg-secondary selection:bg-accent-500/30">
      <SideRail />
      <BottomTabBar />
      
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
