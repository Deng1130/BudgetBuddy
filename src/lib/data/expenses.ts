import { createClient } from "@/lib/supabase/server";
import { Expense, ExpenseCategory, Database } from "@/types/database";

export interface GetExpensesOptions {
  limit?: number;
  offset?: number;
  startDate?: string;
  endDate?: string;
  category?: ExpenseCategory | string;
}

export interface ExpenseResponse<T> {
  data: T | null;
  error: string | null;
  count?: number | null;
}

export interface CategoryTotal {
  category: ExpenseCategory;
  total: number;
  count: number;
}

/**
 * Fetches a list of expenses for a specific user with optional filters and pagination.
 * Expenses are ordered by expense_date DESC and created_at DESC.
 */
export async function getExpenses(
  userId: string,
  options?: GetExpensesOptions
): Promise<ExpenseResponse<Expense[]>> {
  try {
    const supabase = await createClient();

    let query = supabase
      .from("expenses")
      .select("*", { count: "exact" })
      .eq("user_id", userId)
      .order("expense_date", { ascending: false })
      .order("created_at", { ascending: false });

    if (options?.category && options.category !== "all") {
      query = query.eq("category", options.category);
    }

    if (options?.startDate) {
      query = query.gte("expense_date", options.startDate);
    }

    if (options?.endDate) {
      query = query.lte("expense_date", options.endDate);
    }

    if (options?.offset !== undefined && options?.limit !== undefined) {
      query = query.range(options.offset, options.offset + options.limit - 1);
    } else if (options?.limit !== undefined) {
      query = query.limit(options.limit);
    }

    const { data, count, error } = await query;

    if (error) {
      console.error("Error fetching expenses:", error.message);
      return { data: null, count: null, error: error.message };
    }

    return {
      data: (data as Expense[]) || [],
      count: count ?? null,
      error: null,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch expenses";
    console.error("Unexpected error in getExpenses:", message);
    return { data: null, count: null, error: message };
  }
}

/**
 * Fetches a single expense by its unique ID.
 */
export async function getExpenseById(id: string): Promise<ExpenseResponse<Expense>> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("expenses")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error(`Error fetching expense ${id}:`, error.message);
      return { data: null, error: error.message };
    }

    return { data: data as Expense, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch expense";
    console.error(`Unexpected error in getExpenseById(${id}):`, message);
    return { data: null, error: message };
  }
}

/**
 * Inserts a new expense.
 * SECURITY: The `user_id` is always fetched directly from the authenticated session,
 * preventing spoofing or tampering via client payloads.
 */
export async function createExpense(
  expense: Omit<Expense, "id" | "created_at">
): Promise<ExpenseResponse<Expense>> {
  try {
    const supabase = await createClient();

    // Verify authenticated user from session
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        data: null,
        error: "Unauthorized: You must be logged in to create an expense.",
      };
    }

    // Enforce authenticated user_id
    const payload = {
      title: expense.title.trim(),
      amount: expense.amount,
      category: expense.category,
      notes: expense.notes ? expense.notes.trim() : null,
      expense_date: expense.expense_date,
      user_id: user.id,
    };

    const { data, error } = await supabase
      .from("expenses")
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.error("Error creating expense:", error.message);
      return { data: null, error: error.message };
    }

    return { data: data as Expense, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create expense";
    console.error("Unexpected error in createExpense:", message);
    return { data: null, error: message };
  }
}

/**
 * Updates an existing expense.
 * Ownership is enforced by Supabase RLS (auth.uid() = user_id).
 */
export async function updateExpense(
  id: string,
  updates: Partial<Expense>
): Promise<ExpenseResponse<Expense>> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        data: null,
        error: "Unauthorized: You must be logged in to update an expense.",
      };
    }

    // Strip immutable fields from updates payload for security
    const safeUpdates: Partial<Database["public"]["Tables"]["expenses"]["Update"]> = {};
    if (updates.title !== undefined) safeUpdates.title = updates.title.trim();
    if (updates.amount !== undefined) safeUpdates.amount = updates.amount;
    if (updates.category !== undefined) safeUpdates.category = updates.category;
    if (updates.notes !== undefined) safeUpdates.notes = updates.notes ? updates.notes.trim() : null;
    if (updates.expense_date !== undefined) safeUpdates.expense_date = updates.expense_date;

    const { data, error } = await supabase
      .from("expenses")
      .update(safeUpdates)
      .eq("id", id)
      .eq("user_id", user.id) // Dual check: explicit filter + RLS
      .select()
      .single();

    if (error) {
      console.error(`Error updating expense ${id}:`, error.message);
      return { data: null, error: error.message };
    }

    return { data: data as Expense, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update expense";
    console.error(`Unexpected error in updateExpense(${id}):`, message);
    return { data: null, error: message };
  }
}

/**
 * Deletes an expense by ID.
 * Ownership is enforced by Supabase RLS (auth.uid() = user_id).
 */
export async function deleteExpense(
  id: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        error: "Unauthorized: You must be logged in to delete an expense.",
      };
    }

    const { error } = await supabase
      .from("expenses")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      console.error(`Error deleting expense ${id}:`, error.message);
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to delete expense";
    console.error(`Unexpected error in deleteExpense(${id}):`, message);
    return { success: false, error: message };
  }
}

/**
 * Returns the total sum of expenses for a specific user and month.
 * Month is 1-indexed (1 = January, 12 = December).
 */
export async function getMonthlyTotal(
  userId: string,
  year: number,
  month: number
): Promise<{ total: number; error: string | null }> {
  try {
    const supabase = await createClient();

    // Construct start and end dates for the given month
    const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
    // Day 0 of the next month gives the last day of the target month
    const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
    const endDate = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

    const { data, error } = await supabase
      .from("expenses")
      .select("amount")
      .eq("user_id", userId)
      .gte("expense_date", startDate)
      .lte("expense_date", endDate);

    if (error) {
      console.error("Error calculating monthly total:", error.message);
      return { total: 0, error: error.message };
    }

    const total = (data || []).reduce(
      (sum, item) => sum + Number(item.amount || 0),
      0
    );

    return { total, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to calculate monthly total";
    console.error("Unexpected error in getMonthlyTotal:", message);
    return { total: 0, error: message };
  }
}

/**
 * Returns expense totals grouped by category for a specific month (useful for charts and breakdowns).
 * Month is 1-indexed (1 = January, 12 = December).
 */
export async function getExpensesByCategory(
  userId: string,
  year: number,
  month: number
): Promise<{ data: CategoryTotal[]; error: string | null }> {
  try {
    const supabase = await createClient();

    const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
    const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
    const endDate = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

    const { data, error } = await supabase
      .from("expenses")
      .select("category, amount")
      .eq("user_id", userId)
      .gte("expense_date", startDate)
      .lte("expense_date", endDate);

    if (error) {
      console.error("Error fetching expenses by category:", error.message);
      return { data: [], error: error.message };
    }

    const grouped: Record<string, CategoryTotal> = {};

    for (const item of data || []) {
      const cat = item.category as ExpenseCategory;
      if (!grouped[cat]) {
        grouped[cat] = { category: cat, total: 0, count: 0 };
      }
      grouped[cat].total += Number(item.amount || 0);
      grouped[cat].count += 1;
    }

    return {
      data: Object.values(grouped).sort((a, b) => b.total - a.total),
      error: null,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to aggregate categories";
    console.error("Unexpected error in getExpensesByCategory:", message);
    return { data: [], error: message };
  }
}
