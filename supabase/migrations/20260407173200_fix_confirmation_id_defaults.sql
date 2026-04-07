CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE public.installment_confirmations
  ALTER COLUMN id SET DEFAULT gen_random_uuid();

UPDATE public.installment_confirmations
  SET id = gen_random_uuid()
  WHERE id IS NULL;

ALTER TABLE public.installment_confirmations
  ALTER COLUMN id SET NOT NULL;

ALTER TABLE public.recurring_confirmations
  ALTER COLUMN id SET DEFAULT gen_random_uuid();

UPDATE public.recurring_confirmations
  SET id = gen_random_uuid()
  WHERE id IS NULL;

ALTER TABLE public.recurring_confirmations
  ALTER COLUMN id SET NOT NULL;
