import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getUser } from "@/lib/auth";
import { getMonthlyTotal, getExpenses, getExpensesByCategory } from "@/lib/data/expenses";
import { getMonthlyBillsTotal, getUpcomingInstances } from "@/lib/data/recurring-bills";
import { CATEGORIES, formatCurrency, formatExpenseDate } from "@/lib/constants/categories";
import { DashboardQuickAdd } from "@/components/dashboard/dashboard-quick-add";
import { Zap, ShoppingBag, ChevronRight, PieChart, Calendar } from "lucide-react";
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

  // Current year & month for data queries (Month is 1-indexed for our DAL)
  const currentYear = dateObj.getFullYear();
  const currentMonth = dateObj.getMonth() + 1;

  // Live queries using the Data Access Layer
  const userId = user?.id || "";
  const [
    { total: monthlyTotal },
    { total: monthlyBillsTotal },
    { data: recentExpenses },
    { data: upcomingBills },
    { data: categoryBreakdown },
  ] = await Promise.all([
    userId ? getMonthlyTotal(userId, currentYear, currentMonth) : Promise.resolve({ total: 0 }),
    userId ? getMonthlyBillsTotal(userId, currentYear, currentMonth) : Promise.resolve({ total: 0 }),
    userId ? getExpenses(userId, { limit: 5 }) : Promise.resolve({ data: [] }),
    userId ? getUpcomingInstances(userId, { limit: 3 }) : Promise.resolve({ data: [] }),
    userId
      ? getExpensesByCategory(userId, currentYear, currentMonth)
      : Promise.resolve({ data: [] }),
  ]);

  // Format parts of total for aesthetic typography
  const grandTotal = monthlyTotal + monthlyBillsTotal;
  const formattedAmountParts = grandTotal.toFixed(2).split(".");
  const integerPart = Number(formattedAmountParts[0]).toLocaleString();
  const decimalPart = formattedAmountParts[1];

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
        {/* Summary Card (Connected to live getMonthlyTotal & getMonthlyBillsTotal) */}
        <Card
          variant="accent"
          className="md:col-span-2 lg:col-span-2 row-span-2 p-6 flex flex-col justify-between relative overflow-hidden group"
        >
          <div className="relative z-10 space-y-2">
            <h2 className="text-lg font-medium text-text-primary/80">This Month&apos;s Total</h2>
            <div className="text-5xl font-extrabold tracking-tighter">
              ₱{integerPart}
              <span className="text-2xl text-text-muted font-bold">.{decimalPart}</span>
            </div>
            <p className="text-sm font-medium text-emerald-500 bg-emerald-500/10 inline-flex px-2 py-1 rounded-full">
              {grandTotal > 0 ? "Tracking active" : "No expenses or bills yet"}
            </p>
          </div>
          <div className="relative z-10 flex gap-8 mt-8 pt-6 border-t border-accent-500/10">
            <div>
              <p className="text-xs text-text-muted font-medium mb-1">Spent</p>
              <p className="font-semibold text-lg">{formatCurrency(monthlyTotal)}</p>
            </div>
            <div>
              <p className="text-xs text-text-muted font-medium mb-1">Upcoming Bills</p>
              <p className="font-semibold text-lg text-accent-500">{formatCurrency(monthlyBillsTotal)}</p>
            </div>
          </div>
          {/* Decorative blur */}
          <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-accent-500/20 rounded-full blur-3xl group-hover:bg-accent-500/30 transition-colors duration-500" />
        </Card>

        {/* Quick Add (Client Component with in-place modal trigger) */}
        <DashboardQuickAdd />

        {/* Upcoming Bills (Connected to live getUpcomingInstances) */}
        <Card variant="default" className="md:col-span-1 lg:col-span-1 row-span-2 p-6 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-sm sm:text-base">Upcoming Bills</h3>
              <Link href="/dashboard/bills">
                <Button variant="ghost" size="sm" className="h-8 px-2 text-xs">
                  See all
                </Button>
              </Link>
            </div>

            {upcomingBills && upcomingBills.length > 0 ? (
              <div className="space-y-3">
                {upcomingBills.map((inst) => {
                  const meta =
                    CATEGORIES[inst.bill?.category || "subscriptions"] ||
                    CATEGORIES.subscriptions;
                  const Icon = meta.icon;

                  return (
                    <div
                      key={inst.id}
                      className="p-3 rounded-2xl bg-bg-secondary/40 border border-border/50 flex items-center justify-between gap-3 hover:border-accent-500/30 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${meta.bgColor} ${meta.textColor} ${meta.borderBadge}`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-xs text-text-primary truncate">
                            {inst.bill?.title || "Recurring Bill"}
                          </p>
                          <p className="text-[11px] text-text-muted flex items-center gap-1 mt-0.5">
                            <Calendar className="w-3 h-3" />
                            {formatExpenseDate(inst.due_date)}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="font-extrabold text-xs text-text-primary block">
                          {formatCurrency(inst.amount)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-4 py-8 flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 rounded-full bg-bg-secondary flex items-center justify-center mb-1">
                  <Zap className="w-5 h-5 text-text-muted" />
                </div>
                <p className="text-sm font-medium text-text-primary">No upcoming bills</p>
                <p className="text-xs text-text-muted">You&apos;re all caught up!</p>
              </div>
            )}
          </div>

          <Link href="/dashboard/bills" className="w-full mt-4 block">
            <Button variant="secondary" className="w-full text-xs">
              Manage Bills
            </Button>
          </Link>
        </Card>

        {/* Recent Expenses (Connected to live getExpenses) */}
        <Card variant="default" className="md:col-span-2 lg:col-span-2 p-6 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold">Recent Expenses</h3>
              <Link href="/dashboard/expenses">
                <Button variant="ghost" size="sm" className="h-8 px-2 text-xs gap-1">
                  <span>View history</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </div>

            {recentExpenses && recentExpenses.length > 0 ? (
              <div className="divide-y divide-border/40">
                {recentExpenses.map((expense) => {
                  const meta = CATEGORIES[expense.category] || CATEGORIES.other;
                  const Icon = meta.icon;

                  return (
                    <div
                      key={expense.id}
                      className="py-3 flex items-center justify-between gap-3 first:pt-0 last:pb-0"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${meta.bgColor} ${meta.textColor} ${meta.borderBadge}`}
                        >
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-sm text-text-primary truncate">
                            {expense.title}
                          </p>
                          <p className="text-xs text-text-muted">
                            {formatExpenseDate(expense.expense_date)} &bull; {meta.label}
                          </p>
                        </div>
                      </div>

                      <span className="font-bold text-sm text-text-primary shrink-0">
                        {formatCurrency(expense.amount)}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-3 py-6 flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 rounded-full bg-bg-secondary flex items-center justify-center mb-1">
                  <ShoppingBag className="w-5 h-5 text-text-muted" />
                </div>
                <p className="text-sm font-medium text-text-primary">No recent expenses</p>
                <p className="text-xs text-text-muted">When you add expenses, they&apos;ll show up here.</p>
              </div>
            )}
          </div>
        </Card>

        {/* Category Breakdown (Connected to live getExpensesByCategory) */}
        <Card variant="glass" className="p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-sm text-text-primary flex items-center gap-2">
                <PieChart className="w-4 h-4 text-accent-500" />
                Top Categories
              </h3>
              <span className="text-[11px] text-text-muted">This Month</span>
            </div>

            {categoryBreakdown && categoryBreakdown.length > 0 ? (
              <div className="space-y-3">
                {categoryBreakdown.slice(0, 3).map((item) => {
                  const meta = CATEGORIES[item.category] || CATEGORIES.other;
                  const percent =
                    monthlyTotal > 0
                      ? Math.round((item.total / monthlyTotal) * 100)
                      : 0;

                  return (
                    <div key={item.category} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-text-primary font-medium">{meta.label}</span>
                        <span className="text-text-muted font-medium">{percent}%</span>
                      </div>
                      <div className="w-full bg-bg-secondary h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-accent-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-6 flex flex-col items-center justify-center text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-bg-secondary flex items-center justify-center text-text-muted">
                  <PieChart className="w-5 h-5 opacity-40" />
                </div>
                <p className="text-xs text-text-muted">No categorized expenses this month.</p>
              </div>
            )}
          </div>

          <Link href="/dashboard/expenses" className="text-xs text-accent-500 font-semibold hover:underline mt-4 block">
            View full breakdown &rarr;
          </Link>
        </Card>
      </div>
    </div>
  );
}
