import { useEffect, useState, useMemo } from "react";
import { ArrowDownLeft, ArrowUpRight, ArrowUpDown, Filter, Search } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/hooks/useTheme";
import Header from "@/components/Header";

const categoryIcons: Record<string, string> = {
  Mercado: "🛒", Aluguel: "🏠", Transporte: "🚗", Lazer: "🎮", Saúde: "💊", Outros: "📦",
};

const categories = ["Mercado", "Aluguel", "Transporte", "Lazer", "Saúde", "Outros"];

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

const formatDate = (dateStr: string) => {
  try {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return dateStr;
  }
};

type SortKey = "date" | "amount";
type SortDir = "asc" | "desc";

const Transactions = () => {
  const { theme, toggleTheme } = useTheme();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<"all" | "income" | "expense">("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    const { data } = await supabase.from("transactions").select("*").order("date", { ascending: false });
    setTransactions(data || []);
  };

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("desc"); }
  };

  const filtered = useMemo(() => {
    let list = [...transactions];

    if (search) {
      const q = search.toLowerCase();
      list = list.filter((t) => t.description.toLowerCase().includes(q));
    }
    if (filterType !== "all") list = list.filter((t) => t.type === filterType);
    if (filterCategory !== "all") list = list.filter((t) => t.category === filterCategory);
    if (dateFrom) list = list.filter((t) => t.date >= dateFrom);
    if (dateTo) list = list.filter((t) => t.date <= dateTo);

    list.sort((a, b) => {
      let cmp = 0;
      if (sortKey === "date") cmp = a.date.localeCompare(b.date);
      else cmp = Number(a.amount) - Number(b.amount);
      return sortDir === "asc" ? cmp : -cmp;
    });

    return list;
  }, [transactions, search, filterType, filterCategory, dateFrom, dateTo, sortKey, sortDir]);

  const inputClass =
    "rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all";

  return (
    <div className="min-h-screen transition-theme">
      <div className="mx-auto max-w-5xl px-4 pb-12">
        <Header theme={theme} onToggleTheme={toggleTheme} />

        <div className="mt-6 mb-5">
          <h1 className="text-xl font-bold mb-1">Lançamentos</h1>
          <p className="text-sm text-muted-foreground">{filtered.length} transações encontradas</p>
        </div>

        {/* Filters */}
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm mb-5 animate-fade-in">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs font-semibold text-muted-foreground">Filtros</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="relative sm:col-span-2 lg:col-span-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                placeholder="Buscar por descrição..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={`${inputClass} w-full pl-9`}
              />
            </div>
            <select value={filterType} onChange={(e) => setFilterType(e.target.value as any)} className={`${inputClass} w-full`}>
              <option value="all">Todos os tipos</option>
              <option value="income">Entradas</option>
              <option value="expense">Saídas</option>
            </select>
            <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className={`${inputClass} w-full`}>
              <option value="all">Todas as categorias</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className={`${inputClass} w-full`} placeholder="De" />
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className={`${inputClass} w-full`} placeholder="Até" />
          </div>
          <div className="flex items-center gap-3 mt-3">
            <span className="text-xs text-muted-foreground">Ordenar:</span>
            <button
              onClick={() => toggleSort("date")}
              className={`flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg transition-colors ${sortKey === "date" ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-muted"}`}
            >
              <ArrowUpDown className="h-3 w-3" /> Data {sortKey === "date" && (sortDir === "asc" ? "↑" : "↓")}
            </button>
            <button
              onClick={() => toggleSort("amount")}
              className={`flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg transition-colors ${sortKey === "amount" ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-muted"}`}
            >
              <ArrowUpDown className="h-3 w-3" /> Valor {sortKey === "amount" && (sortDir === "asc" ? "↑" : "↓")}
            </button>
            {(search || filterType !== "all" || filterCategory !== "all" || dateFrom || dateTo) && (
              <button
                onClick={() => { setSearch(""); setFilterType("all"); setFilterCategory("all"); setDateFrom(""); setDateTo(""); }}
                className="text-xs text-destructive hover:underline ml-auto"
              >
                Limpar filtros
              </button>
            )}
          </div>
        </div>

        {/* Summary bar */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="rounded-lg bg-secondary/10 border border-secondary/20 p-3 text-center">
            <p className="text-lg font-bold text-secondary">
              {formatCurrency(filtered.filter((t) => t.type === "income").reduce((s, t) => s + Number(t.amount), 0))}
            </p>
            <p className="text-[10px] text-muted-foreground">Entradas</p>
          </div>
          <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-center">
            <p className="text-lg font-bold text-destructive">
              {formatCurrency(filtered.filter((t) => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0))}
            </p>
            <p className="text-[10px] text-muted-foreground">Saídas</p>
          </div>
          <div className="rounded-lg bg-primary/10 border border-primary/20 p-3 text-center">
            <p className="text-lg font-bold">
              {formatCurrency(
                filtered.reduce((s, t) => s + (t.type === "income" ? Number(t.amount) : -Number(t.amount)), 0)
              )}
            </p>
            <p className="text-[10px] text-muted-foreground">Saldo</p>
          </div>
        </div>

        {/* Transaction list */}
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-10 text-center shadow-sm">
              <p className="text-sm text-muted-foreground">Nenhuma transação encontrada.</p>
            </div>
          ) : (
            filtered.map((t, i) => {
              const isIncome = t.type === "income";
              return (
                <div
                  key={t.id}
                  className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 animate-fade-in"
                  style={{ animationDelay: `${Math.min(i * 30, 300)}ms` }}
                >
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${isIncome ? "bg-secondary/15" : "bg-destructive/15"}`}>
                    {isIncome ? <ArrowDownLeft className="h-5 w-5 text-secondary" /> : <ArrowUpRight className="h-5 w-5 text-destructive" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{t.description}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-xs text-muted-foreground">{formatDate(t.date)}</span>
                      <span className="text-xs text-muted-foreground">·</span>
                      <span className={`text-xs font-medium ${isIncome ? "text-secondary" : "text-destructive"}`}>
                        {isIncome ? "Entrada" : "Saída"}
                      </span>
                      {t.category && (
                        <>
                          <span className="text-xs text-muted-foreground">·</span>
                          <span className="text-xs text-muted-foreground">{categoryIcons[t.category] || "📦"} {t.category}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <p className={`text-sm font-bold whitespace-nowrap ${isIncome ? "text-secondary" : "text-destructive"}`}>
                    {isIncome ? "+" : "-"} {formatCurrency(Number(t.amount))}
                  </p>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default Transactions;
