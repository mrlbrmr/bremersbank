import { useState, useEffect } from "react";
import { Wallet, Eye, EyeOff, TrendingUp, TrendingDown, CalendarClock } from "lucide-react";
import { useFilters } from "@/contexts/FilterContext";

interface BalanceCardProps {
  saldoAtual: number;
  saldoPrevisto: number;
  adjustment: number;
  onAdjustmentChange: (value: number) => void;
}

const formatCurrency = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const BalanceCard = ({ saldoAtual, saldoPrevisto, adjustment, onAdjustmentChange }: BalanceCardProps) => {
  const [hidden, setHidden] = useState(false);
  const [editingAdjustment, setEditingAdjustment] = useState(false);
  const [draftAdjustment, setDraftAdjustment] = useState(String(adjustment));
  const { navigateToReport } = useFilters();
  const isNegative = saldoAtual < 0;

  useEffect(() => {
    setDraftAdjustment(String(adjustment));
  }, [adjustment]);

  const saveAdjustment = () => {
    const parsed = Number(draftAdjustment.replace(/[^0-9.-]/g, ""));
    if (Number.isNaN(parsed)) return;
    onAdjustmentChange(parsed);
    setEditingAdjustment(false);
  };

  const resetAdjustment = () => {
    onAdjustmentChange(0);
    setDraftAdjustment("0");
    setEditingAdjustment(false);
  };

  const formattedAdjustment = adjustment === 0 ? "Nenhum ajuste" : `${adjustment >= 0 ? "+" : ""}${formatCurrency(adjustment)}`;

  return (
    <div className="space-y-2">
      {/* Saldo Real */}
      <div
        className={`relative overflow-hidden rounded-2xl p-4 sm:p-6 text-primary-foreground shadow-lg cursor-pointer transition-all hover:shadow-xl ${
          isNegative ? "bg-destructive" : "bg-primary"
        }`}
        onClick={() => navigateToReport("balance")}
      >
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10" />
        <div className="absolute -right-4 bottom-0 h-20 w-20 rounded-full bg-white/5" />

        <div className="relative">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <Wallet className="h-4 w-4 opacity-80" />
              <span className="text-xs font-medium opacity-80">Saldo Real</span>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); setHidden(!hidden); }}
              className="p-1 rounded-lg hover:bg-white/10 transition-colors"
            >
              {hidden ? <EyeOff className="h-4 w-4 opacity-70" /> : <Eye className="h-4 w-4 opacity-70" />}
            </button>
          </div>

          <p className="text-2xl sm:text-4xl font-bold tracking-tight">
            {hidden ? "R$ •••••" : formatCurrency(saldoAtual)}
          </p>

          <div className="mt-2 flex items-center gap-1.5 text-[10px] sm:text-xs opacity-80">
            {saldoAtual >= 0 ? <TrendingUp className="h-3.5 w-3.5 shrink-0" /> : <TrendingDown className="h-3.5 w-3.5 shrink-0" />}
            <span className="truncate">Baseado em transações realizadas</span>
          </div>
          <div className="mt-3 rounded-lg bg-white/10 p-3 text-[11px] text-primary-foreground/90">
            <div className="flex items-center justify-between gap-2">
              <span>{formattedAdjustment}</span>
              <div className="flex items-center gap-2">
                {editingAdjustment ? (
                  <>
                    <input
                      type="number"
                      step="0.01"
                      value={draftAdjustment}
                      onChange={(e) => setDraftAdjustment(e.target.value)}
                      className="w-24 rounded-lg border border-white/20 bg-white/10 px-2 py-1 text-xs text-white focus:outline-none focus:ring-2 focus:ring-white/40"
                    />
                    <button
                      onClick={(e) => { e.stopPropagation(); saveAdjustment(); }}
                      className="rounded-lg bg-white/10 px-2 py-1 text-[10px] font-semibold hover:bg-white/20"
                    >Salvar</button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setEditingAdjustment(false); setDraftAdjustment(String(adjustment)); }}
                      className="rounded-lg border border-white/20 px-2 py-1 text-[10px] hover:bg-white/10"
                    >Cancelar</button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={(e) => { e.stopPropagation(); setEditingAdjustment(true); }}
                      className="rounded-lg border border-white/20 px-2 py-1 text-[10px] hover:bg-white/10"
                    >Ajustar saldo</button>
                    {adjustment !== 0 && (
                      <button
                        onClick={(e) => { e.stopPropagation(); resetAdjustment(); }}
                        className="rounded-lg border border-white/20 px-2 py-1 text-[10px] hover:bg-white/10"
                      >Limpar</button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Saldo Previsto */}
      <div
        className="relative overflow-hidden rounded-2xl p-4 sm:p-5 shadow-sm cursor-pointer transition-all hover:shadow-md border-2 border-amber-400/30"
        style={{ background: "linear-gradient(135deg, hsl(45, 93%, 47%, 0.1), hsl(45, 93%, 47%, 0.05))" }}
        onClick={() => navigateToReport("balance")}
      >
        <div className="relative flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <CalendarClock className="h-4 w-4 text-amber-500" />
              <span className="text-xs font-medium text-amber-600 dark:text-amber-400">Saldo Previsto</span>
            </div>
            <p className="text-xl sm:text-2xl font-bold tracking-tight text-amber-600 dark:text-amber-400">
              {hidden ? "R$ •••••" : formatCurrency(saldoPrevisto)}
            </p>
          </div>
          <span className="text-[10px] text-amber-500/70 max-w-[120px] text-right">Inclui pendentes e fixos</span>
        </div>
      </div>
    </div>
  );
};

export default BalanceCard;
