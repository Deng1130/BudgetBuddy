"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Receipt, RefreshCw, Settings } from "lucide-react";

const NAV_ITEMS = [
  { name: "Home", href: "/dashboard", icon: Home },
  { name: "Expenses", href: "/dashboard/expenses", icon: Receipt },
  { name: "Bills", href: "/dashboard/bills", icon: RefreshCw },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

export function BottomTabBar() {
  const pathname = usePathname();

  return (
    <div className="md:hidden fixed bottom-6 left-6 right-6 z-50">
      <nav className="flex items-center justify-around bg-card/80 backdrop-blur-xl border border-border/50 rounded-2xl p-3 shadow-lg shadow-shadow">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-300 ${
                isActive ? "text-accent-500 scale-110" : "text-text-muted hover:text-text-primary"
              }`}
            >
              <item.icon className={`w-6 h-6 ${isActive ? "drop-shadow-[0_0_8px_var(--color-accent-500)]" : ""}`} />
              <span className="text-[10px] font-medium tracking-wide">
                {item.name}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
