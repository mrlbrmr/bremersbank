import { useEffect, useState, useMemo } from "react";
import {
  Wallet, CreditCard, CalendarDays, Plus, X, Home, BarChart3, Settings,
  ArrowDownLeft, ArrowUpRight, TrendingUp, TrendingDown, CalendarClock, List
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "@/hooks/useTheme";
import Header from "@/components/Header";
import ExpenseChart from "@/components/ExpenseChart";
import TransactionForm from "@/components/TransactionForm";
import TransactionList from "@/components/TransactionList";
import SpendingLimit from "@/components/SpendingLimit";
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

type Tab = "home" | "chart" | "transactions" | "settings";

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

  const { entradas, saidas, saldoAtual, saldoPrevisto } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let entradas = 0;
    let saidas = 0;
    let entradasAteHoje = 0;
    let saidasAteHoje = 0;

    for (const t of filteredTransactions) {
      const amount = Number(t.amount);
      const d = new Date(t.date + "T00:00:00");
      if (t.type === "income") {
        entradas += amount;
        if (d <= today) entradasAteHoje += amount;
      } else {
        saidas += amount;
        if (d <= today) saidasAteHoje += amount;
      }
    }

    return {
      entradas,
      saidas,
      saldoAtual: entradasAteHoje - saidasAteHoje,
      saldoPrevisto: entradas - saidas,
    };
  }, [filteredTransactions]);

  const monthLabel = selectedMonth.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  return (
    <div className="min-h-screen transition-theme">
      <div className="mx-auto max-w-5xl px-4 pb-24">
        <Header theme={theme} onToggleTheme={toggleTheme} />

        {/* Month selector */}
        <div className="mt-5 mb-5 flex flex-wrap items-center justify-between gap-3">
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
                const next = new Date(selectedMonth);
                next.setMonth(next.getMonth() + 1);
                setSelectedMonth(next);
              }}
              className="rounded-lg border border-border bg-background px-3 py-2 text-xs text-muted-foreground hover:bg-muted transition-colors"
            >
              Próximo →
            </button>
          </div>
        </div>

        {/* Content based on tab */}
        {activeTab === "home" && (
          <main className="space-y-5 animate-fade-in">
            {/* Hero saldo card */}
            <div
              className="relative overflow-hidden rounded-2xl bg-primary p-6 text-primary-foreground shadow-lg animate-fade-in"
              style={{ animationDelay: "0ms" }}
            >
              <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10" />
              <div className="absolute -right-4 bottom-0 h-20 w-20 rounded-full bg-white/5" />
              <div className="relative">
                <div className="flex items-center gap-2 mb-1">
                  <Wallet className="h-4 w-4 opacity-80" />
                  <span className="text-xs font-medium opacity-80">Saldo Atual</span>
                </div>
                <p className="text-4xl font-bold tracking-tight">{formatCurrency(saldoAtual)}</p>
                <div className="mt-3 flex items-center gap-1.5 text-xs opacity-80">
                  {saldoAtual >= 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                  <span>Baseado em transações realizadas até hoje</span>
                </div>
              </div>
            </div>

            {/* 3-column stats grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Entradas */}
              <div className="rounded-xl border border-secondary/20 bg-secondary/10 p-5 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 animate-fade-in" style={{ animationDelay: "100ms" }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-muted-foreground">Entradas</span>
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary/20">
                    <ArrowDownLeft className="h-4 w-4 text-secondary" />
                  </div>
                </div>
                <p className="text-2xl font-bold tracking-tight text-secondary">{formatCurrency(entradas)}</p>
              </div>

              {/* Saídas */}
              <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-5 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 animate-fade-in" style={{ animationDelay: "200ms" }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-muted-foreground">Saídas</span>
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-destructive/20">
                    <ArrowUpRight className="h-4 w-4 text-destructive" />
                  </div>
                </div>
                <p className="text-2xl font-bold tracking-tight text-destructive">{formatCurrency(saidas)}</p>
              </div>

              {/* Saldo Previsto */}
              <div className="rounded-xl border border-primary/20 bg-primary/10 p-5 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 animate-fade-in" style={{ animationDelay: "300ms" }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-muted-foreground">Saldo Previsto</span>
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20">
                    <CalendarClock className="h-4 w-4 text-primary" />
                  </div>
                </div>
                <p className={`text-2xl font-bold tracking-tight ${saldoPrevisto >= 0 ? "text-primary" : "text-destructive"}`}>
                  {formatCurrency(saldoPrevisto)}
                </p>
                <p className="text-[10px] text-muted-foreground mt-1">Inclui lançamentos futuros</p>
              </div>
            </div>

            {/* Resumo do mês */}
            <div className="rounded-xl border border-border bg-card p-5 shadow-sm animate-fade-in" style={{ animationDelay: "400ms" }}>
              <h3 className="text-xs font-semibold text-muted-foreground mb-3">
                Resumo — <span className="capitalize">{monthLabel}</span>
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="text-center">
                  <p className="text-lg font-bold">{filteredTransactions.length}</p>
                  <p className="text-[10px] text-muted-foreground">Transações</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-secondary">{filteredTransactions.filter(t => t.type === "income").length}</p>
                  <p className="text-[10px] text-muted-foreground">Entradas</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-destructive">{filteredTransactions.filter(t => t.type === "expense").length}</p>
                  <p className="text-[10px] text-muted-foreground">Saídas</p>
                </div>
                <div className="text-center">
                  <p className={`text-lg font-bold ${saldoPrevisto >= 0 ? "text-secondary" : "text-destructive"}`}>
                    {saidas > 0 ? `${((entradas / saidas) * 100).toFixed(0)}%` : "—"}
                  </p>
                  <p className="text-[10px] text-muted-foreground">Cobertura</p>
                </div>
              </div>
            </div>

            {/* Spending Limit */}
            <SpendingLimit gastosMes={saidas} monthYear={toMonthValue(selectedMonth)} />

            {/* Transaction list */}
            <TransactionList transactions={filteredTransactions.slice(0, 5)} onRefresh={fetchTransactions} />

            {filteredTransactions.length > 5 && (
              <button
                onClick={() => setActiveTab("transactions")}
                className="w-full rounded-lg border border-border bg-background py-2.5 text-sm text-muted-foreground hover:bg-muted transition-colors"
              >
                Ver todos os lançamentos ({filteredTransactions.length})
              </button>
            )}
          </main>
        )}

        {activeTab === "chart" && (
          <main className="grid grid-cols-1 gap-4 sm:grid-cols-2 animate-fade-in">
            <ExpenseChart theme={theme} transactions={filteredTransactions} />
            <div className="rounded-xl border border-secondary/20 bg-secondary/10 p-6 shadow-sm animate-fade-in" style={{ animationDelay: "400ms" }}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-muted-foreground">Economia do Mês</span>
                {saldoPrevisto >= 0 ? <TrendingUp className="h-5 w-5 text-secondary" /> : <TrendingDown className="h-5 w-5 text-destructive" />}
              </div>
              <p className="text-3xl font-bold tracking-tight">{formatCurrency(saldoPrevisto)}</p>
            </div>
          </main>
        )}

        {activeTab === "transactions" && (
          <main className="animate-fade-in">
            <TransactionList transactions={filteredTransactions} onRefresh={fetchTransactions} />
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
            { tab: "home" as Tab, icon: Home, label: "Início" },
            { tab: "transactions" as Tab, icon: List, label: "Lançamentos" },
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
