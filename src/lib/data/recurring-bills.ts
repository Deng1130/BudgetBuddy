import { createClient } from "@/lib/supabase/server";
import {
  RecurringBill,
  RecurringBillInstance,
  BillFrequency,
  ExpenseCategory,
} from "@/types/database";
import { format, addDays } from "date-fns";

export interface RecurringBillWithInstances extends RecurringBill {
  instances: RecurringBillInstance[];
}

export interface UpcomingBillInstance extends RecurringBillInstance {
  bill?: {
    id: string;
    title: string;
    category: ExpenseCategory;
    frequency: BillFrequency;
    interval_value: number;
    total_repetitions: number | null;
    repetitions_completed: number;
    is_active: boolean;
  } | null;
}

export interface DataResponse<T> {
  data: T | null;
  error: string | null;
}

/**
 * Fetches all recurring bills for the authenticated user.
 * Ordered by created_at DESC.
 */
export async function getRecurringBills(
  userId: string,
  options?: { activeOnly?: boolean }
): Promise<DataResponse<RecurringBill[]>> {
  try {
    const supabase = await createClient();

    let query = supabase
      .from("recurring_bills")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (options?.activeOnly) {
      query = query.eq("is_active", true);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching recurring bills:", error.message);
      return { data: null, error: error.message };
    }

    return { data: (data as RecurringBill[]) || [], error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch recurring bills";
    console.error("Unexpected error in getRecurringBills:", message);
    return { data: null, error: message };
  }
}

/**
 * Fetches a single recurring bill along with all its generated instances.
 */
export async function getRecurringBillById(
  id: string
): Promise<DataResponse<RecurringBillWithInstances>> {
  try {
    const supabase = await createClient();

    const { data: bill, error: billError } = await supabase
      .from("recurring_bills")
      .select("*")
      .eq("id", id)
      .single();

    if (billError || !bill) {
      return { data: null, error: billError?.message || "Bill not found" };
    }

    const { data: instances, error: instancesError } = await supabase
      .from("recurring_bill_instances")
      .select("*")
      .eq("bill_id", id)
      .order("due_date", { ascending: true });

    if (instancesError) {
      console.error("Error fetching bill instances:", instancesError.message);
    }

    const result: RecurringBillWithInstances = {
      ...(bill as RecurringBill),
      instances: (instances as RecurringBillInstance[]) || [],
    };

    return { data: result, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch recurring bill";
    console.error(`Unexpected error in getRecurringBillById(${id}):`, message);
    return { data: null, error: message };
  }
}

/**
 * Inserts a new recurring bill.
 * SECURITY: Enforces authenticated user_id from Supabase auth.
 * Automatically calls `generate_bill_instances` to pre-generate the next 6 instances.
 */
export async function createRecurringBill(
  bill: Omit<RecurringBill, "id" | "created_at" | "repetitions_completed">
): Promise<DataResponse<RecurringBill>> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { data: null, error: "Unauthorized: Please sign in." };
    }

    const payload = {
      user_id: user.id,
      title: bill.title.trim(),
      amount: bill.amount,
      category: bill.category,
      frequency: bill.frequency,
      interval_value: bill.interval_value,
      start_date: bill.start_date,
      total_repetitions: bill.total_repetitions ?? null,
      repetitions_completed: 0,
      is_active: bill.is_active ?? true,
      notes: bill.notes ? bill.notes.trim() : null,
    };

    const { data, error } = await supabase
      .from("recurring_bills")
      .insert(payload)
      .select()
      .single();

    if (error || !data) {
      console.error("Error creating recurring bill:", error?.message);
      return { data: null, error: error?.message || "Failed to create bill" };
    }

    const createdBill = data as RecurringBill;

    // Call Postgres RPC function to generate the initial 6 instances
    const { error: rpcError } = await supabase.rpc("generate_bill_instances", {
      p_bill_id: createdBill.id,
      p_count: 6,
    });

    if (rpcError) {
      console.warn("generate_bill_instances RPC notice:", rpcError.message);
    }

    return { data: createdBill, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create recurring bill";
    console.error("Unexpected error in createRecurringBill:", message);
    return { data: null, error: message };
  }
}

/**
 * Updates a recurring bill. If the schedule changed (frequency, interval, start_date),
 * future unpaid instances are removed and regenerated cleanly.
 */
