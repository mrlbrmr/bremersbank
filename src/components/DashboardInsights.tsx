import { useMemo } from "react";
import { Lightbulb, TrendingUp, TrendingDown, PiggyBank, AlertTriangle } from "lucide-react";

interface Transaction {
  amount: number;
  type: string;
  category?: string;
  date: string;
}

interface DashboardInsightsProps {
  transactions: Transaction[];
  entradas: number;
  saidas: number;
  entradasAnterior: number;
  saidasAnterior: number;
}

const formatCurrency = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const DashboardInsights = ({ transactions, entradas, saidas, entradasAnterior, saidasAnterior }: DashboardInsightsProps) => {
  const insights = useMemo(() => {
    const msgs: { icon: React.ReactNode; text: string; type: "positive" | "negative" | "neutral" }[] = [];

    // Top category
    const grouped: Record<string, number> = {};
    transactions.filter(t => t.type === "expense").forEach(t => {
      const cat = t.category || "Outros";
      grouped[cat] = (grouped[cat] || 0) + Number(t.amount);
    });
    const sorted = Object.entries(grouped).sort((a, b) => b[1] - a[1]);
    if (sorted.length > 0) {
      msgs.push({
        icon: <AlertTriangle className="h-4 w-4" />,
        text: `Maior gasto: ${sorted[0][0]} com ${formatCurrency(sorted[0][1])}`,
        type: "negative",
      });
    }

    // Expense variation
    if (saidasAnterior > 0) {
      const var_ = ((saidas - saidasAnterior) / saidasAnterior) * 100;
      if (var_ > 10) {
        msgs.push({
          icon: <TrendingUp className="h-4 w-4" />,
          text: `Gastos aumentaram ${var_.toFixed(0)}% vs período anterior`,
          type: "negative",
        });
      } else if (var_ < -5) {
        msgs.push({
          icon: <TrendingDown className="h-4 w-4" />,
          text: `Gastos reduziram ${Math.abs(var_).toFixed(0)}% — ótimo!`,
          type: "positive",
        });
      }
    }

    // Savings rate
    const savings = entradas > 0 ? ((entradas - saidas) / entradas) * 100 : 0;
    if (savings > 20) {
      msgs.push({
        icon: <PiggyBank className="h-4 w-4" />,
        text: `Economia de ${savings.toFixed(0)}% da receita — excelente!`,
        type: "positive",
      });
    } else if (savings < 0) {
      msgs.push({
        icon: <AlertTriangle className="h-4 w-4" />,
        text: `Gastos superaram receita em ${formatCurrency(saidas - entradas)}`,
        type: "negative",
      });
    }

    if (msgs.length === 0) {
      msgs.push({ icon: <Lightbulb className="h-4 w-4" />, text: "Adicione mais transações para insights.", type: "neutral" });
    }

    return msgs;
  }, [transactions, entradas, saidas, entradasAnterior, saidasAnterior]);

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/15">
          <Lightbulb className="h-3.5 w-3.5 text-primary" />
        </div>
        <span className="text-xs font-semibold">Insights</span>
      </div>
      <div className="space-y-2">
        {insights.map((ins, i) => (
          <div
            key={i}
            className={`flex items-start gap-2.5 rounded-lg p-2.5 text-xs ${
              ins.type === "positive"
                ? "bg-secondary/8 border border-secondary/15 text-secondary"
                : ins.type === "negative"
                ? "bg-destructive/8 border border-destructive/15 text-destructive"
                : "bg-muted border border-border text-muted-foreground"
            }`}
          >
            <span className="mt-0.5 shrink-0">{ins.icon}</span>
            <span className="leading-relaxed">{ins.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DashboardInsights;
