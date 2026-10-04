export type BillFrequency = 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly';

export type ExpenseCategory = 
  | 'food' 
  | 'transport' 
  | 'housing' 
  | 'utilities' 
  | 'entertainment'
  | 'healthcare' 
  | 'education' 
  | 'shopping' 
  | 'subscriptions' 
  | 'other';

export interface Profile {
  id: string; // UUID
  display_name: string | null;
  avatar_url: string | null;
  preferred_currency: string;
  created_at: string; // TIMESTAMPTZ
}

export interface Expense {
  id: string; // UUID
  user_id: string; // UUID (references profile)
  title: string;
  amount: number;
  category: ExpenseCategory;
  notes: string | null;
  expense_date: string; // DATE
  created_at: string; // TIMESTAMPTZ
}

export interface RecurringBill {
  id: string; // UUID
  user_id: string; // UUID (references profile)
  title: string;
  amount: number;
  category: ExpenseCategory;
  frequency: BillFrequency;
  interval_value: number;
  start_date: string; // DATE
  total_repetitions: number | null;
  repetitions_completed: number;
  is_active: boolean;
  notes: string | null;
  created_at: string; // TIMESTAMPTZ
}

export interface RecurringBillInstance {
  id: string; // UUID
  bill_id: string; // UUID
  user_id: string; // UUID
  due_date: string; // DATE
  amount: number;
  is_paid: boolean;
  paid_at: string | null; // TIMESTAMPTZ
  created_at: string; // TIMESTAMPTZ
}

// Database interface simulating Supabase generated types
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Partial<Profile> & { id: string };
        Update: Partial<Profile>;
      };
      expenses: {
        Row: Expense;
        Insert: Omit<Expense, 'id' | 'created_at'> & { id?: string; created_at?: string };
        Update: Partial<Expense>;
      };
      recurring_bills: {
        Row: RecurringBill;
        Insert: Omit<RecurringBill, 'id' | 'created_at'> & { id?: string; created_at?: string };
        Update: Partial<RecurringBill>;
      };
      recurring_bill_instances: {
        Row: RecurringBillInstance;
        Insert: Omit<RecurringBillInstance, 'id' | 'created_at'> & { id?: string; created_at?: string };
        Update: Partial<RecurringBillInstance>;
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      generate_bill_instances: {
        Args: {
          p_bill_id: string;
          p_count?: number;
        };
        Returns: RecurringBillInstance[];
      };
    };
    Enums: {
      bill_frequency: BillFrequency;
      expense_category: ExpenseCategory;
    };
  };
}
