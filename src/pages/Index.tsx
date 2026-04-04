import { useEffect, useState, useMemo } from "react";
import { Wallet, CreditCard, CalendarDays } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import Header from "@/components/Header";
import StatCard from "@/components/StatCard";
import ExpenseChart from "@/components/ExpenseChart";
import SavingsCard from "@/components/SavingsCard";
import TransactionForm from "@/components/TransactionForm";
import TransactionList from "@/components/TransactionList";
import { supabase } from "@/lib/supabase";

interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: string;
  category?: string;
  date: string;
}

const formatCurrency = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const toMonthValue = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

const Index = () => {
  const { theme, toggleTheme } = useTheme();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    const { data } = await supabase
      .from("transactions")
      .select("*")
      .order("date", { ascending: false });
    setTransactions(data || []);
  };

  const filteredTransactions = useMemo(() => {
    const m = selectedMonth.getMonth();
    const y = selectedMonth.getFullYear();
    return transactions.filter((t) => {
      const d = new Date(t.date + "T00:00:00");
      return d.getMonth() === m && d.getFullYear() === y;
    });
  }, [transactions, selectedMonth]);

  const { saldo, gastosMes, economia } = useMemo(() => {
    let income = 0;
    let expense = 0;
    for (const t of filteredTransactions) {
      const amount = Number(t.amount);
      if (t.type === "income") income += amount;
      else expense += amount;
    }
    return { saldo: income - expense, gastosMes: expense, economia: income - expense };
  }, [filteredTransactions]);

  const monthLabel = selectedMonth.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  return (
    <div className="min-h-screen transition-theme">
      <div className="mx-auto max-w-5xl px-4 pb-12">
        <Header theme={theme} onToggleTheme={toggleTheme} />

        <div className="mt-6 mb-5 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
            <CalendarDays className="h-4 w-4" />
            📅 <span className="capitalize">{monthLabel}</span>
          </p>
          <input
            type="month"
            value={toMonthValue(selectedMonth)}
            onChange={(e) => {
              if (e.target.value) setSelectedMonth(new Date(e.target.value + "-01"));
            }}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
          />
        </div>

        <main className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <StatCard
            title="Saldo do Mês"
            value={formatCurrency(saldo)}
            icon={Wallet}
            variant="primary"
            delay={0}
          />
          <StatCard
            title="Gastos do Mês"
            value={formatCurrency(gastosMes)}
            icon={CreditCard}
            variant="default"
            delay={100}
          />
          <ExpenseChart theme={theme} transactions={filteredTransactions} />
          <SavingsCard value={economia} />
          <div className="sm:col-span-2">
            <TransactionForm onSuccess={fetchTransactions} />
          </div>
          <div className="sm:col-span-2">
            <TransactionList transactions={filteredTransactions} onRefresh={fetchTransactions} />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Index;
