CREATE TABLE public.spending_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  month_year text NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(month_year)
);

ALTER TABLE public.spending_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view spending limits"
  ON public.spending_limits FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert spending limits"
  ON public.spending_limits FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update spending limits"
  ON public.spending_limits FOR UPDATE TO authenticated USING (true) WITH CHECK (true);