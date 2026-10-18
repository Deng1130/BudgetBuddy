'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CATEGORIES, CATEGORY_LIST, formatExpenseDate } from '@/lib/constants/categories';
import {
  RecurringBill,
  BillFrequency,
  ExpenseCategory,
} from '@/types/database';
import {
  addRecurringBillAction,
  updateRecurringBillAction,
} from '@/app/dashboard/bills/actions';
import {
  getRecurrenceDescription,
  generateUpcomingDates,
} from '@/lib/utils/recurrence';

const FREQUENCY_OPTIONS: { id: BillFrequency; label: string; unit: string }[] = [
  { id: 'daily', label: 'Daily', unit: 'days' },
  { id: 'weekly', label: 'Weekly', unit: 'weeks' },
  { id: 'biweekly', label: 'Bi-weekly', unit: 'fortnights (2 wks)' },
  { id: 'monthly', label: 'Monthly', unit: 'months' },
  { id: 'quarterly', label: 'Quarterly', unit: 'quarters (3 mos)' },
  { id: 'yearly', label: 'Yearly', unit: 'years' },
];

interface BillFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: RecurringBill | null;
  onSuccess?: (bill: RecurringBill) => void;
}

interface BillFormSheetProps {
  onClose: () => void;
  initialData?: RecurringBill | null;
  onSuccess?: (bill: RecurringBill) => void;
}

