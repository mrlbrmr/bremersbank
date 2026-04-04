import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle, Target, Pencil, Save } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface SpendingLimitProps {
  gastosMes: number;
  monthYear: string; // "2026-04"
}

const formatCurrency = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const SpendingLimit = ({ gastosMes, monthYear }: SpendingLimitProps) => {
  const [limit, setLimit] = useState<number>(0);
  const [editing, setEditing] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetchLimit();
  }, [monthYear]);

  const fetchLimit = async () => {
    const { data } = await supabase
      .from("spending_limits")
      .select("*")
      .eq("month_year", monthYear)
      .maybeSingle();
    if (data) setLimit(Number(data.amount));
    else setLimit(0);
    setLoaded(true);
  };

  const saveLimit = async () => {
    const amount = parseFloat(inputValue);
    if (isNaN(amount) || amount < 0) {
      toast.error("Valor inválido.");
      return;
    }

    const { data: existing } = await supabase
      .from("spending_limits")
      .select("id")
      .eq("month_year", monthYear)
      .maybeSingle();

    if (existing) {
      await supabase.from("spending_limits").update({ amount }).eq("id", existing.id);
    } else {
      await supabase.from("spending_limits").insert({ month_year: monthYear, amount });
    }

    setLimit(amount);
    setEditing(false);
    toast.success("Limite atualizado!");
  };

  if (!loaded) return null;

  const percentage = limit > 0 ? (gastosMes / limit) * 100 : 0;
  const isWarning = percentage >= 80 && percentage < 100;
  const isDanger = percentage >= 100;

  const barColor = isDanger
    ? "bg-destructive"
    : isWarning
    ? "bg-amber-500"
    : "bg-secondary";

  const statusIcon = isDanger ? (
    <AlertTriangle className="h-5 w-5 text-destructive" />
  ) : isWarning ? (
    <AlertTriangle className="h-5 w-5 text-amber-500" />
  ) : (
    <CheckCircle className="h-5 w-5 text-secondary" />
  );

  const statusText = isDanger
    ? "⚠️ Limite estourado!"
    : isWarning
    ? "⚡ Atenção: próximo do limite"
    : limit > 0
    ? "✅ Dentro do limite"
    : "Defina seu limite mensal";

  return (
    <div
      className={`rounded-xl border p-5 shadow-sm transition-all duration-300 animate-fade-in ${
        isDanger
          ? "border-destructive/30 bg-destructive/5"
          : isWarning
          ? "border-amber-500/30 bg-amber-500/5"
          : "border-border bg-card"
      }`}
      style={{ animationDelay: "500ms" }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs font-semibold text-muted-foreground">Limite Mensal</span>
        </div>
        {statusIcon}
      </div>

      {limit > 0 && !editing ? (
        <>
          <div className="flex items-baseline justify-between mb-2">
            <p className="text-2xl font-bold">{formatCurrency(gastosMes)}</p>
            <p className="text-sm text-muted-foreground">de {formatCurrency(limit)}</p>
          </div>

          {/* Progress bar */}
          <div className="w-full h-3 rounded-full bg-muted overflow-hidden mb-2">
            <div
              className={`h-full rounded-full transition-all duration-500 ${barColor}`}
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </div>

          <div className="flex items-center justify-between">
            <p className={`text-xs font-medium ${isDanger ? "text-destructive" : isWarning ? "text-amber-600" : "text-muted-foreground"}`}>
              {statusText} — {percentage.toFixed(0)}% usado
            </p>
            <button
              onClick={() => { setEditing(true); setInputValue(String(limit)); }}
              className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted transition-colors"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Remaining */}
          {limit > gastosMes && (
            <p className="text-xs text-secondary mt-2">
              Ainda pode gastar: {formatCurrency(limit - gastosMes)}
            </p>
          )}
          {isDanger && (
            <p className="text-xs text-destructive mt-2">
              Excedido em: {formatCurrency(gastosMes - limit)}
            </p>
          )}
        </>
      ) : (
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <label className="block text-xs text-muted-foreground mb-1">Valor do limite (R$)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ex: 3000"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
              autoFocus
            />
          </div>
          <button
            onClick={saveLimit}
            className="mt-5 flex items-center gap-1 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-colors"
          >
            <Save className="h-4 w-4" /> Salvar
          </button>
          {limit > 0 && (
            <button
              onClick={() => setEditing(false)}
              className="mt-5 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground hover:bg-muted transition-colors"
            >
              Cancelar
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default SpendingLimit;
