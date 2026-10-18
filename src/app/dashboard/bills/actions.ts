'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { getUser } from '@/lib/auth';
import {
  createRecurringBill,
  updateRecurringBill,
  deleteRecurringBill,
  toggleBillActive,
  markInstancePaid,
  markInstanceUnpaid,
} from '@/lib/data/recurring-bills';
import { RecurringBill, RecurringBillInstance, BillFrequency, ExpenseCategory } from '@/types/database';

/**
 * Zod validation schema for Recurring Bill.
 */
export const recurringBillSchema = z.object({
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
  frequency: z.enum(
    ['daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'yearly'],
    { message: 'Please select a valid frequency' }
  ),
  interval_value: z.coerce
    .number()
    .int('Interval must be an integer')
    .min(1, 'Interval must be at least 1')
    .max(365, 'Interval cannot exceed 365'),
  start_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Valid start date is required (YYYY-MM-DD)'),
  total_repetitions: z.preprocess((val) => {
    if (val === '' || val === null || val === undefined || val === 'null' || val === 0 || val === '0') {
      return null;
    }
    const num = Number(val);
    return isNaN(num) ? null : num;
  }, z.number().int('Must be a whole number').min(1, 'Must be at least 1 repetition').max(9999, 'Cannot exceed 9999 repetitions').nullable()),
  notes: z
    .string()
    .max(500, 'Notes must be 500 characters or less')
    .optional()
    .nullable()
    .transform((val) => (val && val.trim().length > 0 ? val.trim() : null)),
});

export type RecurringBillFormValues = z.infer<typeof recurringBillSchema>;

export interface ActionResponse<T = unknown> {
  success: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
  data?: T;
}

/**
 * Server action to validate and add a recurring bill.
 */
export async function addRecurringBillAction(
  formData: FormData | Record<string, unknown>
): Promise<ActionResponse<RecurringBill>> {
  try {
    const user = await getUser();
    if (!user) {
      return { success: false, error: 'You must be signed in to add a bill.' };
    }

    const rawData =
      formData instanceof FormData
        ? {
            title: formData.get('title'),
            amount: formData.get('amount'),
            category: formData.get('category'),
            frequency: formData.get('frequency'),
            interval_value: formData.get('interval_value'),
            start_date: formData.get('start_date'),
            total_repetitions: formData.get('total_repetitions'),
            notes: formData.get('notes'),
          }
        : formData;

    const validated = recurringBillSchema.safeParse(rawData);

    if (!validated.success) {
      const fieldErrors = validated.error.flatten().fieldErrors;
      const firstErrorMessage = Object.values(fieldErrors).flat()[0] || 'Invalid input';
      return {
        success: false,
        error: firstErrorMessage,
        fieldErrors,
      };
    }

    const result = await createRecurringBill({
      user_id: user.id,
      title: validated.data.title,
      amount: validated.data.amount,
      category: validated.data.category as ExpenseCategory,
      frequency: validated.data.frequency as BillFrequency,
      interval_value: validated.data.interval_value,
      start_date: validated.data.start_date,
      total_repetitions: validated.data.total_repetitions,
      is_active: true,
      notes: validated.data.notes ?? null,
    });

    if (result.error || !result.data) {
      return { success: false, error: result.error || 'Failed to create recurring bill.' };
    }

    revalidatePath('/dashboard/bills');
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
 * Server action to validate and update an existing recurring bill.
 */
export async function updateRecurringBillAction(
  formData: FormData | Record<string, unknown>
): Promise<ActionResponse<RecurringBill>> {
  try {
    const user = await getUser();
    if (!user) {
      return { success: false, error: 'You must be signed in to edit a bill.' };
    }

    const id =
      formData instanceof FormData ? (formData.get('id') as string) : (formData.id as string);

    if (!id || typeof id !== 'string') {
      return { success: false, error: 'Missing bill ID for update.' };
    }

    const rawData =
      formData instanceof FormData
        ? {
            title: formData.get('title'),
            amount: formData.get('amount'),
            category: formData.get('category'),
            frequency: formData.get('frequency'),
            interval_value: formData.get('interval_value'),
            start_date: formData.get('start_date'),
            total_repetitions: formData.get('total_repetitions'),
            notes: formData.get('notes'),
          }
        : formData;

    const validated = recurringBillSchema.safeParse(rawData);

    if (!validated.success) {
      const fieldErrors = validated.error.flatten().fieldErrors;
      const firstErrorMessage = Object.values(fieldErrors).flat()[0] || 'Invalid input';
      return {
        success: false,
        error: firstErrorMessage,
        fieldErrors,
      };
    }

    const result = await updateRecurringBill(id, {
      title: validated.data.title,
      amount: validated.data.amount,
      category: validated.data.category as ExpenseCategory,
      frequency: validated.data.frequency as BillFrequency,
      interval_value: validated.data.interval_value,
      start_date: validated.data.start_date,
      total_repetitions: validated.data.total_repetitions,
      notes: validated.data.notes ?? null,
    });

    if (result.error || !result.data) {
      return { success: false, error: result.error || 'Failed to update recurring bill.' };
    }

    revalidatePath('/dashboard/bills');
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
 * Server action to delete a recurring bill.
 */
export async function deleteRecurringBillAction(
  formData: FormData | { id: string } | string
): Promise<ActionResponse<void>> {
  try {
    const user = await getUser();
    if (!user) {
      return { success: false, error: 'You must be signed in to delete a bill.' };
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
      return { success: false, error: 'Missing bill ID for deletion.' };
    }

    const result = await deleteRecurringBill(id);

    if (!result.success) {
      return { success: false, error: result.error || 'Failed to delete recurring bill.' };
    }

    revalidatePath('/dashboard/bills');
    revalidatePath('/dashboard');

    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'An unexpected error occurred';
    return { success: false, error: message };
  }
}

/**
 * Server action to toggle a bill's active state.
 */
export async function toggleBillActiveAction(
  formData: FormData | { id: string; is_active: boolean }
): Promise<ActionResponse<RecurringBill>> {
  try {
    const user = await getUser();
    if (!user) {
      return { success: false, error: 'You must be signed in to update a bill.' };
    }

    let id: string;
    let isActive: boolean;

    if (formData instanceof FormData) {
      id = (formData.get('id') as string) || '';
      isActive = formData.get('is_active') === 'true';
    } else {
      id = formData.id;
      isActive = formData.is_active;
    }

    if (!id) {
      return { success: false, error: 'Missing bill ID.' };
    }

    const result = await toggleBillActive(id, isActive);

    if (result.error || !result.data) {
      return { success: false, error: result.error || 'Failed to toggle bill status.' };
    }

    revalidatePath('/dashboard/bills');
    revalidatePath('/dashboard');

    return { success: true, data: result.data };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'An unexpected error occurred';
    return { success: false, error: message };
  }
}

/**
 * Server action to mark an instance as paid.
 */
export async function markPaidAction(
  formData: FormData | { instance_id: string } | string
): Promise<ActionResponse<RecurringBillInstance>> {
  try {
    const user = await getUser();
    if (!user) {
      return { success: false, error: 'You must be signed in.' };
    }

    let instanceId: string;
    if (typeof formData === 'string') {
      instanceId = formData;
    } else if (formData instanceof FormData) {
      instanceId = (formData.get('instance_id') as string) || '';
    } else {
      instanceId = formData.instance_id;
    }

    if (!instanceId) {
      return { success: false, error: 'Missing bill instance ID.' };
    }

    const result = await markInstancePaid(instanceId);

    if (result.error || !result.data) {
      return { success: false, error: result.error || 'Failed to mark bill as paid.' };
    }

    revalidatePath('/dashboard/bills');
    revalidatePath('/dashboard');

    return { success: true, data: result.data };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'An unexpected error occurred';
    return { success: false, error: message };
  }
}

/**
 * Server action to mark an instance as unpaid.
 */
export async function markUnpaidAction(
  formData: FormData | { instance_id: string } | string
): Promise<ActionResponse<RecurringBillInstance>> {
  try {
    const user = await getUser();
    if (!user) {
      return { success: false, error: 'You must be signed in.' };
    }

    let instanceId: string;
    if (typeof formData === 'string') {
      instanceId = formData;
    } else if (formData instanceof FormData) {
      instanceId = (formData.get('instance_id') as string) || '';
    } else {
      instanceId = formData.instance_id;
    }

    if (!instanceId) {
      return { success: false, error: 'Missing bill instance ID.' };
    }

    const result = await markInstanceUnpaid(instanceId);

    if (result.error || !result.data) {
      return { success: false, error: result.error || 'Failed to mark bill as unpaid.' };
    }

    revalidatePath('/dashboard/bills');
    revalidatePath('/dashboard');

    return { success: true, data: result.data };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'An unexpected error occurred';
    return { success: false, error: message };
  }
}
