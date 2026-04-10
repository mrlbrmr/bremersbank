-- Ensure user_id can be auto-populated from authenticated JWT context
ALTER TABLE public.recurring_transactions
ALTER COLUMN user_id SET DEFAULT auth.uid();

-- Keep recurring transaction values consistent with frontend validations
ALTER TABLE public.recurring_transactions
ADD CONSTRAINT recurring_transactions_day_of_month_range
CHECK (day_of_month BETWEEN 1 AND 31);

ALTER TABLE public.recurring_transactions
ADD CONSTRAINT recurring_transactions_type_allowed
CHECK (type IN ('income', 'expense'));
