import { useMemo, useState } from "react";
import {
  ArrowDownLeft, ArrowUpRight, TrendingUp, TrendingDown, AlertTriangle,
  ShieldCheck, Eye, EyeOff, Sparkles, SlidersHorizontal, Play, RotateCcw, Info
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from "recharts";

interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: string;
  category?: string;
  date: string;
  isInstallment?: boolean;
  installmentLabel?: string;
  isRecurring?: boolean;
  realized?: boolean;
}

interface FinancialTimelineProps {
  transactions: Transaction[];
  saldoAtual: number;
  selectedMonth: Date;
}

const formatCurrency = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const formatDay = (dateStr: string) => {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
};

const getSaldoColor = (v: number) => {
  if (v < 0) return "text-destructive";
  if (v < 1000) return "text-warning";
  return "text-secondary";
};

const getSaldoZone = (v: number): "safe" | "warning" | "danger" => {
  if (v < 0) return "danger";
  if (v < 1000) return "warning";
  return "safe";
};

const zoneConfig = {
  safe: { label: "Zona Segura", icon: ShieldCheck, color: "text-secondary", bg: "bg-secondary/10 border-secondary/20" },
  warning: { label: "Atenção", icon: AlertTriangle, color: "text-warning", bg: "bg-warning/10 border-warning/20" },
  danger: { label: "Risco", icon: AlertTriangle, color: "text-destructive", bg: "bg-destructive/10 border-destructive/20" },
};

interface DayData {
  date: string;
  dayNum: number;
  income: number;
  expense: number;
  balance: number;
  simulatedBalance: number;
  transactions: Transaction[];
  isToday: boolean;
  isPast: boolean;
}

