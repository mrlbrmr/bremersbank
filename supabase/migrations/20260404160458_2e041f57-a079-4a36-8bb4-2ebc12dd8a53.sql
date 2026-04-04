
-- Categories table
CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL DEFAULT 'expense', -- 'income' or 'expense'
  icon text NOT NULL DEFAULT '📦',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users can view categories" ON public.categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can insert categories" ON public.categories FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users can update categories" ON public.categories FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth users can delete categories" ON public.categories FOR DELETE TO authenticated USING (true);

-- Seed default categories
INSERT INTO public.categories (name, type, icon) VALUES
  ('Mercado', 'expense', '🛒'),
  ('Aluguel', 'expense', '🏠'),
  ('Transporte', 'expense', '🚗'),
  ('Lazer', 'expense', '🎮'),
  ('Saúde', 'expense', '💊'),
  ('Outros', 'expense', '📦'),
  ('Salário', 'income', '💰'),
  ('Freelance', 'income', '💻'),
  ('Investimentos', 'income', '📈'),
  ('Outros', 'income', '📦');

-- Financial goals table
CREATE TABLE public.financial_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  target_amount numeric NOT NULL DEFAULT 0,
  current_amount numeric NOT NULL DEFAULT 0,
  icon text NOT NULL DEFAULT '🎯',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.financial_goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users can view goals" ON public.financial_goals FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can insert goals" ON public.financial_goals FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users can update goals" ON public.financial_goals FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth users can delete goals" ON public.financial_goals FOR DELETE TO authenticated USING (true);

-- Installments table
CREATE TABLE public.installments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  description text NOT NULL,
  total_amount numeric NOT NULL,
  total_installments int NOT NULL,
  current_installment int NOT NULL DEFAULT 1,
  monthly_amount numeric NOT NULL,
  start_date date NOT NULL,
  category text DEFAULT 'Outros',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.installments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users can view installments" ON public.installments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can insert installments" ON public.installments FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users can update installments" ON public.installments FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth users can delete installments" ON public.installments FOR DELETE TO authenticated USING (true);
