export interface FinancialTransaction {
  id: string;
  amount: number;
  type: string;
  date: string;
  realized?: boolean;
}

export interface FinancialAdjustment {
  id?: string;
  amount: number;
  adjustment_date: string;
}

interface FinancialSummaryInput {
  transactions: FinancialTransaction[];
  adjustments?: FinancialAdjustment[];
  isRealized?: (transaction: FinancialTransaction) => boolean;
}

export interface FinancialSummary {
  entradas: number;
  saidas: number;
  receitasEfetivadas: number;
  despesasEfetivadas: number;
  receitasPendentes: number;
  despesasPendentes: number;
  ajustesDeSaldo: number;
  saldoAtual: number;
  saldoPrevisto: number;
}

export function sumAdjustments(adjustments: FinancialAdjustment[]): number {
  return adjustments.reduce((sum, adjustment) => sum + Number(adjustment.amount), 0);
}

export function calculateFinancialSummary({
  transactions,
  adjustments = [],
  isRealized,
}: FinancialSummaryInput): FinancialSummary {
  let entradas = 0;
  let saidas = 0;
  let receitasEfetivadas = 0;
  let despesasEfetivadas = 0;
  let receitasPendentes = 0;
  let despesasPendentes = 0;

  for (const transaction of transactions) {
    const amount = Number(transaction.amount);
    const realized = isRealized ? isRealized(transaction) : transaction.realized !== false;

    if (transaction.type === "income") {
      entradas += amount;
      if (realized) receitasEfetivadas += amount;
      else receitasPendentes += amount;
      continue;
    }

    saidas += amount;
    if (realized) despesasEfetivadas += amount;
    else despesasPendentes += amount;
  }

  const ajustesDeSaldo = sumAdjustments(adjustments);
  const saldoAtual = ajustesDeSaldo + receitasEfetivadas - despesasEfetivadas;
  const saldoPrevisto = saldoAtual + receitasPendentes - despesasPendentes;

  return {
    entradas,
    saidas,
    receitasEfetivadas,
    despesasEfetivadas,
    receitasPendentes,
    despesasPendentes,
    ajustesDeSaldo,
    saldoAtual,
    saldoPrevisto,
  };
}