export async function updateRecurringBill(
  id: string,
  updates: Partial<RecurringBill>
): Promise<DataResponse<RecurringBill>> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { data: null, error: "Unauthorized: Please sign in." };
    }

    // Check if schedule parameters are being modified
    const scheduleChanged =
      updates.frequency !== undefined ||
      updates.interval_value !== undefined ||
      updates.start_date !== undefined;

    // Filter mutable fields
    const safeUpdates: Record<string, unknown> = {};
    if (updates.title !== undefined) safeUpdates.title = updates.title.trim();
    if (updates.amount !== undefined) safeUpdates.amount = updates.amount;
    if (updates.category !== undefined) safeUpdates.category = updates.category;
    if (updates.frequency !== undefined) safeUpdates.frequency = updates.frequency;
    if (updates.interval_value !== undefined) safeUpdates.interval_value = updates.interval_value;
    if (updates.start_date !== undefined) safeUpdates.start_date = updates.start_date;
    if (updates.total_repetitions !== undefined) safeUpdates.total_repetitions = updates.total_repetitions;
    if (updates.is_active !== undefined) safeUpdates.is_active = updates.is_active;
    if (updates.notes !== undefined) safeUpdates.notes = updates.notes ? updates.notes.trim() : null;

    const { data, error } = await supabase
      .from("recurring_bills")
      .update(safeUpdates)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error || !data) {
      console.error("Error updating recurring bill:", error?.message);
      return { data: null, error: error?.message || "Failed to update bill" };
    }

    // If schedule changed, clean up future unpaid instances and regenerate
    if (scheduleChanged) {
      await supabase
        .from("recurring_bill_instances")
        .delete()
        .eq("bill_id", id)
        .eq("is_paid", false);

      await supabase.rpc("generate_bill_instances", {
        p_bill_id: id,
        p_count: 6,
      });
    }

    return { data: data as RecurringBill, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update recurring bill";
    console.error(`Unexpected error in updateRecurringBill(${id}):`, message);
    return { data: null, error: message };
  }
}

/**
 * Deletes a recurring bill. Cascade delete will clean up all instances.
 */
export async function deleteRecurringBill(
  id: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "Unauthorized: Please sign in." };
    }

    const { error } = await supabase
      .from("recurring_bills")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      console.error(`Error deleting recurring bill ${id}:`, error.message);
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to delete recurring bill";
    console.error(`Unexpected error in deleteRecurringBill(${id}):`, message);
    return { success: false, error: message };
  }
}

/**
 * Toggles a bill's active state.
 */
export async function toggleBillActive(
  id: string,
  isActive: boolean
): Promise<DataResponse<RecurringBill>> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { data: null, error: "Unauthorized: Please sign in." };
    }

    const { data, error } = await supabase
      .from("recurring_bills")
      .update({ is_active: isActive })
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error || !data) {
      return { data: null, error: error?.message || "Failed to toggle bill status" };
    }

    // If activated, ensure future instances exist
    if (isActive) {
      await supabase.rpc("generate_bill_instances", {
        p_bill_id: id,
        p_count: 6,
      });
    }

    return { data: data as RecurringBill, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to toggle active state";
    return { data: null, error: message };
  }
}

/**
 * Fetches upcoming unpaid instances within the next N days (or all future upcoming).
 * Includes parent bill metadata.
 */
