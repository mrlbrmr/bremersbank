import { useState, useMemo, useEffect } from "react";
import { ArrowDownLeft, ArrowUpRight, Trash2, Pencil, X, Check, CreditCard, RotateCcw, CheckCircle2, Circle, Filter, ArrowUpDown, ChevronDown } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

const categoryIcons: Record<string, string> = {
  Mercado: "🛒",
  Aluguel: "🏠",
  Transporte: "🚗",
  Lazer: "🎮",
  Saúde: "💊",
  Outros: "📦",
};

interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: string;
  category?: string;
  date: string;
  isInstallment?: boolean;
  installmentLabel?: string;
  isRecurring?: boolean;
  realized?: boolean;
}

interface DBCategory {
  id: string;
  name: string;
  type: string;
  icon: string;
}

interface TransactionListProps {
  transactions: Transaction[];
  onRefresh: () => void;
  recurringConfirmations?: Set<string>;
  onToggleRecurringConfirmation?: (recurringId: string) => void;
  installmentConfirmations?: Set<string>;
  onToggleInstallmentConfirmation?: (installmentId: string, installmentNumber: number) => void;
}

type SortField = "date" | "amount" | "category" | "status";
type SortDir = "asc" | "desc";
type StatusFilter = "all" | "realized" | "pending";

const formatDate = (dateStr: string) => {
  try {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  } catch {
    return dateStr;
  }
};

