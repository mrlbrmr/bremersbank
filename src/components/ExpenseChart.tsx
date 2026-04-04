import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: string;
  category?: string;
  date: string;
}

interface ExpenseChartProps {
  theme: "light" | "dark";
  transactions: Transaction[];
}

const COLORS = ["#6C63FF", "#00C896", "#FF6B6B", "#FFD93D", "#845EC2", "#2C73D2"];

const ExpenseChart = ({ theme, transactions }: ExpenseChartProps) => {
  const grouped = transactions.reduce<Record<string, number>>((acc, t) => {
    if (t.type === "expense") {
      const cat = t.category || "Outros";
      acc[cat] = (acc[cat] || 0) + Number(t.amount);
    }
    return acc;
  }, {});

  const data = Object.entries(grouped).map(([name, value]) => ({ name, value }));
  const empty = data.length === 0;

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm animate-fade-in" style={{ animationDelay: "300ms" }}>
      <h3 className="text-sm font-medium text-muted-foreground mb-4">Gastos por Categoria</h3>
      {empty ? (
        <p className="text-center text-sm text-muted-foreground py-20">Sem dados ainda.</p>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={4} dataKey="value" strokeWidth={0}>
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                borderRadius: "12px",
                border: "none",
                boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                background: theme === "dark" ? "#1a1d24" : "#fff",
                color: theme === "dark" ? "#fff" : "#1a1a1a",
              }}
              formatter={(value: number) => [`R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, ""]}
            />
          </PieChart>
        </ResponsiveContainer>
      )}
      <div className="flex flex-wrap gap-4 mt-4 justify-center">
        {data.map((item, i) => (
          <div key={item.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
            {item.name}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ExpenseChart;
