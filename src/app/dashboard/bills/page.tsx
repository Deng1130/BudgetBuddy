import { requireUser } from "@/lib/auth";
import { getRecurringBills, getUpcomingInstances } from "@/lib/data/recurring-bills";
import { BillsView } from "@/components/bills/bills-view";

export default async function BillsPage() {
  const user = await requireUser();

  const [{ data: bills }, { data: upcomingInstances }] = await Promise.all([
    getRecurringBills(user.id),
    getUpcomingInstances(user.id, { daysAhead: 30 }),
  ]);

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <header className="space-y-1">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-text-primary">
          Recurring Bills
        </h1>
        <p className="text-text-secondary text-sm md:text-base">
          Track subscriptions, monitor due dates, and automate your scheduled payments.
        </p>
      </header>

      {/* Main Bills View */}
      <BillsView
        initialBills={bills || []}
        upcomingInstances={upcomingInstances || []}
      />
    </div>
  );
}