function BillFormSheet({
  onClose,
  initialData,
  onSuccess,
}: BillFormSheetProps) {
  const router = useRouter();

  // Form field state directly initialized from props
  const [title, setTitle] = useState(initialData?.title || '');
  const [amount, setAmount] = useState(initialData?.amount?.toString() || '');
  const [category, setCategory] = useState<ExpenseCategory>(initialData?.category || 'subscriptions');
  const [frequency, setFrequency] = useState<BillFrequency>(initialData?.frequency || 'monthly');
  const [intervalValue, setIntervalValue] = useState<number>(initialData?.interval_value || 1);
  const [startDate, setStartDate] = useState(
    initialData?.start_date || new Date().toISOString().split('T')[0]
  );
  const [isInfinite, setIsInfinite] = useState<boolean>(
    initialData ? initialData.total_repetitions === null : true
  );
  const [totalRepetitions, setTotalRepetitions] = useState<string>(
    initialData?.total_repetitions ? initialData.total_repetitions.toString() : '12'
  );
  const [notes, setNotes] = useState(initialData?.notes || '');

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  const isEditMode = Boolean(initialData);

  // Current frequency metadata
  const currentFreqConfig = useMemo(() => {
    return FREQUENCY_OPTIONS.find((f) => f.id === frequency) || FREQUENCY_OPTIONS[3];
  }, [frequency]);

  // Live Recurrence Preview calculation
  const recurrencePreview = useMemo(() => {
    try {
      const reps = isInfinite ? null : parseInt(totalRepetitions, 10) || null;
      const desc = getRecurrenceDescription(frequency, intervalValue || 1, reps);
      const nextDates = generateUpcomingDates(startDate, frequency, intervalValue || 1, 3, 1);
      const formattedDates = nextDates.map(formatExpenseDate).join(', ');

      return {
        description: desc,
        formattedDates,
        startDateFormatted: formatExpenseDate(startDate),
      };
    } catch {
      return null;
    }
  }, [startDate, frequency, intervalValue, isInfinite, totalRepetitions]);

  // Handle ESC key dismiss
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
    if (!startDate) {
      setFieldErrors((prev) => ({ ...prev, start_date: ['Start date is required'] }));
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
      formData.append('frequency', frequency);
      formData.append('interval_value', (intervalValue || 1).toString());
      formData.append('start_date', startDate);
      formData.append(
        'total_repetitions',
        isInfinite ? '' : (parseInt(totalRepetitions, 10) || 1).toString()
      );
      formData.append('notes', notes.trim());

      const res = isEditMode
        ? await updateRecurringBillAction(formData)
        : await addRecurringBillAction(formData);

      if (!res.success) {
        setGeneralError(res.error || 'Failed to save recurring bill');
        if (res.fieldErrors) {
          setFieldErrors(res.fieldErrors);
        }
        setIsSubmitting(false);
        return;
      }

      setShowSuccessToast(true);
      router.refresh();
      if (onSuccess && res.data) {
        onSuccess(res.data);
      }

      setTimeout(() => {
        setIsSubmitting(false);
        setShowSuccessToast(false);
        onClose();
      }, 700);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong';
      setGeneralError(msg);
      setIsSubmitting(false);
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
        className="relative w-full sm:max-w-xl bg-bg-card border-t sm:border border-border/80 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col z-10"
        role="dialog"
        aria-modal="true"
        aria-labelledby="bill-modal-title"
      >
        {/* Drag handle for mobile */}
        <div className="sm:hidden flex justify-center pt-3 pb-1">
          <div className="w-12 h-1.5 rounded-full bg-border" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-4 pb-3 border-b border-border/40">
          <div>
            <h2 id="bill-modal-title" className="text-xl font-bold tracking-tight text-text-primary">
              {isEditMode ? 'Edit Recurring Bill' : 'New Recurring Bill'}
            </h2>
            <p className="text-xs text-text-muted mt-0.5">
              Automate tracking for subscriptions, utilities, and scheduled payments
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
                {isEditMode ? 'Bill updated successfully!' : 'Recurring bill created and scheduled!'}
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

          {/* Title and Amount Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Netflix, Gym, Internet"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (fieldErrors.title) setFieldErrors((prev) => ({ ...prev, title: [] }));
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
                    if (fieldErrors.amount) setFieldErrors((prev) => ({ ...prev, amount: [] }));
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
          </div>

          {/* Frequency Segmented Control / Pill Selector */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider">
              Frequency <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 p-1 bg-bg-secondary/80 rounded-2xl border border-border/50">
              {FREQUENCY_OPTIONS.map((freq) => {
                const isSelected = frequency === freq.id;
                return (
                  <button
                    key={freq.id}
                    type="button"
                    onClick={() => setFrequency(freq.id)}
                    className={`py-2 px-2 rounded-xl text-xs font-medium transition-all text-center ${
                      isSelected
                        ? 'bg-bg-card text-accent-500 font-bold shadow-sm scale-[1.02] border border-border/60'
                        : 'text-text-muted hover:text-text-primary'
                    }`}
                  >
                    {freq.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Interval and Start Date Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Dynamic Interval Input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider">
                Interval <span className="text-text-muted normal-case font-normal">(Every ___ {currentFreqConfig.unit})</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max="365"
                  required
                  value={intervalValue}
                  onChange={(e) => setIntervalValue(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="w-24 px-4 py-3 rounded-xl bg-bg-secondary/70 border border-border/60 text-text-primary text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-accent-500"
                />
                <span className="text-xs text-text-muted capitalize">
                  {currentFreqConfig.unit}
                </span>
              </div>
            </div>

            {/* Start Date */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider">
                First Due Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-bg-secondary/70 border border-border/60 text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent-500"
              />
            </div>
          </div>

          {/* Repetitions Duration Toggle */}
          <div className="space-y-2 p-4 rounded-2xl bg-bg-secondary/40 border border-border/50">
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider">
              Repetitions / Duration
            </label>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsInfinite(true)}
                className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold border transition-all flex items-center justify-center gap-2 ${
                  isInfinite
                    ? 'bg-accent-500/15 border-accent-500 text-accent-600 dark:text-accent-400 shadow-sm'
                    : 'border-border/60 bg-bg-card/70 text-text-secondary hover:text-text-primary'
                }`}
              >
                <span>Repeats forever ∞</span>
              </button>

              <button
                type="button"
                onClick={() => setIsInfinite(false)}
                className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold border transition-all flex items-center justify-center gap-2 ${
                  !isInfinite
                    ? 'bg-accent-500/15 border-accent-500 text-accent-600 dark:text-accent-400 shadow-sm'
                    : 'border-border/60 bg-bg-card/70 text-text-secondary hover:text-text-primary'
                }`}
              >
                <span>Custom Count</span>
              </button>
            </div>

            {!isInfinite && (
              <div className="pt-2 flex items-center gap-3">
                <span className="text-xs text-text-muted">Total times to bill:</span>
                <input
                  type="number"
                  min="1"
                  max="9999"
                  value={totalRepetitions}
                  onChange={(e) => setTotalRepetitions(e.target.value)}
                  className="w-28 px-3 py-2 rounded-xl bg-bg-card border border-border text-sm font-semibold text-text-primary focus:ring-2 focus:ring-accent-500"
                  placeholder="e.g. 12"
                />
                <span className="text-xs text-text-muted">repetitions</span>
              </div>
            )}
          </div>

          {/* Live Recurrence Preview Box */}
          {recurrencePreview && (
            <div className="p-4 rounded-2xl bg-gradient-to-br from-accent-500/10 to-accent-600/5 border border-accent-500/20 space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-bold text-accent-600 dark:text-accent-400">
                <Sparkles className="w-4 h-4" />
                <span>Live Schedule Preview</span>
              </div>
              <p className="text-xs text-text-primary font-medium leading-relaxed">
                This bill will recur <strong>{recurrencePreview.description.toLowerCase()}</strong> starting{' '}
                <strong>{recurrencePreview.startDateFormatted}</strong>.
              </p>
              <p className="text-[11px] text-text-muted">
                Next 3 due dates: <span className="font-semibold text-text-secondary">{recurrencePreview.formattedDates}</span>
              </p>
            </div>
          )}

          {/* Category Picker */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider flex items-center justify-between">
              <span>Category <span className="text-red-500">*</span></span>
              <span className="text-[11px] text-text-muted font-normal">
                {CATEGORIES[category]?.label}
              </span>
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
              {CATEGORY_LIST.map((cat) => {
                const Icon = cat.icon;
                const isSelected = category === cat.id;

                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all text-xs text-center group ${
                      isSelected
                        ? 'bg-accent-500/15 border-accent-500 text-accent-600 dark:text-accent-400 shadow-sm font-semibold scale-[1.02]'
                        : 'border-border/60 bg-bg-secondary/40 text-text-secondary hover:bg-bg-secondary hover:text-text-primary'
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center mb-1 transition-transform group-hover:scale-110 ${cat.bgColor} ${cat.textColor}`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="truncate w-full text-[11px]">
                      {cat.label.split(' ')[0]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Notes Field */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider">
                Notes <span className="text-text-muted font-normal">(optional)</span>
              </label>
              <span className="text-[11px] text-text-muted">{notes.length}/500</span>
            </div>
            <textarea
              rows={2}
              placeholder="e.g. Account number, billing portal login reminder..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={500}
              className="w-full px-4 py-2.5 rounded-xl bg-bg-secondary/70 border border-border/60 text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent-500 resize-none"
            />
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
                'Create Bill'
              )}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

export function BillFormModal({
  isOpen,
  onClose,
  initialData,
  onSuccess,
}: BillFormModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <BillFormSheet
          key={initialData?.id || 'new'}
          onClose={onClose}
          initialData={initialData}
          onSuccess={onSuccess}
        />
      )}
    </AnimatePresence>
  );
}