const TransactionList = ({ transactions, onRefresh, recurringConfirmations, onToggleRecurringConfirmation, installmentConfirmations, onToggleInstallmentConfirmation }: TransactionListProps) => {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ description: "", amount: "", type: "", category: "", date: "" });
  const [dbCategories, setDbCategories] = useState<DBCategory[]>([]);

  // Filter & Sort state
  const [showFilters, setShowFilters] = useState(false);
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<StatusFilter>("all");
  const [filterType, setFilterType] = useState<string>("all");

  useEffect(() => {
    supabase.from("categories").select("*").order("name").then(({ data }) => setDbCategories(data || []));
  }, []);

  // Extract unique categories from transactions
  const uniqueCategories = useMemo(() => {
    const cats = new Set<string>();
    transactions.forEach(t => { if (t.category) cats.add(t.category); });
    return Array.from(cats).sort();
  }, [transactions]);

  // Apply filters
  const filteredTransactions = useMemo(() => {
    let result = [...transactions];

    if (filterCategory !== "all") {
      result = result.filter(t => t.category === filterCategory);
    }
    if (filterStatus === "realized") {
      result = result.filter(t => t.realized !== false);
    } else if (filterStatus === "pending") {
      result = result.filter(t => t.realized === false || t.isRecurring || t.isInstallment);
    }
    if (filterType !== "all") {
      result = result.filter(t => t.type === filterType);
    }

    // Sort
    result.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "date":
          cmp = a.date.localeCompare(b.date);
          break;
        case "amount":
          cmp = Number(a.amount) - Number(b.amount);
          break;
        case "category":
          cmp = (a.category || "").localeCompare(b.category || "");
          break;
        case "status": {
          const aStatus = a.realized === false ? 0 : 1;
          const bStatus = b.realized === false ? 0 : 1;
          cmp = aStatus - bStatus;
          break;
        }
      }
      return sortDir === "desc" ? -cmp : cmp;
    });

    return result;
  }, [transactions, filterCategory, filterStatus, filterType, sortField, sortDir]);

  const activeFilters = [filterCategory !== "all", filterStatus !== "all", filterType !== "all"].filter(Boolean).length;

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(d => d === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  const clearFilters = () => {
    setFilterCategory("all");
    setFilterStatus("all");
    setFilterType("all");
    setSortField("date");
    setSortDir("desc");
  };

  const realTransactions = filteredTransactions.filter(t => !t.isInstallment && !t.isRecurring);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === realTransactions.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(realTransactions.map((t) => t.id)));
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("transactions").delete().eq("id", id);
    if (error) {
      toast.error("Erro ao excluir.");
    } else {
      toast.success("Transação excluída!");
      onRefresh();
    }
  };

  const handleBulkDelete = async () => {
    if (selected.size === 0) return;
    setDeleting(true);
    const { error } = await supabase.from("transactions").delete().in("id", Array.from(selected));
    setDeleting(false);
    if (error) {
      toast.error("Erro ao excluir transações.");
    } else {
      toast.success(`${selected.size} transação(ões) excluída(s)!`);
      setSelected(new Set());
      onRefresh();
    }
  };

  const toggleRealized = async (t: Transaction) => {
    if (t.isInstallment || t.isRecurring) return;
    const { error } = await supabase
      .from("transactions")
      .update({ realized: !t.realized })
      .eq("id", t.id);
    if (error) {
      toast.error("Erro ao atualizar status.");
    } else {
      toast.success(t.realized ? "Marcada como pendente" : "Marcada como realizada!");
      onRefresh();
    }
  };

  const startEdit = (t: Transaction) => {
    setEditingId(t.id);
    setEditForm({
      description: t.description,
      amount: String(t.amount),
      type: t.type,
      category: t.category || "Outros",
      date: t.date,
    });
  };

  const cancelEdit = () => setEditingId(null);

  const saveEdit = async () => {
    if (!editingId) return;
    const amount = parseFloat(editForm.amount);
    if (!editForm.description.trim() || isNaN(amount) || amount <= 0) {
      toast.error("Preencha os campos corretamente.");
      return;
    }
    const { error } = await supabase
      .from("transactions")
      .update({
        description: editForm.description.trim(),
        amount,
        type: editForm.type,
        category: editForm.category,
        date: editForm.date,
      })
      .eq("id", editingId);
    if (error) {
      toast.error("Erro ao atualizar.");
    } else {
      toast.success("Transação atualizada!");
      setEditingId(null);
      onRefresh();
    }
  };

  const inputClass =
    "rounded-lg border border-border bg-background px-2 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all";

  const selectClass =
    "rounded-lg border border-border bg-background px-2 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all appearance-none cursor-pointer";

  if (transactions.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-10 text-center shadow-sm">
        <p className="text-sm text-muted-foreground">Nenhuma transação registrada.</p>
      </div>
    );
  }

  const editCategories = dbCategories.filter(c => c.type === editForm.type);

  return (
    <div className="space-y-3 stagger-in">
      {/* Header with filter/sort controls */}
      <div className="flex items-center justify-between px-1">
        <h3 className="text-sm font-semibold text-muted-foreground">Transações recentes</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
              showFilters || activeFilters > 0
                ? "bg-primary/10 text-primary border border-primary/20"
                : "border border-border text-muted-foreground hover:bg-muted"
            }`}
          >
            <Filter className="h-3.5 w-3.5" />
            Filtros
            {activeFilters > 0 && (
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
                {activeFilters}
              </span>
            )}
          </button>

          <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
            <input
              type="checkbox"
              checked={selected.size === realTransactions.length && realTransactions.length > 0}
              onChange={toggleAll}
              className="rounded border-border accent-primary h-3.5 w-3.5"
            />
            <span className="hidden sm:inline">Selecionar</span>
          </label>
          {selected.size > 0 && (
            <button
              onClick={handleBulkDelete}
              disabled={deleting}
              className="flex items-center gap-1 rounded-lg bg-destructive/10 px-2 sm:px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/20 transition-colors disabled:opacity-50"
            >
              <Trash2 className="h-3.5 w-3.5" />
              ({selected.size})
            </button>
          )}
        </div>
      </div>

      {/* Filter & Sort Panel */}
      {showFilters && (
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm animate-fade-in space-y-3">
          {/* Sort buttons */}
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
              <ArrowUpDown className="h-3 w-3" /> Ordenar por
            </p>
            <div className="flex flex-wrap gap-1.5">
              {([
                { field: "date" as SortField, label: "Data" },
                { field: "amount" as SortField, label: "Valor" },
                { field: "category" as SortField, label: "Categoria" },
                { field: "status" as SortField, label: "Status" },
              ]).map(({ field, label }) => (
                <button
                  key={field}
                  onClick={() => toggleSort(field)}
                  className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all ${
                    sortField === field
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {label}
                  {sortField === field && (
                    <ChevronDown className={`h-3 w-3 transition-transform ${sortDir === "asc" ? "rotate-180" : ""}`} />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Categoria</p>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className={`${selectClass} w-full`}
              >
                <option value="all">Todas</option>
                {uniqueCategories.map(c => {
                  const cat = dbCategories.find(dc => dc.name === c);
                  return <option key={c} value={c}>{cat?.icon || "📦"} {c}</option>;
                })}
              </select>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Status</p>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as StatusFilter)}
                className={`${selectClass} w-full`}
              >
                <option value="all">Todos</option>
                <option value="realized">✅ Realizados</option>
                <option value="pending">⏳ Pendentes</option>
              </select>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Tipo</p>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className={`${selectClass} w-full`}
              >
                <option value="all">Todos</option>
                <option value="income">Entradas</option>
                <option value="expense">Saídas</option>
              </select>
            </div>
          </div>

          {activeFilters > 0 && (
            <button
              onClick={clearFilters}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
            >
              <X className="h-3 w-3" /> Limpar filtros
            </button>
          )}

          <p className="text-[10px] text-muted-foreground">
            {filteredTransactions.length} de {transactions.length} lançamento(s)
          </p>
        </div>
      )}

      {/* Transaction list */}
      {filteredTransactions.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center shadow-sm">
          <p className="text-sm text-muted-foreground">Nenhuma transação encontrada com esses filtros.</p>
          <button onClick={clearFilters} className="text-xs text-primary mt-2 hover:underline">Limpar filtros</button>
        </div>
      ) : (
        filteredTransactions.map((t, i) => {
          const isIncome = t.type === "income";
          const isEditing = editingId === t.id;
          const isVirtual = t.isInstallment || t.isRecurring;
          const isRealized = t.realized !== false;

          if (isEditing) {
            return (
              <div
                key={t.id}
                className="rounded-xl border-2 border-primary/30 bg-card p-3 sm:p-4 shadow-sm animate-fade-in"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Descrição</label>
                    <input
                      value={editForm.description}
                      onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                      className={`${inputClass} w-full`}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Valor (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={editForm.amount}
                      onChange={(e) => setEditForm((f) => ({ ...f, amount: e.target.value }))}
                      className={`${inputClass} w-full`}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Data</label>
                    <input
                      type="date"
                      value={editForm.date}
                      onChange={(e) => setEditForm((f) => ({ ...f, date: e.target.value }))}
                      className={`${inputClass} w-full`}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Tipo</label>
                    <select
                      value={editForm.type}
                      onChange={(e) => {
                        const newType = e.target.value;
                        const firstCat = dbCategories.find(c => c.type === newType);
                        setEditForm((f) => ({ ...f, type: newType, category: firstCat?.name || "Outros" }));
                      }}
                      className={`${inputClass} w-full`}
                    >
                      <option value="expense">Saída</option>
                      <option value="income">Entrada</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Categoria</label>
                    <select
                      value={editForm.category}
                      onChange={(e) => setEditForm((f) => ({ ...f, category: e.target.value }))}
                      className={`${inputClass} w-full`}
                    >
                      {editCategories.map((c) => (
                        <option key={c.id} value={c.name}>{c.icon} {c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-3">
                  <button
                    onClick={cancelEdit}
                    className="flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted transition-colors"
                  >
                    <X className="h-3.5 w-3.5" /> Cancelar
                  </button>
                  <button
                    onClick={saveEdit}
                    className="flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 transition-colors"
                  >
                    <Check className="h-3.5 w-3.5" /> Salvar
                  </button>
                </div>
              </div>
            );
          }

          // Determine if this item is truly "pending" (not paid/received)
          const isPending = (() => {
            if (t.isRecurring && recurringConfirmations) {
              const realRecurringId = t.id.replace(/^recurring-/, "").replace(/-\d{4}-\d+$/, "");
              return !recurringConfirmations.has(realRecurringId);
            }
            if (t.isInstallment && installmentConfirmations) {
              const parts = t.id.split("-");
              const instNumber = parseInt(parts[parts.length - 1]);
              const instId = t.id.replace(/^installment-/, "").replace(/-\d+$/, "");
              return !installmentConfirmations.has(`${instId}-${instNumber}`);
            }
            return t.realized === false;
          })();

          const getIconBg = () => {
            if (isPending) return "bg-warning/15";
            if (t.isInstallment) return "bg-primary/15";
            return isIncome ? "bg-secondary/15" : "bg-destructive/15";
          };

          const getAmountColor = () => {
            if (isPending) return "text-muted-foreground";
            if (t.isInstallment) return "text-primary";
            return isIncome ? "text-secondary" : "text-destructive";
          };

          const catIcon = dbCategories.find(c => c.name === t.category)?.icon || categoryIcons[t.category || ""] || "📦";

          return (
            <div
              key={t.id}
              className={`group flex items-center gap-2 sm:gap-3 rounded-xl border bg-card p-3 sm:p-4 shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 animate-fade-in ${
                isPending
                  ? "border-dashed border-warning/40 bg-warning/[0.03]"
                  : t.isInstallment
                    ? "border-primary/25 bg-primary/[0.03]"
                    : "border-border hover:border-primary/20"
              }`}
              style={{ animationDelay: `${Math.min(i * 40, 400)}ms` }}
            >
              {!isVirtual && (
                <button
                  onClick={() => toggleRealized(t)}
                  className="shrink-0 p-0.5 transition-colors"
                  title={isRealized ? "Marcar como pendente" : "Marcar como realizada"}
                >
                  {isRealized ? (
                    <CheckCircle2 className="h-5 w-5 text-secondary" />
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground" />
                  )}
                </button>
              )}

              {t.isRecurring && recurringConfirmations && onToggleRecurringConfirmation && (() => {
                const realRecurringId = t.id.replace(/^recurring-/, "").replace(/-\d{4}-\d+$/, "");
                const isConfirmed = recurringConfirmations.has(realRecurringId);
                return (
                  <button
                    onClick={() => onToggleRecurringConfirmation(realRecurringId)}
                    className="shrink-0 p-0.5 transition-colors"
                    title={isConfirmed ? "Desmarcar" : (isIncome ? "Marcar como recebido" : "Marcar como pago")}
                  >
                    {isConfirmed ? (
                      <CheckCircle2 className="h-5 w-5 text-secondary" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground" />
                    )}
                  </button>
                );
              })()}

              {t.isInstallment && installmentConfirmations && onToggleInstallmentConfirmation && (() => {
                // id format: installment-{uuid}-{number}
                const parts = t.id.split("-");
                const instNumber = parseInt(parts[parts.length - 1]);
                const instId = t.id.replace(/^installment-/, "").replace(/-\d+$/, "");
                const confirmKey = `${instId}-${instNumber}`;
                const isConfirmed = installmentConfirmations.has(confirmKey);
                return (
                  <button
                    onClick={() => onToggleInstallmentConfirmation(instId, instNumber)}
                    className="shrink-0 p-0.5 transition-colors"
                    title={isConfirmed ? "Desmarcar pago" : "Marcar como pago"}
                  >
                    {isConfirmed ? (
                      <CheckCircle2 className="h-5 w-5 text-secondary" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground" />
                    )}
                  </button>
                );
              })()}

              <div className={`flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full ${getIconBg()}`}>
                {t.isInstallment ? (
                  <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                ) : t.isRecurring ? (
                  <RotateCcw className={`h-4 w-4 sm:h-5 sm:w-5 ${isIncome ? "text-secondary" : "text-destructive"}`} />
                ) : isIncome ? (
                  <ArrowDownLeft className="h-4 w-4 sm:h-5 sm:w-5 text-secondary" />
                ) : (
                  <ArrowUpRight className="h-4 w-4 sm:h-5 sm:w-5 text-destructive" />
                )}
              </div>

              <div className="flex-1 min-w-0 overflow-hidden">
                <div className="flex items-center gap-1 sm:gap-2">
                  <p className={`font-medium text-xs sm:text-sm truncate ${isPending ? "text-muted-foreground" : ""}`}>
                    {t.description}
                  </p>
                  {t.isInstallment && t.installmentLabel && (
                    <span className="shrink-0 rounded-full bg-primary/15 px-1.5 sm:px-2 py-0.5 text-[9px] sm:text-[10px] font-semibold text-primary">
                      {t.installmentLabel}
                    </span>
                  )}
                  {t.isRecurring && (
                    <span className={`shrink-0 rounded-full px-1.5 sm:px-2 py-0.5 text-[9px] sm:text-[10px] font-semibold ${
                      isIncome ? "bg-secondary/15 text-secondary" : "bg-destructive/15 text-destructive"
                    }`}>
                      Fixo
                    </span>
                  )}
                  {isPending && (
                    <span className="shrink-0 rounded-full bg-warning/15 border border-warning/30 px-1.5 sm:px-2 py-0.5 text-[9px] sm:text-[10px] font-semibold text-warning animate-pulse">
                      Pendente
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 sm:gap-2 mt-0.5 flex-wrap">
                  <span className="text-[10px] sm:text-xs text-muted-foreground">{formatDate(t.date)}</span>
                  <span className="text-[10px] sm:text-xs text-muted-foreground hidden sm:inline">·</span>
                  {t.isInstallment ? (
                    <span className="text-[10px] sm:text-xs font-medium text-primary hidden sm:inline">Parcela</span>
                  ) : t.isRecurring ? (
                    <span className={`text-[10px] sm:text-xs font-medium hidden sm:inline ${isIncome ? "text-secondary" : "text-destructive"}`}>Fixo</span>
                  ) : (
                    <span className={`text-[10px] sm:text-xs font-medium hidden sm:inline ${isIncome ? "text-secondary" : "text-destructive"}`}>
                      {isIncome ? "Entrada" : "Saída"}
                    </span>
                  )}
                  {t.category && (
                    <span className="text-[10px] sm:text-xs text-muted-foreground truncate">
                      {catIcon} <span className="hidden sm:inline">{t.category}</span>
                    </span>
                  )}
                </div>
              </div>

              <p className={`text-xs sm:text-sm font-bold whitespace-nowrap shrink-0 ${getAmountColor()}`}>
                {isIncome ? "+" : "-"} R$ {Number(t.amount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </p>

              {!isVirtual && (
                <div className="flex items-center shrink-0">
                  <button
                    onClick={() => startEdit(t)}
                    className="rounded-lg p-1.5 sm:p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                    title="Editar"
                  >
                    <Pencil className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(t.id)}
                    className="rounded-lg p-1.5 sm:p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                    title="Excluir"
                  >
                    <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </button>
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
};

export default TransactionList;
