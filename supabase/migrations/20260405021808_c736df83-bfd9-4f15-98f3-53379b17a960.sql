
CREATE TABLE public.recurring_confirmations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  recurring_id UUID NOT NULL REFERENCES public.recurring_transactions(id) ON DELETE CASCADE,
  month_year TEXT NOT NULL,
  confirmed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (recurring_id, month_year)
);

ALTER TABLE public.recurring_confirmations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own confirmations"
ON public.recurring_confirmations
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.recurring_transactions rt
    WHERE rt.id = recurring_id AND rt.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert their own confirmations"
ON public.recurring_confirmations
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.recurring_transactions rt
    WHERE rt.id = recurring_id AND rt.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their own confirmations"
ON public.recurring_confirmations
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.recurring_transactions rt
    WHERE rt.id = recurring_id AND rt.user_id = auth.uid()
  )
);
