import { useEffect, useState } from "react";
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
  person: string;
  date: string;
}

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

  return (
    <div className="min-h-screen transition-theme">
      <div className="mx-auto max-w-5xl px-4 pb-12">
        <Header theme={theme} onToggleTheme={toggleTheme} />
        <main className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
          <StatCard
            title="Saldo Total"
            value="R$ 12.450,00"
            icon={Wallet}
            variant="primary"
            delay={0}
          />
          <StatCard
            title="Gastos do Mês"
            value="R$ 6.250,00"
            icon={CreditCard}
            variant="default"
            delay={100}
          />
          <ExpenseChart theme={theme} />
          <SavingsCard />
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
