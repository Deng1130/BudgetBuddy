"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Receipt, RefreshCw, Settings, Wallet } from "lucide-react";

const NAV_ITEMS = [
  { name: "Home", href: "/dashboard", icon: Home },
  { name: "Expenses", href: "/dashboard/expenses", icon: Receipt },
  { name: "Bills", href: "/dashboard/bills", icon: RefreshCw },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

export function SideRail() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex flex-col items-center w-20 h-screen fixed top-0 left-0 border-r border-border bg-bg-primary py-8 z-50">
      <div className="mb-12">
        <div className="w-10 h-10 bg-accent-500 rounded-xl flex items-center justify-center shadow-lg shadow-accent-500/30 text-white">
          <Wallet className="w-6 h-6" />
        </div>
      </div>
      
      <nav className="flex flex-col items-center gap-6 flex-1">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <div key={item.name} className="relative group">
              <Link
                href={item.href}
                className={`flex items-center justify-center w-12 h-12 rounded-2xl transition-all duration-300 ${
                  isActive 
                    ? "bg-accent-500/10 text-accent-500 shadow-inner" 
                    : "text-text-muted hover:bg-bg-secondary hover:text-text-primary"
                }`}
              >
                <item.icon className={`w-6 h-6 ${isActive ? "scale-110 drop-shadow-[0_0_8px_var(--color-accent-500)]" : ""}`} />
              </Link>
              
              {/* Tooltip */}
              <div className="absolute left-full ml-4 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-text-primary text-bg-primary text-xs font-semibold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-lg">
                {item.name}
              </div>
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
