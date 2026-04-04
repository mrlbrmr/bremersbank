import { useMemo } from "react";
import { PieChart, Pie, Cell, BarChart, Bar, AreaChart, Area, ResponsiveContainer } from "recharts";

interface Transaction {
  amount: number;
  type: string;
  category?: string;
  date: string;
}

interface ReportsPreviewProps {
  transactions: Transaction[];
  onNavigate: () => void;
}

const COLORS = ["#6C63FF", "#00C896", "#FF6B6B", "#FFD93D", "#845EC2"];

const ReportsPreview = ({ transactions, onNavigate }: ReportsPreviewProps) => {
  const categoryData = useMemo(() => {
    const grouped: Record<string, number> = {};
    transactions.filter(t => t.type === "expense").forEach(t => {
      grouped[t.category || "Outros"] = (grouped[t.category || "Outros"] || 0) + Number(t.amount);
    });
    return Object.entries(grouped).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 5);
  }, [transactions]);

  const incomeVsExpense = useMemo(() => {
    const income = transactions.filter(t => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
    const expense = transactions.filter(t => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);
    return [{ name: "R", income, expense }];
  }, [transactions]);

  const balanceTrend = useMemo(() => {
    const sorted = [...transactions].sort((a, b) => a.date.localeCompare(b.date));
    let balance = 0;
    const map = new Map<string, number>();
    sorted.forEach(t => {
      balance += t.type === "income" ? Number(t.amount) : -Number(t.amount);
      map.set(t.date, balance);
    });
    return Array.from(map.entries()).map(([, value]) => ({ value }));
  }, [transactions]);

  const cards = [
    {
      title: "Por Categoria",
      chart: categoryData.length > 0 ? (
        <ResponsiveContainer width="100%" height={60}>
          <PieChart>
            <Pie data={categoryData} cx="50%" cy="50%" innerRadius={16} outerRadius={28} dataKey="value" strokeWidth={0}>
              {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      ) : null,
    },
    {
      title: "Receita vs Despesa",
      chart: (
        <ResponsiveContainer width="100%" height={60}>
          <BarChart data={incomeVsExpense}>
            <Bar dataKey="income" fill="#00C896" radius={[4, 4, 0, 0]} />
            <Bar dataKey="expense" fill="#FF6B6B" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      ),
    },
    {
      title: "Evolução",
      chart: balanceTrend.length > 1 ? (
        <ResponsiveContainer width="100%" height={60}>
          <AreaChart data={balanceTrend}>
            <Area type="monotone" dataKey="value" stroke="#6C63FF" fill="#6C63FF" fillOpacity={0.1} strokeWidth={2} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      ) : null,
    },
  ];

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <p className="text-xs font-semibold text-muted-foreground mb-3">Relatórios</p>
      <div className="grid grid-cols-3 gap-2">
        {cards.map((c) => (
          <button
            key={c.title}
            onClick={onNavigate}
            className="rounded-lg border border-border bg-background p-2 hover:shadow-sm hover:-translate-y-0.5 transition-all text-center"
          >
            {c.chart || <div className="h-[60px] flex items-center justify-center text-xs text-muted-foreground">—</div>}
            <p className="text-[9px] text-muted-foreground mt-1">{c.title}</p>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ReportsPreview;
