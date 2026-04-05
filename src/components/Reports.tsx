import { useEffect, useState, useMemo, useRef } from "react";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Legend, LineChart, Line, Area, AreaChart
} from "recharts";
import {
  TrendingUp, TrendingDown, DollarSign, ArrowUpRight, ArrowDownLeft,
  PiggyBank, AlertTriangle, Lightbulb, ChevronDown, Calendar
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useFilters, type PeriodFilter, type ReportSection } from "@/contexts/FilterContext";
import { useInstallmentTransactions, mergeTransactions } from "@/hooks/useInstallmentTransactions";
import { useRecurringVirtualTransactions } from "@/hooks/useRecurringTransactions";

const COLORS = ["#6C63FF", "#00C896", "#FF6B6B", "#FFD93D", "#845EC2", "#2C73D2", "#FF9671", "#00D2FC", "#F9A8D4", "#34D399"];

const formatCurrency = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const formatCompact = (v: number) => {
  if (Math.abs(v) >= 1000) return `R$${(v / 1000).toFixed(1)}k`;
  return `R$${v.toFixed(0)}`;
};

interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: string;
  category?: string;
  date: string;
}

interface Installment {
  id: string;
  description: string;
  total_amount: number;
  total_installments: number;
  current_installment: number;
  monthly_amount: number;
  start_date: string;
  category: string;
  active: boolean;
}

interface RecurringItem {
  id: string;
  description: string;
  amount: number;
  type: string;
  category: string;
  day_of_month: number;
  active: boolean;
}

