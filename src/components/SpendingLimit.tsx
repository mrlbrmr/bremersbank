import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle, Target, Plus, Save, X, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface SpendingLimitProps {
  transactions: { amount: number; type: string; category?: string }[];
  monthYear: string;
}

interface LimitRow {
  id: string;
  category: string;
  amount: number;
  month_year: string;
}

const formatCurrency = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const SpendingLimit = ({ transactions, monthYear }: SpendingLimitProps) => {
  const [limits, setLimits] = useState<LimitRow[]>([]);
  const [adding, setAdding] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    fetchLimits();
    fetchCategories();
  }, [monthYear]);

  const fetchLimits = async () => {
    const { data } = await supabase
      .from("spending_limits")
      .select("*")
      .eq("month_year", monthYear);
    setLimits(data || []);
  };

  const fetchCategories = async () => {
    const { data } = await supabase.from("categories").select("name").eq("type", "expense");
    const names = (data || []).map((c) => c.name);
    if (!names.includes("Mercado")) names.push("Mercado", "Aluguel", "Transporte", "Lazer", "Saúde", "Outros");
    setCategories([...new Set(names)]);
  };

  const gastosPorCategoria = (cat: string) =>
    transactions
      .filter((t) => t.type === "expense" && t.category === cat)
      .reduce((s, t) => s + Number(t.amount), 0);

  const saveLimit = async () => {
    const amount = parseFloat(newAmount);
    if (!newCategory || isNaN(amount) || amount <= 0) {
      toast.error("Preencha categoria e valor.");
      return;
    }
    const { data: existing } = await supabase
      .from("spending_limits")
      .select("id")
      .eq("month_year", monthYear)
      .eq("category", newCategory)
      .maybeSingle();

    if (existing) {
      await supabase.from("spending_limits").update({ amount }).eq("id", existing.id);
    } else {
      await supabase.from("spending_limits").insert({ month_year: monthYear, category: newCategory, amount });
    }
    setAdding(false);
    setNewCategory("");
    setNewAmount("");
    toast.success("Limite salvo!");
    fetchLimits();
  };

  const deleteLimit = async (id: string) => {
    await supabase.from("spending_limits").delete().eq("id", id);
    toast.success("Limite removido!");
    fetchLimits();
  };

  const inputClass =
    "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all";

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm animate-fade-in" style={{ animationDelay: "500ms" }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs font-semibold text-muted-foreground">Limites por Categoria</span>
        </div>
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-1 rounded-lg bg-primary/10 px-2.5 py-1.5 text-xs font-medium text-primary hover:bg-primary/20 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" /> Adicionar
        </button>
      </div>

      {adding && (
        <div className="mb-4 rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-2">
          <select value={newCategory} onChange={(e) => setNewCategory(e.target.value)} className={inputClass}>
            <option value="">Selecione a categoria</option>
            {categories
              .filter((c) => !limits.some((l) => l.category === c))
              .map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
          </select>
          <input
            type="number"
            step="0.01"
            min="0"
            value={newAmount}
            onChange={(e) => setNewAmount(e.target.value)}
            placeholder="Limite (R$)"
            className={inputClass}
          />
          <div className="flex gap-2">
            <button onClick={saveLimit} className="flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 transition-colors">
              <Save className="h-3.5 w-3.5" /> Salvar
            </button>
            <button onClick={() => setAdding(false)} className="flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted transition-colors">
              <X className="h-3.5 w-3.5" /> Cancelar
            </button>
          </div>
        </div>
      )}

      {limits.length === 0 && !adding ? (
        <p className="text-xs text-muted-foreground text-center py-4">
          Nenhum limite definido. Clique em "Adicionar" para criar.
        </p>
      ) : (
        <div className="space-y-3">
          {limits.map((l) => {
            const gasto = gastosPorCategoria(l.category);
            const pct = l.amount > 0 ? (gasto / l.amount) * 100 : 0;
            const isWarning = pct >= 80 && pct < 100;
            const isDanger = pct >= 100;
            const barColor = isDanger ? "bg-destructive" : isWarning ? "bg-amber-500" : "bg-secondary";

            return (
              <div
                key={l.id}
                className={`rounded-lg border p-3 transition-all ${
                  isDanger ? "border-destructive/30 bg-destructive/5" : isWarning ? "border-amber-500/30 bg-amber-500/5" : "border-border"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium">{l.category}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {formatCurrency(gasto)} / {formatCurrency(l.amount)}
                    </span>
                    {isDanger ? (
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                    ) : isWarning ? (
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                    ) : (
                      <CheckCircle className="h-4 w-4 text-secondary" />
                    )}
                    <button onClick={() => deleteLimit(l.id)} className="p-1 text-muted-foreground hover:text-destructive transition-colors">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-500 ${barColor}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                </div>
                <p className={`text-[10px] mt-1 ${isDanger ? "text-destructive" : isWarning ? "text-amber-600" : "text-muted-foreground"}`}>
                  {pct.toFixed(0)}% usado
                  {isDanger && ` — Excedido em ${formatCurrency(gasto - l.amount)}`}
                  {!isDanger && l.amount > gasto && ` — Restam ${formatCurrency(l.amount - gasto)}`}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SpendingLimit;
