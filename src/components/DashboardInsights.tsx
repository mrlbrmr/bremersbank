import { useMemo } from "react";
import { Lightbulb, TrendingUp, TrendingDown, PiggyBank, AlertTriangle, ShieldAlert, Target } from "lucide-react";
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
  limiteGastos?: number;
  saldoPrevisto?: number;
  previousCategoryData?: Record<string, number>;
}

const formatCurrency = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

type InsightType = "positive" | "negative" | "warning" | "critical" | "neutral";

interface Insight {
  icon: React.ReactNode;
  text: string;
  type: InsightType;
  section: ReportSection;
  overrides?: Record<string, string>;
  priority: number;
}

const DashboardInsights = ({
  transactions,
  entradas,
  saidas,
  entradasAnterior,
  saidasAnterior,
  limiteGastos,
  saldoPrevisto,
  previousCategoryData,
}: DashboardInsightsProps) => {
  const { navigateToReport } = useFilters();

  const insights = useMemo(() => {
    const msgs: Insight[] = [];

    // Category grouping (current month)
    const grouped: Record<string, number> = {};
    transactions.filter(t => t.type === "expense").forEach(t => {
      const cat = t.category || "Outros";
      grouped[cat] = (grouped[cat] || 0) + Number(t.amount);
    });
    const sorted = Object.entries(grouped).sort((a, b) => b[1] - a[1]);

    // 🔴 Saldo negativo previsto
    const previstoVal = saldoPrevisto ?? (entradas - saidas);
    if (previstoVal < 0) {
      msgs.push({
        icon: <ShieldAlert className="h-4 w-4" />,
        text: `Saldo previsto ficará negativo: ${formatCurrency(previstoVal)}`,
        type: "critical",
        section: "balance",
        priority: 0,
      });
    }

    // 📈 Aumento por categoria (vs mês anterior)
    if (previousCategoryData) {
      for (const [cat, valor] of Object.entries(grouped)) {
        const anterior = previousCategoryData[cat];
        if (anterior && anterior > 0 && valor > anterior) {
          const aumento = ((valor - anterior) / anterior) * 100;
          if (aumento > 15) {
            msgs.push({
              icon: <TrendingUp className="h-4 w-4" />,
              text: `${cat}: +${aumento.toFixed(0)}% vs mês anterior (${formatCurrency(valor)})`,
              type: "warning",
              section: "categories",
              overrides: { category: cat },
              priority: 2,
            });
          }
        }
      }
    }

    // 🏆 Maior gasto
    if (sorted.length > 0) {
      msgs.push({
        icon: <AlertTriangle className="h-4 w-4" />,
        text: `Maior gasto: ${sorted[0][0]} com ${formatCurrency(sorted[0][1])}`,
        type: "negative",
        section: "categories",
        overrides: { category: sorted[0][0] },
        priority: 3,
      });
    }

    // 🚨 Limite de gastos
    if (limiteGastos && limiteGastos > 0) {
      const uso = (saidas / limiteGastos) * 100;
      if (uso > 100) {
        msgs.push({
          icon: <ShieldAlert className="h-4 w-4" />,
          text: `Limite estourado! Você usou ${uso.toFixed(0)}% (${formatCurrency(saidas)} de ${formatCurrency(limiteGastos)})`,
          type: "critical",
          section: "overview",
          priority: 0,
        });
      } else if (uso > 90) {
        msgs.push({
          icon: <ShieldAlert className="h-4 w-4" />,
          text: `Atenção crítica: ${uso.toFixed(0)}% do limite usado`,
          type: "critical",
          section: "overview",
          priority: 1,
        });
      } else if (uso > 70) {
        msgs.push({
          icon: <Target className="h-4 w-4" />,
          text: `Você já usou ${uso.toFixed(0)}% do seu limite de gastos`,
          type: "warning",
          section: "overview",
          priority: 2,
        });
      }
    }

    // 📊 Variação geral de gastos
    if (saidasAnterior > 0) {
      const var_ = ((saidas - saidasAnterior) / saidasAnterior) * 100;
      if (var_ > 10) {
        msgs.push({
          icon: <TrendingUp className="h-4 w-4" />,
          text: `Gastos aumentaram ${var_.toFixed(0)}% vs período anterior`,
          type: "negative",
          section: "comparison",
          priority: 3,
        });
      } else if (var_ < -5) {
        msgs.push({
          icon: <TrendingDown className="h-4 w-4" />,
          text: `Gastos reduziram ${Math.abs(var_).toFixed(0)}% — ótimo!`,
          type: "positive",
          section: "comparison",
          priority: 4,
        });
      }
    }

    // 💰 Economia
    const savings = entradas > 0 ? ((entradas - saidas) / entradas) * 100 : 0;
    if (savings > 20) {
      msgs.push({
        icon: <PiggyBank className="h-4 w-4" />,
        text: `Economia de ${savings.toFixed(0)}% da receita — excelente!`,
        type: "positive",
        section: "income-vs-expense",
        priority: 5,
      });
    } else if (savings >= 0 && savings <= 5 && entradas > 0) {
      msgs.push({
        icon: <AlertTriangle className="h-4 w-4" />,
        text: `Economia apertada: apenas ${savings.toFixed(0)}% da receita`,
        type: "warning",
        section: "income-vs-expense",
        priority: 2,
      });
    } else if (savings < 0) {
      msgs.push({
        icon: <AlertTriangle className="h-4 w-4" />,
        text: `Gastos superaram receita em ${formatCurrency(saidas - entradas)}`,
        type: "critical",
        section: "balance",
        priority: 0,
      });
    }

    if (msgs.length === 0) {
      msgs.push({
        icon: <Lightbulb className="h-4 w-4" />,
        text: "Adicione mais transações para insights personalizados.",
        type: "neutral",
        section: "overview",
        priority: 10,
      });
    }

    return msgs.sort((a, b) => a.priority - b.priority);
  }, [transactions, entradas, saidas, entradasAnterior, saidasAnterior, limiteGastos, saldoPrevisto, previousCategoryData]);

  const typeStyles: Record<InsightType, string> = {
    critical: "bg-destructive/10 border-destructive/20 text-destructive hover:bg-destructive/15",
    negative: "bg-destructive/8 border-destructive/15 text-destructive hover:bg-destructive/12",
    warning: "bg-[hsl(38,92%,50%)]/10 border-[hsl(38,92%,50%)]/20 text-[hsl(38,92%,50%)] hover:bg-[hsl(38,92%,50%)]/15",
    positive: "bg-secondary/10 border-secondary/20 text-secondary hover:bg-secondary/15",
    neutral: "bg-muted border-border text-muted-foreground hover:bg-muted/80",
  };

  const typeLabels: Record<InsightType, string> = {
    critical: "Crítico",
    negative: "Alerta",
    warning: "Atenção",
    positive: "Positivo",
    neutral: "Info",
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/15">
          <Lightbulb className="h-3.5 w-3.5 text-primary" />
        </div>
        <span className="text-xs font-semibold">Insights Inteligentes</span>
        <span className="ml-auto text-[10px] text-muted-foreground">{insights.length} insight{insights.length !== 1 ? "s" : ""}</span>
      </div>
      <div className="space-y-2">
        {insights.map((ins, i) => (
          <div
            key={i}
            onClick={() => navigateToReport(ins.section, ins.overrides as any)}
            className={`flex items-start gap-2.5 rounded-lg p-2.5 text-xs cursor-pointer border transition-all duration-200 hover:translate-y-[-2px] hover:shadow-sm ${typeStyles[ins.type]}`}
          >
            <span className="mt-0.5 shrink-0">{ins.icon}</span>
            <span className="leading-relaxed flex-1">{ins.text}</span>
            <div className="flex flex-col items-end gap-1 shrink-0">
              <span className="text-[9px] font-medium opacity-70">{typeLabels[ins.type]}</span>
              <span className="text-[9px] opacity-50">Ver →</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DashboardInsights;
