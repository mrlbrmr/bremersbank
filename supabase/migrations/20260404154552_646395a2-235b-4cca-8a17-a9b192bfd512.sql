CREATE POLICY "Authenticated users can update transactions"
  ON public.transactions FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);