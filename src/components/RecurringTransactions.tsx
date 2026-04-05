import { useEffect, useState } from "react";
import { Plus, Trash2, RotateCcw, Pause, Play, X, Loader2, Pencil, Check, CheckCircle2, Circle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

interface RecurringTransaction {
  id: string;
  user_id: string;
  description: string;
  amount: number;
  type: string;
  category: string;
  day_of_month: number;
  active: boolean;
  created_at: string;
  start_date: string;
}

interface DBCategory {
  id: string;
  name: string;
  type: string;
  icon: string;
}

interface Confirmation {
  recurring_id: string;
  month_year: string;
}

const formatCurrency = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const getCurrentMonthYear = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
};

const RecurringTransactions = () => {
  const { session } = useAuth();
  const [items, setItems] = useState<RecurringTransaction[]>([]);
  const [categories, setCategories] = useState<DBCategory[]>([]);
  const [confirmations, setConfirmations] = useState<Set<string>>(new Set());
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthYear());
  const [form, setForm] = useState({
    description: "",
    amount: "",
    type: "expense",
    category: "Outros",
    day_of_month: "1",
    start_date: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    fetchItems();
    supabase.from("categories").select("*").order("name").then(({ data }) => setCategories(data || []));
  }, []);

  useEffect(() => {
    fetchConfirmations();
  }, [selectedMonth]);

  const fetchItems = async () => {
    const { data } = await supabase
      .from("recurring_transactions")
      .select("*")
      .order("created_at", { ascending: false });
    setItems(data || []);
  };

  const fetchConfirmations = async () => {
    const { data } = await supabase
      .from("recurring_confirmations")
      .select("recurring_id, month_year")
      .eq("month_year", selectedMonth);
    const set = new Set((data || []).map((c: Confirmation) => c.recurring_id));
    setConfirmations(set);
  };

  const toggleConfirmation = async (recurringId: string) => {
    if (confirmations.has(recurringId)) {
      // Remove confirmation
      await supabase
        .from("recurring_confirmations")
        .delete()
        .eq("recurring_id", recurringId)
        .eq("month_year", selectedMonth);
      setConfirmations(prev => {
        const next = new Set(prev);
        next.delete(recurringId);
        return next;
      });
      toast.success("Desmarcado!");
    } else {
      // Add confirmation
      await supabase
        .from("recurring_confirmations")
        .insert({ recurring_id: recurringId, month_year: selectedMonth });
      setConfirmations(prev => new Set(prev).add(recurringId));
      toast.success("Marcado como recebido/pago!");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.description.trim() || !form.amount) {
      toast.error("Preencha todos os campos.");
      return;
    }
    const amount = parseFloat(form.amount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Valor deve ser positivo.");
      return;
    }
    const day = parseInt(form.day_of_month);
    if (isNaN(day) || day < 1 || day > 31) {
      toast.error("Dia do mês deve ser entre 1 e 31.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.from("recurring_transactions").insert([{
      user_id: session?.user?.id,
      description: form.description.trim(),
      amount,
      type: form.type,
      category: form.category,
      day_of_month: day,
      start_date: form.start_date,
    }]);
    setLoading(false);

    if (error) {
      toast.error("Erro ao salvar.");
      return;
    }
    toast.success("Lançamento fixo criado!");
    const firstCat = categories.find(c => c.type === "expense");
    setForm({ description: "", amount: "", type: "expense", category: firstCat?.name || "Outros", day_of_month: "1", start_date: new Date().toISOString().split("T")[0] });
    setShowForm(false);
    fetchItems();
  };

  const startEdit = (item: RecurringTransaction) => {
    setEditingId(item.id);
    setForm({
      description: item.description,
      amount: String(item.amount),
      type: item.type,
      category: item.category,
      day_of_month: String(item.day_of_month),
      start_date: item.start_date || new Date().toISOString().split("T")[0],
    });
  };

  const handleUpdate = async () => {
    if (!editingId) return;
    const amount = parseFloat(form.amount);
    const day = parseInt(form.day_of_month);
    if (!form.description.trim() || isNaN(amount) || amount <= 0 || isNaN(day) || day < 1 || day > 31) {
      toast.error("Preencha corretamente.");
      return;
    }
    const { error } = await supabase.from("recurring_transactions").update({
      description: form.description.trim(),
      amount,
      type: form.type,
      category: form.category,
      day_of_month: day,
    }).eq("id", editingId);
    if (error) toast.error("Erro ao atualizar.");
    else { toast.success("Atualizado!"); setEditingId(null); fetchItems(); }
  };

  const toggleActive = async (item: RecurringTransaction) => {
    const { error } = await supabase
      .from("recurring_transactions")
      .update({ active: !item.active })
      .eq("id", item.id);
    if (error) toast.error("Erro ao atualizar.");
    else {
      toast.success(item.active ? "Pausado!" : "Reativado!");
      fetchItems();
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("recurring_transactions").delete().eq("id", id);
    if (error) toast.error("Erro ao excluir.");
    else { toast.success("Excluído!"); fetchItems(); }
  };

  const filteredCategories = categories.filter(c => c.type === form.type);
  const incomeItems = items.filter(i => i.type === "income");
  const expenseItems = items.filter(i => i.type === "expense");
  const totalFixedIncome = incomeItems.filter(i => i.active).reduce((s, i) => s + Number(i.amount), 0);
  const totalFixedExpense = expenseItems.filter(i => i.active).reduce((s, i) => s + Number(i.amount), 0);

  const confirmedCount = items.filter(i => i.active && confirmations.has(i.id)).length;
  const activeCount = items.filter(i => i.active).length;

  const inputClass =
    "w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all";
  const labelClass = "block text-xs font-medium text-muted-foreground mb-1.5";

  // Month label
  const [y, m] = selectedMonth.split("-").map(Number);
  const monthLabel = new Date(y, m - 1).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  const renderItem = (item: RecurringTransaction) => {
    const isIncome = item.type === "income";
    const cat = categories.find(c => c.name === item.category);
    const icon = cat?.icon || "📦";
    const isConfirmed = confirmations.has(item.id);

    if (editingId === item.id) {
      return (
        <div key={item.id} className="rounded-xl border-2 border-primary/30 bg-card p-4 space-y-3 animate-fade-in">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className={labelClass}>Descrição</label>
              <input value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Valor (R$)</label>
              <input type="number" step="0.01" min="0.01" value={form.amount} onChange={(e) => setForm(f => ({ ...f, amount: e.target.value }))} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Dia do mês</label>
              <input type="number" min="1" max="31" value={form.day_of_month} onChange={(e) => setForm(f => ({ ...f, day_of_month: e.target.value }))} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Tipo</label>
              <select value={form.type} onChange={(e) => {
                const newType = e.target.value;
                const firstCat = categories.find(c => c.type === newType);
                setForm(f => ({ ...f, type: newType, category: firstCat?.name || "Outros" }));
              }} className={inputClass}>
                <option value="expense">Despesa fixa</option>
                <option value="income">Receita fixa</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Categoria</label>
              <select value={form.category} onChange={(e) => setForm(f => ({ ...f, category: e.target.value }))} className={inputClass}>
                {filteredCategories.map(c => (
                  <option key={c.id} value={c.name}>{c.icon} {c.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setEditingId(null)} className="flex items-center gap-1 text-xs text-muted-foreground px-3 py-1.5 rounded hover:bg-muted">
              <X className="h-3.5 w-3.5" /> Cancelar
            </button>
            <button onClick={handleUpdate} className="flex items-center gap-1 text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded">
              <Check className="h-3.5 w-3.5" /> Salvar
            </button>
          </div>
        </div>
      );
    }

    return (
      <div
        key={item.id}
        className={`flex items-center gap-3 rounded-xl border bg-card p-4 shadow-sm transition-all duration-200 hover:shadow-md ${
          !item.active ? "border-border/50 opacity-60" : isConfirmed ? "border-secondary/30" : "border-border"
        }`}
      >
        {/* Confirmation toggle */}
        {item.active && (
          <button
            onClick={() => toggleConfirmation(item.id)}
            className="shrink-0 p-0.5 transition-colors"
            title={isConfirmed ? (isIncome ? "Desmarcar recebido" : "Desmarcar pago") : (isIncome ? "Marcar como recebido" : "Marcar como pago")}
          >
            {isConfirmed ? (
              <CheckCircle2 className="h-5 w-5 text-secondary" />
            ) : (
              <Circle className="h-5 w-5 text-muted-foreground" />
            )}
          </button>
        )}

        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg ${
          isIncome ? "bg-secondary/15" : "bg-destructive/15"
        }`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className={`font-medium text-sm truncate ${isConfirmed ? "" : ""}`}>{item.description}</p>
            {!item.active && (
              <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full">Pausado</span>
            )}
            {isConfirmed && (
              <span className="text-[10px] bg-secondary/15 text-secondary px-1.5 py-0.5 rounded-full font-medium">
                {isIncome ? "Recebido" : "Pago"}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[11px] text-muted-foreground">{item.category}</span>
            <span className="text-[11px] text-muted-foreground">•</span>
            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
              <RotateCcw className="h-3 w-3" />
              Todo dia {item.day_of_month}
            </span>
          </div>
        </div>
        <p className={`text-sm font-bold whitespace-nowrap ${isIncome ? "text-secondary" : "text-destructive"}`}>
          {isIncome ? "+" : "-"} {formatCurrency(Number(item.amount))}
        </p>
        <div className="flex items-center gap-1">
          <button
            onClick={() => startEdit(item)}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted transition-colors"
            title="Editar"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={() => toggleActive(item)}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted transition-colors"
            title={item.active ? "Pausar" : "Reativar"}
          >
            {item.active ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </button>
          <button
            onClick={() => handleDelete(item.id)}
            className="rounded-lg p-1.5 text-destructive/70 hover:bg-destructive/10 transition-colors"
            title="Excluir"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <RotateCcw className="h-4 w-4 text-primary" />
            Lançamentos Fixos
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Receitas e despesas que se repetem todo mês
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:opacity-90 transition-colors"
        >
          {showForm ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
          {showForm ? "Fechar" : "Novo"}
        </button>
      </div>

      {/* Month selector for confirmations */}
      <div className="flex items-center justify-between mb-4 rounded-lg bg-muted/50 p-2.5">
        <button
          onClick={() => {
            const d = new Date(y, m - 2, 1);
            setSelectedMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
          }}
          className="rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-background transition-colors"
        >
          ←
        </button>
        <div className="text-center">
          <p className="text-xs font-medium capitalize">{monthLabel}</p>
          <p className="text-[10px] text-muted-foreground">{confirmedCount}/{activeCount} confirmados</p>
        </div>
        <button
          onClick={() => {
            const d = new Date(y, m, 1);
            setSelectedMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
          }}
          className="rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-background transition-colors"
        >
          →
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="rounded-lg bg-secondary/10 border border-secondary/20 p-3 text-center">
          <p className="text-sm font-bold text-secondary">{formatCurrency(totalFixedIncome)}</p>
          <p className="text-[10px] text-muted-foreground">Receitas fixas/mês</p>
        </div>
        <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-center">
          <p className="text-sm font-bold text-destructive">{formatCurrency(totalFixedExpense)}</p>
          <p className="text-[10px] text-muted-foreground">Despesas fixas/mês</p>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-lg border border-border bg-background p-4 mb-4 animate-fade-in">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className={labelClass}>Descrição</label>
              <input
                value={form.description}
                onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Ex: Aluguel, Netflix, Salário..."
                maxLength={100}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Valor (R$)</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={form.amount}
                onChange={(e) => setForm(f => ({ ...f, amount: e.target.value }))}
                placeholder="0,00"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Dia do mês</label>
              <input
                type="number"
                min="1"
                max="31"
                value={form.day_of_month}
                onChange={(e) => setForm(f => ({ ...f, day_of_month: e.target.value }))}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Tipo</label>
              <select
                value={form.type}
                onChange={(e) => {
                  const newType = e.target.value;
                  const firstCat = categories.find(c => c.type === newType);
                  setForm(f => ({ ...f, type: newType, category: firstCat?.name || "Outros" }));
                }}
                className={inputClass}
              >
                <option value="expense">Despesa fixa</option>
                <option value="income">Receita fixa</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Categoria</label>
              <select
                value={form.category}
                onChange={(e) => setForm(f => ({ ...f, category: e.target.value }))}
                className={inputClass}
              >
                {filteredCategories.map(c => (
                  <option key={c.id} value={c.name}>{c.icon} {c.name}</option>
                ))}
              </select>
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition-all hover:shadow-md disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            {loading ? "Salvando..." : "Criar lançamento fixo"}
          </button>
        </form>
      )}

      {/* List */}
      {items.length === 0 ? (
        <div className="text-center py-6">
          <p className="text-sm text-muted-foreground">Nenhum lançamento fixo cadastrado.</p>
          <p className="text-xs text-muted-foreground mt-1">
            Adicione receitas e despesas que se repetem todo mês.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {expenseItems.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Despesas fixas</p>
              <div className="space-y-2">{expenseItems.map(renderItem)}</div>
            </div>
          )}
          {incomeItems.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Receitas fixas</p>
              <div className="space-y-2">{incomeItems.map(renderItem)}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RecurringTransactions;
