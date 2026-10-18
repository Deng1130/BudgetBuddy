'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown,
  Edit3,
  Trash2,
  Calendar,
  FileText,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { Expense } from '@/types/database';
import {
  CATEGORIES,
  formatCurrency,
  formatExpenseDate,
} from '@/lib/constants/categories';
import { deleteExpenseAction } from '@/app/dashboard/expenses/actions';
import { Button } from '@/components/ui/button';

interface ExpenseCardProps {
  expense: Expense;
  onEdit?: (expense: Expense) => void;
  onDelete?: (id: string) => void;
}

export function ExpenseCard({ expense, onEdit, onDelete }: ExpenseCardProps) {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [swipeOffset, setSwipeOffset] = useState(0);

  const categoryMeta = CATEGORIES[expense.category] || CATEGORIES.other;
  const CategoryIcon = categoryMeta.icon;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await deleteExpenseAction(expense.id);
      if (res.success) {
        setShowDeleteConfirm(false);
        router.refresh();
        if (onDelete) {
          onDelete(expense.id);
        }
      } else {
        alert(res.error || 'Failed to delete expense');
      }
    } catch {
      alert('An error occurred while deleting');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-bg-card shadow-sm hover:border-border transition-all group select-none">
        {/* Background Action Buttons revealed by Swipe-left */}
        <div className="absolute inset-y-0 right-0 flex items-center justify-end px-3 gap-2 bg-bg-secondary/80 w-36 z-0">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEdit?.(expense);
            }}
            className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 flex items-center justify-center transition-colors"
            title="Edit Expense"
            aria-label="Edit Expense"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowDeleteConfirm(true);
            }}
            className="w-10 h-10 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20 flex items-center justify-center transition-colors"
            title="Delete Expense"
            aria-label="Delete Expense"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Draggable / Clickable Card Surface */}
        <motion.div
          drag="x"
          dragConstraints={{ left: -110, right: 0 }}
          dragElastic={0.1}
          onDragEnd={(_, info) => {
            // Keep swipe open if pulled sufficiently to the left
            if (info.offset.x < -60) {
              setSwipeOffset(-110);
            } else {
              setSwipeOffset(0);
            }
          }}
          animate={{ x: swipeOffset }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="relative z-10 bg-bg-card"
        >
          {/* Card Header Tap Zone */}
          <div
            onClick={() => {
              // Reset swipe if open, else toggle expand
              if (swipeOffset < 0) {
                setSwipeOffset(0);
              } else {
                setIsExpanded((prev) => !prev);
              }
            }}
            className="p-4 sm:p-5 flex items-center justify-between gap-4 cursor-pointer hover:bg-bg-secondary/30 transition-colors"
          >
            {/* Category Icon and Main Details */}
            <div className="flex items-center gap-3.5 min-w-0">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${categoryMeta.bgColor} ${categoryMeta.textColor} ${categoryMeta.borderBadge}`}
              >
                <CategoryIcon className="w-6 h-6" />
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-text-primary text-base truncate">
                    {expense.title}
                  </h4>
                  <span
                    className={`hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${categoryMeta.bgColor} ${categoryMeta.textColor} ${categoryMeta.borderBadge}`}
                  >
                    {categoryMeta.label}
                  </span>
                </div>

                <div className="flex items-center gap-2 mt-0.5 text-xs text-text-muted">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatExpenseDate(expense.expense_date)}
                  </span>
                  {expense.notes && (
                    <span className="flex items-center gap-1 text-accent-500 font-medium">
                      <FileText className="w-3 h-3" />
                      Notes
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Amount and Desktop Actions / Chevron */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="text-right">
                <span className="font-bold text-lg text-text-primary tracking-tight">
                  {formatCurrency(expense.amount)}
                </span>
              </div>

              {/* Desktop quick action buttons */}
              <div className="hidden sm:flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit?.(expense);
                  }}
                  className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-secondary transition-colors"
                  title="Edit"
                  aria-label="Edit"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDeleteConfirm(true);
                  }}
                  className="p-2 rounded-lg text-text-muted hover:text-red-500 hover:bg-red-500/10 transition-colors"
                  title="Delete"
                  aria-label="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Expand indicator */}
              <motion.div
                animate={{ rotate: isExpanded ? 180 : 0 }}
                transition={{ duration: 0.2 }}
                className="text-text-muted p-1"
              >
                <ChevronDown className="w-4 h-4" />
              </motion.div>
            </div>
          </div>

          {/* Expandable Notes and Details with CSS/Framer animation */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: 'easeInOut' }}
                className="overflow-hidden border-t border-border/40 bg-bg-secondary/20"
              >
                <div className="p-4 sm:p-5 space-y-3">
                  {/* Notes display */}
                  <div>
                    <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                      Notes
                    </span>
                    <p className="mt-1 text-sm text-text-primary leading-relaxed whitespace-pre-wrap bg-bg-card p-3 rounded-xl border border-border/50">
                      {expense.notes || 'No notes provided for this transaction.'}
                    </p>
                  </div>

                  {/* Additional Metadata */}
                  <div className="flex flex-wrap items-center justify-between text-xs text-text-muted pt-2 border-t border-border/30 gap-2">
                    <div className="flex items-center gap-4">
                      <span>Category: <strong className="text-text-secondary font-medium">{categoryMeta.label}</strong></span>
                      <span>Recorded: {formatExpenseDate(expense.created_at.slice(0, 10))}</span>
                    </div>

                    {/* Mobile visible action buttons inside expanded view */}
                    <div className="flex items-center gap-2 sm:hidden w-full pt-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit?.(expense);
                        }}
                        className="flex-1 gap-1.5 text-xs text-blue-500 hover:text-blue-600 hover:bg-blue-500/10"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        Edit
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowDeleteConfirm(true);
                        }}
                        className="flex-1 gap-1.5 text-xs text-red-500 hover:text-red-600 hover:bg-red-500/10"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Delete Confirmation Modal Dialog */}
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
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="relative w-full max-w-sm bg-bg-card border border-border/80 rounded-3xl p-6 shadow-2xl z-10 space-y-4"
              role="alertdialog"
              aria-labelledby="delete-confirm-title"
              aria-describedby="delete-confirm-desc"
            >
              <div className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6" />
              </div>

              <div>
                <h3
                  id="delete-confirm-title"
                  className="text-lg font-bold text-text-primary"
                >
                  Delete Expense?
                </h3>
                <p id="delete-confirm-desc" className="text-sm text-text-secondary mt-1">
                  Are you sure you want to delete <strong>&quot;{expense.title}&quot;</strong> ({formatCurrency(expense.amount)})? This cannot be undone.
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
                      Deleting...
                    </>
                  ) : (
                    'Delete'
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
