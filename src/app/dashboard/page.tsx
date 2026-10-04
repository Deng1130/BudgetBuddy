import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getUser } from "@/lib/auth";
import { Plus, Coffee, ShoppingBag, Zap, CreditCard, ChevronRight } from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
  const user = await getUser();
  const firstName = user?.user_metadata?.full_name?.split(" ")[0] || "there";
  
  const dateObj = new Date();
  
  // Format date in PH timezone
  const today = new Intl.DateTimeFormat("en-PH", {
    timeZone: "Asia/Manila",
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(dateObj);

  // Determine greeting based on PH hour
  const hourString = new Intl.DateTimeFormat("en-PH", {
    timeZone: "Asia/Manila",
    hour: "numeric",
    hourCycle: "h23",
  }).format(dateObj);
  
  const hour = parseInt(hourString, 10);
  let greeting = "Good evening";
  if (hour < 12) {
    greeting = "Good morning";
  } else if (hour < 18) {
    greeting = "Good afternoon";
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header Area */}
      <header className="space-y-1">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
          {greeting}, {firstName} <span className="inline-block animate-waving-hand">👋</span>
        </h1>
        <p className="text-text-secondary">{today}</p>
      </header>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 auto-rows-[minmax(180px,auto)]">
        
        {/* Summary Card */}
        <Card variant="accent" className="md:col-span-2 lg:col-span-2 row-span-2 p-6 flex flex-col justify-between relative overflow-hidden group">
          <div className="relative z-10 space-y-2">
            <h2 className="text-lg font-medium text-text-primary/80">This Month</h2>
            <div className="text-5xl font-extrabold tracking-tighter">
              ₱0<span className="text-2xl text-text-muted font-bold">.00</span>
            </div>
            <p className="text-sm font-medium text-emerald-500 bg-emerald-500/10 inline-flex px-2 py-1 rounded-full">
              ₱0 remaining
            </p>
          </div>
          <div className="relative z-10 flex gap-4 mt-8 pt-6 border-t border-accent-500/10">
            <div>
              <p className="text-xs text-text-muted font-medium mb-1">Spent</p>
              <p className="font-semibold text-lg">₱0</p>
            </div>
            <div>
              <p className="text-xs text-text-muted font-medium mb-1">Bills</p>
              <p className="font-semibold text-lg">₱0</p>
            </div>
          </div>
          {/* Decorative blur */}
          <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-accent-500/20 rounded-full blur-3xl group-hover:bg-accent-500/30 transition-colors duration-500"></div>
        </Card>

        {/* Quick Add */}
        <Link href="/dashboard/expenses" className="block">
          <Card variant="glass" className="p-6 h-full flex flex-col items-center justify-center text-center space-y-4 hover:border-accent-500/50 transition-colors cursor-pointer group">
            <div className="w-16 h-16 rounded-full bg-accent-500/10 flex items-center justify-center text-accent-500 group-hover:scale-110 transition-transform duration-300">
              <Plus className="w-8 h-8" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Add Expense</h3>
              <p className="text-sm text-text-muted">Tap to record</p>
            </div>
          </Card>
        </Link>

        {/* Upcoming Bills */}
        <Card variant="default" className="md:col-span-1 lg:col-span-1 row-span-2 p-6 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-semibold">Upcoming Bills</h3>
            <Link href="/dashboard/bills">
              <Button variant="ghost" size="sm" className="h-8 px-2 text-xs">See all</Button>
            </Link>
          </div>
          <div className="space-y-4 flex-1 flex flex-col items-center justify-center text-center py-6">
            <div className="w-12 h-12 rounded-full bg-bg-secondary flex items-center justify-center mb-3">
              <Zap className="w-5 h-5 text-text-muted" />
            </div>
            <p className="text-sm font-medium text-text-primary">No upcoming bills</p>
            <p className="text-xs text-text-muted mt-1">You're all caught up!</p>
          </div>
          <Link href="/dashboard/bills" className="w-full mt-4 block">
            <Button variant="secondary" className="w-full">Pay Bills</Button>
          </Link>
        </Card>

        {/* Recent Expenses */}
        <Card variant="default" className="md:col-span-2 lg:col-span-2 p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-semibold">Recent Expenses</h3>
            <Link href="/dashboard/expenses">
              <Button variant="ghost" size="sm" className="h-8 px-2 text-xs">View history</Button>
            </Link>
          </div>
          <div className="space-y-4 py-8 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-full bg-bg-secondary flex items-center justify-center mb-3">
              <ShoppingBag className="w-5 h-5 text-text-muted" />
            </div>
            <p className="text-sm font-medium text-text-primary">No recent expenses</p>
            <p className="text-xs text-text-muted mt-1">When you add expenses, they'll show up here.</p>
          </div>
        </Card>
        
        {/* Category Breakdown Placeholder */}
        <Card variant="glass" className="p-6 flex flex-col justify-center items-center text-center space-y-2 border-dashed border-2 border-border/60 hover:border-accent-500/30 transition-colors">
          <div className="w-16 h-16 rounded-full border-4 border-accent-500 border-t-transparent animate-spin-slow opacity-20"></div>
          <h3 className="font-medium text-text-secondary mt-4">Category Breakdown</h3>
          <p className="text-xs text-text-muted">Coming soon</p>
        </Card>
        
      </div>
    </div>
  );
}
