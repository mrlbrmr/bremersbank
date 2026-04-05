CREATE TABLE public.installment_confirmations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  installment_id UUID NOT NULL REFERENCES public.installments(id) ON DELETE CASCADE,
  installment_number INTEGER NOT NULL,
  month_year TEXT NOT NULL,
  confirmed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(installment_id, installment_number)
);

ALTER TABLE public.installment_confirmations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth users can view installment confirmations"
ON public.installment_confirmations FOR SELECT
TO authenticated USING (true);

CREATE POLICY "Auth users can insert installment confirmations"
ON public.installment_confirmations FOR INSERT
TO authenticated WITH CHECK (true);

CREATE POLICY "Auth users can delete installment confirmations"
ON public.installment_confirmations FOR DELETE
TO authenticated USING (true);