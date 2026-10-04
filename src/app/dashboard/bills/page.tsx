import { Card } from "@/components/ui/card";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function BillsPage() {
  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Recurring Bills</h1>
          <p className="text-text-secondary">Keep track of your subscriptions and monthly payments.</p>
        </div>
        <Button className="gap-2">
          <RefreshCw className="w-5 h-5" />
          Add Bill
        </Button>
      </header>
      
      <Card variant="glass" className="p-12 flex flex-col items-center justify-center text-center space-y-4 border-dashed border-2 border-border/60">
        <div className="w-16 h-16 rounded-full bg-accent-500/10 flex items-center justify-center text-accent-500">
          <RefreshCw className="w-8 h-8 opacity-50" />
        </div>
        <div>
          <h3 className="font-medium text-lg">No bills yet</h3>
          <p className="text-sm text-text-muted">Bills feature is coming soon in the next phase!</p>
        </div>
      </Card>
    </div>
  );
}
