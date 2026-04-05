import { useMemo } from "react";

interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: string;
  category?: string;
  date: string;
  isInstallment?: boolean;
  installmentLabel?: string;
}

interface Installment {
  id: string;
  description: string;
  total_amount: number;
  total_installments: number;
  current_installment: number;
  monthly_amount: number;
  start_date: string;
  category: string;
  active: boolean;
}

/**
 * Generates virtual expense transactions for each installment month.
 * Starts from current_installment (0-based: 0 means none paid yet).
 */
export function useInstallmentTransactions(installments: Installment[]): Transaction[] {
  return useMemo(() => {
    const virtual: Transaction[] = [];

    for (const inst of installments) {
      if (!inst.active) continue;

      const startDate = new Date(inst.start_date + "T00:00:00");

      // Generate a transaction for each remaining installment (from current_installment onwards)
      for (let i = inst.current_installment; i < inst.total_installments; i++) {
        const installmentDate = new Date(startDate);
        installmentDate.setMonth(startDate.getMonth() + i);

        const day = startDate.getDate();
        const lastDayOfMonth = new Date(installmentDate.getFullYear(), installmentDate.getMonth() + 1, 0).getDate();
        installmentDate.setDate(Math.min(day, lastDayOfMonth));

        const dateStr = installmentDate.toISOString().split("T")[0];

        virtual.push({
          id: `installment-${inst.id}-${i}`,
          description: inst.description,
          amount: Number(inst.monthly_amount),
          type: "expense",
          category: inst.category || "Outros",
          date: dateStr,
          isInstallment: true,
          installmentLabel: `${i + 1}/${inst.total_installments}`,
        });
      }
    }

    return virtual;
  }, [installments]);
}

/**
 * Merges real transactions with virtual installment transactions.
 */
export function mergeTransactions(
  real: Transaction[],
  installmentVirtual: Transaction[]
): Transaction[] {
  return [...real, ...installmentVirtual].sort((a, b) => b.date.localeCompare(a.date));
}