const Reports = () => {
  const { filters, updateFilters } = useFilters();
  const { period, showRealized, section, category: filterCategory, type: filterType } = filters;
  const setPeriod = (p: PeriodFilter) => updateFilters({ period: p });
  const setShowRealized = (v: boolean) => updateFilters({ showRealized: v });

  const [rawTransactions, setRawTransactions] = useState<Transaction[]>([]);
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [recurringItems, setRecurringItems] = useState<RecurringItem[]>([]);

  // Refs for scrolling to sections
  const sectionRefs: Record<ReportSection, React.RefObject<HTMLDivElement | null>> = {
    overview: useRef<HTMLDivElement>(null),
    balance: useRef<HTMLDivElement>(null),
    categories: useRef<HTMLDivElement>(null),
    "income-vs-expense": useRef<HTMLDivElement>(null),
    comparison: useRef<HTMLDivElement>(null),
    insights: useRef<HTMLDivElement>(null),
  };

  useEffect(() => {
    supabase.from("transactions").select("*").order("date", { ascending: true })
      .then(({ data }) => setRawTransactions(data || []));
    supabase.from("installments").select("*")
      .then(({ data }) => setInstallments(data || []));
    supabase.from("recurring_transactions").select("*")
      .then(({ data }) => setRecurringItems(data || []));
  }, []);

  // Generate virtual transactions for current view
  const installmentVirtual = useInstallmentTransactions(installments);
  
  // For recurring, generate for ALL months in the possible period range (up to 12 months back + current)
  const allRecurringVirtual = useMemo(() => {
    const virtual: Transaction[] = [];
    const now = new Date();
    for (let i = 12; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const month = d.getMonth();
      const year = d.getFullYear();
      
      for (const r of recurringItems) {
        if (!r.active) continue;
        
        // Check if a real transaction already exists for this month
        const alreadyExists = rawTransactions.some(t => {
          const td = new Date(t.date + "T00:00:00");
          return (
            td.getMonth() === month &&
            td.getFullYear() === year &&
            t.description === r.description &&
            Math.abs(Number(t.amount) - Number(r.amount)) < 0.01 &&
            t.type === r.type
          );
        });
        if (alreadyExists) continue;
        
        const lastDay = new Date(year, month + 1, 0).getDate();
        const day = Math.min(r.day_of_month, lastDay);
        const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        
        virtual.push({
          id: `recurring-${r.id}-${year}-${month}`,
          description: r.description,
          amount: Number(r.amount),
          type: r.type,
          category: r.category,
          date: dateStr,
        });
      }
    }
    return virtual;
  }, [recurringItems, rawTransactions]);

  // Merge all transactions
  const transactions = useMemo(
    () => mergeTransactions([...rawTransactions, ...allRecurringVirtual], installmentVirtual),
    [rawTransactions, installmentVirtual, allRecurringVirtual]
  );

  // Auto-scroll to section when navigated from dashboard
  useEffect(() => {
    if (section && section !== "overview" && sectionRefs[section]?.current) {
      setTimeout(() => {
        sectionRefs[section]?.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 150);
    }
  }, [section]);

  const now = new Date();
  now.setHours(23, 59, 59, 999);

  const periodRange = useMemo(() => {
    const end = new Date(now);
    const start = new Date(now);
    switch (period) {
      case "1m": start.setMonth(start.getMonth() - 1); break;
      case "3m": start.setMonth(start.getMonth() - 3); break;
      case "6m": start.setMonth(start.getMonth() - 6); break;
      case "1y": start.setFullYear(start.getFullYear() - 1); break;
      default: start.setMonth(start.getMonth() - 1);
    }
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    return { start, end };
  }, [period]);

  const prevPeriodRange = useMemo(() => {
    const duration = periodRange.end.getTime() - periodRange.start.getTime();
    const prevEnd = new Date(periodRange.start.getTime() - 1);
    const prevStart = new Date(prevEnd.getTime() - duration);
    return { start: prevStart, end: prevEnd };
  }, [periodRange]);

  const inRange = (t: Transaction, range: { start: Date; end: Date }) => {
    const d = new Date(t.date + "T00:00:00");
    if (showRealized) return d >= range.start && d <= new Date() && d <= range.end;
    return d >= range.start && d <= range.end;
  };

  const filtered = useMemo(() => transactions.filter(t => inRange(t, periodRange)), [transactions, periodRange, showRealized]);
  const prevFiltered = useMemo(() => transactions.filter(t => inRange(t, prevPeriodRange)), [transactions, prevPeriodRange, showRealized]);

  const calcTotals = (txs: Transaction[]) => {
    const income = txs.filter(t => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
    const expense = txs.filter(t => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);
    return { income, expense, balance: income - expense, savings: income > 0 ? ((income - expense) / income) * 100 : 0 };
  };

  const current = calcTotals(filtered);
  const prev = calcTotals(prevFiltered);

  const variation = (cur: number, pre: number) => {
    if (pre === 0) return cur > 0 ? 100 : 0;
    return ((cur - pre) / pre) * 100;
  };

  const incomeVar = variation(current.income, prev.income);
  const expenseVar = variation(current.expense, prev.expense);
  const balanceVar = variation(current.balance, prev.balance);

  // Category breakdown (donut)
  const categoryData = useMemo(() => {
    const grouped: Record<string, number> = {};
    filtered.filter(t => t.type === "expense").forEach(t => {
      const cat = t.category || "Outros";
      grouped[cat] = (grouped[cat] || 0) + Number(t.amount);
    });
    const total = Object.values(grouped).reduce((a, b) => a + b, 0);
    return Object.entries(grouped)
      .map(([name, value]) => ({ name, value, percent: total > 0 ? ((value / total) * 100).toFixed(1) : "0" }))
      .sort((a, b) => b.value - a.value);
  }, [filtered]);

  // Timeline data (line chart)
  const timelineData = useMemo(() => {
    const map = new Map<string, { date: string; income: number; expense: number; balance: number }>();
    let runningBalance = 0;
    const sorted = [...filtered].sort((a, b) => a.date.localeCompare(b.date));

    sorted.forEach(t => {
      const key = t.date;
      if (!map.has(key)) map.set(key, { date: key, income: 0, expense: 0, balance: 0 });
      const entry = map.get(key)!;
      const amt = Number(t.amount);
      if (t.type === "income") entry.income += amt;
      else entry.expense += amt;
    });

    const result: { date: string; label: string; income: number; expense: number; balance: number }[] = [];
    for (const [date, entry] of map) {
      runningBalance += entry.income - entry.expense;
      result.push({
        date,
        label: new Date(date + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }),
        income: entry.income,
        expense: entry.expense,
        balance: runningBalance,
      });
    }
    return result;
  }, [filtered]);

  // Monthly bars
  const monthlyBars = useMemo(() => {
    const monthCount = period === "1y" ? 12 : period === "6m" ? 6 : period === "3m" ? 3 : 2;
    const months: { label: string; income: number; expense: number }[] = [];
    for (let i = monthCount - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const m = d.getMonth();
      const y = d.getFullYear();
      const label = d.toLocaleDateString("pt-BR", { month: "short", year: period === "1y" ? "2-digit" : undefined });
      let income = 0, expense = 0;
      transactions.forEach(t => {
        const td = new Date(t.date + "T00:00:00");
        if (td.getMonth() === m && td.getFullYear() === y) {
          if (!showRealized || td <= new Date()) {
            if (t.type === "income") income += Number(t.amount);
            else expense += Number(t.amount);
          }
        }
      });
      months.push({ label, income, expense });
    }
    return months;
  }, [transactions, period, showRealized]);

  // Insights
  const insights = useMemo(() => {
    const msgs: { icon: React.ReactNode; text: string; type: "positive" | "negative" | "neutral" }[] = [];

    if (categoryData.length > 0) {
      const top = categoryData[0];
      msgs.push({
        icon: <AlertTriangle className="h-4 w-4" />,
        text: `Maior gasto: ${top.name} com ${formatCurrency(top.value)} (${top.percent}% do total)`,
        type: "negative",
      });
    }

    if (expenseVar > 10) {
      msgs.push({
        icon: <TrendingUp className="h-4 w-4" />,
        text: `Gastos aumentaram ${expenseVar.toFixed(0)}% em relação ao período anterior`,
        type: "negative",
      });
    } else if (expenseVar < -5) {
      msgs.push({
        icon: <TrendingDown className="h-4 w-4" />,
        text: `Gastos reduziram ${Math.abs(expenseVar).toFixed(0)}% — ótimo controle!`,
        type: "positive",
      });
    }

    if (current.savings > 20) {
      msgs.push({
        icon: <PiggyBank className="h-4 w-4" />,
        text: `Economia de ${current.savings.toFixed(0)}% da receita — excelente!`,
        type: "positive",
      });
    } else if (current.savings < 0) {
      msgs.push({
        icon: <AlertTriangle className="h-4 w-4" />,
        text: `Gastos superaram a receita — saldo negativo de ${formatCurrency(Math.abs(current.balance))}`,
        type: "negative",
      });
    }

    if (incomeVar > 10) {
      msgs.push({
        icon: <TrendingUp className="h-4 w-4" />,
        text: `Receita cresceu ${incomeVar.toFixed(0)}% — tendência positiva!`,
        type: "positive",
      });
    }

    // Predict next month balance
    if (monthlyBars.length >= 2) {
      const lastTwo = monthlyBars.slice(-2);
      const avgBalance = lastTwo.reduce((s, m) => s + (m.income - m.expense), 0) / 2;
      msgs.push({
        icon: <Lightbulb className="h-4 w-4" />,
        text: `Previsão para o próximo mês: saldo de ${formatCurrency(avgBalance)} (baseado na média)`,
        type: avgBalance >= 0 ? "positive" : "negative",
      });
    }

    if (msgs.length === 0) {
      msgs.push({ icon: <Lightbulb className="h-4 w-4" />, text: "Adicione transações para gerar insights automáticos.", type: "neutral" });
    }

    return msgs;
  }, [categoryData, expenseVar, incomeVar, current, monthlyBars]);

  const tooltipStyle = {
    borderRadius: "12px",
    border: "none",
    boxShadow: "0 4px 24px rgba(0,0,0,0.12)",
    fontSize: "12px",
  };

  const VariationBadge = ({ value, inverted = false }: { value: number; inverted?: boolean }) => {
    const positive = inverted ? value < 0 : value > 0;
    const color = value === 0 ? "text-muted-foreground" : positive ? "text-secondary" : "text-destructive";
    const bg = value === 0 ? "bg-muted" : positive ? "bg-secondary/10" : "bg-destructive/10";
    return (
      <span className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-semibold ${color} ${bg}`}>
        {value > 0 ? <TrendingUp className="h-3 w-3" /> : value < 0 ? <TrendingDown className="h-3 w-3" /> : null}
        {value > 0 ? "+" : ""}{value.toFixed(1)}%
      </span>
    );
  };

  const periodLabels: Record<PeriodFilter, string> = {
    "1m": "Mês",
    "3m": "3 meses",
    "6m": "6 meses",
    "1y": "Ano",
    
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">Relatórios</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Visão completa das suas finanças</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Period filter */}
          <div className="flex rounded-lg border border-border bg-background p-0.5">
            {(["1m", "3m", "6m", "1y"] as PeriodFilter[]).map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                  period === p
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {periodLabels[p]}
              </button>
            ))}
          </div>
          {/* Toggle realized/predicted */}
          <button
            onClick={() => setShowRealized(!showRealized)}
            className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
              showRealized
                ? "border-secondary/30 bg-secondary/10 text-secondary"
                : "border-primary/30 bg-primary/10 text-primary"
            }`}
          >
            {showRealized ? "Realizado" : "Previsto"}
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Receita */}
        <div className="rounded-xl border border-secondary/20 bg-card p-4 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5">
          <div className="flex items-center justify-between mb-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary/15">
              <ArrowDownLeft className="h-4 w-4 text-secondary" />
            </div>
            <VariationBadge value={incomeVar} />
          </div>
          <p className="text-xl font-bold text-secondary">{formatCurrency(current.income)}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Receita total</p>
        </div>

        {/* Despesa */}
        <div className="rounded-xl border border-destructive/20 bg-card p-4 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5">
          <div className="flex items-center justify-between mb-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-destructive/15">
              <ArrowUpRight className="h-4 w-4 text-destructive" />
            </div>
            <VariationBadge value={expenseVar} inverted />
          </div>
          <p className="text-xl font-bold text-destructive">{formatCurrency(current.expense)}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Despesa total</p>
        </div>

        {/* Saldo */}
        <div className="rounded-xl border border-primary/20 bg-card p-4 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5">
          <div className="flex items-center justify-between mb-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15">
              <DollarSign className="h-4 w-4 text-primary" />
            </div>
            <VariationBadge value={balanceVar} />
          </div>
          <p className={`text-xl font-bold ${current.balance >= 0 ? "text-secondary" : "text-destructive"}`}>
            {formatCurrency(current.balance)}
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Saldo</p>
        </div>

        {/* Economia */}
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5">
          <div className="flex items-center justify-between mb-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
              <PiggyBank className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
          <p className={`text-xl font-bold ${current.savings >= 0 ? "text-secondary" : "text-destructive"}`}>
            {current.savings.toFixed(1)}%
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Economia</p>
        </div>
      </div>

      {/* Line Chart - Balance Evolution */}
      <div ref={sectionRefs.balance} className="rounded-xl border border-border bg-card p-5 shadow-sm scroll-mt-4">
        <h3 className="text-sm font-semibold text-muted-foreground mb-4">Evolução do Saldo</h3>
        {timelineData.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-16">Sem dados no período</p>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={timelineData}>
              <defs>
                <linearGradient id="gradBalance" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(244, 95%, 69%)" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="hsl(244, 95%, 69%)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradIncome" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00C896" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#00C896" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={formatCompact} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number, name: string) => [formatCurrency(v), name === "balance" ? "Saldo" : name === "income" ? "Receita" : "Despesa"]} />
              <Area type="monotone" dataKey="income" stroke="#00C896" fill="url(#gradIncome)" strokeWidth={2} name="income" dot={false} />
              <Line type="monotone" dataKey="expense" stroke="#FF6B6B" strokeWidth={2} name="expense" dot={false} />
              <Area type="monotone" dataKey="balance" stroke="hsl(244, 95%, 69%)" fill="url(#gradBalance)" strokeWidth={2.5} name="balance" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {/* Donut - Category */}
        <div ref={sectionRefs.categories} className="rounded-xl border border-border bg-card p-5 shadow-sm scroll-mt-4">
          <h3 className="text-sm font-semibold text-muted-foreground mb-4">Gastos por Categoria</h3>
          {categoryData.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-16">Sem dados</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={categoryData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value" strokeWidth={0}>
                    {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [formatCurrency(v), ""]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-3">
                {categoryData.map((item, i) => (
                  <div key={item.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                      <span className="text-muted-foreground">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{formatCurrency(item.value)}</span>
                      <span className="text-muted-foreground">({item.percent}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Bars - Income vs Expense */}
        <div ref={sectionRefs["income-vs-expense"]} className="rounded-xl border border-border bg-card p-5 shadow-sm scroll-mt-4">
          <h3 className="text-sm font-semibold text-muted-foreground mb-4">Receitas vs Despesas</h3>
          {monthlyBars.every(m => m.income === 0 && m.expense === 0) ? (
            <p className="text-sm text-muted-foreground text-center py-16">Sem dados</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={monthlyBars} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={formatCompact} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [formatCurrency(v), ""]} />
                <Legend iconType="circle" iconSize={8} />
                <Bar dataKey="income" name="Receitas" fill="#00C896" radius={[6, 6, 0, 0]} />
                <Bar dataKey="expense" name="Despesas" fill="#FF6B6B" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Monthly Comparison with growth indicators */}
      <div ref={sectionRefs.comparison} className="rounded-xl border border-border bg-card p-5 shadow-sm scroll-mt-4">
        <h3 className="text-sm font-semibold text-muted-foreground mb-4">Comparativo Mensal</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                <th className="pb-2 text-left font-medium text-muted-foreground">Mês</th>
                <th className="pb-2 text-right font-medium text-muted-foreground">Receita</th>
                <th className="pb-2 text-right font-medium text-muted-foreground">Despesa</th>
                <th className="pb-2 text-right font-medium text-muted-foreground">Saldo</th>
                <th className="pb-2 text-right font-medium text-muted-foreground">Tendência</th>
              </tr>
            </thead>
            <tbody>
              {monthlyBars.map((m, i) => {
                const balance = m.income - m.expense;
                const prevBalance = i > 0 ? monthlyBars[i - 1].income - monthlyBars[i - 1].expense : 0;
                const trend = i === 0 ? 0 : prevBalance !== 0 ? ((balance - prevBalance) / Math.abs(prevBalance)) * 100 : (balance > 0 ? 100 : 0);
                return (
                  <tr key={m.label} className="border-b border-border/50 last:border-0">
                    <td className="py-2.5 font-medium capitalize">{m.label}</td>
                    <td className="py-2.5 text-right text-secondary">{formatCurrency(m.income)}</td>
                    <td className="py-2.5 text-right text-destructive">{formatCurrency(m.expense)}</td>
                    <td className={`py-2.5 text-right font-semibold ${balance >= 0 ? "text-secondary" : "text-destructive"}`}>
                      {formatCurrency(balance)}
                    </td>
                    <td className="py-2.5 text-right">
                      {i > 0 ? (
                        <span className={`inline-flex items-center gap-0.5 ${trend >= 0 ? "text-secondary" : "text-destructive"}`}>
                          {trend >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                          {Math.abs(trend).toFixed(0)}%
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Insights */}
      <div ref={sectionRefs.insights} className="rounded-xl border border-border bg-card p-5 shadow-sm scroll-mt-4">
        <div className="flex items-center gap-2 mb-4">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/15">
            <Lightbulb className="h-3.5 w-3.5 text-primary" />
          </div>
          <h3 className="text-sm font-semibold">Insights Automáticos</h3>
        </div>
        <div className="space-y-2.5">
          {insights.map((insight, i) => (
            <div
              key={i}
              className={`flex items-start gap-3 rounded-lg p-3 text-xs transition-all ${
                insight.type === "positive"
                  ? "bg-secondary/8 border border-secondary/15 text-secondary"
                  : insight.type === "negative"
                  ? "bg-destructive/8 border border-destructive/15 text-destructive"
                  : "bg-muted border border-border text-muted-foreground"
              }`}
            >
              <span className="mt-0.5 shrink-0">{insight.icon}</span>
              <span className="leading-relaxed">{insight.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Reports;
