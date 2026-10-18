'use client';

import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { ExpenseFormModal } from '@/components/expenses/expense-form';

export function DashboardQuickAdd() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsModalOpen(true)}
        className="w-full text-left h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 rounded-3xl"
        aria-label="Quick add new expense"
      >
        <Card
          variant="glass"
          className="p-6 h-full flex flex-col items-center justify-center text-center space-y-4 hover:border-accent-500/50 hover:bg-bg-card transition-all cursor-pointer group shadow-sm"
        >
          <div className="w-16 h-16 rounded-full bg-accent-500/10 flex items-center justify-center text-accent-500 group-hover:scale-110 group-hover:bg-accent-500 group-hover:text-white transition-all duration-300 shadow-sm">
            <Plus className="w-8 h-8" />
          </div>
          <div>
            <h3 className="font-semibold text-lg text-text-primary group-hover:text-accent-500 transition-colors">
              Add Expense
            </h3>
            <p className="text-sm text-text-muted">Tap to record</p>
          </div>
        </Card>
      </button>

      <ExpenseFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
