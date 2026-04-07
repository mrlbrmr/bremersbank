-- Execute this script in Supabase Dashboard -> SQL Editor to create the spending_limits table
-- URL: https://supabase.com/dashboard/project/tpophphtloixefuxujsi

-- 1. Create the main spending_limits table
CREATE TABLE IF NOT EXISTS public.spending_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  month_year text NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(month_year)
);

-- 2. Add category column if it doesn't exist
ALTER TABLE public.spending_limits ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'Geral';

-- 3. Update the primary key and unique index to include category
-- First, drop old constraints if they exist
ALTER TABLE public.spending_limits DROP CONSTRAINT IF EXISTS spending_limits_pkey CASCADE;
DROP INDEX IF EXISTS spending_limits_month_category_idx;

-- 4. Add new primary key
ALTER TABLE public.spending_limits ADD CONSTRAINT spending_limits_pkey PRIMARY KEY (id);

-- 5. Create new unique index on (month_year, category)
CREATE UNIQUE INDEX IF NOT EXISTS spending_limits_month_category_idx ON public.spending_limits (month_year, category);

-- 6. Enable Row Level Security
ALTER TABLE public.spending_limits ENABLE ROW LEVEL SECURITY;

-- 7. Drop old policies if they exist
DROP POLICY IF EXISTS "Authenticated users can view spending limits" ON public.spending_limits;
DROP POLICY IF EXISTS "Authenticated users can insert spending limits" ON public.spending_limits;
DROP POLICY IF EXISTS "Authenticated users can update spending limits" ON public.spending_limits;
DROP POLICY IF EXISTS "Authenticated users can delete spending limits" ON public.spending_limits;

-- 8. Create RLS policies
CREATE POLICY "Authenticated users can view spending limits"
  ON public.spending_limits FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert spending limits"
  ON public.spending_limits FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update spending limits"
  ON public.spending_limits FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can delete spending limits"
  ON public.spending_limits FOR DELETE TO authenticated USING (true);
