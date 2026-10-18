'use server';

import { revalidatePath } from 'next/cache';
import { createExpense, updateExpense, deleteExpense } from '@/lib/data/expenses';
import { getUser } from '@/lib/auth';
import { ExpenseCategory, Expense } from '@/types/database';
import { expenseSchema, ActionResponse } from '@/lib/validations/expense';

<<<<<<< HEAD
/**
 * Zod validation schema for Expense input.
 * - title: required, 1-100 characters
 * - amount: positive number, at most 2 decimal places
 * - category: one of the 10 expense_category enum values
 * - expense_date: valid date string (YYYY-MM-DD)
 * - notes: optional, max 500 characters
 */
const expenseSchema = z.object({
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
        // Validate max 2 decimal places
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

interface ActionResponse<T = unknown> {
  success: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
  data?: T;
}
=======
// Re-export types for consumers that import from this file
export type { ExpenseFormValues, ActionResponse } from '@/lib/validations/expense';
>>>>>>> 3a9704334821e8bd9e3ab1d08eb05eff838ce531

/**
 * Server action to validate and add a new expense.
 * Accepts FormData (standard form submission) or plain object.
 */
export async function addExpenseAction(
  formData: FormData | Record<string, unknown>
): Promise<ActionResponse<Expense>> {
  try {
    const user = await getUser();
    if (!user) {
      return { success: false, error: 'You must be signed in to add an expense.' };
    }

    const rawData =
      formData instanceof FormData
        ? {
            title: formData.get('title'),
            amount: formData.get('amount'),
            category: formData.get('category'),
            expense_date: formData.get('expense_date'),
            notes: formData.get('notes'),
          }
        : formData;

    const validated = expenseSchema.safeParse(rawData);

    if (!validated.success) {
      const fieldErrors = validated.error.flatten().fieldErrors;
      const firstErrorMessage = Object.values(fieldErrors).flat()[0] || 'Invalid input';
      return {
        success: false,
        error: firstErrorMessage,
        fieldErrors,
      };
    }

    const result = await createExpense({
      title: validated.data.title,
      amount: validated.data.amount,
      category: validated.data.category as ExpenseCategory,
      expense_date: validated.data.expense_date,
      notes: validated.data.notes ?? null,
      user_id: user.id,
    });

    if (result.error || !result.data) {
      return { success: false, error: result.error || 'Failed to save expense.' };
    }

    // Revalidate paths so fresh data loads on dashboard and expenses list
    revalidatePath('/dashboard/expenses');
    revalidatePath('/dashboard');

    return {
      success: true,
      data: result.data,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'An unexpected error occurred';
    return { success: false, error: message };
  }
}

/**
 * Server action to validate and update an existing expense.
 */
export async function updateExpenseAction(
  formData: FormData | Record<string, unknown>
): Promise<ActionResponse<Expense>> {
  try {
    const user = await getUser();
    if (!user) {
      return { success: false, error: 'You must be signed in to edit an expense.' };
    }

    const id =
      formData instanceof FormData ? (formData.get('id') as string) : (formData.id as string);

    if (!id || typeof id !== 'string') {
      return { success: false, error: 'Missing expense ID for update.' };
    }

    const rawData =
      formData instanceof FormData
        ? {
            title: formData.get('title'),
            amount: formData.get('amount'),
            category: formData.get('category'),
            expense_date: formData.get('expense_date'),
            notes: formData.get('notes'),
          }
        : formData;

    const validated = expenseSchema.safeParse(rawData);

    if (!validated.success) {
      const fieldErrors = validated.error.flatten().fieldErrors;
      const firstErrorMessage = Object.values(fieldErrors).flat()[0] || 'Invalid input';
      return {
        success: false,
        error: firstErrorMessage,
        fieldErrors,
      };
    }

    const result = await updateExpense(id, {
      title: validated.data.title,
      amount: validated.data.amount,
      category: validated.data.category as ExpenseCategory,
      expense_date: validated.data.expense_date,
      notes: validated.data.notes ?? null,
    });

    if (result.error || !result.data) {
      return { success: false, error: result.error || 'Failed to update expense.' };
    }

    revalidatePath('/dashboard/expenses');
    revalidatePath('/dashboard');

    return {
      success: true,
      data: result.data,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'An unexpected error occurred';
    return { success: false, error: message };
  }
}

/**
 * Server action to delete an expense by ID.
 */
export async function deleteExpenseAction(
  formData: FormData | { id: string } | string
): Promise<ActionResponse<void>> {
  try {
    const user = await getUser();
    if (!user) {
      return { success: false, error: 'You must be signed in to delete an expense.' };
    }

    let id: string;
    if (typeof formData === 'string') {
      id = formData;
    } else if (formData instanceof FormData) {
      id = (formData.get('id') as string) || '';
    } else {
      id = formData.id;
    }

    if (!id) {
      return { success: false, error: 'Missing expense ID for deletion.' };
    }

    const result = await deleteExpense(id);

    if (!result.success) {
      return { success: false, error: result.error || 'Failed to delete expense.' };
    }

    revalidatePath('/dashboard/expenses');
    revalidatePath('/dashboard');

    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'An unexpected error occurred';
    return { success: false, error: message };
  }
}
