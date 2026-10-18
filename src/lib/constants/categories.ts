import {
  Utensils,
  Car,
  Home,
  Zap,
  Film,
  HeartPulse,
  GraduationCap,
  ShoppingBag,
  RefreshCw,
  Tag,
  type LucideIcon,
} from "lucide-react";
import { ExpenseCategory } from "@/types/database";

export interface CategoryMeta {
  id: ExpenseCategory;
  label: string;
  icon: LucideIcon;
  bgColor: string;
  textColor: string;
  borderBadge: string;
}

export const CATEGORIES: Record<ExpenseCategory, CategoryMeta> = {
  food: {
    id: "food",
    label: "Food & Dining",
    icon: Utensils,
    bgColor: "bg-amber-500/10 dark:bg-amber-500/20",
    textColor: "text-amber-600 dark:text-amber-400",
    borderBadge: "border-amber-500/20",
  },
  transport: {
    id: "transport",
    label: "Transportation",
    icon: Car,
    bgColor: "bg-blue-500/10 dark:bg-blue-500/20",
    textColor: "text-blue-600 dark:text-blue-400",
    borderBadge: "border-blue-500/20",
  },
  housing: {
    id: "housing",
    label: "Housing & Rent",
    icon: Home,
    bgColor: "bg-indigo-500/10 dark:bg-indigo-500/20",
    textColor: "text-indigo-600 dark:text-indigo-400",
    borderBadge: "border-indigo-500/20",
  },
  utilities: {
    id: "utilities",
    label: "Utilities & Bills",
    icon: Zap,
    bgColor: "bg-yellow-500/10 dark:bg-yellow-500/20",
    textColor: "text-yellow-600 dark:text-yellow-400",
    borderBadge: "border-yellow-500/20",
  },
  entertainment: {
    id: "entertainment",
    label: "Entertainment",
    icon: Film,
    bgColor: "bg-purple-500/10 dark:bg-purple-500/20",
    textColor: "text-purple-600 dark:text-purple-400",
    borderBadge: "border-purple-500/20",
  },
  healthcare: {
    id: "healthcare",
    label: "Healthcare",
    icon: HeartPulse,
    bgColor: "bg-rose-500/10 dark:bg-rose-500/20",
    textColor: "text-rose-600 dark:text-rose-400",
    borderBadge: "border-rose-500/20",
  },
  education: {
    id: "education",
    label: "Education",
    icon: GraduationCap,
    bgColor: "bg-emerald-500/10 dark:bg-emerald-500/20",
    textColor: "text-emerald-600 dark:text-emerald-400",
    borderBadge: "border-emerald-500/20",
  },
  shopping: {
    id: "shopping",
    label: "Shopping",
    icon: ShoppingBag,
    bgColor: "bg-pink-500/10 dark:bg-pink-500/20",
    textColor: "text-pink-600 dark:text-pink-400",
    borderBadge: "border-pink-500/20",
  },
  subscriptions: {
    id: "subscriptions",
    label: "Subscriptions",
    icon: RefreshCw,
    bgColor: "bg-violet-500/10 dark:bg-violet-500/20",
    textColor: "text-violet-600 dark:text-violet-400",
    borderBadge: "border-violet-500/20",
  },
  other: {
    id: "other",
    label: "Other Expenses",
    icon: Tag,
    bgColor: "bg-slate-500/10 dark:bg-slate-500/20",
    textColor: "text-slate-600 dark:text-slate-400",
    borderBadge: "border-slate-500/20",
  },
};

export const CATEGORY_LIST = Object.values(CATEGORIES);

/**
 * Format a numeric amount into localized currency display (default ₱ Philippine Peso).
 */
export function formatCurrency(amount: number, currency = "PHP"): string {
  const symbol = currency === "PHP" ? "₱" : "$";
  const formatted = new Intl.NumberFormat("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(amount));

  return `${amount < 0 ? "-" : ""}${symbol}${formatted}`;
}

/**
 * Format a date string (YYYY-MM-DD) into human-readable display.
 */
export function formatExpenseDate(dateStr: string): string {
  if (!dateStr) return "";
  const [year, month, day] = dateStr.split("-").map(Number);
  if (!year || !month || !day) return dateStr;
  
  const date = new Date(year, month - 1, day);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}
