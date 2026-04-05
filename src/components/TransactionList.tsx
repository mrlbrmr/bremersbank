import { useState } from "react";
import { ArrowDownLeft, ArrowUpRight, Trash2, Pencil, X, Check, CreditCard, RotateCcw } from "lucide-react";
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

const categories = ["Mercado", "Aluguel", "Transporte", "Lazer", "Saúde", "Outros"];

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
}

interface TransactionListProps {
  transactions: Transaction[];
  onRefresh: () => void;
}

const formatDate = (dateStr: string) => {
  try {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return dateStr;
  }
};

const TransactionList = ({ transactions, onRefresh }: TransactionListProps) => {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ description: "", amount: "", type: "", category: "", date: "" });

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const realTransactions = transactions.filter(t => !t.isInstallment && !t.isRecurring);

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

  if (transactions.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-10 text-center shadow-sm">
        <p className="text-sm text-muted-foreground">Nenhuma transação registrada.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-sm font-semibold text-muted-foreground">Transações recentes</h3>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
            <input
              type="checkbox"
              checked={selected.size === realTransactions.length && realTransactions.length > 0}
              onChange={toggleAll}
              className="rounded border-border accent-primary h-3.5 w-3.5"
            />
            Selecionar tudo
          </label>
          {selected.size > 0 && (
            <button
              onClick={handleBulkDelete}
              disabled={deleting}
              className="flex items-center gap-1 rounded-lg bg-destructive/10 px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/20 transition-colors disabled:opacity-50"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Excluir ({selected.size})
            </button>
          )}
        </div>
      </div>

      {transactions.map((t, i) => {
        const isIncome = t.type === "income";
        const isEditing = editingId === t.id;

        if (isEditing) {
          return (
            <div
              key={t.id}
              className="rounded-xl border-2 border-primary/30 bg-card p-4 shadow-sm animate-fade-in"
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
                    onChange={(e) => setEditForm((f) => ({ ...f, type: e.target.value }))}
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
                    {categories.map((c) => (
                      <option key={c} value={c}>{c}</option>
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

        return (
          <div
            key={t.id}
            className={`flex items-center gap-3 rounded-xl border bg-card p-4 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 animate-fade-in ${
              t.isInstallment ? "border-primary/25 bg-primary/5" : t.isRecurring ? "border-accent/25 bg-accent/5" : "border-border"
            }`}
            style={{ animationDelay: `${i * 50}ms` }}
          >
            {!t.isInstallment && !t.isRecurring && (
              <input
                type="checkbox"
                checked={selected.has(t.id)}
                onChange={() => toggleSelect(t.id)}
                className="rounded border-border accent-primary h-4 w-4 shrink-0"
              />
            )}
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
              t.isInstallment ? "bg-primary/15" : t.isRecurring ? "bg-accent/15" : isIncome ? "bg-secondary/15" : "bg-destructive/15"
            }`}>
              {t.isInstallment ? (
                <CreditCard className="h-5 w-5 text-primary" />
              ) : t.isRecurring ? (
                <RotateCcw className="h-5 w-5 text-accent-foreground" />
              ) : isIncome ? (
                <ArrowDownLeft className="h-5 w-5 text-secondary" />
              ) : (
                <ArrowUpRight className="h-5 w-5 text-destructive" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-medium text-sm truncate">{t.description}</p>
                {t.isInstallment && t.installmentLabel && (
                  <span className="shrink-0 rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold text-primary">
                    {t.installmentLabel}
                  </span>
                )}
                {t.isRecurring && (
                  <span className="shrink-0 rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-semibold text-accent-foreground">
                    Fixo
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-muted-foreground">{formatDate(t.date)}</span>
                <span className="text-xs text-muted-foreground">·</span>
                {t.isInstallment ? (
                  <span className="text-xs font-medium text-primary">Parcela</span>
                ) : t.isRecurring ? (
                  <span className="text-xs font-medium text-accent-foreground">Fixo mensal</span>
                ) : (
                  <span className={`text-xs font-medium ${isIncome ? "text-secondary" : "text-destructive"}`}>
                    {isIncome ? "Entrada" : "Saída"}
                  </span>
                )}
                {t.category && (
                  <>
                    <span className="text-xs text-muted-foreground">·</span>
                    <span className="text-xs text-muted-foreground">{categoryIcons[t.category] || "📦"} {t.category}</span>
                  </>
                )}
              </div>
            </div>
            <p className={`text-sm font-bold whitespace-nowrap ${
              t.isInstallment ? "text-primary" : isIncome ? "text-secondary" : "text-destructive"
            }`}>
              {isIncome ? "+" : "-"} R$ {Number(t.amount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
            {!t.isInstallment && (
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => startEdit(t)}
                  className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  title="Editar"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(t.id)}
                  className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                  title="Excluir"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default TransactionList;
