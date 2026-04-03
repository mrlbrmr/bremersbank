import { TrendingUp } from "lucide-react";

const SavingsCard = () => {
  return (
    <div className="rounded-xl border border-secondary/20 bg-secondary/10 p-6 shadow-sm animate-fade-in transition-all duration-300 hover:shadow-lg hover:-translate-y-1" style={{ animationDelay: "400ms" }}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-muted-foreground">Economia do Mês</span>
        <TrendingUp className="h-5 w-5 text-secondary" />
      </div>
      <p className="text-3xl font-bold tracking-tight">R$ 1.250,00</p>
      <p className="text-xs text-secondary mt-2 font-medium">+12% em relação ao mês anterior</p>
    </div>
  );
};

export default SavingsCard;
