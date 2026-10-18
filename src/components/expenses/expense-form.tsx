'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CATEGORIES, CATEGORY_LIST } from '@/lib/constants/categories';
import { Expense, ExpenseCategory } from '@/types/database';
import { addExpenseAction, updateExpenseAction } from '@/app/dashboard/expenses/actions';

interface ExpenseFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: Expense | null;
  onSuccess?: (expense: Expense) => void;
}

interface ExpenseFormSheetProps {
  onClose: () => void;
  initialData?: Expense | null;
  onSuccess?: (expense: Expense) => void;
}

function ExpenseFormSheet({
  onClose,
  initialData,
  onSuccess,
}: ExpenseFormSheetProps) {
  // Guard against setState calls after the modal has been unmounted by AnimatePresence
  const isMounted = useRef(true);
  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  // Form field state directly initialized from props (no useEffect setState needed!)
  const [title, setTitle] = useState(initialData?.title || '');
  const [amount, setAmount] = useState(initialData?.amount?.toString() || '');
  const [category, setCategory] = useState<ExpenseCategory>(initialData?.category || 'food');
  const [expenseDate, setExpenseDate] = useState(
    initialData?.expense_date || new Date().toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState(initialData?.notes || '');

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  const isEditMode = Boolean(initialData);

  // Handle ESC key dismiss (accessible modal behavior)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSubmitting, onClose]);

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);
    setFieldErrors({});

    // Client-side quick checks
    if (!title.trim()) {
      setFieldErrors((prev) => ({ ...prev, title: ['Title is required'] }));
      return;
    }
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setFieldErrors((prev) => ({ ...prev, amount: ['Amount must be greater than 0'] }));
      return;
    }
    if (!expenseDate) {
      setFieldErrors((prev) => ({ ...prev, expense_date: ['Date is required'] }));
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      if (isEditMode && initialData) {
        formData.append('id', initialData.id);
      }
      formData.append('title', title.trim());
      formData.append('amount', amount);
      formData.append('category', category);
      formData.append('expense_date', expenseDate);
      formData.append('notes', notes.trim());

      const res = isEditMode
        ? await updateExpenseAction(formData)
        : await addExpenseAction(formData);

      if (!res.success) {
        setGeneralError(res.error || 'Failed to save expense');
        if (res.fieldErrors) {
          setFieldErrors(res.fieldErrors);
        }
        setIsSubmitting(false);
        return;
      }

      // Success feedback
      setShowSuccessToast(true);
      if (onSuccess && res.data) {
        onSuccess(res.data);
      }

      // Briefly display success feedback before auto-closing.
      // Guard with isMounted ref so we don't setState on an unmounted component
      // (AnimatePresence may remove this component before the timer fires).
      const timer = setTimeout(() => {
        if (!isMounted.current) return;
        setIsSubmitting(false);
        setShowSuccessToast(false);
        onClose();
      }, 700);
      return () => clearTimeout(timer);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong';
      if (isMounted.current) {
        setGeneralError(msg);
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop with blur & light dismiss */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => {
          if (!isSubmitting) onClose();
        }}
        aria-hidden="true"
      />

      {/* Slide-up Sheet / Modal Container */}
      <motion.div
        initial={{ y: '100%', opacity: 0.5 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        className="relative w-full sm:max-w-lg bg-bg-card border-t sm:border border-border/80 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col z-10"
        role="dialog"
        aria-modal="true"
        aria-labelledby="expense-modal-title"
      >
        {/* Sheet Handle for Mobile Drag Affordance */}
        <div className="sm:hidden flex justify-center pt-3 pb-1">
          <div className="w-12 h-1.5 rounded-full bg-border" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-4 pb-3 border-b border-border/40">
          <div>
            <h2
              id="expense-modal-title"
              className="text-xl font-bold tracking-tight text-text-primary"
            >
              {isEditMode ? 'Edit Expense' : 'Add New Expense'}
            </h2>
            <p className="text-xs text-text-muted mt-0.5">
              {isEditMode
                ? 'Update details for this transaction'
                : 'Record money spent to keep your budget on track'}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-bg-secondary transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Success Toast Banner */}
          {showSuccessToast && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center gap-3 text-emerald-600 dark:text-emerald-400 text-sm font-medium"
            >
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span>
                {isEditMode ? 'Expense updated successfully!' : 'Expense saved successfully!'}
              </span>
            </motion.div>
          )}

          {/* General Error Banner */}
          {generalError && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-start gap-2.5 text-red-600 dark:text-red-400 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{generalError}</span>
            </div>
          )}

          {/* Title Field */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Grocery Run, Coffee, Gas"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (fieldErrors.title) {
                  setFieldErrors((prev) => ({ ...prev, title: [] }));
                }
              }}
              className={`w-full px-4 py-3 rounded-xl bg-bg-secondary/70 border text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent-500 transition-all ${
                fieldErrors.title?.length ? 'border-red-500' : 'border-border/60'
              }`}
              maxLength={100}
            />
            {fieldErrors.title?.map((err, i) => (
              <p key={i} className="text-xs text-red-500 font-medium">
                {err}
              </p>
            ))}
          </div>

          {/* Amount and Date Fields (Two Columns) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Amount Field with Currency Prefix */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider">
                Amount <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-text-muted font-bold text-sm">
                  ₱
                </div>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value);
                    if (fieldErrors.amount) {
                      setFieldErrors((prev) => ({ ...prev, amount: [] }));
                    }
                  }}
                  className={`w-full pl-8 pr-4 py-3 rounded-xl bg-bg-secondary/70 border text-text-primary text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-accent-500 transition-all ${
                    fieldErrors.amount?.length ? 'border-red-500' : 'border-border/60'
                  }`}
                />
              </div>
              {fieldErrors.amount?.map((err, i) => (
                <p key={i} className="text-xs text-red-500 font-medium">
                  {err}
                </p>
              ))}
            </div>

            {/* Date Picker Field */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider">
                Date <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  required
                  value={expenseDate}
                  onChange={(e) => {
                    setExpenseDate(e.target.value);
                    if (fieldErrors.expense_date) {
                      setFieldErrors((prev) => ({ ...prev, expense_date: [] }));
                    }
                  }}
                  className={`w-full px-4 py-3 rounded-xl bg-bg-secondary/70 border text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent-500 transition-all ${
                    fieldErrors.expense_date?.length ? 'border-red-500' : 'border-border/60'
                  }`}
                />
              </div>
              {fieldErrors.expense_date?.map((err, i) => (
                <p key={i} className="text-xs text-red-500 font-medium">
                  {err}
                </p>
              ))}
            </div>
          </div>

          {/* Category Picker (Styled Select with Icons) */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider flex items-center justify-between">
              <span>Category <span className="text-red-500">*</span></span>
              <span className="text-[11px] text-text-muted font-normal lowercase">
                {CATEGORIES[category]?.label}
              </span>
            </label>

            {/* Category Grid for visual selection */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
              {CATEGORY_LIST.map((cat) => {
                const Icon = cat.icon;
                const isSelected = category === cat.id;

                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-xl border transition-all text-xs text-center group ${
                      isSelected
                        ? 'bg-accent-500/15 border-accent-500 text-accent-600 dark:text-accent-400 shadow-sm font-semibold scale-[1.02]'
                        : 'border-border/60 bg-bg-secondary/40 text-text-secondary hover:bg-bg-secondary hover:text-text-primary hover:border-border'
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center mb-1.5 transition-transform group-hover:scale-110 ${cat.bgColor} ${cat.textColor}`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="truncate w-full leading-tight text-[11px]">
                      {cat.label.split(' ')[0]}
                    </span>
                  </button>
                );
              })}
            </div>
            {fieldErrors.category?.map((err, i) => (
              <p key={i} className="text-xs text-red-500 font-medium">
                {err}
              </p>
            ))}
          </div>

          {/* Notes Field (Optional Textarea) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider">
                Notes <span className="text-text-muted font-normal">(optional)</span>
              </label>
              <span className="text-[11px] text-text-muted">
                {notes.length}/500
              </span>
            </div>
            <textarea
              rows={2}
              placeholder="Add any extra details, receipt notes, or tags..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={500}
              className="w-full px-4 py-2.5 rounded-xl bg-bg-secondary/70 border border-border/60 text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent-500 transition-all resize-none"
            />
            {fieldErrors.notes?.map((err, i) => (
              <p key={i} className="text-xs text-red-500 font-medium">
                {err}
              </p>
            ))}
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border/40">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 text-sm"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="px-6 text-sm gap-2 min-w-[130px]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : isEditMode ? (
                'Save Changes'
              ) : (
                'Add Expense'
              )}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

export function ExpenseFormModal({
  isOpen,
  onClose,
  initialData,
  onSuccess,
}: ExpenseFormModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <ExpenseFormSheet
          key={initialData?.id || 'new'}
          onClose={onClose}
          initialData={initialData}
          onSuccess={onSuccess}
        />
      )}
    </AnimatePresence>
  );
}
