import { ArrowDownLeft, ArrowUpRight, User } from "lucide-react";

interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: string;
  date: string;
}

interface TransactionListProps {
  transactions: Transaction[];
}

const formatDate = (dateStr: string) => {
  try {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return dateStr;
  }
};

const TransactionList = ({ transactions }: TransactionListProps) => {
  if (transactions.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-10 text-center shadow-sm">
        <p className="text-sm text-muted-foreground">Nenhuma transação registrada.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-muted-foreground px-1">Transações recentes</h3>
      {transactions.map((t, i) => {
        const isIncome = t.type === "income";
        return (
          <div
            key={t.id}
            className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 animate-fade-in"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${isIncome ? "bg-secondary/15" : "bg-destructive/15"}`}>
              {isIncome ? (
                <ArrowDownLeft className="h-5 w-5 text-secondary" />
              ) : (
                <ArrowUpRight className="h-5 w-5 text-destructive" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{t.description}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-muted-foreground">{formatDate(t.date)}</span>
                <span className="text-xs text-muted-foreground">·</span>
                <span className={`text-xs font-medium ${isIncome ? "text-secondary" : "text-destructive"}`}>
                  {isIncome ? "Entrada" : "Saída"}
                </span>
              </div>
            </div>
            <p className={`text-sm font-bold whitespace-nowrap ${isIncome ? "text-secondary" : "text-destructive"}`}>
              {isIncome ? "+" : "-"} R$ {Number(t.amount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
          </div>
        );
      })}
    </div>
  );
};

export default TransactionList;
