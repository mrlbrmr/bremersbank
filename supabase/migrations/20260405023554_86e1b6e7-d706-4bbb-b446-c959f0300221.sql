ALTER TABLE public.recurring_transactions
ADD COLUMN start_date date NOT NULL DEFAULT CURRENT_DATE;