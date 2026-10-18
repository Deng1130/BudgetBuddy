import { requireUser } from "@/lib/auth";
import { getExpenses } from "@/lib/data/expenses";
import { ExpensesView } from "@/components/expenses/expenses-view";

export default async function ExpensesPage() {
  const user = await requireUser();
  const { data: expenses } = await getExpenses(user.id, { limit: 50 });

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6">
      {/* Page Header */}
      <header className="space-y-1">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-text-primary">
          Expenses
        </h1>
        <p className="text-text-secondary text-sm md:text-base">
          Track, categorize, and monitor your personal expenditures.
        </p>
      </header>

      {/* Main Expenses View (Filters, Stats, Cards, Modal, FAB) */}
      <ExpensesView
        initialExpenses={expenses || []}
        currentUserId={user.id}
      />
    </div>
  );
}
