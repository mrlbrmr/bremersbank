import { useEffect, useState, useMemo } from "react";
import { Wallet, CreditCard, CalendarDays, Plus, X, Home, BarChart3, Settings } from "lucide-react";
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

type Tab = "home" | "chart" | "settings";

const Index = () => {
  const { theme, toggleTheme } = useTheme();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [formOpen, setFormOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("home");

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
      <div className="mx-auto max-w-5xl px-4 pb-24">
        <Header theme={theme} onToggleTheme={toggleTheme} />

        {/* Month selector */}
        <div className="mt-5 mb-4 flex flex-col gap-3">
          <p className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
            <CalendarDays className="h-4 w-4" />
            📅 <span className="capitalize">{monthLabel}</span>
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const prev = new Date(selectedMonth);
                prev.setMonth(prev.getMonth() - 1);
                setSelectedMonth(prev);
              }}
              className="flex-1 rounded-lg border border-border bg-background px-2 py-2 text-xs text-muted-foreground hover:bg-muted transition-colors"
            >
              ← Anterior
            </button>
            <button
              onClick={() => setSelectedMonth(new Date())}
              className="flex-1 rounded-lg bg-primary px-2 py-2 text-xs font-medium text-primary-foreground hover:opacity-90 transition-colors"
            >
              Mês atual
            </button>
            <button
              onClick={() => {
                const next = new Date(selectedMonth);
                next.setMonth(next.getMonth() + 1);
                setSelectedMonth(next);
              }}
              className="flex-1 rounded-lg border border-border bg-background px-2 py-2 text-xs text-muted-foreground hover:bg-muted transition-colors"
            >
              Próximo →
            </button>
            <input
              type="month"
              value={toMonthValue(selectedMonth)}
              onChange={(e) => {
                if (e.target.value) setSelectedMonth(new Date(e.target.value + "-01"));
              }}
              className="w-10 rounded-lg border border-border bg-background px-1 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all opacity-0 absolute"
              style={{ pointerEvents: "none" }}
            />
          </div>
        </div>

        {/* Content based on tab */}
        {activeTab === "home" && (
          <main className="grid grid-cols-1 gap-4 sm:grid-cols-2 animate-fade-in">
            <StatCard title="Saldo do Mês" value={formatCurrency(saldo)} icon={Wallet} variant="primary" delay={0} />
            <StatCard title="Gastos do Mês" value={formatCurrency(gastosMes)} icon={CreditCard} variant="default" delay={100} />
            <div className="sm:col-span-2">
              <TransactionList transactions={filteredTransactions} onRefresh={fetchTransactions} />
            </div>
          </main>
        )}

        {activeTab === "chart" && (
          <main className="grid grid-cols-1 gap-4 animate-fade-in">
            <ExpenseChart theme={theme} transactions={filteredTransactions} />
            <SavingsCard value={economia} />
          </main>
        )}

        {activeTab === "settings" && (
          <main className="animate-fade-in">
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <h3 className="text-sm font-semibold mb-4">Configurações</h3>
              <button
                onClick={toggleTheme}
                className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground hover:bg-muted transition-colors text-left"
              >
                {theme === "dark" ? "☀️ Modo claro" : "🌙 Modo escuro"}
              </button>
            </div>
          </main>
        )}
      </div>

      {/* FAB - Floating Action Button */}
      <button
        onClick={() => setFormOpen(true)}
        className="fixed bottom-24 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform duration-200 hover:scale-110 active:scale-95"
        style={{ boxShadow: "0 4px 20px rgba(108, 99, 255, 0.4)" }}
      >
        <Plus className="h-7 w-7" />
      </button>

      {/* Bottom Sheet Modal */}
      {formOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40 animate-fade-in"
            onClick={() => setFormOpen(false)}
          />
          <div className="fixed bottom-0 left-0 right-0 z-50 mx-auto max-w-5xl rounded-t-2xl border-t border-border bg-card p-5 shadow-xl animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold">Nova Transação</h3>
              <button
                onClick={() => setFormOpen(false)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <TransactionForm
              onSuccess={() => {
                fetchTransactions();
                setFormOpen(false);
              }}
            />
          </div>
        </>
      )}

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-border bg-card/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-[480px] items-center justify-around py-2">
          {[
            { tab: "home" as Tab, icon: Home, label: "Início" },
            { tab: "chart" as Tab, icon: BarChart3, label: "Gráficos" },
            { tab: "settings" as Tab, icon: Settings, label: "Config" },
          ].map(({ tab, icon: Icon, label }) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex flex-col items-center gap-0.5 px-4 py-1.5 transition-colors duration-200 ${
                activeTab === tab ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default Index;
