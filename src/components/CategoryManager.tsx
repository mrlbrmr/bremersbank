import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, X, Check } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface Category {
  id: string;
  name: string;
  type: string;
  icon: string;
}

const ICONS = ["🛒", "🏠", "🚗", "🎮", "💊", "📦", "💰", "💻", "📈", "🎓", "👶", "🐶", "🍔", "☕", "🎬", "✈️", "🏋️", "💇", "📱", "🎁"];

const CategoryManager = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", type: "expense", icon: "📦" });
  const [adding, setAdding] = useState(false);

  useEffect(() => { fetchCategories(); }, []);

  const fetchCategories = async () => {
    const { data } = await supabase.from("categories").select("*").order("type").order("name");
    setCategories(data || []);
  };

  const handleAdd = async () => {
    if (!form.name.trim()) { toast.error("Nome obrigatório."); return; }
    const { error } = await supabase.from("categories").insert({ name: form.name.trim(), type: form.type, icon: form.icon });
    if (error) toast.error("Erro ao criar categoria.");
    else { toast.success("Categoria criada!"); setAdding(false); setForm({ name: "", type: "expense", icon: "📦" }); fetchCategories(); }
  };

  const handleUpdate = async (id: string) => {
    if (!form.name.trim()) { toast.error("Nome obrigatório."); return; }
    const { error } = await supabase.from("categories").update({ name: form.name.trim(), type: form.type, icon: form.icon }).eq("id", id);
    if (error) toast.error("Erro ao atualizar.");
    else { toast.success("Categoria atualizada!"); setEditingId(null); fetchCategories(); }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) toast.error("Erro ao excluir.");
    else { toast.success("Categoria excluída!"); fetchCategories(); }
  };

  const startEdit = (cat: Category) => {
    setEditingId(cat.id);
    setForm({ name: cat.name, type: cat.type, icon: cat.icon });
  };

  const inputClass = "rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all";
  const expenseCategories = categories.filter(c => c.type === "expense");
  const incomeCategories = categories.filter(c => c.type === "income");

  const renderList = (list: Category[], label: string) => (
    <div>
      <h4 className="text-xs font-semibold text-muted-foreground mb-2">{label}</h4>
      {list.length === 0 ? (
        <p className="text-xs text-muted-foreground py-4 text-center">Nenhuma categoria</p>
      ) : (
        <div className="space-y-2">
          {list.map((cat) => (
            editingId === cat.id ? (
              <div key={cat.id} className="rounded-lg border-2 border-primary/30 bg-card p-3 space-y-2">
                <div className="flex gap-2">
                  <input value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} className={`${inputClass} flex-1`} />
                  <select value={form.type} onChange={(e) => setForm(f => ({ ...f, type: e.target.value }))} className={`${inputClass} w-28`}>
                    <option value="expense">Despesa</option>
                    <option value="income">Receita</option>
                  </select>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {ICONS.map(icon => (
                    <button key={icon} onClick={() => setForm(f => ({ ...f, icon }))}
                      className={`text-lg p-1 rounded ${form.icon === icon ? "bg-primary/20 ring-2 ring-primary" : "hover:bg-muted"}`}>{icon}</button>
                  ))}
                </div>
                <div className="flex justify-end gap-2">
                  <button onClick={() => setEditingId(null)} className="flex items-center gap-1 text-xs text-muted-foreground px-2 py-1 rounded hover:bg-muted"><X className="h-3 w-3" /> Cancelar</button>
                  <button onClick={() => handleUpdate(cat.id)} className="flex items-center gap-1 text-xs bg-primary text-primary-foreground px-2 py-1 rounded"><Check className="h-3 w-3" /> Salvar</button>
                </div>
              </div>
            ) : (
              <div key={cat.id} className="flex items-center gap-3 rounded-lg border border-border bg-card p-3 hover:shadow-sm transition-all">
                <span className="text-lg">{cat.icon}</span>
                <span className="flex-1 text-sm font-medium">{cat.name}</span>
                <button onClick={() => startEdit(cat)} className="p-1.5 rounded text-muted-foreground hover:bg-muted"><Pencil className="h-3.5 w-3.5" /></button>
                <button onClick={() => handleDelete(cat.id)} className="p-1.5 rounded text-muted-foreground hover:bg-destructive/10 hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            )
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Categorias</h2>
        <button onClick={() => setAdding(true)} className="flex items-center gap-1 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:opacity-90 transition-colors">
          <Plus className="h-4 w-4" /> Nova
        </button>
      </div>

      {adding && (
        <div className="rounded-xl border-2 border-primary/30 bg-card p-4 space-y-3 animate-fade-in">
          <div className="flex gap-2">
            <input placeholder="Nome da categoria" value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} className={`${inputClass} flex-1`} autoFocus />
            <select value={form.type} onChange={(e) => setForm(f => ({ ...f, type: e.target.value }))} className={`${inputClass} w-28`}>
              <option value="expense">Despesa</option>
              <option value="income">Receita</option>
            </select>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {ICONS.map(icon => (
              <button key={icon} onClick={() => setForm(f => ({ ...f, icon }))}
                className={`text-lg p-1 rounded ${form.icon === icon ? "bg-primary/20 ring-2 ring-primary" : "hover:bg-muted"}`}>{icon}</button>
            ))}
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => { setAdding(false); setForm({ name: "", type: "expense", icon: "📦" }); }} className="text-xs text-muted-foreground px-3 py-1.5 rounded hover:bg-muted">Cancelar</button>
            <button onClick={handleAdd} className="text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded">Criar</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {renderList(expenseCategories, "💸 Categorias de Despesa")}
        {renderList(incomeCategories, "💰 Categorias de Receita")}
      </div>
    </div>
  );
};

export default CategoryManager;
