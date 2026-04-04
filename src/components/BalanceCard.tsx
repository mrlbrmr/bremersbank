import { useState } from "react";
import { Wallet, Eye, EyeOff, TrendingUp, TrendingDown, CalendarClock } from "lucide-react";

interface BalanceCardProps {
  saldoAtual: number;
  saldoPrevisto: number;
}

const formatCurrency = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const BalanceCard = ({ saldoAtual, saldoPrevisto }: BalanceCardProps) => {
  const [hidden, setHidden] = useState(false);
  const isNegative = saldoAtual < 0;

  return (
    <div
      className={`relative overflow-hidden rounded-2xl p-6 text-primary-foreground shadow-lg ${
        isNegative ? "bg-destructive" : "bg-primary"
      }`}
    >
      {/* Decorative circles */}
      <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10" />
      <div className="absolute -right-4 bottom-0 h-20 w-20 rounded-full bg-white/5" />
      <div className="absolute left-1/2 -bottom-6 h-24 w-24 rounded-full bg-white/5" />

      <div className="relative">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4 opacity-80" />
            <span className="text-xs font-medium opacity-80">Saldo Atual</span>
          </div>
          <button
            onClick={() => setHidden(!hidden)}
            className="p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            {hidden ? <EyeOff className="h-4 w-4 opacity-70" /> : <Eye className="h-4 w-4 opacity-70" />}
          </button>
        </div>

        <p className="text-4xl font-bold tracking-tight">
          {hidden ? "R$ •••••" : formatCurrency(saldoAtual)}
        </p>

        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs opacity-80">
            {saldoAtual >= 0 ? (
              <TrendingUp className="h-3.5 w-3.5" />
            ) : (
              <TrendingDown className="h-3.5 w-3.5" />
            )}
            <span>Baseado em transações realizadas</span>
          </div>

          <div className="flex items-center gap-1.5 rounded-lg bg-white/10 px-2.5 py-1 text-xs">
            <CalendarClock className="h-3 w-3" />
            <span>Previsto: {hidden ? "•••••" : formatCurrency(saldoPrevisto)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BalanceCard;
