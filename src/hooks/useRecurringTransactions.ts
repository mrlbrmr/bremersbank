import { useMemo } from "react";

interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: string;
  category?: string;
  date: string;
  isRecurring?: boolean;
}

interface RecurringTransaction {
  id: string;
  description: string;
  amount: number;
  type: string;
  category: string;
  day_of_month: number;
  active: boolean;
  start_date?: string;
}

/**
 * Generates virtual transactions for each active recurring item in a given month/year.
 * Only generates if no real transaction with same description+amount exists for that month.
 */
export function useRecurringVirtualTransactions(
  recurring: RecurringTransaction[],
  realTransactions: Transaction[],
  month: number,
  year: number
): Transaction[] {
  return useMemo(() => {
    const virtual: Transaction[] = [];

    for (const r of recurring) {
      if (!r.active) continue;

      // Skip if this month is before the start_date
      if (r.start_date) {
        const startD = new Date(r.start_date + "T00:00:00");
        const startMonth = startD.getMonth();
        const startYear = startD.getFullYear();
        if (year < startYear || (year === startYear && month < startMonth)) continue;
      }

      // Check if a real transaction already exists for this month with same description & amount
      const alreadyExists = realTransactions.some(t => {
        const d = new Date(t.date + "T00:00:00");
        return (
          d.getMonth() === month &&
          d.getFullYear() === year &&
          t.description === r.description &&
          Math.abs(Number(t.amount) - Number(r.amount)) < 0.01 &&
          t.type === r.type
        );
      });

      if (alreadyExists) continue;

      // Clamp day to end of month
      const lastDay = new Date(year, month + 1, 0).getDate();
      const day = Math.min(r.day_of_month, lastDay);
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

      virtual.push({
        id: `recurring-${r.id}-${year}-${month}`,
        description: r.description,
        amount: Number(r.amount),
        type: r.type,
        category: r.category,
        date: dateStr,
        isRecurring: true,
      });
    }

    return virtual;
  }, [recurring, realTransactions, month, year]);
}
