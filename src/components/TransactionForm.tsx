import { useState, useEffect } from "react";
import { Plus, Loader2, RotateCcw } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

interface TransactionFormProps {
  onSuccess: () => void;
}

interface DBCategory { id: string; name: string; type: string; icon: string; }

const initialForm = {
  description: "",
  amount: "",
  type: "expense",
  category: "Outros",
  date: new Date().toISOString().split("T")[0],
  realized: true,
  isRecurring: false,
  day_of_month: String(new Date().getDate()),
};

const TransactionForm = ({ onSuccess }: TransactionFormProps) => {
  const { session } = useAuth();
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<DBCategory[]>([]);

  useEffect(() => {
    supabase.from("categories").select("*").order("name").then(({ data }) => {
      setCategories(data || []);
      if (data && data.length > 0) {
        const firstCat = data.find(c => c.type === form.type);
        if (firstCat) setForm(f => ({ ...f, category: firstCat.name }));
      }
    });
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === "type") {
      const firstCat = categories.find(c => c.type === value);
      setForm((prev) => ({ ...prev, type: value, category: firstCat?.name || "Outros" }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.description.trim() || !form.amount) {
      toast.error("Preencha todos os campos obrigatórios.");
      return;
    }

    const amount = parseFloat(form.amount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Valor deve ser um número positivo.");
      return;
    }

    setLoading(true);

    if (form.isRecurring) {
      const day = parseInt(form.day_of_month);
      if (isNaN(day) || day < 1 || day > 31) {
        toast.error("Dia do mês deve ser entre 1 e 31.");
        setLoading(false);
        return;
      }
      const { error } = await supabase.from("recurring_transactions").insert([{
        user_id: session?.user?.id,
        description: form.description.trim(),
        amount,
        type: form.type,
        category: form.category,
        day_of_month: day,
        start_date: form.date,
      }]);
      setLoading(false);
      if (error) {
        toast.error("Erro ao salvar gasto fixo.");
        return;
      }
      toast.success("Gasto fixo criado!");
    } else {
      if (!form.date) {
        toast.error("Preencha a data.");
        setLoading(false);
        return;
      }
      const { error } = await supabase.from("transactions").insert([{
        user_id: session?.user?.id,
        description: form.description.trim(),
        amount,
        type: form.type,
        category: form.category,
        date: form.date,
        realized: form.realized,
      }]);
      setLoading(false);
      if (error) {
        toast.error("Erro ao salvar transação.");
        return;
      }
      toast.success("Transação adicionada!");
    }

    setForm(initialForm);
    onSuccess();
  };

  const inputClass =
    "w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all";
  const labelClass = "block text-xs font-medium text-muted-foreground mb-1.5";

  return (
    <form onSubmit={handleSubmit} className="animate-fade-in">
      {/* Toggle: Único ou Fixo */}
      <div className="flex items-center gap-2 mb-4 p-2 rounded-lg bg-muted/50">
        <button
          type="button"
          onClick={() => setForm(f => ({ ...f, isRecurring: false }))}
          className={`flex-1 flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium transition-all ${
            !form.isRecurring
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Plus className="h-3.5 w-3.5" />
          Único
        </button>
        <button
          type="button"
          onClick={() => setForm(f => ({ ...f, isRecurring: true }))}
          className={`flex-1 flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium transition-all ${
            form.isRecurring
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Fixo mensal
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <div className="sm:col-span-2">
          <label className={labelClass}>Descrição</label>
          <input
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder={form.isRecurring ? "Ex: Netflix, Aluguel, Salário..." : "Ex: Supermercado"}
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
        {form.isRecurring ? (
          <div>
            <label className={labelClass}>Dia do mês</label>
            <input
              name="day_of_month"
              type="number"
              min="1"
              max="31"
              value={form.day_of_month}
              onChange={handleChange}
              className={inputClass}
            />
          </div>
        ) : (
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
        )}
        <div>
          <label className={labelClass}>Tipo</label>
          <select name="type" value={form.type} onChange={handleChange} className={inputClass}>
            <option value="expense">Saída</option>
            <option value="income">Entrada</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>Categoria</label>
          <select name="category" value={form.category} onChange={handleChange} className={inputClass}>
            {categories.filter(c => c.type === form.type).map((c) => (
              <option key={c.id} value={c.name}>{c.icon} {c.name}</option>
            ))}
          </select>
        </div>
        {!form.isRecurring && (
          <div className="sm:col-span-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <button
                type="button"
                onClick={() => setForm(f => ({ ...f, realized: !f.realized }))}
                className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
                  form.realized ? "bg-secondary" : "bg-muted"
                }`}
              >
                <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform ${
                  form.realized ? "translate-x-4" : "translate-x-0.5"
                }`} />
              </button>
              <span className="text-xs text-muted-foreground">
                {form.realized ? "✅ Já realizada" : "⏳ Ainda não realizada (pendente)"}
              </span>
            </label>
          </div>
        )}
      </div>
      <button
        type="submit"
        disabled={loading}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition-all hover:shadow-md disabled:opacity-50"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : form.isRecurring ? <RotateCcw className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
        {loading ? "Salvando..." : form.isRecurring ? "Criar gasto fixo" : "Adicionar"}
      </button>
    </form>
  );
};

export default TransactionForm;
