import { z } from 'zod';
import { Expense } from '@/types/database';

/**
 * Zod validation schema for Expense input.
 * Lives here (not in actions.ts) because 'use server' files can only
 * export async functions — objects and types are not allowed.
 */
export const expenseSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Title is required')
    .max(100, 'Title must be 100 characters or less'),
  amount: z.coerce
    .number()
    .positive('Amount must be greater than 0')
    .refine(
      (val) => {
        const parts = val.toString().split('.');
        return parts.length < 2 || parts[1].length <= 2;
      },
      { message: 'Amount can have at most 2 decimal places' }
    ),
  category: z.enum(
    [
      'food',
      'transport',
      'housing',
      'utilities',
      'entertainment',
      'healthcare',
      'education',
      'shopping',
      'subscriptions',
      'other',
    ],
    { message: 'Please select a valid expense category' }
  ),
  expense_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be formatted as YYYY-MM-DD'),
  notes: z
    .string()
    .max(500, 'Notes must be 500 characters or less')
    .optional()
    .nullable()
    .transform((val) => (val && val.trim().length > 0 ? val.trim() : null)),
});

export type ExpenseFormValues = z.infer<typeof expenseSchema>;

export interface ActionResponse<T = unknown> {
  success: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
  data?: T;
}
