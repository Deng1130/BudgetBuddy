'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Dashboard error captured:', error);
  }, [error]);

  return (
    <div className="p-6 md:p-8 max-w-xl mx-auto flex items-center justify-center min-h-[50vh]">
      <Card
        variant="glass"
        className="p-8 text-center space-y-4 border border-border/80 rounded-3xl w-full"
      >
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-text-primary">Something went wrong</h2>
          <p className="text-sm text-text-muted">
            {error.message || 'An unexpected error occurred while loading this page.'}
          </p>
        </div>
        <div className="pt-2 flex justify-center gap-3">
          <Button onClick={() => reset()} className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Try again
          </Button>
        </div>
      </Card>
    </div>
  );
}
