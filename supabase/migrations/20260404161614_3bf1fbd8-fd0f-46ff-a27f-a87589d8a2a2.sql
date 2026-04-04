ALTER TABLE public.spending_limits ADD COLUMN category text NOT NULL DEFAULT 'Geral';
ALTER TABLE public.spending_limits DROP CONSTRAINT IF EXISTS spending_limits_pkey;
ALTER TABLE public.spending_limits ADD PRIMARY KEY (id);
CREATE UNIQUE INDEX spending_limits_month_category_idx ON public.spending_limits (month_year, category);