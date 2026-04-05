import { ArrowDownLeft, ArrowUpRight, TrendingUp, TrendingDown } from "lucide-react";
import { useFilters } from "@/contexts/FilterContext";

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
    <span className={`inline-flex items-center gap-0.5 rounded-full px-1.5 sm:px-2 py-0.5 text-[9px] sm:text-[10px] font-semibold ${color} ${bg}`}>
      {value > 0 ? <TrendingUp className="h-2.5 w-2.5 sm:h-3 sm:w-3" /> : value < 0 ? <TrendingDown className="h-2.5 w-2.5 sm:h-3 sm:w-3" /> : null}
      {value > 0 ? "+" : ""}{value.toFixed(0)}%
    </span>
  );
};

const SummaryCards = ({ entradas, saidas, entradasAnterior, saidasAnterior }: SummaryCardsProps) => {
  const { navigateToReport } = useFilters();
  const incomeVar = variation(entradas, entradasAnterior);
  const expenseVar = variation(saidas, saidasAnterior);

  return (
    <div className="grid grid-cols-2 gap-2 sm:gap-3">
      <div
        onClick={() => navigateToReport("income-vs-expense", { type: "income" })}
        className="rounded-xl border border-secondary/20 bg-card p-3 sm:p-4 shadow-sm transition-all hover:shadow-md cursor-pointer"
      >
        <div className="flex items-center justify-between mb-1.5 sm:mb-2">
          <div className="flex h-7 w-7 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-secondary/15">
            <ArrowDownLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-secondary" />
          </div>
          <VariationBadge value={incomeVar} />
        </div>
        <p className="text-base sm:text-2xl font-bold tracking-tight text-secondary truncate">{formatCurrency(entradas)}</p>
        <p className="text-[10px] text-muted-foreground mt-0.5">Entradas</p>
      </div>

      <div
        onClick={() => navigateToReport("categories", { type: "expense" })}
        className="rounded-xl border border-destructive/20 bg-card p-3 sm:p-4 shadow-sm transition-all hover:shadow-md cursor-pointer"
      >
        <div className="flex items-center justify-between mb-1.5 sm:mb-2">
          <div className="flex h-7 w-7 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-destructive/15">
            <ArrowUpRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-destructive" />
          </div>
          <VariationBadge value={expenseVar} inverted />
        </div>
        <p className="text-base sm:text-2xl font-bold tracking-tight text-destructive truncate">{formatCurrency(saidas)}</p>
        <p className="text-[10px] text-muted-foreground mt-0.5">Saídas</p>
      </div>
    </div>
  );
};

export default SummaryCards;
