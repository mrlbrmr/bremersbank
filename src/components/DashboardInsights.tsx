import { useMemo } from "react";
import { Lightbulb, TrendingUp, TrendingDown, PiggyBank, AlertTriangle } from "lucide-react";
import { useFilters, type ReportSection } from "@/contexts/FilterContext";

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
  const { navigateToReport } = useFilters();

  const insights = useMemo(() => {
    const msgs: { icon: React.ReactNode; text: string; type: "positive" | "negative" | "neutral"; section: ReportSection; overrides?: Record<string, string> }[] = [];

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
        section: "categories",
        overrides: { category: sorted[0][0] },
      });
    }

    if (saidasAnterior > 0) {
      const var_ = ((saidas - saidasAnterior) / saidasAnterior) * 100;
      if (var_ > 10) {
        msgs.push({
          icon: <TrendingUp className="h-4 w-4" />,
          text: `Gastos aumentaram ${var_.toFixed(0)}% vs período anterior`,
          type: "negative",
          section: "comparison",
        });
      } else if (var_ < -5) {
        msgs.push({
          icon: <TrendingDown className="h-4 w-4" />,
          text: `Gastos reduziram ${Math.abs(var_).toFixed(0)}% — ótimo!`,
          type: "positive",
          section: "comparison",
        });
      }
    }

    const savings = entradas > 0 ? ((entradas - saidas) / entradas) * 100 : 0;
    if (savings > 20) {
      msgs.push({
        icon: <PiggyBank className="h-4 w-4" />,
        text: `Economia de ${savings.toFixed(0)}% da receita — excelente!`,
        type: "positive",
        section: "income-vs-expense",
      });
    } else if (savings < 0) {
      msgs.push({
        icon: <AlertTriangle className="h-4 w-4" />,
        text: `Gastos superaram receita em ${formatCurrency(saidas - entradas)}`,
        type: "negative",
        section: "balance",
      });
    }

    if (msgs.length === 0) {
      msgs.push({ icon: <Lightbulb className="h-4 w-4" />, text: "Adicione mais transações para insights.", type: "neutral", section: "overview" });
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
            onClick={() => navigateToReport(ins.section, ins.overrides as any)}
            className={`flex items-start gap-2.5 rounded-lg p-2.5 text-xs cursor-pointer transition-all hover:scale-[1.01] ${
              ins.type === "positive"
                ? "bg-secondary/8 border border-secondary/15 text-secondary hover:bg-secondary/15"
                : ins.type === "negative"
                ? "bg-destructive/8 border border-destructive/15 text-destructive hover:bg-destructive/15"
                : "bg-muted border border-border text-muted-foreground hover:bg-muted/80"
            }`}
          >
            <span className="mt-0.5 shrink-0">{ins.icon}</span>
            <span className="leading-relaxed flex-1">{ins.text}</span>
            <span className="text-[9px] opacity-60 shrink-0 mt-0.5">Ver →</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DashboardInsights;
