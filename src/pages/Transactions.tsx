import { useEffect, useState, useMemo } from "react";
import {
  ArrowDownLeft, ArrowUpRight, ArrowUpDown, Filter, Search, SlidersHorizontal,
  Trash2, Pencil, X, Check
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/hooks/useTheme";
import Header from "@/components/Header";
import { toast } from "sonner";

const categoryIcons: Record<string, string> = {
  Mercado: "🛒", Aluguel: "🏠", Transporte: "🚗", Lazer: "🎮", Saúde: "💊", Outros: "📦",
};

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
  const [categories, setCategories] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<"all" | "income" | "expense">("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ description: "", amount: "", type: "", category: "", date: "" });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchTransactions();
    supabase.from("categories").select("name").then(({ data }) => {
      const names = (data || []).map((c: any) => c.name);
      setCategories([...new Set([...names, "Mercado", "Aluguel", "Transporte", "Lazer", "Saúde", "Outros"])]);
    });
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
    if (minAmount) list = list.filter((t) => Number(t.amount) >= parseFloat(minAmount));
    if (maxAmount) list = list.filter((t) => Number(t.amount) <= parseFloat(maxAmount));

    list.sort((a, b) => {
      let cmp = sortKey === "date" ? a.date.localeCompare(b.date) : Number(a.amount) - Number(b.amount);
      return sortDir === "asc" ? cmp : -cmp;
    });
    return list;
  }, [transactions, search, filterType, filterCategory, dateFrom, dateTo, minAmount, maxAmount, sortKey, sortDir]);

  const hasActiveFilters = search || filterType !== "all" || filterCategory !== "all" || dateFrom || dateTo || minAmount || maxAmount;

  const clearFilters = () => {
    setSearch(""); setFilterType("all"); setFilterCategory("all");
    setDateFrom(""); setDateTo(""); setMinAmount(""); setMaxAmount("");
  };

  const totalIncome = filtered.filter((t) => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
  const totalExpense = filtered.filter((t) => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);

  const toggleSelect = (id: string) => setSelected((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleAll = () => setSelected(selected.size === filtered.length ? new Set() : new Set(filtered.map((t) => t.id)));

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("transactions").delete().eq("id", id);
    if (error) toast.error("Erro ao excluir."); else { toast.success("Excluída!"); fetchTransactions(); }
  };

  const handleBulkDelete = async () => {
    if (selected.size === 0) return;
    const { error } = await supabase.from("transactions").delete().in("id", Array.from(selected));
    if (error) toast.error("Erro ao excluir."); else { toast.success(`${selected.size} excluída(s)!`); setSelected(new Set()); fetchTransactions(); }
  };

  const startEdit = (t: Transaction) => {
    setEditingId(t.id);
    setEditForm({ description: t.description, amount: String(t.amount), type: t.type, category: t.category || "Outros", date: t.date });
  };

  const saveEdit = async () => {
    if (!editingId) return;
    const amount = parseFloat(editForm.amount);
    if (!editForm.description.trim() || isNaN(amount) || amount <= 0) { toast.error("Preencha corretamente."); return; }
    const { error } = await supabase.from("transactions").update({
      description: editForm.description.trim(), amount, type: editForm.type, category: editForm.category, date: editForm.date,
    }).eq("id", editingId);
    if (error) toast.error("Erro ao atualizar."); else { toast.success("Atualizada!"); setEditingId(null); fetchTransactions(); }
  };

  const inputClass = "rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all";

  // Group by date for statement style
  const grouped = useMemo(() => {
    const map = new Map<string, Transaction[]>();
    for (const t of filtered) {
      const list = map.get(t.date) || [];
      list.push(t);
      map.set(t.date, list);
    }
    return Array.from(map.entries());
  }, [filtered]);

  return (
    <div className="min-h-screen transition-theme">
      <div className="mx-auto max-w-5xl px-4 pb-12">
        <Header theme={theme} onToggleTheme={toggleTheme} />

        <div className="mt-6 mb-5 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Extrato Financeiro</h1>
            <p className="text-sm text-muted-foreground">{filtered.length} transações</p>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${showFilters ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground hover:bg-muted"}`}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Filtros {hasActiveFilters && `(${[filterType !== "all", filterCategory !== "all", dateFrom, dateTo, minAmount, maxAmount, search].filter(Boolean).length})`}
          </button>
        </div>

        {/* Search bar always visible */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            placeholder="Buscar por descrição..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`${inputClass} w-full pl-9`}
          />
        </div>

        {/* Collapsible filters */}
        {showFilters && (
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm mb-5 animate-fade-in">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Tipo</label>
                <select value={filterType} onChange={(e) => setFilterType(e.target.value as any)} className={`${inputClass} w-full`}>
                  <option value="all">Todos</option>
                  <option value="income">Entradas</option>
                  <option value="expense">Saídas</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Categoria</label>
                <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className={`${inputClass} w-full`}>
                  <option value="all">Todas</option>
                  {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">De</label>
                <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className={`${inputClass} w-full`} />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Até</label>
                <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className={`${inputClass} w-full`} />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Valor mínimo</label>
                <input type="number" step="0.01" min="0" value={minAmount} onChange={(e) => setMinAmount(e.target.value)} placeholder="R$ 0,00" className={`${inputClass} w-full`} />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Valor máximo</label>
                <input type="number" step="0.01" min="0" value={maxAmount} onChange={(e) => setMaxAmount(e.target.value)} placeholder="R$ 99.999" className={`${inputClass} w-full`} />
              </div>
            </div>
            <div className="flex items-center gap-3 mt-3">
              <span className="text-xs text-muted-foreground">Ordenar:</span>
              <button onClick={() => toggleSort("date")} className={`flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg transition-colors ${sortKey === "date" ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-muted"}`}>
                <ArrowUpDown className="h-3 w-3" /> Data {sortKey === "date" && (sortDir === "asc" ? "↑" : "↓")}
              </button>
              <button onClick={() => toggleSort("amount")} className={`flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg transition-colors ${sortKey === "amount" ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-muted"}`}>
                <ArrowUpDown className="h-3 w-3" /> Valor {sortKey === "amount" && (sortDir === "asc" ? "↑" : "↓")}
              </button>
              {hasActiveFilters && (
                <button onClick={clearFilters} className="text-xs text-destructive hover:underline ml-auto">Limpar filtros</button>
              )}
            </div>
          </div>
        )}

        {/* Summary */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="rounded-lg bg-secondary/10 border border-secondary/20 p-3 text-center">
            <p className="text-lg font-bold text-secondary">{formatCurrency(totalIncome)}</p>
            <p className="text-[10px] text-muted-foreground">Entradas</p>
          </div>
          <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-center">
            <p className="text-lg font-bold text-destructive">{formatCurrency(totalExpense)}</p>
            <p className="text-[10px] text-muted-foreground">Saídas</p>
          </div>
          <div className="rounded-lg bg-primary/10 border border-primary/20 p-3 text-center">
            <p className="text-lg font-bold">{formatCurrency(totalIncome - totalExpense)}</p>
            <p className="text-[10px] text-muted-foreground">Saldo</p>
          </div>
        </div>

        {/* Bulk actions */}
        {selected.size > 0 && (
          <div className="flex items-center justify-between rounded-lg border border-primary/20 bg-primary/5 px-4 py-2.5 mb-4 animate-fade-in">
            <span className="text-xs font-medium">{selected.size} selecionada(s)</span>
            <button onClick={handleBulkDelete} className="flex items-center gap-1 rounded-lg bg-destructive/10 px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/20 transition-colors">
              <Trash2 className="h-3.5 w-3.5" /> Excluir
            </button>
          </div>
        )}

        {/* Statement list grouped by date */}
        <div className="space-y-4">
          {filtered.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-10 text-center shadow-sm">
              <p className="text-sm text-muted-foreground">Nenhuma transação encontrada.</p>
            </div>
          ) : (
            grouped.map(([date, txns]) => (
              <div key={date}>
                <div className="flex items-center gap-2 mb-2 px-1">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-[11px] font-medium text-muted-foreground whitespace-nowrap">{formatDate(date)}</span>
                  <div className="h-px flex-1 bg-border" />
                </div>
                <div className="space-y-2">
                  {txns.map((t, i) => {
                    const isIncome = t.type === "income";

                    if (editingId === t.id) {
                      return (
                        <div key={t.id} className="rounded-xl border-2 border-primary/30 bg-card p-4 shadow-sm animate-fade-in">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="sm:col-span-2">
                              <label className="block text-xs font-medium text-muted-foreground mb-1">Descrição</label>
                              <input value={editForm.description} onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))} className={`${inputClass} w-full`} />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-muted-foreground mb-1">Valor (R$)</label>
                              <input type="number" step="0.01" min="0.01" value={editForm.amount} onChange={(e) => setEditForm((f) => ({ ...f, amount: e.target.value }))} className={`${inputClass} w-full`} />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-muted-foreground mb-1">Data</label>
                              <input type="date" value={editForm.date} onChange={(e) => setEditForm((f) => ({ ...f, date: e.target.value }))} className={`${inputClass} w-full`} />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-muted-foreground mb-1">Tipo</label>
                              <select value={editForm.type} onChange={(e) => setEditForm((f) => ({ ...f, type: e.target.value }))} className={`${inputClass} w-full`}>
                                <option value="expense">Saída</option>
                                <option value="income">Entrada</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-muted-foreground mb-1">Categoria</label>
                              <select value={editForm.category} onChange={(e) => setEditForm((f) => ({ ...f, category: e.target.value }))} className={`${inputClass} w-full`}>
                                {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                              </select>
                            </div>
                          </div>
                          <div className="flex justify-end gap-2 mt-3">
                            <button onClick={() => setEditingId(null)} className="flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted transition-colors">
                              <X className="h-3.5 w-3.5" /> Cancelar
                            </button>
                            <button onClick={saveEdit} className="flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 transition-colors">
                              <Check className="h-3.5 w-3.5" /> Salvar
                            </button>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={t.id}
                        className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 animate-fade-in"
                        style={{ animationDelay: `${Math.min(i * 30, 200)}ms` }}
                      >
                        <input
                          type="checkbox"
                          checked={selected.has(t.id)}
                          onChange={() => toggleSelect(t.id)}
                          className="rounded border-border accent-primary h-4 w-4 shrink-0"
                        />
                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${isIncome ? "bg-secondary/15" : "bg-destructive/15"}`}>
                          {isIncome ? <ArrowDownLeft className="h-5 w-5 text-secondary" /> : <ArrowUpRight className="h-5 w-5 text-destructive" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{t.description}</p>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
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
                        <div className="flex items-center gap-1 shrink-0">
                          <button onClick={() => startEdit(t)} className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors" title="Editar">
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button onClick={() => handleDelete(t.id)} className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors" title="Excluir">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Select all */}
        {filtered.length > 0 && (
          <div className="flex justify-center mt-4">
            <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
              <input type="checkbox" checked={selected.size === filtered.length} onChange={toggleAll} className="rounded border-border accent-primary h-3.5 w-3.5" />
              Selecionar todas ({filtered.length})
            </label>
          </div>
        )}
      </div>
    </div>
  );
};

export default Transactions;
