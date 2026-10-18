'use client';

import React, { useState, useMemo } from 'react';
import { Plus, Filter, X } from 'lucide-react';
import { Expense } from '@/types/database';
import { ExpenseCard } from './expense-card';
import { ExpenseFormModal } from './expense-form';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  CATEGORY_LIST,
  formatCurrency,
} from '@/lib/constants/categories';

interface ExpensesViewProps {
  initialExpenses: Expense[];
  currentUserId?: string;
}

type DateRangeOption = 'this_month' | 'last_month' | 'all' | 'custom';

export function ExpensesView({
  initialExpenses,
}: ExpensesViewProps) {
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  // Filter states
  const [dateRange, setDateRange] = useState<DateRangeOption>('this_month');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');

  // Calculate current and previous month date boundaries
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-indexed

  // Filtered expense computation
  const filteredExpenses = useMemo(() => {
    return (initialExpenses || []).filter((item) => {
      if (!item) return false;

      // 1. Category Filter
      if (selectedCategory !== 'all' && item.category !== selectedCategory) {
        return false;
      }

      // 2. Date Range Filter
      if (!item.expense_date) return true;
      const [year, month, day] = String(item.expense_date).split('-').map(Number);
      if (!year || !month || !day) return true;
      const itemDate = new Date(year, month - 1, day);

      if (dateRange === 'this_month') {
        return itemDate.getFullYear() === currentYear && itemDate.getMonth() === currentMonth;
      }

      if (dateRange === 'last_month') {
        const lastMonthDate = new Date(currentYear, currentMonth - 1, 1);
        return (
          itemDate.getFullYear() === lastMonthDate.getFullYear() &&
          itemDate.getMonth() === lastMonthDate.getMonth()
        );
      }

      if (dateRange === 'custom') {
        if (customStartDate && item.expense_date < customStartDate) return false;
        if (customEndDate && item.expense_date > customEndDate) return false;
      }

      return true;
    });
  }, [
    initialExpenses,
    selectedCategory,
    dateRange,
    currentYear,
    currentMonth,
    customStartDate,
    customEndDate,
  ]);

  // Total summary of filtered view
  const filteredTotal = useMemo(() => {
    return filteredExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  }, [filteredExpenses]);

  // Open modal for editing
  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setIsModalOpen(true);
  };

  // Open modal for creating new
  const handleAddNew = () => {
    setEditingExpense(null);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Top Controls: Filter Bar & Summary Header */}
      <Card variant="glass" className="p-4 sm:p-6 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Quick Metrics */}
          <div>
            <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">
              {dateRange === 'this_month'
                ? 'This Month’s Spending'
                : dateRange === 'last_month'
                ? 'Last Month’s Spending'
                : 'Filtered Total'}
            </span>
            <div className="flex items-baseline gap-3 mt-1">
              <span className="text-3xl sm:text-4xl font-extrabold text-text-primary tracking-tight">
                {formatCurrency(filteredTotal)}
              </span>
              <span className="text-xs font-medium text-text-muted bg-bg-secondary px-2.5 py-1 rounded-full">
                {filteredExpenses.length} {filteredExpenses.length === 1 ? 'transaction' : 'transactions'}
              </span>
            </div>
          </div>

          {/* Primary Action Button */}
          <div className="flex items-center gap-2">
            <Button onClick={handleAddNew} className="gap-2 shadow-lg shadow-accent-500/20">
              <Plus className="w-4 h-4" />
              <span>Add Expense</span>
            </Button>
          </div>
        </div>

        {/* Filter Selection Row */}
        <div className="pt-3 border-t border-border/40 flex flex-wrap items-center gap-3">
          {/* Date Range Tabs */}
          <div className="flex items-center bg-bg-secondary p-1 rounded-xl text-xs font-medium text-text-secondary overflow-x-auto max-w-full">
            <button
              type="button"
              onClick={() => setDateRange('this_month')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                dateRange === 'this_month'
                  ? 'bg-bg-card text-text-primary font-semibold shadow-sm'
                  : 'hover:text-text-primary'
              }`}
            >
              This Month
            </button>
            <button
              type="button"
              onClick={() => setDateRange('last_month')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                dateRange === 'last_month'
                  ? 'bg-bg-card text-text-primary font-semibold shadow-sm'
                  : 'hover:text-text-primary'
              }`}
            >
              Last Month
            </button>
            <button
              type="button"
              onClick={() => setDateRange('all')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                dateRange === 'all'
                  ? 'bg-bg-card text-text-primary font-semibold shadow-sm'
                  : 'hover:text-text-primary'
              }`}
            >
              All Time
            </button>
            <button
              type="button"
              onClick={() => setDateRange('custom')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                dateRange === 'custom'
                  ? 'bg-bg-card text-text-primary font-semibold shadow-sm'
                  : 'hover:text-text-primary'
              }`}
            >
              Custom
            </button>
          </div>

          {/* Category Dropdown Filter */}
          <div className="relative">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="appearance-none bg-bg-secondary border border-border/60 hover:border-border text-text-primary text-xs font-medium rounded-xl px-3.5 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-accent-500 cursor-pointer"
            >
              <option value="all">All Categories</option>
              {CATEGORY_LIST.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.label}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-2.5 pointer-events-none text-text-muted">
              <Filter className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Active filter reset button if filtered */}
          {(selectedCategory !== 'all' || dateRange !== 'this_month') && (
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('all');
                setDateRange('this_month');
                setCustomStartDate('');
                setCustomEndDate('');
              }}
              className="inline-flex items-center gap-1 text-xs text-text-muted hover:text-text-primary px-2 py-1 rounded-lg hover:bg-bg-secondary transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              Reset Filters
            </button>
          )}
        </div>

        {/* Custom Date Pickers when 'Custom' is chosen */}
        {dateRange === 'custom' && (
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-text-muted">From:</span>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="bg-bg-secondary border border-border/60 text-text-primary text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-accent-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-text-muted">To:</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="bg-bg-secondary border border-border/60 text-text-primary text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-accent-500"
              />
            </div>
          </div>
        )}
      </Card>

      {/* Expenses List or Empty State */}
      {filteredExpenses.length > 0 ? (
        <div className="space-y-3">
          {filteredExpenses.map((expense) => (
            <ExpenseCard
              key={expense.id}
              expense={expense}
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
            💸
          </div>
          <div className="max-w-md space-y-1">
            <h3 className="font-bold text-xl text-text-primary">
              {initialExpenses.length === 0
                ? 'No expenses yet — add your first one!'
                : 'No matching expenses found'}
            </h3>
            <p className="text-sm text-text-muted">
              {initialExpenses.length === 0
                ? 'Keep tabs on where your money goes. Record daily coffees, groceries, rent, and more.'
                : 'Try adjusting your date range or category filter to find what you are looking for.'}
            </p>
          </div>
          <Button onClick={handleAddNew} className="gap-2 mt-2">
            <Plus className="w-4 h-4" />
            Add Expense
          </Button>
        </Card>
      )}

      {/* Floating Action Button (FAB) at Bottom-Right */}
      <button
        type="button"
        onClick={handleAddNew}
        className="fixed bottom-24 sm:bottom-8 right-6 sm:right-8 z-40 w-14 h-14 rounded-2xl bg-accent-500 text-white shadow-xl shadow-accent-500/30 flex items-center justify-center hover:bg-accent-600 hover:scale-105 active:scale-95 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-accent-500/30 group"
        aria-label="Add new expense"
      >
        <Plus className="w-7 h-7 group-hover:rotate-90 transition-transform duration-200" />
      </button>

      {/* Add / Edit Expense Slide-up Modal */}
      <ExpenseFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingExpense(null);
        }}
        initialData={editingExpense}
      />
    </div>
  );
}
