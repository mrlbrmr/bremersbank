
DROP POLICY "Users can view their own transactions" ON public.transactions;
DROP POLICY "Users can insert their own transactions" ON public.transactions;
DROP POLICY "Users can delete their own transactions" ON public.transactions;

CREATE POLICY "Authenticated users can view all transactions"
  ON public.transactions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert transactions"
  ON public.transactions FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete transactions"
  ON public.transactions FOR DELETE
  TO authenticated
  USING (true);
