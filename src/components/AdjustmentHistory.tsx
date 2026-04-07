import { useState } from "react";
import { useBalanceAdjustments } from "@/hooks/useBalanceAdjustments";
import { Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";

interface AdjustmentHistoryProps {
  selectedMonth: Date;
}

const formatCurrency = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const AdjustmentHistory: React.FC<AdjustmentHistoryProps> = ({ selectedMonth }) => {
  const { adjustments, loading, deleteAdjustment } = useBalanceAdjustments(selectedMonth);
  const [expanded, setExpanded] = useState(false);

  const handleDelete = async (id: string | undefined) => {
    if (!id) return;
    
    try {
      await deleteAdjustment(id);
      toast.success("Ajuste removido com sucesso!");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao remover ajuste";
      toast.error(message);
    }
  };

  if (loading) {
    return (
      <div className="rounded-lg border border-border bg-card p-4">
        <p className="text-xs text-muted-foreground animate-pulse">Carregando ajustes...</p>
      </div>
    );
  }

  if (adjustments.length === 0) {
    return null;
  }

  return (
    <div className="rounded-lg border border-amber-200/30 bg-amber-50/30 dark:bg-amber-950/20 p-4 space-y-2">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between gap-2 text-sm font-medium text-amber-900 dark:text-amber-100 hover:opacity-80 transition-opacity"
      >
        <span>Histórico de Ajustes ({adjustments.length})</span>
        {expanded ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </button>

      {expanded && (
        <div className="space-y-2 pt-2 border-t border-amber-200/30">
          {adjustments.map((adjustment) => (
            <div
              key={adjustment.id}
              className="flex items-center justify-between gap-2 p-2 rounded-lg bg-white/50 dark:bg-black/20"
            >
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground truncate">
                  {adjustment.description}
                </p>
                {adjustment.reason && (
                  <p className="text-xs text-muted-foreground truncate">
                    {adjustment.reason}
                  </p>
                )}
                <p className="text-xs text-muted-foreground/70">
                  {new Date(adjustment.adjustment_date).toLocaleDateString("pt-BR")}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`text-xs font-semibold ${
                  Number(adjustment.amount) >= 0
                    ? "text-green-600 dark:text-green-400"
                    : "text-red-600 dark:text-red-400"
                }`}>
                  {Number(adjustment.amount) >= 0 ? "+" : ""}
                  {formatCurrency(Number(adjustment.amount))}
                </span>
                <button
                  onClick={() => handleDelete(adjustment.id)}
                  className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 transition-colors"
                  title="Remover ajuste"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdjustmentHistory;
