import { useMemo } from "react";
import { AreaChart, Area, ResponsiveContainer } from "recharts";
import { useFilters } from "@/contexts/FilterContext";

interface Transaction {
  amount: number;
  type: string;
  date: string;
}

interface SparklineCardProps {
  transactions: Transaction[];
}

const SparklineCard = ({ transactions }: SparklineCardProps) => {
  const { navigateToReport } = useFilters();

  const data = useMemo(() => {
    const sorted = [...transactions].sort((a, b) => a.date.localeCompare(b.date));
    let balance = 0;
    const map = new Map<string, number>();
    sorted.forEach((t) => {
      balance += t.type === "income" ? Number(t.amount) : -Number(t.amount);
      map.set(t.date, balance);
    });
    return Array.from(map.entries()).map(([date, value]) => ({ date, value }));
  }, [transactions]);

  if (data.length < 2) return null;

  const trend = data[data.length - 1].value - data[0].value;
  const color = trend >= 0 ? "#00C896" : "#FF6B6B";

  return (
    <div
      onClick={() => navigateToReport("balance")}
      className="rounded-xl border border-border bg-card p-4 shadow-sm cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5"
    >
      <p className="text-xs font-semibold text-muted-foreground mb-2">Tendência do Saldo</p>
      <ResponsiveContainer width="100%" height={60}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.2} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area type="monotone" dataKey="value" stroke={color} fill="url(#sparkGrad)" strokeWidth={2} dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SparklineCard;
