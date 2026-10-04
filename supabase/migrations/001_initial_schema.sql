-- a) Create an enum for bill frequency
CREATE TYPE bill_frequency AS ENUM (
  'daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'yearly'
);

-- b) Create an enum for expense categories
CREATE TYPE expense_category AS ENUM (
  'food', 'transport', 'housing', 'utilities', 'entertainment',
  'healthcare', 'education', 'shopping', 'subscriptions', 'other'
);

-- c) Create the profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  preferred_currency TEXT DEFAULT 'USD',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- d) Create a trigger function that auto-creates a profile row when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$
LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- e) Create the expenses table
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  category expense_category NOT NULL DEFAULT 'other',
  notes TEXT,
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_expenses_user_date ON expenses(user_id, expense_date DESC);

-- f) Create the recurring_bills table
CREATE TABLE recurring_bills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  category expense_category NOT NULL DEFAULT 'subscriptions',
  frequency bill_frequency NOT NULL DEFAULT 'monthly',
  interval_value INT NOT NULL DEFAULT 1 CHECK (interval_value > 0),
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_repetitions INT CHECK (total_repetitions IS NULL OR total_repetitions > 0),
  -- NULL = infinite recurrence
  repetitions_completed INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_recurring_bills_user ON recurring_bills(user_id, is_active);

-- g) Create the recurring_bill_instances table
CREATE TABLE recurring_bill_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_id UUID NOT NULL REFERENCES recurring_bills(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  due_date DATE NOT NULL,
  amount NUMERIC(12, 2) NOT NULL,
  is_paid BOOLEAN NOT NULL DEFAULT FALSE,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_bill_instances_user_date
  ON recurring_bill_instances(user_id, due_date DESC);
CREATE INDEX idx_bill_instances_bill
  ON recurring_bill_instances(bill_id);

-- h) Enable Row Level Security (RLS) on ALL tables and create strict policies

-- PROFILES
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profiles" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own profiles" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profiles" ON profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can delete own profiles" ON profiles
  FOR DELETE USING (auth.uid() = id);

-- EXPENSES
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own expenses" ON expenses
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own expenses" ON expenses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own expenses" ON expenses
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own expenses" ON expenses
  FOR DELETE USING (auth.uid() = user_id);

-- RECURRING BILLS
ALTER TABLE recurring_bills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own recurring_bills" ON recurring_bills
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own recurring_bills" ON recurring_bills
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own recurring_bills" ON recurring_bills
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own recurring_bills" ON recurring_bills
  FOR DELETE USING (auth.uid() = user_id);

-- RECURRING BILL INSTANCES
ALTER TABLE recurring_bill_instances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own recurring_bill_instances" ON recurring_bill_instances
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own recurring_bill_instances" ON recurring_bill_instances
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own recurring_bill_instances" ON recurring_bill_instances
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own recurring_bill_instances" ON recurring_bill_instances
  FOR DELETE USING (auth.uid() = user_id);

-- i) Create a database function to generate upcoming bill instances
CREATE OR REPLACE FUNCTION generate_bill_instances(p_bill_id UUID, p_count INT DEFAULT 6)
RETURNS SETOF recurring_bill_instances AS $$
DECLARE
  v_bill recurring_bills%ROWTYPE;
  v_due_date DATE;
  v_instances_generated INT := 0;
  v_interval_str TEXT;
BEGIN
  -- Get the bill details
  SELECT * INTO v_bill FROM recurring_bills WHERE id = p_bill_id;
  
  IF NOT FOUND OR NOT v_bill.is_active THEN
    RETURN;
  END IF;

  -- Determine the postgres interval string based on frequency
  CASE v_bill.frequency
    WHEN 'daily' THEN v_interval_str := v_bill.interval_value || ' days';
    WHEN 'weekly' THEN v_interval_str := v_bill.interval_value || ' weeks';
    WHEN 'biweekly' THEN v_interval_str := (v_bill.interval_value * 2) || ' weeks';
    WHEN 'monthly' THEN v_interval_str := v_bill.interval_value || ' months';
    WHEN 'quarterly' THEN v_interval_str := (v_bill.interval_value * 3) || ' months';
    WHEN 'yearly' THEN v_interval_str := v_bill.interval_value || ' years';
  END CASE;

  -- Generate instances
  v_due_date := v_bill.start_date;
  
  -- Fast forward past completed repetitions
  IF v_bill.repetitions_completed > 0 THEN
    v_due_date := v_due_date + (v_interval_str::interval * v_bill.repetitions_completed);
  END IF;

  WHILE v_instances_generated < p_count LOOP
    -- Stop if we hit the total repetitions limit
    IF v_bill.total_repetitions IS NOT NULL AND (v_bill.repetitions_completed + v_instances_generated) >= v_bill.total_repetitions THEN
      EXIT;
    END IF;

    -- Insert the instance if it doesn't already exist for this exact date and bill
    IF NOT EXISTS (SELECT 1 FROM recurring_bill_instances WHERE bill_id = v_bill.id AND due_date = v_due_date) THEN
      RETURN QUERY INSERT INTO recurring_bill_instances (
        bill_id, user_id, due_date, amount
      ) VALUES (
        v_bill.id, v_bill.user_id, v_due_date, v_bill.amount
      ) RETURNING *;
    END IF;

    v_instances_generated := v_instances_generated + 1;
    v_due_date := (v_due_date + v_interval_str::interval)::date;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
