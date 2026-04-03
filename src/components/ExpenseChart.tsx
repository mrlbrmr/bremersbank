import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const data = [
  { name: "Moradia", value: 2800 },
  { name: "Alimentação", value: 1500 },
  { name: "Transporte", value: 600 },
  { name: "Lazer", value: 900 },
  { name: "Outros", value: 450 },
];

const COLORS_LIGHT = ["#6C63FF", "#00C896", "#FF6B6B", "#FFB347", "#A78BFA"];
const COLORS_DARK = ["#8B7CFF", "#00E0A4", "#FF8585", "#FFC56B", "#C4B5FD"];

interface ExpenseChartProps {
  theme: "light" | "dark";
}

const ExpenseChart = ({ theme }: ExpenseChartProps) => {
  const colors = theme === "dark" ? COLORS_DARK : COLORS_LIGHT;

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm animate-fade-in" style={{ animationDelay: "300ms" }}>
      <h3 className="text-sm font-medium text-muted-foreground mb-4">Resumo Financeiro</h3>
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={4}
            dataKey="value"
            strokeWidth={0}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={colors[i % colors.length]} />
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
            formatter={(value: number) => [`R$ ${value.toLocaleString("pt-BR")}`, ""]}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex flex-wrap gap-3 mt-4 justify-center">
        {data.map((item, i) => (
          <div key={item.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: colors[i] }} />
            {item.name}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ExpenseChart;
