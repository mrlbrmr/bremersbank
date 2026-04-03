import { useEffect, useState } from "react";
import { Wallet, CreditCard } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import Header from "@/components/Header";
import StatCard from "@/components/StatCard";
import ExpenseChart from "@/components/ExpenseChart";
import SavingsCard from "@/components/SavingsCard";
import { supabase } from "../lib/supabase";

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

  const addTransaction = async () => {
    await supabase.from("transactions").insert([
      {
        description: "Teste",
        amount: 100,
        type: "expense",
        person: "A",
        date: new Date(),
      },
    ]);
    fetchTransactions();
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
            <button
              onClick={addTransaction}
              className="rounded-xl bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5"
            >
              Adicionar Transação
            </button>
          </div>
          <div className="sm:col-span-2 space-y-3">
            {transactions.map((t) => (
              <div key={t.id} className="flex items-center justify-between rounded-xl border border-border bg-card p-4 shadow-sm">
                <p className="font-medium">{t.description}</p>
                <p className="text-sm text-muted-foreground">R$ {t.amount}</p>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Index;
