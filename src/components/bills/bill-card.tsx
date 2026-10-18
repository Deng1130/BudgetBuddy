'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  CheckCircle2,
  Clock,
  Edit3,
  Trash2,
  Power,
  AlertTriangle,
  Loader2,
  Check,
  ChevronDown,
} from 'lucide-react';
import { RecurringBill, RecurringBillInstance } from '@/types/database';
import { CATEGORIES, formatCurrency, formatExpenseDate } from '@/lib/constants/categories';
import { getRecurrenceDescription } from '@/lib/utils/recurrence';
import {
  deleteRecurringBillAction,
  toggleBillActiveAction,
  markPaidAction,
} from '@/app/dashboard/bills/actions';
import { Button } from '@/components/ui/button';

interface BillCardProps {
  bill: RecurringBill;
  nextInstance?: RecurringBillInstance | null;
  onEdit?: (bill: RecurringBill) => void;
  onDelete?: (id: string) => void;
}

export function BillCard({
  bill,
  nextInstance,
  onEdit,
  onDelete,
}: BillCardProps) {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isTogglingActive, setIsTogglingActive] = useState(false);
  const [isMarkingPaid, setIsMarkingPaid] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const categoryMeta = CATEGORIES[bill.category] || CATEGORIES.subscriptions;
  const CategoryIcon = categoryMeta.icon;

  const recurrenceText = getRecurrenceDescription(
    bill.frequency,
    bill.interval_value,
    bill.total_repetitions
  );

  const isInfinite = bill.total_repetitions === null || bill.total_repetitions === undefined;
  const completionPercent =
    !isInfinite && bill.total_repetitions && bill.total_repetitions > 0
      ? Math.min(100, Math.round((bill.repetitions_completed / bill.total_repetitions) * 100))
      : 0;

  // Toggle active state handler
  const handleToggleActive = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsTogglingActive(true);
    try {
      const res = await toggleBillActiveAction({
        id: bill.id,
        is_active: !bill.is_active,
      });
      if (!res.success) {
        alert(res.error || 'Failed to toggle bill status');
      } else {
        router.refresh();
      }
    } catch {
      alert('Error updating bill status');
    } finally {
      setIsTogglingActive(false);
    }
  };

  // Quick mark paid for next instance
  const handleMarkPaid = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!nextInstance || nextInstance.is_paid) return;
    setIsMarkingPaid(true);
    try {
      const res = await markPaidAction(nextInstance.id);
      if (!res.success) {
        alert(res.error || 'Failed to mark bill as paid');
      } else {
        router.refresh();
      }
    } catch {
      alert('Error marking bill paid');
    } finally {
      setIsMarkingPaid(false);
    }
  };

  // Delete handler
  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await deleteRecurringBillAction(bill.id);
      if (res.success) {
        setShowDeleteConfirm(false);
        router.refresh();
        onDelete?.(bill.id);
      } else {
        alert(res.error || 'Failed to delete bill');
      }
    } catch {
      alert('An error occurred while deleting');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div
        onClick={() => setIsExpanded((prev) => !prev)}
        className={`rounded-3xl border transition-all cursor-pointer overflow-hidden shadow-sm hover:shadow-md ${
          bill.is_active
            ? 'bg-bg-card border-border/80 hover:border-accent-500/40'
            : 'bg-bg-card/50 border-border/40 opacity-70'
        }`}
      >
        <div className="p-5 sm:p-6 space-y-4">
          {/* Top row: Category icon, Title, Active toggle, Amount */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3.5 min-w-0">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${categoryMeta.bgColor} ${categoryMeta.textColor} ${categoryMeta.borderBadge}`}
              >
                <CategoryIcon className="w-6 h-6" />
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold text-lg text-text-primary truncate">
                    {bill.title}
                  </h3>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                      bill.is_active
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                        : 'bg-slate-500/10 text-slate-500 border-slate-500/20'
                    }`}
                  >
                    {bill.is_active ? 'Active' : 'Paused'}
                  </span>
                </div>

                <p className="text-xs text-text-secondary mt-0.5 flex items-center gap-1.5 font-medium">
                  <Clock className="w-3.5 h-3.5 text-accent-500" />
                  <span>{recurrenceText}</span>
                </p>
              </div>
            </div>

            {/* Prominent Amount */}
            <div className="text-right shrink-0">
              <div className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight">
                {formatCurrency(bill.amount)}
              </div>
              <span className="text-[11px] text-text-muted capitalize">
                per {bill.frequency === 'biweekly' ? '2 weeks' : bill.frequency}
              </span>
            </div>
          </div>

          {/* Middle Row: Progress indicator & Next due date */}
          <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            {/* Repetitions Progress */}
            <div className="flex-1 max-w-sm">
              <div className="flex justify-between items-center mb-1 text-text-muted">
                <span className="font-medium">Progress</span>
                <span className="font-semibold text-text-secondary">
                  {isInfinite
                    ? '∞ Ongoing'
                    : `${bill.repetitions_completed} of ${bill.total_repetitions} completed`}
                </span>
              </div>

              <div className="w-full bg-bg-secondary h-2 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isInfinite ? 'bg-accent-500/50' : 'bg-accent-500'
                  }`}
                  initial={{ width: 0 }}
                  animate={{
                    width: isInfinite ? '100%' : `${completionPercent}%`,
                  }}
                />
              </div>
            </div>

            {/* Next Due Date & Quick Mark Paid button */}
            <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
              {nextInstance ? (
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <p className="text-[10px] text-text-muted uppercase tracking-wider font-semibold">
                      Next Due
                    </p>
                    <p className="font-bold text-xs text-text-primary flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-text-muted" />
                      {formatExpenseDate(nextInstance.due_date)}
                    </p>
                  </div>

                  <Button
                    type="button"
                    size="sm"
                    variant={nextInstance.is_paid ? 'ghost' : 'primary'}
                    disabled={isMarkingPaid || nextInstance.is_paid}
                    onClick={handleMarkPaid}
                    className="h-8 px-3 text-xs gap-1.5 shadow-sm"
                  >
                    {isMarkingPaid ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : nextInstance.is_paid ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-500" />
                        <span>Paid</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Mark Paid</span>
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <span className="text-xs text-text-muted italic">All caught up</span>
              )}
            </div>
          </div>
        </div>

        {/* Expandable Action Strip */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="border-t border-border/40 bg-bg-secondary/30 px-5 py-4 space-y-3"
            >
              {bill.notes && (
                <div className="text-xs">
                  <span className="font-semibold text-text-muted uppercase tracking-wider">
                    Notes:
                  </span>
                  <p className="mt-1 text-text-primary bg-bg-card p-3 rounded-xl border border-border/50">
                    {bill.notes}
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between pt-1 gap-2 flex-wrap">
                <span className="text-[11px] text-text-muted">
                  Started: {formatExpenseDate(bill.start_date)}
                </span>

                <div className="flex items-center gap-2">
                  {/* Pause / Resume Button */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={isTogglingActive}
                    onClick={handleToggleActive}
                    className="h-8 px-3 text-xs gap-1.5"
                  >
                    <Power className={`w-3.5 h-3.5 ${bill.is_active ? 'text-amber-500' : 'text-emerald-500'}`} />
                    <span>{bill.is_active ? 'Pause Bill' : 'Resume Bill'}</span>
                  </Button>

                  {/* Edit Button */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit?.(bill);
                    }}
                    className="h-8 px-3 text-xs gap-1.5 text-blue-500 hover:text-blue-600 hover:bg-blue-500/10"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </Button>

                  {/* Delete Button */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowDeleteConfirm(true);
                    }}
                    className="h-8 px-3 text-xs gap-1.5 text-red-500 hover:text-red-600 hover:bg-red-500/10"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Small expand toggle indicator */}
        <div className="py-1 flex justify-center bg-bg-secondary/20 hover:bg-bg-secondary/40 transition-colors">
          <ChevronDown
            className={`w-3.5 h-3.5 text-text-muted transition-transform duration-200 ${
              isExpanded ? 'rotate-180' : ''
            }`}
          />
        </div>
      </div>

      {/* Delete Confirmation Alert Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => {
                if (!isDeleting) setShowDeleteConfirm(false);
              }}
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-sm bg-bg-card border border-border/80 rounded-3xl p-6 shadow-2xl z-10 space-y-4"
              role="alertdialog"
              aria-labelledby="delete-bill-title"
            >
              <div className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6" />
              </div>

              <div>
                <h3 id="delete-bill-title" className="text-lg font-bold text-text-primary">
                  Delete Recurring Bill?
                </h3>
                <p className="text-sm text-text-secondary mt-1">
                  Are you sure you want to delete <strong>&quot;{bill.title}&quot;</strong>? All associated
                  scheduled instances will also be deleted.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                  size="sm"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="danger"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  size="sm"
                  className="gap-2"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    'Delete Bill'
                  )}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