export async function getUpcomingInstances(
  userId: string,
  options?: { limit?: number; daysAhead?: number }
): Promise<DataResponse<UpcomingBillInstance[]>> {
  try {
    const supabase = await createClient();

    let query = supabase
      .from("recurring_bill_instances")
      .select(`
        *,
        bill:recurring_bills (
          id,
          title,
          category,
          frequency,
          interval_value,
          total_repetitions,
          repetitions_completed,
          is_active
        )
      `)
      .eq("user_id", userId)
      .eq("is_paid", false)
      .order("due_date", { ascending: true });

    if (options?.daysAhead) {
      const maxDate = format(addDays(new Date(), options.daysAhead), "yyyy-MM-dd");
      query = query.lte("due_date", maxDate);
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching upcoming instances:", error.message);
      return { data: null, error: error.message };
    }

    return { data: (data as UpcomingBillInstance[]) || [], error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch upcoming instances";
    console.error("Unexpected error in getUpcomingInstances:", message);
    return { data: null, error: message };
  }
}

/**
 * Marks a specific bill instance as paid, sets paid_at,
 * and increments the parent recurring bill's `repetitions_completed`.
 */
export async function markInstancePaid(
  instanceId: string
): Promise<DataResponse<RecurringBillInstance>> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { data: null, error: "Unauthorized: Please sign in." };
    }

    // 1. Fetch current instance to locate parent bill_id
    const { data: currentInstance, error: fetchError } = await supabase
      .from("recurring_bill_instances")
      .select("*, bill:recurring_bills(*)")
      .eq("id", instanceId)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !currentInstance) {
      return { data: null, error: fetchError?.message || "Bill instance not found" };
    }

    // 2. Mark instance as paid
    const nowIso = new Date().toISOString();
    const { data: updatedInstance, error: updateError } = await supabase
      .from("recurring_bill_instances")
      .update({
        is_paid: true,
        paid_at: nowIso,
      })
      .eq("id", instanceId)
      .select()
      .single();

    if (updateError || !updatedInstance) {
      return { data: null, error: updateError?.message || "Failed to mark bill as paid" };
    }

    // 3. Increment repetitions_completed on parent bill
    if (currentInstance.bill_id) {
      const parentBill = currentInstance.bill as RecurringBill | null;
      const currentCount = parentBill?.repetitions_completed || 0;

      await supabase
        .from("recurring_bills")
        .update({
          repetitions_completed: currentCount + 1,
        })
        .eq("id", currentInstance.bill_id);

      // Generate additional upcoming instances so a rolling window is maintained
      await supabase.rpc("generate_bill_instances", {
        p_bill_id: currentInstance.bill_id,
        p_count: 6,
      });
    }

    return { data: updatedInstance as RecurringBillInstance, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to mark bill as paid";
    console.error(`Unexpected error in markInstancePaid(${instanceId}):`, message);
    return { data: null, error: message };
  }
}

/**
 * Reverses the paid state of a bill instance and decrements `repetitions_completed`.
 */
export async function markInstanceUnpaid(
  instanceId: string
): Promise<DataResponse<RecurringBillInstance>> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { data: null, error: "Unauthorized: Please sign in." };
    }

    const { data: currentInstance, error: fetchError } = await supabase
      .from("recurring_bill_instances")
      .select("*, bill:recurring_bills(*)")
      .eq("id", instanceId)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !currentInstance) {
      return { data: null, error: fetchError?.message || "Bill instance not found" };
    }

    const { data: updatedInstance, error: updateError } = await supabase
      .from("recurring_bill_instances")
      .update({
        is_paid: false,
        paid_at: null,
      })
      .eq("id", instanceId)
      .select()
      .single();

    if (updateError || !updatedInstance) {
      return { data: null, error: updateError?.message || "Failed to mark bill unpaid" };
    }

    if (currentInstance.bill_id) {
      const parentBill = currentInstance.bill as RecurringBill | null;
      const currentCount = parentBill?.repetitions_completed || 1;

      await supabase
        .from("recurring_bills")
        .update({
          repetitions_completed: Math.max(0, currentCount - 1),
        })
        .eq("id", currentInstance.bill_id);
    }

    return { data: updatedInstance as RecurringBillInstance, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to mark bill unpaid";
    console.error(`Unexpected error in markInstanceUnpaid(${instanceId}):`, message);
    return { data: null, error: message };
  }
}

/**
 * Calculates the total sum of bill instances due in a given month.
 * Month is 1-indexed (1 = January, 12 = December).
 */
export async function getMonthlyBillsTotal(
  userId: string,
  year: number,
  month: number
): Promise<{ total: number; error: string | null }> {
  try {
    const supabase = await createClient();

    const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
    const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
    const endDate = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

    const { data, error } = await supabase
      .from("recurring_bill_instances")
      .select("amount")
      .eq("user_id", userId)
      .gte("due_date", startDate)
      .lte("due_date", endDate);

    if (error) {
      console.error("Error calculating monthly bills total:", error.message);
      return { total: 0, error: error.message };
    }

    const total = (data || []).reduce(
      (sum, item) => sum + Number(item.amount || 0),
      0
    );

    return { total, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to calculate monthly bills total";
    console.error("Unexpected error in getMonthlyBillsTotal:", message);
    return { total: 0, error: message };
  }
}