const FinancialTimeline = ({ transactions, saldoAtual, selectedMonth }: FinancialTimelineProps) => {
  const [showRealized, setShowRealized] = useState(true);
  const [simActive, setSimActive] = useState(false);
  const [simExtraExpense, setSimExtraExpense] = useState(0);
  const [simPercentAdjust, setSimPercentAdjust] = useState(0);
  const [expandedDay, setExpandedDay] = useState<string | null>(null);

  const month = selectedMonth.getMonth();
  const year = selectedMonth.getFullYear();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Build daily data
  const dailyData = useMemo(() => {
    const days: DayData[] = [];

    // Calculate running balance from beginning of month
    // Start with saldoAtual minus all transactions in this month that are realized/past to get start-of-month balance
    const monthTxs = transactions.filter(t => {
      const d = new Date(t.date + "T00:00:00");
      return d.getMonth() === month && d.getFullYear() === year;
    });

    // Sum all realized transactions in this month to derive start-of-month balance
    const totalRealized = monthTxs.reduce((sum, t) => {
      const amt = Number(t.amount);
      return sum + (t.type === "income" ? amt : -amt);
    }, 0);
    const startBalance = saldoAtual - totalRealized;

    let runningBalance = startBalance;

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const dayDate = new Date(dateStr + "T00:00:00");
      const isToday = dayDate.getTime() === today.getTime();
      const isPast = dayDate < today;

      const dayTxs = monthTxs.filter(t => t.date === dateStr);

      let dayIncome = 0;
      let dayExpense = 0;

      for (const t of dayTxs) {
        if (showRealized && t.realized === false && !t.isRecurring && !t.isInstallment) continue;
        const amt = Number(t.amount);
        if (t.type === "income") dayIncome += amt;
        else dayExpense += amt;
      }

      runningBalance += dayIncome - dayExpense;

      // Simulated balance
      const adjustedExpense = dayExpense * (1 + simPercentAdjust / 100);
      const simBalance = runningBalance - (adjustedExpense - dayExpense) - (day === 15 ? simExtraExpense : 0);

      days.push({
        date: dateStr,
        dayNum: day,
        income: dayIncome,
        expense: dayExpense,
        balance: runningBalance,
        simulatedBalance: simActive ? simBalance : runningBalance,
        transactions: dayTxs,
        isToday,
        isPast,
      });
    }

    // Recalculate simulated balance as running
    if (simActive) {
      let simRunning = startBalance;
      for (const day of days) {
        const adjustedExpense = day.expense * (1 + simPercentAdjust / 100);
        const extraOnDay15 = day.dayNum === 15 ? simExtraExpense : 0;
        simRunning += day.income - adjustedExpense - extraOnDay15;
        day.simulatedBalance = simRunning;
      }
    }

    return days;
  }, [transactions, saldoAtual, selectedMonth, month, year, daysInMonth, showRealized, simActive, simPercentAdjust, simExtraExpense]);

  // Insights
  const insights = useMemo(() => {
    const msgs: { text: string; type: "safe" | "warning" | "danger" }[] = [];
    const lastDay = dailyData[dailyData.length - 1];
    const balanceField = simActive ? "simulatedBalance" : "balance";

    // Check when goes negative
    const negDay = dailyData.find(d => d[balanceField] < 0);
    if (negDay) {
      msgs.push({ text: `Saldo negativo a partir do dia ${negDay.dayNum}`, type: "danger" });
    }

    // Final balance
    if (lastDay) {
      const finalBal = lastDay[balanceField];
      if (finalBal >= 1000) {
        msgs.push({ text: `Saldo final projetado: ${formatCurrency(finalBal)} — zona segura`, type: "safe" });
      } else if (finalBal >= 0) {
        msgs.push({ text: `Saldo final projetado: ${formatCurrency(finalBal)} — atenção`, type: "warning" });
      } else {
        msgs.push({ text: `Saldo final projetado: ${formatCurrency(finalBal)} — risco!`, type: "danger" });
      }
    }

    // Simulation comparison
    if (simActive && lastDay) {
      const diff = lastDay.simulatedBalance - lastDay.balance;
      if (Math.abs(diff) > 0.01) {
        msgs.push({
          text: diff < 0
            ? `Este cenário reduz seu saldo final em ${formatCurrency(Math.abs(diff))}`
            : `Este cenário aumenta seu saldo final em ${formatCurrency(diff)}`,
          type: diff < 0 ? "warning" : "safe",
        });
      }
    }

    return msgs;
  }, [dailyData, simActive]);

  // Chart data
  const chartData = useMemo(() => {
    return dailyData.map(d => ({
      name: String(d.dayNum),
      saldo: Math.round(d.balance * 100) / 100,
      simulado: simActive ? Math.round(d.simulatedBalance * 100) / 100 : undefined,
      income: d.income,
      expense: d.expense,
    }));
  }, [dailyData, simActive]);

  const todayDayNum = today.getMonth() === month && today.getFullYear() === year ? today.getDate() : null;

  const finalZone = dailyData.length > 0
    ? getSaldoZone(simActive ? dailyData[dailyData.length - 1].simulatedBalance : dailyData[dailyData.length - 1].balance)
    : "safe";
  const zoneInfo = zoneConfig[finalZone];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    const day = dailyData.find(d => String(d.dayNum) === label);
    return (
      <div className="rounded-xl border border-border bg-card p-3 shadow-xl text-xs space-y-1.5 min-w-[180px]">
        <p className="font-semibold text-foreground">{day ? formatDay(day.date) : `Dia ${label}`}</p>
        <div className="h-px bg-border" />
        {payload.map((p: any, i: number) => (
          <div key={i} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: p.color }} />
              {p.dataKey === "saldo" ? "Saldo Real" : "Saldo Simulado"}
            </span>
            <span className="font-bold">{formatCurrency(p.value)}</span>
          </div>
        ))}
        {day && day.income > 0 && (
          <div className="flex items-center justify-between text-secondary">
            <span className="flex items-center gap-1"><ArrowDownLeft className="h-3 w-3" /> Entradas</span>
            <span className="font-medium">+{formatCurrency(day.income)}</span>
          </div>
        )}
        {day && day.expense > 0 && (
          <div className="flex items-center justify-between text-destructive">
            <span className="flex items-center gap-1"><ArrowUpRight className="h-3 w-3" /> Saídas</span>
            <span className="font-medium">-{formatCurrency(day.expense)}</span>
          </div>
        )}
        {day && day.transactions.length > 0 && (
          <>
            <div className="h-px bg-border" />
            <div className="space-y-0.5 max-h-32 overflow-y-auto">
              {day.transactions.slice(0, 5).map(t => (
                <div key={t.id} className="flex items-center justify-between gap-2">
                  <span className="truncate text-muted-foreground">{t.description}</span>
                  <span className={`font-medium whitespace-nowrap ${t.type === "income" ? "text-secondary" : "text-destructive"}`}>
                    {t.type === "income" ? "+" : "-"}{formatCurrency(Number(t.amount))}
                  </span>
                </div>
              ))}
              {day.transactions.length > 5 && (
                <p className="text-muted-foreground text-center">+{day.transactions.length - 5} mais</p>
              )}
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4 stagger-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Linha do Tempo
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">Projeção financeira diária</p>
        </div>
        <button
          onClick={() => setShowRealized(!showRealized)}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-all ${
            showRealized
              ? "bg-secondary/10 text-secondary border border-secondary/20"
              : "bg-muted text-muted-foreground border border-border"
          }`}
        >
          {showRealized ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
          {showRealized ? "Realizado" : "Previsto"}
        </button>
      </div>

      {/* Zone indicator */}
      <div className={`flex items-center gap-3 rounded-xl border p-3 ${zoneInfo.bg} animate-fade-in`}>
        <zoneInfo.icon className={`h-5 w-5 ${zoneInfo.color}`} />
        <div className="flex-1">
          <p className={`text-sm font-semibold ${zoneInfo.color}`}>{zoneInfo.label}</p>
          <p className="text-[10px] text-muted-foreground">
            Saldo final projetado: {formatCurrency(
              dailyData.length > 0
                ? (simActive ? dailyData[dailyData.length - 1].simulatedBalance : dailyData[dailyData.length - 1].balance)
                : 0
            )}
          </p>
        </div>
      </div>

      {/* Chart */}
      <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-muted-foreground">Evolução do Saldo</p>
          {simActive && (
            <div className="flex items-center gap-3 text-[10px]">
              <span className="flex items-center gap-1">
                <span className="h-0.5 w-4 bg-primary rounded" style={{ opacity: 0.4 }} /> Original
              </span>
              <span className="flex items-center gap-1">
                <span className="h-0.5 w-4 bg-primary rounded" /> Simulado
              </span>
            </div>
          )}
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 0, left: -10 }}>
            <defs>
              <linearGradient id="gradSaldo" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="gradSim" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--secondary))" stopOpacity={0.25} />
                <stop offset="100%" stopColor="hsl(var(--secondary))" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              tickLine={false}
              axisLine={false}
              interval={Math.floor(daysInMonth / 8)}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${(v / 1000).toFixed(1)}k`}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={0} stroke="hsl(var(--destructive))" strokeDasharray="4 4" opacity={0.6} />
            <ReferenceLine y={1000} stroke="hsl(var(--warning))" strokeDasharray="4 4" opacity={0.4} />
            {todayDayNum && (
              <ReferenceLine x={String(todayDayNum)} stroke="hsl(var(--primary))" strokeDasharray="2 2" opacity={0.6} />
            )}
            <Area
              type="monotone"
              dataKey="saldo"
              stroke="hsl(var(--primary))"
              strokeWidth={simActive ? 1.5 : 2.5}
              strokeDasharray={simActive ? "6 3" : undefined}
              fill="url(#gradSaldo)"
              fillOpacity={simActive ? 0.3 : 1}
              dot={false}
              animationDuration={800}
            />
            {simActive && (
              <Area
                type="monotone"
                dataKey="simulado"
                stroke="hsl(var(--secondary))"
                strokeWidth={2.5}
                fill="url(#gradSim)"
                dot={false}
                animationDuration={800}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Insights */}
      {insights.length > 0 && (
        <div className="space-y-2">
          {insights.map((insight, i) => {
            const cfg = zoneConfig[insight.type];
            return (
              <div key={i} className={`flex items-start gap-2.5 rounded-lg border p-3 ${cfg.bg} animate-fade-in`} style={{ animationDelay: `${i * 100}ms` }}>
                <Info className={`h-4 w-4 mt-0.5 shrink-0 ${cfg.color}`} />
                <p className="text-xs font-medium">{insight.text}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Scenario Simulator */}
      <div className="rounded-xl border border-border bg-card p-4 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold">Simulador de Cenários</h3>
          </div>
          {simActive && (
            <button
              onClick={() => { setSimActive(false); setSimExtraExpense(0); setSimPercentAdjust(0); }}
              className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted border border-border transition-colors"
            >
              <RotateCcw className="h-3 w-3" /> Resetar
            </button>
          )}
        </div>

        <div className="space-y-4">
          {/* Extra expense */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs text-muted-foreground">Gasto extra (dia 15)</label>
              <span className="text-xs font-bold text-destructive">
                {simExtraExpense > 0 ? `- ${formatCurrency(simExtraExpense)}` : "R$ 0,00"}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={5000}
              step={100}
              value={simExtraExpense}
              onChange={(e) => setSimExtraExpense(Number(e.target.value))}
              className="w-full h-2 rounded-full appearance-none cursor-pointer accent-primary bg-muted"
            />
            <div className="flex justify-between text-[9px] text-muted-foreground mt-0.5">
              <span>R$ 0</span>
              <span>R$ 5.000</span>
            </div>
          </div>

          {/* Percentage adjustment */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs text-muted-foreground">Ajuste nos gastos</label>
              <span className={`text-xs font-bold ${simPercentAdjust > 0 ? "text-destructive" : simPercentAdjust < 0 ? "text-secondary" : "text-muted-foreground"}`}>
                {simPercentAdjust > 0 ? "+" : ""}{simPercentAdjust}%
              </span>
            </div>
            <input
              type="range"
              min={-30}
              max={30}
              step={5}
              value={simPercentAdjust}
              onChange={(e) => setSimPercentAdjust(Number(e.target.value))}
              className="w-full h-2 rounded-full appearance-none cursor-pointer accent-primary bg-muted"
            />
            <div className="flex justify-between text-[9px] text-muted-foreground mt-0.5">
              <span>-30%</span>
              <span>0%</span>
              <span>+30%</span>
            </div>
          </div>

          <button
            onClick={() => setSimActive(true)}
            className={`w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-all duration-300 ${
              simActive
                ? "bg-secondary text-secondary-foreground shadow-lg"
                : "bg-primary text-primary-foreground hover:opacity-90 shadow-md"
            }`}
          >
            <Play className="h-4 w-4" />
            {simActive ? "Simulação Ativa" : "Simular Cenário"}
          </button>
        </div>
      </div>

      {/* Daily Timeline */}
      <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <h3 className="text-sm font-semibold mb-3 text-muted-foreground">Dia a Dia</h3>
        <div className="relative space-y-0">
          {/* Vertical line */}
          <div className="absolute left-[18px] top-4 bottom-4 w-0.5 bg-border" />

          {dailyData.map((day, i) => {
            const hasEvents = day.income > 0 || day.expense > 0;
            const zone = getSaldoZone(simActive ? day.simulatedBalance : day.balance);
            const isExpanded = expandedDay === day.date;

            if (!hasEvents && !day.isToday) return null;

            return (
              <div
                key={day.date}
                className={`relative flex items-start gap-3 py-2 pl-1 cursor-pointer transition-all duration-200 rounded-lg hover:bg-muted/50 ${
                  day.isToday ? "bg-primary/5" : ""
                }`}
                onClick={() => setExpandedDay(isExpanded ? null : day.date)}
              >
                {/* Dot */}
                <div className={`relative z-10 mt-1 flex h-[18px] w-[18px] sm:h-5 sm:w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all ${
                  day.isToday
                    ? "border-primary bg-primary shadow-md shadow-primary/30"
                    : zone === "danger"
                      ? "border-destructive bg-destructive/20"
                      : zone === "warning"
                        ? "border-warning bg-warning/20"
                        : "border-secondary bg-secondary/20"
                }`}>
                  {day.isToday && <span className="h-1.5 w-1.5 rounded-full bg-primary-foreground" />}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-semibold ${day.isToday ? "text-primary" : "text-foreground"}`}>
                        {formatDay(day.date)}
                      </span>
                      {day.isToday && (
                        <span className="rounded-full bg-primary px-2 py-0.5 text-[9px] font-bold text-primary-foreground">
                          HOJE
                        </span>
                      )}
                    </div>
                    <span className={`text-xs font-bold ${getSaldoColor(simActive ? day.simulatedBalance : day.balance)}`}>
                      {formatCurrency(simActive ? day.simulatedBalance : day.balance)}
                    </span>
                  </div>

                  {/* Events summary */}
                  <div className="flex items-center gap-3 mt-1">
                    {day.income > 0 && (
                      <span className="flex items-center gap-1 text-[10px] text-secondary font-medium">
                        <ArrowDownLeft className="h-3 w-3" /> +{formatCurrency(day.income)}
                      </span>
                    )}
                    {day.expense > 0 && (
                      <span className="flex items-center gap-1 text-[10px] text-destructive font-medium">
                        <ArrowUpRight className="h-3 w-3" /> -{formatCurrency(day.expense)}
                      </span>
                    )}
                  </div>

                  {/* Expanded details */}
                  {isExpanded && day.transactions.length > 0 && (
                    <div className="mt-2 space-y-1.5 animate-fade-in border-t border-border pt-2">
                      {day.transactions.map(t => (
                        <div key={t.id} className="flex items-center justify-between gap-2 text-[11px]">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${t.type === "income" ? "bg-secondary" : "bg-destructive"}`} />
                            <span className="truncate text-muted-foreground">{t.description}</span>
                            {t.isRecurring && <span className="text-[9px] text-muted-foreground">(Fixo)</span>}
                            {t.isInstallment && t.installmentLabel && <span className="text-[9px] text-primary">{t.installmentLabel}</span>}
                          </div>
                          <span className={`font-semibold whitespace-nowrap ${t.type === "income" ? "text-secondary" : "text-destructive"}`}>
                            {t.type === "income" ? "+" : "-"}{formatCurrency(Number(t.amount))}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default FinancialTimeline;
