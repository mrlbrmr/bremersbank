import { useEffect, useState, useMemo } from "react";
import {
  Plus, X, Home, BarChart3, Settings, List, Target, CalendarDays
} from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import DashboardHeader from "@/components/DashboardHeader";
import BalanceCard from "@/components/BalanceCard";
import SummaryCards from "@/components/SummaryCards";
import SparklineCard from "@/components/SparklineCard";
import SpendingLimit from "@/components/SpendingLimit";
import TransactionList from "@/components/TransactionList";
import ReportsPreview from "@/components/ReportsPreview";
import DashboardInsights from "@/components/DashboardInsights";
import TransactionForm from "@/components/TransactionForm";
import Reports from "@/components/Reports";
import CategoryManager from "@/components/CategoryManager";
import FinancialGoals from "@/components/FinancialGoals";
import InstallmentManager from "@/components/InstallmentManager";
import { supabase } from "@/lib/supabase";
import { FilterProvider } from "@/contexts/FilterContext";

interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: string;
  category?: string;
  date: string;
}

const toMonthValue = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

type Tab = "home" | "transactions" | "reports" | "goals" | "settings";

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

  // Previous month transactions for comparison
  const prevMonthTransactions = useMemo(() => {
    const prev = new Date(selectedMonth);
    prev.setMonth(prev.getMonth() - 1);
    const m = prev.getMonth();
    const y = prev.getFullYear();
    return transactions.filter((t) => {
      const d = new Date(t.date + "T00:00:00");
      return d.getMonth() === m && d.getFullYear() === y;
    });
  }, [transactions, selectedMonth]);

  const calcTotals = (txs: Transaction[]) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let entradas = 0, saidas = 0, entradasHoje = 0, saidasHoje = 0;
    for (const t of txs) {
      const amt = Number(t.amount);
      const d = new Date(t.date + "T00:00:00");
      if (t.type === "income") { entradas += amt; if (d <= today) entradasHoje += amt; }
      else { saidas += amt; if (d <= today) saidasHoje += amt; }
    }
    return { entradas, saidas, saldoAtual: entradasHoje - saidasHoje, saldoPrevisto: entradas - saidas };
  };

  const current = calcTotals(filteredTransactions);
  const prev = calcTotals(prevMonthTransactions);

  const monthLabel = selectedMonth.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  return (
    <FilterProvider onNavigate={(tab) => setActiveTab(tab as Tab)}>
    <div className="min-h-screen transition-theme">
      <div className="mx-auto max-w-5xl px-4 pb-24">
        <DashboardHeader theme={theme} onToggleTheme={toggleTheme} />

        {/* Month selector */}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
            <CalendarDays className="h-4 w-4" />
            <span className="capitalize">{monthLabel}</span>
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const p = new Date(selectedMonth);
                p.setMonth(p.getMonth() - 1);
                setSelectedMonth(p);
              }}
              className="rounded-lg border border-border bg-background px-3 py-2 text-xs text-muted-foreground hover:bg-muted transition-colors"
            >
              ← Anterior
            </button>
            <button
              onClick={() => setSelectedMonth(new Date())}
              className="rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:opacity-90 transition-colors"
            >
              Mês atual
            </button>
            <button
              onClick={() => {
                const n = new Date(selectedMonth);
                n.setMonth(n.getMonth() + 1);
                setSelectedMonth(n);
              }}
              className="rounded-lg border border-border bg-background px-3 py-2 text-xs text-muted-foreground hover:bg-muted transition-colors"
            >
              Próximo →
            </button>
          </div>
        </div>

        {/* Content */}
        {activeTab === "home" && (
          <main className="space-y-4 animate-fade-in">
            <BalanceCard saldoAtual={current.saldoAtual} saldoPrevisto={current.saldoPrevisto} />

            <SummaryCards
              entradas={current.entradas}
              saidas={current.saidas}
              entradasAnterior={prev.entradas}
              saidasAnterior={prev.saidas}
            />

            <SparklineCard transactions={filteredTransactions} />

            <SpendingLimit transactions={filteredTransactions} monthYear={toMonthValue(selectedMonth)} />

            <TransactionList transactions={filteredTransactions.slice(0, 5)} onRefresh={fetchTransactions} />

            {filteredTransactions.length > 5 && (
              <button
                onClick={() => setActiveTab("transactions")}
                className="w-full rounded-lg border border-border bg-background py-2.5 text-sm text-muted-foreground hover:bg-muted transition-colors"
              >
                Ver todos os lançamentos ({filteredTransactions.length})
              </button>
            )}

            <ReportsPreview transactions={filteredTransactions} />

            <DashboardInsights
              transactions={filteredTransactions}
              entradas={current.entradas}
              saidas={current.saidas}
              entradasAnterior={prev.entradas}
              saidasAnterior={prev.saidas}
            />
          </main>
        )}

        {activeTab === "transactions" && (
          <main className="animate-fade-in">
            <TransactionList transactions={filteredTransactions} onRefresh={fetchTransactions} />
          </main>
        )}

        {activeTab === "reports" && (
          <main className="animate-fade-in">
            <Reports />
          </main>
        )}

        {activeTab === "goals" && (
          <main className="space-y-6 animate-fade-in">
            <FinancialGoals />
            <InstallmentManager />
          </main>
        )}

        {activeTab === "settings" && (
          <main className="space-y-5 animate-fade-in">
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <h3 className="text-sm font-semibold mb-4">Configurações</h3>
              <button
                onClick={toggleTheme}
                className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground hover:bg-muted transition-colors text-left"
              >
                {theme === "dark" ? "☀️ Modo claro" : "🌙 Modo escuro"}
              </button>
            </div>
            <CategoryManager />
          </main>
        )}
      </div>

      {/* FAB */}
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
          <div className="fixed inset-0 z-40 bg-black/40 animate-fade-in" onClick={() => setFormOpen(false)} />
          <div className="fixed bottom-0 left-0 right-0 z-50 mx-auto max-w-5xl rounded-t-2xl border-t border-border bg-card p-5 shadow-xl animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold">Nova Transação</h3>
              <button onClick={() => setFormOpen(false)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            <TransactionForm onSuccess={() => { fetchTransactions(); setFormOpen(false); }} />
          </div>
        </>
      )}

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-border bg-card/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-around py-2">
          {[
            { tab: "home" as Tab, icon: Home, label: "Dashboard" },
            { tab: "transactions" as Tab, icon: List, label: "Lançamentos" },
            { tab: "reports" as Tab, icon: BarChart3, label: "Relatórios" },
            { tab: "goals" as Tab, icon: Target, label: "Metas" },
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
    </FilterProvider>
  );
};

export default Index;
