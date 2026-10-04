import { Card } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ExpensesPage() {
  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Expenses</h1>
          <p className="text-text-secondary">Track and manage your spending.</p>
        </div>
        <Button className="gap-2">
          <Plus className="w-5 h-5" />
          Add Expense
        </Button>
      </header>
      
      <Card variant="glass" className="p-12 flex flex-col items-center justify-center text-center space-y-4 border-dashed border-2 border-border/60">
        <div className="w-16 h-16 rounded-full bg-accent-500/10 flex items-center justify-center text-accent-500">
          <Plus className="w-8 h-8 opacity-50" />
        </div>
        <div>
          <h3 className="font-medium text-lg">No expenses yet</h3>
          <p className="text-sm text-text-muted">Expenses feature is coming soon in the next phase!</p>
        </div>
      </Card>
    </div>
  );
}
