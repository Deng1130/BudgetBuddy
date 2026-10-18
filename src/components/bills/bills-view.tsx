'use client';

import React, { useState, useMemo } from 'react';
import { Plus } from 'lucide-react';
import { RecurringBill } from '@/types/database';
import { UpcomingBillInstance } from '@/lib/data/recurring-bills';
import { BillCard } from './bill-card';
import { BillFormModal } from './bill-form';
import { UpcomingTimeline } from './upcoming-timeline';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { formatCurrency } from '@/lib/constants/categories';

interface BillsViewProps {
  initialBills: RecurringBill[];
  upcomingInstances: UpcomingBillInstance[];
}

export function BillsView({
  initialBills,
  upcomingInstances,
}: BillsViewProps) {
  const [filterMode, setFilterMode] = useState<'active' | 'all'>('active');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBill, setEditingBill] = useState<RecurringBill | null>(null);

  // Map each bill to its closest upcoming unpaid instance
  const nextInstanceByBill = useMemo(() => {
    const map: Record<string, UpcomingBillInstance> = {};
    for (const inst of upcomingInstances) {
      if (!map[inst.bill_id]) {
        map[inst.bill_id] = inst;
      }
    }
    return map;
  }, [upcomingInstances]);

  // Filter bills by active status
  const displayedBills = useMemo(() => {
    if (filterMode === 'active') {
      return initialBills.filter((b) => b.is_active);
    }
    return initialBills;
  }, [initialBills, filterMode]);

  // Total active monthly committed bills
  const activeMonthlyEstimate = useMemo(() => {
    return initialBills
      .filter((b) => b.is_active)
      .reduce((sum, b) => {
        let monthlyEquiv = b.amount;
        if (b.frequency === 'daily') monthlyEquiv = b.amount * 30;
        else if (b.frequency === 'weekly') monthlyEquiv = (b.amount * 52) / 12;
        else if (b.frequency === 'biweekly') monthlyEquiv = (b.amount * 26) / 12;
        else if (b.frequency === 'monthly') monthlyEquiv = b.amount / b.interval_value;
        else if (b.frequency === 'quarterly') monthlyEquiv = b.amount / (3 * b.interval_value);
        else if (b.frequency === 'yearly') monthlyEquiv = b.amount / 12;
        return sum + monthlyEquiv;
      }, 0);
  }, [initialBills]);

  const handleEdit = (bill: RecurringBill) => {
    setEditingBill(bill);
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setEditingBill(null);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-8">
      {/* 30-Day Upcoming Timeline Component */}
      <UpcomingTimeline instances={upcomingInstances} />

      {/* Overview & Filter Bar */}
      <Card variant="glass" className="p-4 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">
              Committed Monthly Bills
            </span>
            <div className="flex items-baseline gap-3 mt-1">
              <span className="text-3xl sm:text-4xl font-extrabold text-text-primary tracking-tight">
                {formatCurrency(activeMonthlyEstimate)}
              </span>
              <span className="text-xs font-medium text-text-muted bg-bg-secondary px-2.5 py-1 rounded-full">
                {initialBills.filter((b) => b.is_active).length} active bills
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Active vs All filter toggle */}
            <div className="flex items-center bg-bg-secondary p-1 rounded-xl text-xs font-medium text-text-secondary">
              <button
                type="button"
                onClick={() => setFilterMode('active')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  filterMode === 'active'
                    ? 'bg-bg-card text-text-primary font-bold shadow-sm'
                    : 'hover:text-text-primary'
                }`}
              >
                Active Only
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('all')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  filterMode === 'all'
                    ? 'bg-bg-card text-text-primary font-bold shadow-sm'
                    : 'hover:text-text-primary'
                }`}
              >
                All Bills ({initialBills.length})
              </button>
            </div>

            <Button onClick={handleAddNew} className="gap-2 shadow-lg shadow-accent-500/20">
              <Plus className="w-4 h-4" />
              <span>Add Bill</span>
            </Button>
          </div>
        </div>
      </Card>

      {/* Recurring Bills List */}
      {displayedBills.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {displayedBills.map((bill) => (
            <BillCard
              key={bill.id}
              bill={bill}
              nextInstance={nextInstanceByBill[bill.id] || null}
              onEdit={handleEdit}
            />
          ))}
        </div>
      ) : (
        /* Friendly Empty State */
        <Card
          variant="glass"
          className="p-12 flex flex-col items-center justify-center text-center space-y-4 border-dashed border-2 border-border/80 rounded-3xl"
        >
          <div className="w-20 h-20 rounded-3xl bg-accent-500/10 flex items-center justify-center text-4xl shadow-inner">
            ⚡
          </div>
          <div className="max-w-md space-y-1">
            <h3 className="font-bold text-xl text-text-primary">
              {initialBills.length === 0
                ? 'No recurring bills yet — add your first one!'
                : 'No active bills found'}
            </h3>
            <p className="text-sm text-text-muted">
              {initialBills.length === 0
                ? 'Never miss a due date. Set up Netflix, rent, wifi, gym memberships, or insurance.'
                : 'All your bills are currently paused. Switch to "All Bills" to resume them.'}
            </p>
          </div>
          <Button onClick={handleAddNew} className="gap-2 mt-2">
            <Plus className="w-4 h-4" />
            Add Recurring Bill
          </Button>
        </Card>
      )}

      {/* Floating Action Button (+ FAB) */}
      <button
        type="button"
        onClick={handleAddNew}
        className="fixed bottom-24 sm:bottom-8 right-6 sm:right-8 z-40 w-14 h-14 rounded-2xl bg-accent-500 text-white shadow-xl shadow-accent-500/30 flex items-center justify-center hover:bg-accent-600 hover:scale-105 active:scale-95 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-accent-500/30 group"
        aria-label="Add new recurring bill"
      >
        <Plus className="w-7 h-7 group-hover:rotate-90 transition-transform duration-200" />
      </button>

      {/* Add / Edit Bill Modal */}
      <BillFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingBill(null);
        }}
        initialData={editingBill}
      />
    </div>
  );
}
