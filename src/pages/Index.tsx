import { Wallet, CreditCard } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import Header from "@/components/Header";
import StatCard from "@/components/StatCard";
import ExpenseChart from "@/components/ExpenseChart";
import SavingsCard from "@/components/SavingsCard";
import { supabase } from "../lib/supabase";

const Index = () => {
  const { theme, toggleTheme } = useTheme();

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
        </main>
      </div>
    </div>
  );
};

export default Index;
