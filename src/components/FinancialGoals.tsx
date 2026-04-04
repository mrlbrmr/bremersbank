import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, X, Check, Target, TrendingUp } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface Goal {
  id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  icon: string;
}

const ICONS = ["🎯", "✈️", "🚗", "🏠", "💻", "📱", "🎓", "💍", "👶", "🏖️", "🏋️", "📚", "🎸", "🐶", "💎", "🏢"];

const formatCurrency = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const FinancialGoals = () => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", target_amount: "", current_amount: "", icon: "🎯" });
  const [addAmount, setAddAmount] = useState<Record<string, string>>({});

  useEffect(() => { fetchGoals(); }, []);

  const fetchGoals = async () => {
    const { data } = await supabase.from("financial_goals").select("*").order("created_at", { ascending: false });
    setGoals(data || []);
  };

  const handleAdd = async () => {
    const target = parseFloat(form.target_amount);
    if (!form.name.trim() || isNaN(target) || target <= 0) { toast.error("Preencha corretamente."); return; }
    await supabase.from("financial_goals").insert({ name: form.name.trim(), target_amount: target, current_amount: parseFloat(form.current_amount) || 0, icon: form.icon });
    toast.success("Meta criada!"); setAdding(false); setForm({ name: "", target_amount: "", current_amount: "", icon: "🎯" }); fetchGoals();
  };

  const handleUpdate = async (id: string) => {
    const target = parseFloat(form.target_amount);
    if (!form.name.trim() || isNaN(target) || target <= 0) { toast.error("Preencha corretamente."); return; }
    await supabase.from("financial_goals").update({ name: form.name.trim(), target_amount: target, current_amount: parseFloat(form.current_amount) || 0, icon: form.icon }).eq("id", id);
    toast.success("Meta atualizada!"); setEditingId(null); fetchGoals();
  };

  const handleAddAmount = async (goal: Goal) => {
    const val = parseFloat(addAmount[goal.id] || "0");
    if (isNaN(val) || val <= 0) return;
    await supabase.from("financial_goals").update({ current_amount: goal.current_amount + val }).eq("id", goal.id);
    toast.success(`+${formatCurrency(val)} adicionado!`);
    setAddAmount(prev => ({ ...prev, [goal.id]: "" }));
    fetchGoals();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("financial_goals").delete().eq("id", id);
    toast.success("Meta excluída!"); fetchGoals();
  };

  const startEdit = (g: Goal) => {
    setEditingId(g.id);
    setForm({ name: g.name, target_amount: String(g.target_amount), current_amount: String(g.current_amount), icon: g.icon });
  };

  const inputClass = "rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all";

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Metas Financeiras</h2>
        <button onClick={() => setAdding(true)} className="flex items-center gap-1 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:opacity-90 transition-colors">
          <Plus className="h-4 w-4" /> Nova Meta
        </button>
      </div>

      {adding && (
        <div className="rounded-xl border-2 border-primary/30 bg-card p-4 space-y-3 animate-fade-in">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input placeholder="Nome da meta (ex: Viagem)" value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} className={`${inputClass} sm:col-span-2`} autoFocus />
            <input type="number" placeholder="Valor alvo (R$)" value={form.target_amount} onChange={(e) => setForm(f => ({ ...f, target_amount: e.target.value }))} className={inputClass} />
            <input type="number" placeholder="Já guardado (R$)" value={form.current_amount} onChange={(e) => setForm(f => ({ ...f, current_amount: e.target.value }))} className={inputClass} />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {ICONS.map(icon => (
              <button key={icon} onClick={() => setForm(f => ({ ...f, icon }))}
                className={`text-lg p-1 rounded ${form.icon === icon ? "bg-primary/20 ring-2 ring-primary" : "hover:bg-muted"}`}>{icon}</button>
            ))}
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setAdding(false)} className="text-xs text-muted-foreground px-3 py-1.5 rounded hover:bg-muted">Cancelar</button>
            <button onClick={handleAdd} className="text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded">Criar Meta</button>
          </div>
        </div>
      )}

      {goals.length === 0 && !adding && (
        <div className="rounded-xl border border-border bg-card p-10 text-center">
          <Target className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Nenhuma meta criada ainda.</p>
          <p className="text-xs text-muted-foreground mt-1">Crie sua primeira meta financeira!</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {goals.map((goal) => {
          const pct = goal.target_amount > 0 ? (goal.current_amount / goal.target_amount) * 100 : 0;
          const completed = pct >= 100;

          if (editingId === goal.id) {
            return (
              <div key={goal.id} className="rounded-xl border-2 border-primary/30 bg-card p-4 space-y-3">
                <input value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} className={`${inputClass} w-full`} />
                <div className="grid grid-cols-2 gap-2">
                  <input type="number" value={form.target_amount} onChange={(e) => setForm(f => ({ ...f, target_amount: e.target.value }))} className={inputClass} placeholder="Alvo" />
                  <input type="number" value={form.current_amount} onChange={(e) => setForm(f => ({ ...f, current_amount: e.target.value }))} className={inputClass} placeholder="Atual" />
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {ICONS.map(icon => (
                    <button key={icon} onClick={() => setForm(f => ({ ...f, icon }))}
                      className={`text-lg p-1 rounded ${form.icon === icon ? "bg-primary/20 ring-2 ring-primary" : "hover:bg-muted"}`}>{icon}</button>
                  ))}
                </div>
                <div className="flex justify-end gap-2">
                  <button onClick={() => setEditingId(null)} className="flex items-center gap-1 text-xs text-muted-foreground px-2 py-1 rounded hover:bg-muted"><X className="h-3 w-3" /> Cancelar</button>
                  <button onClick={() => handleUpdate(goal.id)} className="flex items-center gap-1 text-xs bg-primary text-primary-foreground px-2 py-1 rounded"><Check className="h-3 w-3" /> Salvar</button>
                </div>
              </div>
            );
          }

          return (
            <div key={goal.id} className={`rounded-xl border p-5 shadow-sm transition-all hover:shadow-md ${completed ? "border-secondary/30 bg-secondary/5" : "border-border bg-card"}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{goal.icon}</span>
                  <div>
                    <p className="font-semibold text-sm">{goal.name}</p>
                    <p className="text-[10px] text-muted-foreground">{formatCurrency(goal.current_amount)} de {formatCurrency(goal.target_amount)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => startEdit(goal)} className="p-1.5 rounded text-muted-foreground hover:bg-muted"><Pencil className="h-3.5 w-3.5" /></button>
                  <button onClick={() => handleDelete(goal.id)} className="p-1.5 rounded text-muted-foreground hover:bg-destructive/10 hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full h-3 rounded-full bg-muted overflow-hidden mb-2">
                <div className={`h-full rounded-full transition-all duration-500 ${completed ? "bg-secondary" : "bg-primary"}`}
                  style={{ width: `${Math.min(pct, 100)}%` }} />
              </div>
              <div className="flex items-center justify-between mb-3">
                <span className={`text-xs font-medium ${completed ? "text-secondary" : "text-muted-foreground"}`}>
                  {completed ? "🎉 Meta alcançada!" : `${pct.toFixed(0)}% concluído`}
                </span>
                {!completed && (
                  <span className="text-xs text-muted-foreground">Falta: {formatCurrency(goal.target_amount - goal.current_amount)}</span>
                )}
              </div>

              {/* Quick add */}
              {!completed && (
                <div className="flex gap-2">
                  <input
                    type="number" placeholder="Adicionar R$"
                    value={addAmount[goal.id] || ""}
                    onChange={(e) => setAddAmount(prev => ({ ...prev, [goal.id]: e.target.value }))}
                    className={`${inputClass} flex-1 text-xs`}
                  />
                  <button onClick={() => handleAddAmount(goal)} className="flex items-center gap-1 rounded-lg bg-secondary/15 px-3 py-1.5 text-xs font-medium text-secondary hover:bg-secondary/25 transition-colors">
                    <TrendingUp className="h-3.5 w-3.5" /> Guardar
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FinancialGoals;
