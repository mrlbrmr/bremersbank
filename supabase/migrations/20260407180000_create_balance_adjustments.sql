-- Create balance_adjustments table for tracking manual balance adjustments
CREATE TABLE public.balance_adjustments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  adjustment_date DATE NOT NULL,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.balance_adjustments ENABLE ROW LEVEL SECURITY;

-- Create policies for balance_adjustments
CREATE POLICY "Authenticated users can view balance adjustments"
  ON public.balance_adjustments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert balance adjustments"
  ON public.balance_adjustments FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete balance adjustments"
  ON public.balance_adjustments FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can update balance adjustments"
  ON public.balance_adjustments FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX idx_balance_adjustments_user_id ON public.balance_adjustments(user_id);
CREATE INDEX idx_balance_adjustments_date ON public.balance_adjustments(adjustment_date);

-- Add to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.balance_adjustments;
