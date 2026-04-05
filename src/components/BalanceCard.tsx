import { useState } from "react";
import { Wallet, Eye, EyeOff, TrendingUp, TrendingDown, CalendarClock } from "lucide-react";
import { useFilters } from "@/contexts/FilterContext";

interface BalanceCardProps {
  saldoAtual: number;
  saldoPrevisto: number;
}

const formatCurrency = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const BalanceCard = ({ saldoAtual, saldoPrevisto }: BalanceCardProps) => {
  const [hidden, setHidden] = useState(false);
  const { navigateToReport } = useFilters();
  const isNegative = saldoAtual < 0;

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
