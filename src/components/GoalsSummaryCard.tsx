import { useEffect, useState } from "react";
import { Target } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface Goal {
  id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  icon: string;
}

const formatCurrency = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

interface GoalsSummaryCardProps {
  onNavigate: () => void;
}

const GoalsSummaryCard = ({ onNavigate }: GoalsSummaryCardProps) => {
  const [goals, setGoals] = useState<Goal[]>([]);

  useEffect(() => {
    supabase.from("financial_goals").select("*").order("created_at", { ascending: false })
      .then(({ data }) => setGoals(data || []));
  }, []);

  if (goals.length === 0) return null;

  const topGoals = goals.slice(0, 3);

  return (
    <div
      onClick={onNavigate}
      className="rounded-xl border border-border bg-card p-4 shadow-sm cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5"
    >
      <div className="flex items-center gap-2 mb-3">
        <Target className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold text-muted-foreground">Metas Financeiras</h3>
      </div>
      <div className="space-y-3">
        {topGoals.map((goal) => {
          const pct = goal.target_amount > 0 ? (goal.current_amount / goal.target_amount) * 100 : 0;
          const completed = pct >= 100;
          return (
            <div key={goal.id}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm">{goal.icon}</span>
                  <span className="text-xs font-medium truncate">{goal.name}</span>
                </div>
                <span className={`text-[10px] font-semibold ${completed ? "text-secondary" : "text-muted-foreground"}`}>
                  {completed ? "🎉 100%" : `${pct.toFixed(0)}%`}
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${completed ? "bg-secondary" : "bg-primary"}`}
                  style={{ width: `${Math.min(pct, 100)}%` }}
                />
              </div>
              <div className="flex justify-between mt-0.5">
                <span className="text-[10px] text-muted-foreground">{formatCurrency(goal.current_amount)}</span>
                <span className="text-[10px] text-muted-foreground">{formatCurrency(goal.target_amount)}</span>
              </div>
            </div>
          );
        })}
      </div>
      {goals.length > 3 && (
        <p className="text-[10px] text-muted-foreground text-center mt-2">+{goals.length - 3} meta(s)</p>
      )}
    </div>
  );
};

export default GoalsSummaryCard;
