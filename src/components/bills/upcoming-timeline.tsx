'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  format,
  addDays,
  isToday,
  isBefore,
  startOfToday,
  parseISO,
} from 'date-fns';
import {
  CheckCircle2,
  Calendar,
  Check,
  Loader2,
} from 'lucide-react';
import { UpcomingBillInstance } from '@/lib/data/recurring-bills';
import { CATEGORIES, formatCurrency } from '@/lib/constants/categories';
import { markPaidAction, markUnpaidAction } from '@/app/dashboard/bills/actions';
import { Card } from '@/components/ui/card';

interface UpcomingTimelineProps {
  instances: UpcomingBillInstance[];
}

export function UpcomingTimeline({ instances }: UpcomingTimelineProps) {
  const router = useRouter();
  const [selectedInstance, setSelectedInstance] = useState<UpcomingBillInstance | null>(null);
  const [loadingInstanceId, setLoadingInstanceId] = useState<string | null>(null);

  const today = startOfToday();

  // Create a 30-day window: 3 days past + today + 26 days future
  const days = Array.from({ length: 30 }, (_, i) => {
    return addDays(today, i - 3);
  });

  // Group instances by 'YYYY-MM-DD'
  const instancesByDate = instances.reduce<Record<string, UpcomingBillInstance[]>>(
    (acc, inst) => {
      const dateKey = inst.due_date;
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(inst);
      return acc;
    },
    {}
  );

  const handleTogglePaid = async (inst: UpcomingBillInstance, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setLoadingInstanceId(inst.id);
    try {
      if (inst.is_paid) {
        await markUnpaidAction(inst.id);
      } else {
        await markPaidAction(inst.id);
      }
      router.refresh();
      setSelectedInstance(null);
    } catch {
      alert('Failed to update bill payment status');
    } finally {
      setLoadingInstanceId(null);
    }
  };

  return (
    <Card variant="glass" className="p-4 sm:p-6 space-y-4">
      {/* Timeline Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-accent-500" />
          <h3 className="font-bold text-base text-text-primary">
            30-Day Upcoming Timeline
          </h3>
        </div>
        <div className="flex items-center gap-3 text-xs text-text-muted">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" /> Past Due
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-accent-500 inline-block" /> Upcoming
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Paid
          </span>
        </div>
      </div>

      {/* Horizontal Scrolling Calendar Strip */}
      <div className="relative">
        <div className="flex gap-2.5 overflow-x-auto pb-3 pt-1 scroll-smooth no-scrollbar">
          {days.map((day) => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const dayInstances = instancesByDate[dateStr] || [];
            const hasBills = dayInstances.length > 0;
            const isCurrentDay = isToday(day);
            const isPast = isBefore(day, today);

            const hasPastDue =
              isPast && dayInstances.some((inst) => !inst.is_paid);
            const allPaid =
              hasBills && dayInstances.every((inst) => inst.is_paid);

            return (
              <div
                key={dateStr}
                className={`shrink-0 w-20 sm:w-24 rounded-2xl p-2.5 flex flex-col items-center justify-between border transition-all text-center select-none ${
                  isCurrentDay
                    ? 'border-accent-500 bg-accent-500/10 shadow-sm ring-2 ring-accent-500/20'
                    : hasPastDue
                    ? 'border-red-500/50 bg-red-500/10 ring-1 ring-red-500/20'
                    : allPaid
                    ? 'border-emerald-500/40 bg-emerald-500/10'
                    : hasBills
                    ? 'border-border/80 bg-bg-card hover:border-border'
                    : 'border-border/40 bg-bg-secondary/30 text-text-muted opacity-70'
                }`}
              >
                {/* Day Header */}
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider block text-text-muted">
                    {format(day, 'EEE')}
                  </span>
                  <span
                    className={`text-base font-extrabold block ${
                      isCurrentDay
                        ? 'text-accent-500'
                        : hasBills
                        ? 'text-text-primary'
                        : 'text-text-muted'
                    }`}
                  >
                    {format(day, 'd')}
                  </span>
                  {isCurrentDay && (
                    <span className="text-[9px] font-bold text-accent-500 uppercase tracking-tight">
                      Today
                    </span>
                  )}
                </div>

                {/* Bill indicator dot / badge */}
                <div className="mt-2 min-h-[32px] flex flex-col items-center justify-center gap-1 w-full">
                  {hasBills ? (
                    dayInstances.map((inst) => {
                      const meta =
                        CATEGORIES[inst.bill?.category || 'subscriptions'] ||
                        CATEGORIES.subscriptions;
                      const Icon = meta.icon;
                      const isPastDue = isPast && !inst.is_paid;

                      return (
                        <button
                          key={inst.id}
                          type="button"
                          onClick={() => setSelectedInstance(inst)}
                          className={`w-full py-1 px-1.5 rounded-xl border flex items-center justify-between gap-1 transition-transform hover:scale-105 active:scale-95 ${
                            inst.is_paid
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                              : isPastDue
                              ? 'bg-red-500/15 border-red-500/40 text-red-600 dark:text-red-400 animate-pulse'
                              : 'bg-accent-500/15 border-accent-500/30 text-accent-600 dark:text-accent-400'
                          }`}
                          title={`${inst.bill?.title || 'Bill'}: ${formatCurrency(inst.amount)}`}
                        >
                          <Icon className="w-3 h-3 shrink-0" />
                          <span className="text-[10px] font-bold truncate">
                            {formatCurrency(inst.amount).replace('.00', '')}
                          </span>
                          {inst.is_paid && <Check className="w-2.5 h-2.5 shrink-0" />}
                        </button>
                      );
                    })
                  ) : (
                    <div className="w-1.5 h-1.5 rounded-full bg-border/60" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Instance Detail Popover / Modal when clicked */}
      <AnimatePresence>
        {selectedInstance && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setSelectedInstance(null)}
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-sm bg-bg-card border border-border/80 rounded-3xl p-6 shadow-2xl z-10 space-y-4"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                  Bill Instance Details
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border ${
                    selectedInstance.is_paid
                      ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                      : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                  }`}
                >
                  {selectedInstance.is_paid ? 'Paid' : 'Unpaid'}
                </span>
              </div>

              <div>
                <h4 className="text-xl font-bold text-text-primary">
                  {selectedInstance.bill?.title || 'Recurring Bill'}
                </h4>
                <p className="text-2xl font-extrabold text-accent-500 mt-1">
                  {formatCurrency(selectedInstance.amount)}
                </p>
                <p className="text-xs text-text-muted mt-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  Due date: <strong>{format(parseISO(selectedInstance.due_date), 'MMMM d, yyyy')}</strong>
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedInstance(null)}
                  className="px-4 py-2 text-xs font-semibold text-text-muted hover:text-text-primary"
                >
                  Close
                </button>

                <button
                  type="button"
                  onClick={() => handleTogglePaid(selectedInstance)}
                  disabled={loadingInstanceId === selectedInstance.id}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm ${
                    selectedInstance.is_paid
                      ? 'bg-bg-secondary text-text-secondary hover:bg-bg-secondary/80'
                      : 'bg-emerald-500 text-white hover:bg-emerald-600'
                  }`}
                >
                  {loadingInstanceId === selectedInstance.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : selectedInstance.is_paid ? (
                    'Mark as Unpaid'
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Mark as Paid
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </Card>
  );
}
