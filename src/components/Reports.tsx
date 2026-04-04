import { useEffect, useState, useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from "recharts";
import { supabase } from "@/lib/supabase";

const COLORS = ["#6C63FF", "#00C896", "#FF6B6B", "#FFD93D", "#845EC2", "#2C73D2", "#FF9671", "#00D2FC"];

const formatCurrency = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: string;
  category?: string;
  date: string;
}

const Reports = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    supabase.from("transactions").select("*").order("date", { ascending: false })
      .then(({ data }) => setTransactions(data || []));
  }, []);

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const monthTransactions = useMemo(() =>
    transactions.filter((t) => {
      const d = new Date(t.date + "T00:00:00");
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    }), [transactions, currentMonth, currentYear]);

  const totalIncome = monthTransactions.filter(t => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
  const totalExpense = monthTransactions.filter(t => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);

  // Category breakdown
  const categoryData = useMemo(() => {
    const grouped: Record<string, number> = {};
    monthTransactions.filter(t => t.type === "expense").forEach(t => {
      const cat = t.category || "Outros";
      grouped[cat] = (grouped[cat] || 0) + Number(t.amount);
    });
    return Object.entries(grouped).map(([name, value]) => ({ name, value }));
  }, [monthTransactions]);

  // Income vs Expense pie
  const incomeVsExpense = [
    { name: "Receitas", value: totalIncome },
    { name: "Despesas", value: totalExpense },
  ];

  // Monthly comparison (last 6 months)
  const monthlyComparison = useMemo(() => {
    const months: { label: string; income: number; expense: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(currentYear, currentMonth - i, 1);
      const m = d.getMonth();
      const y = d.getFullYear();
      const label = d.toLocaleDateString("pt-BR", { month: "short" });
      let income = 0, expense = 0;
      transactions.forEach(t => {
        const td = new Date(t.date + "T00:00:00");
        if (td.getMonth() === m && td.getFullYear() === y) {
          if (t.type === "income") income += Number(t.amount);
          else expense += Number(t.amount);
        }
      });
      months.push({ label, income, expense });
    }
    return months;
  }, [transactions, currentMonth, currentYear]);

  const tooltipStyle = {
    borderRadius: "12px",
    border: "none",
    boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <h2 className="text-xl font-bold">Relatórios</h2>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl bg-secondary/10 border border-secondary/20 p-4 text-center">
          <p className="text-lg font-bold text-secondary">{formatCurrency(totalIncome)}</p>
          <p className="text-[10px] text-muted-foreground">Total Recebido</p>
        </div>
        <div className="rounded-xl bg-destructive/10 border border-destructive/20 p-4 text-center">
          <p className="text-lg font-bold text-destructive">{formatCurrency(totalExpense)}</p>
          <p className="text-[10px] text-muted-foreground">Total Gasto</p>
        </div>
        <div className="rounded-xl bg-primary/10 border border-primary/20 p-4 text-center">
          <p className="text-lg font-bold">{formatCurrency(totalIncome - totalExpense)}</p>
          <p className="text-[10px] text-muted-foreground">Saldo</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {/* Gastos por categoria */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-muted-foreground mb-4">Gastos por Categoria</h3>
          {categoryData.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-16">Sem dados</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={categoryData} cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={3} dataKey="value" strokeWidth={0}>
                    {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [formatCurrency(v), ""]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-3 mt-3 justify-center">
                {categoryData.map((item, i) => (
                  <div key={item.name} className="flex items-center gap-1 text-xs text-muted-foreground">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                    {item.name}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Receitas vs Despesas */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-muted-foreground mb-4">Receitas vs Despesas</h3>
          {totalIncome === 0 && totalExpense === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-16">Sem dados</p>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={incomeVsExpense} cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={4} dataKey="value" strokeWidth={0}>
                  <Cell fill="#00C896" />
                  <Cell fill="#FF6B6B" />
                </Pie>
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [formatCurrency(v), ""]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Monthly comparison */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-muted-foreground mb-4">Comparativo Mensal (últimos 6 meses)</h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={monthlyComparison}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="label" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
            <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [formatCurrency(v), ""]} />
            <Legend />
            <Bar dataKey="income" name="Receitas" fill="#00C896" radius={[6, 6, 0, 0]} />
            <Bar dataKey="expense" name="Despesas" fill="#FF6B6B" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default Reports;
