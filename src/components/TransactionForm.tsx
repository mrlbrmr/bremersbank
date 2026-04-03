import { useState } from "react";
import { Plus, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface TransactionFormProps {
  onSuccess: () => void;
}

const initialForm = {
  description: "",
  amount: "",
  type: "expense",
  date: new Date().toISOString().split("T")[0],
};

const TransactionForm = ({ onSuccess }: TransactionFormProps) => {
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.description.trim() || !form.amount || !form.date) {
      toast.error("Preencha todos os campos obrigatórios.");
      return;
    }

    const amount = parseFloat(form.amount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Valor deve ser um número positivo.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.from("transactions").insert([
      {
        description: form.description.trim(),
        amount,
        type: form.type,
        date: form.date,
      },
    ]);
    setLoading(false);

    if (error) {
      toast.error("Erro ao salvar transação.");
      return;
    }

    toast.success("Transação adicionada!");
    setForm(initialForm);
    onSuccess();
  };

  const inputClass =
    "w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all";
  const labelClass = "block text-xs font-medium text-muted-foreground mb-1.5";

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-card p-6 shadow-sm animate-fade-in">
      <h3 className="text-sm font-semibold mb-4">Nova Transação</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className={labelClass}>Descrição</label>
          <input
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Ex: Supermercado"
            maxLength={100}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Valor (R$)</label>
          <input
            name="amount"
            type="number"
            step="0.01"
            min="0.01"
            value={form.amount}
            onChange={handleChange}
            placeholder="0,00"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Data</label>
          <input
            name="date"
            type="date"
            value={form.date}
            onChange={handleChange}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Tipo</label>
          <select name="type" value={form.type} onChange={handleChange} className={inputClass}>
            <option value="expense">Saída</option>
            <option value="income">Entrada</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>Pessoa</label>
          <select name="person" value={form.person} onChange={handleChange} className={inputClass}>
            <option value="A">Pessoa A</option>
            <option value="B">Pessoa B</option>
          </select>
        </div>
      </div>
      <button
        type="submit"
        disabled={loading}
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition-all hover:shadow-md disabled:opacity-50"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
        {loading ? "Salvando..." : "Adicionar"}
      </button>
    </form>
  );
};

export default TransactionForm;
