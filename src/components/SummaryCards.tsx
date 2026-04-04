import { ArrowDownLeft, ArrowUpRight, TrendingUp, TrendingDown } from "lucide-react";

interface SummaryCardsProps {
  entradas: number;
  saidas: number;
  entradasAnterior: number;
  saidasAnterior: number;
}

const formatCurrency = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const variation = (cur: number, pre: number) => {
  if (pre === 0) return cur > 0 ? 100 : 0;
  return ((cur - pre) / pre) * 100;
};

const VariationBadge = ({ value, inverted = false }: { value: number; inverted?: boolean }) => {
  const positive = inverted ? value < 0 : value > 0;
  const color = value === 0 ? "text-muted-foreground" : positive ? "text-secondary" : "text-destructive";
  const bg = value === 0 ? "bg-muted" : positive ? "bg-secondary/10" : "bg-destructive/10";
  return (
    <span className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-semibold ${color} ${bg}`}>
      {value > 0 ? <TrendingUp className="h-3 w-3" /> : value < 0 ? <TrendingDown className="h-3 w-3" /> : null}
      {value > 0 ? "+" : ""}{value.toFixed(1)}%
    </span>
  );
};

const SummaryCards = ({ entradas, saidas, entradasAnterior, saidasAnterior }: SummaryCardsProps) => {
  const incomeVar = variation(entradas, entradasAnterior);
  const expenseVar = variation(saidas, saidasAnterior);

  return (
    <div className="grid grid-cols-2 gap-3">
      {/* Entradas */}
      <div className="rounded-xl border border-secondary/20 bg-card p-4 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5">
        <div className="flex items-center justify-between mb-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary/15">
            <ArrowDownLeft className="h-4 w-4 text-secondary" />
          </div>
          <VariationBadge value={incomeVar} />
        </div>
        <p className="text-2xl font-bold tracking-tight text-secondary">{formatCurrency(entradas)}</p>
        <p className="text-[10px] text-muted-foreground mt-0.5">Entradas</p>
      </div>

      {/* Saídas */}
      <div className="rounded-xl border border-destructive/20 bg-card p-4 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5">
        <div className="flex items-center justify-between mb-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-destructive/15">
            <ArrowUpRight className="h-4 w-4 text-destructive" />
          </div>
          <VariationBadge value={expenseVar} inverted />
        </div>
        <p className="text-2xl font-bold tracking-tight text-destructive">{formatCurrency(saidas)}</p>
        <p className="text-[10px] text-muted-foreground mt-0.5">Saídas</p>
      </div>
    </div>
  );
};

export default SummaryCards;
