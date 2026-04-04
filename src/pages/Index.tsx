import { useEffect, useState, useMemo } from "react";
import { Wallet, CreditCard } from "lucide-react";
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

const Index = () => {
  const { theme, toggleTheme } = useTheme();
  const [transactions, setTransactions] = useState<Transaction[]>([]);

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

  const { saldo, gastosMes, economia } = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    let totalIncome = 0;
    let totalExpense = 0;
    let monthExpense = 0;
    let monthIncome = 0;

    for (const t of transactions) {
      const amount = Number(t.amount);
      const d = new Date(t.date + "T00:00:00");
      const isCurrentMonth = d.getMonth() === currentMonth && d.getFullYear() === currentYear;

      if (t.type === "income") {
        totalIncome += amount;
        if (isCurrentMonth) monthIncome += amount;
      } else {
        totalExpense += amount;
        if (isCurrentMonth) monthExpense += amount;
      }
    }

    return {
      saldo: totalIncome - totalExpense,
      gastosMes: monthExpense,
      economia: monthIncome - monthExpense,
    };
  }, [transactions]);

  return (
    <div className="min-h-screen transition-theme">
      <div className="mx-auto max-w-5xl px-4 pb-12">
        <Header theme={theme} onToggleTheme={toggleTheme} />
        <main className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
          <StatCard
            title="Saldo Total"
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
          <ExpenseChart theme={theme} gastos={gastosMes} economia={economia} />
          <SavingsCard value={economia} />
          <div className="sm:col-span-2">
            <TransactionForm onSuccess={fetchTransactions} />
          </div>
          <div className="sm:col-span-2">
            <TransactionList transactions={transactions} />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Index;
