import { TrendingUp, TrendingDown } from "lucide-react";

interface SavingsCardProps {
  value: number;
}

const formatCurrency = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const SavingsCard = ({ value }: SavingsCardProps) => {
  const positive = value >= 0;
  return (
    <div className="rounded-xl border border-secondary/20 bg-secondary/10 p-6 shadow-sm animate-fade-in transition-all duration-300 hover:shadow-lg hover:-translate-y-1" style={{ animationDelay: "400ms" }}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-muted-foreground">Economia do Mês</span>
        {positive ? <TrendingUp className="h-5 w-5 text-secondary" /> : <TrendingDown className="h-5 w-5 text-destructive" />}
      </div>
      <p className="text-3xl font-bold tracking-tight">{formatCurrency(value)}</p>
    </div>
  );
};

export default SavingsCard;
