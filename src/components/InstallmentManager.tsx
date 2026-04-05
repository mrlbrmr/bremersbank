import { useEffect, useState } from "react";
import { Plus, Trash2, CreditCard, AlertCircle, Pencil, X, Check } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface Installment {
  id: string;
  description: string;
  total_amount: number;
  total_installments: number;
  current_installment: number;
  monthly_amount: number;
  start_date: string;
  category: string;
  active: boolean;
}

interface DBCategory {
  id: string;
  name: string;
  type: string;
  icon: string;
}

const formatCurrency = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const InstallmentManager = () => {
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [categories, setCategories] = useState<DBCategory[]>([]);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    description: "", total_amount: "", total_installments: "", start_date: new Date().toISOString().split("T")[0], category: "Outros",
  });

  useEffect(() => {
    fetchInstallments();
    supabase.from("categories").select("*").order("name").then(({ data }) => setCategories(data || []));
  }, []);

  const fetchInstallments = async () => {
    const { data } = await supabase.from("installments").select("*").order("created_at", { ascending: false });
    setInstallments(data || []);
  };

  const handleAdd = async () => {
    const total = parseFloat(form.total_amount);
    const parcelas = parseInt(form.total_installments);
    if (!form.description.trim() || isNaN(total) || total <= 0 || isNaN(parcelas) || parcelas <= 0) {
      toast.error("Preencha todos os campos."); return;
    }
    const monthly = total / parcelas;
    await supabase.from("installments").insert({
      description: form.description.trim(), total_amount: total, total_installments: parcelas,
      monthly_amount: Math.round(monthly * 100) / 100, start_date: form.start_date, category: form.category,
      current_installment: 0,
    });
    toast.success("Parcelamento criado!"); setAdding(false);
    setForm({ description: "", total_amount: "", total_installments: "", start_date: new Date().toISOString().split("T")[0], category: "Outros" });
    fetchInstallments();
  };

  const startEdit = (inst: Installment) => {
    setEditingId(inst.id);
    setForm({
      description: inst.description,
      total_amount: String(inst.total_amount),
      total_installments: String(inst.total_installments),
      start_date: inst.start_date,
      category: inst.category || "Outros",
    });
  };

  const handleUpdate = async () => {
    if (!editingId) return;
    const total = parseFloat(form.total_amount);
    const parcelas = parseInt(form.total_installments);
    if (!form.description.trim() || isNaN(total) || total <= 0 || isNaN(parcelas) || parcelas <= 0) {
      toast.error("Preencha corretamente."); return;
    }
    const monthly = total / parcelas;
    const { error } = await supabase.from("installments").update({
      description: form.description.trim(),
      total_amount: total,
      total_installments: parcelas,
      monthly_amount: Math.round(monthly * 100) / 100,
      start_date: form.start_date,
      category: form.category,
    }).eq("id", editingId);
    if (error) toast.error("Erro ao atualizar.");
    else { toast.success("Parcelamento atualizado!"); setEditingId(null); fetchInstallments(); }
  };

  const handleAdvance = async (inst: Installment) => {
    if (inst.current_installment >= inst.total_installments) return;
    const next = inst.current_installment + 1;
    const active = next < inst.total_installments;
    await supabase.from("installments").update({ current_installment: next, active }).eq("id", inst.id);
    toast.success(`Parcela ${next}/${inst.total_installments} paga!`);
    fetchInstallments();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("installments").delete().eq("id", id);
    toast.success("Parcelamento excluído!"); fetchInstallments();
  };

  const inputClass = "rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all";

  const activeInstallments = installments.filter(i => i.active);
  const completedInstallments = installments.filter(i => !i.active);
  const totalMonthly = activeInstallments.reduce((s, i) => s + Number(i.monthly_amount), 0);

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Parcelamentos</h2>
        <button onClick={() => setAdding(true)} className="flex items-center gap-1 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:opacity-90 transition-colors">
          <Plus className="h-4 w-4" /> Novo
        </button>
      </div>

      {/* Monthly total */}
      <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 flex items-center gap-3">
        <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
        <div>
          <p className="text-sm font-medium">Comprometido mensal: <span className="text-destructive font-bold">{formatCurrency(totalMonthly)}</span></p>
          <p className="text-xs text-muted-foreground">{activeInstallments.length} parcelamento(s) ativo(s)</p>
        </div>
      </div>

      {adding && (
        <div className="rounded-xl border-2 border-primary/30 bg-card p-4 space-y-3 animate-fade-in">
          <input placeholder="Descrição (ex: Notebook)" value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} className={`${inputClass} w-full`} autoFocus />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <input type="number" placeholder="Valor total (R$)" value={form.total_amount} onChange={(e) => setForm(f => ({ ...f, total_amount: e.target.value }))} className={inputClass} />
            <input type="number" placeholder="Nº de parcelas" value={form.total_installments} onChange={(e) => setForm(f => ({ ...f, total_installments: e.target.value }))} className={inputClass} />
            <input type="date" value={form.start_date} onChange={(e) => setForm(f => ({ ...f, start_date: e.target.value }))} className={inputClass} />
            <select value={form.category} onChange={(e) => setForm(f => ({ ...f, category: e.target.value }))} className={inputClass}>
              {categories.filter(c => c.type === "expense").map(c => (
                <option key={c.id} value={c.name}>{c.icon} {c.name}</option>
              ))}
            </select>
          </div>
          {form.total_amount && form.total_installments && (
            <p className="text-xs text-muted-foreground">
              Parcela mensal: <span className="font-medium text-foreground">{formatCurrency(parseFloat(form.total_amount) / parseInt(form.total_installments) || 0)}</span>
            </p>
          )}
          <div className="flex justify-end gap-2">
            <button onClick={() => setAdding(false)} className="text-xs text-muted-foreground px-3 py-1.5 rounded hover:bg-muted">Cancelar</button>
            <button onClick={handleAdd} className="text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded">Criar</button>
          </div>
        </div>
      )}

      {/* Active installments */}
      {activeInstallments.length === 0 && !adding && (
        <div className="rounded-xl border border-border bg-card p-10 text-center">
          <CreditCard className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Nenhum parcelamento ativo.</p>
        </div>
      )}

      <div className="space-y-3">
        {activeInstallments.map((inst) => {
          const pct = (inst.current_installment / inst.total_installments) * 100;
          const paid = inst.current_installment * Number(inst.monthly_amount);
          const remaining = Number(inst.total_amount) - paid;

          if (editingId === inst.id) {
            return (
              <div key={inst.id} className="rounded-xl border-2 border-primary/30 bg-card p-4 space-y-3 animate-fade-in">
                <input value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} className={`${inputClass} w-full`} />
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <input type="number" placeholder="Valor total" value={form.total_amount} onChange={(e) => setForm(f => ({ ...f, total_amount: e.target.value }))} className={inputClass} />
                  <input type="number" placeholder="Nº parcelas" value={form.total_installments} onChange={(e) => setForm(f => ({ ...f, total_installments: e.target.value }))} className={inputClass} />
                  <input type="date" value={form.start_date} onChange={(e) => setForm(f => ({ ...f, start_date: e.target.value }))} className={inputClass} />
                </div>
                <div className="flex justify-end gap-2">
                  <button onClick={() => setEditingId(null)} className="flex items-center gap-1 text-xs text-muted-foreground px-2 py-1 rounded hover:bg-muted"><X className="h-3 w-3" /> Cancelar</button>
                  <button onClick={handleUpdate} className="flex items-center gap-1 text-xs bg-primary text-primary-foreground px-2 py-1 rounded"><Check className="h-3 w-3" /> Salvar</button>
                </div>
              </div>
            );
          }

          return (
            <div key={inst.id} className="rounded-xl border border-border bg-card p-4 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="font-semibold text-sm">{inst.description}</p>
                  <p className="text-xs text-muted-foreground">{inst.category}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => handleAdvance(inst)} className="rounded-lg bg-primary/10 px-2.5 py-1.5 text-xs font-medium text-primary hover:bg-primary/20 transition-colors">
                    Pagar parcela
                  </button>
                  <button onClick={() => startEdit(inst)} className="p-1.5 rounded text-muted-foreground hover:bg-muted">
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => handleDelete(inst.id)} className="p-1.5 rounded text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <div className="w-full h-2.5 rounded-full bg-muted overflow-hidden mb-2">
                <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${pct}%` }} />
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="font-medium text-foreground">{inst.current_installment}/{inst.total_installments} parcelas pagas</span>
                <span>{formatCurrency(Number(inst.monthly_amount))}/mês</span>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
                <span>Pago: {formatCurrency(paid)}</span>
                <span>Restante: {formatCurrency(remaining)}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Completed */}
      {completedInstallments.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-muted-foreground mb-2">✅ Quitados</h4>
          <div className="space-y-2">
            {completedInstallments.map((inst) => (
              <div key={inst.id} className="flex items-center justify-between rounded-lg border border-border bg-card p-3 opacity-60">
                <div>
                  <p className="text-sm font-medium">{inst.description}</p>
                  <p className="text-xs text-muted-foreground">{inst.total_installments}x de {formatCurrency(Number(inst.monthly_amount))} — Total: {formatCurrency(Number(inst.total_amount))}</p>
                </div>
                <button onClick={() => handleDelete(inst.id)} className="p-1.5 rounded text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default InstallmentManager;
