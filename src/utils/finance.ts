import type { CreditCardTransaction, CryptoTopUp, CryptoTransaction } from '../types';

/**
 * Total gasto em cartões de crédito num mês/ano.
 * Considera apenas transações cujas parcelas caem naquele mês.
 */
export function getMonthlyCreditCardExpenses(
  transactions: CreditCardTransaction[],
  month: number,
  year: number
): number {
  return transactions
    .filter((t) => {
      const d = new Date(t.date);
      // Se for parcela gerada, verificar pelo mês/ano da parcela
      if (t.currentInstallment && t.totalInstallments) {
        const parentDate = new Date(t.date);
        const installmentMonth = parentDate.getMonth() + (t.currentInstallment - 1);
        const targetDate = new Date(parentDate.getFullYear(), installmentMonth, 1);
        return targetDate.getMonth() === month && targetDate.getFullYear() === year;
      }
      return d.getMonth() === month && d.getFullYear() === year;
    })
    .reduce((sum, t) => sum + t.amount, 0);
}

/**
 * Total de gastos de um cartão específico num mês/ano.
 */
export function getCardMonthlyExpenses(
  transactions: CreditCardTransaction[],
  cardId: string,
  month: number,
  year: number
): number {
  return transactions
    .filter((t) => t.creditCardId === cardId)
    .filter((t) => {
      const d = new Date(t.date);
      if (t.currentInstallment && t.totalInstallments) {
        const parentDate = new Date(t.date);
        const installmentMonth = parentDate.getMonth() + (t.currentInstallment - 1);
        const targetDate = new Date(parentDate.getFullYear(), installmentMonth, 1);
        return targetDate.getMonth() === month && targetDate.getFullYear() === year;
      }
      return d.getMonth() === month && d.getFullYear() === year;
    })
    .reduce((sum, t) => sum + t.amount, 0);
}

/**
 * Total abastecido em cartões cripto num mês/ano (em BRL).
 */
export function getMonthlyCryptoTopUps(
  topUps: CryptoTopUp[],
  month: number,
  year: number
): number {
  return topUps
    .filter((t) => {
      const d = new Date(t.date);
      return d.getMonth() === month && d.getFullYear() === year;
    })
    .reduce((sum, t) => sum + t.amountBrl, 0);
}

/**
 * Total abastecido em cartões cripto num mês/ano (em USD).
 */
export function getMonthlyCryptoTopUpsUsd(
  topUps: CryptoTopUp[],
  month: number,
  year: number
): number {
  return topUps
    .filter((t) => {
      const d = new Date(t.date);
      return d.getMonth() === month && d.getFullYear() === year;
    })
    .reduce((sum, t) => sum + t.amountUsd, 0);
}

/**
 * Limite mensal restante = Limite - CréditoUsado - AbastecimentosCripto
 */
export function getMonthlySpendingRemaining(
  monthlyLimit: number,
  creditExpenses: number,
  cryptoTopUps: number
): number {
  return Math.round((monthlyLimit - creditExpenses - cryptoTopUps) * 100) / 100;
}

/**
 * Total utilizado do limite = CréditoUsado + AbastecimentosCripto
 */
export function getMonthlySpendingUsed(
  creditExpenses: number,
  cryptoTopUps: number
): number {
  return Math.round((creditExpenses + cryptoTopUps) * 100) / 100;
}

/**
 * Percentual utilizado do limite mensal
 */
export function getSpendingPercent(used: number, limit: number): number {
  if (limit <= 0) return 0;
  return (used / limit) * 100;
}

/**
 * Estado visual da barra de progresso
 */
export function getSpendingStatus(percent: number): 'comfortable' | 'attention' | 'elevated' | 'critical' | 'exceeded' {
  if (percent > 100) return 'exceeded';
  if (percent >= 90) return 'critical';
  if (percent >= 75) return 'elevated';
  if (percent >= 50) return 'attention';
  return 'comfortable';
}

/**
 * Saldo de um cartão cripto = soma dos topups - soma dos gastos (tudo em USD)
 */
export function getCryptoCardBalance(
  cardId: string,
  topUps: CryptoTopUp[],
  transactions: CryptoTransaction[]
): number {
  const totalIn = topUps
    .filter((t) => t.cryptoCardId === cardId)
    .reduce((sum, t) => sum + t.amountUsd, 0);
  const totalOut = transactions
    .filter((t) => t.cryptoCardId === cardId)
    .reduce((sum, t) => sum + t.amountUsd, 0);
  return Math.round((totalIn - totalOut) * 100) / 100;
}

/**
 * Gastos cripto de um cartão num mês/ano (em USD)
 */
export function getMonthlyCryptoExpenses(
  transactions: CryptoTransaction[],
  cardId: string,
  month: number,
  year: number
): number {
  return transactions
    .filter((t) => t.cryptoCardId === cardId)
    .filter((t) => {
      const d = new Date(t.date);
      return d.getMonth() === month && d.getFullYear() === year;
    })
    .reduce((sum, t) => sum + t.amountUsd, 0);
}

/**
 * Gera parcelas a partir de uma transação parcelada.
 * Retorna array de transações (uma por parcela).
 */
export function generateInstallments(
  transaction: CreditCardTransaction
): CreditCardTransaction[] {
  if (transaction.installments <= 1) return [transaction];

  const installmentAmount = Math.round((transaction.amount / transaction.installments) * 100) / 100;
  const baseDate = new Date(transaction.date);

  return Array.from({ length: transaction.installments }, (_, i) => {
    const installmentDate = new Date(baseDate.getFullYear(), baseDate.getMonth() + i, baseDate.getDate());
    return {
      ...transaction,
      id: `${transaction.id}_${i + 1}`,
      amount: installmentAmount,
      date: installmentDate.toISOString(),
      currentInstallment: i + 1,
      totalInstallments: transaction.installments,
      parentTransactionId: transaction.id,
    };
  });
}

/**
 * Agrupa parcelas futuras por mês
 */
export function getFutureInstallments(
  transactions: CreditCardTransaction[],
  currentMonth: number,
  currentYear: number
): { 
  month: number; 
  year: number; 
  total: number; 
  cards: { cardId: string; total: number; items: CreditCardTransaction[] }[] 
}[] {
  const futureMap = new Map<string, { total: number; cards: Map<string, { total: number; items: CreditCardTransaction[] }> }>();

  transactions
    .filter((t) => t.currentInstallment && t.totalInstallments && t.currentInstallment < t.totalInstallments!)
    .forEach((t) => {
      const baseDate = new Date(t.date);
      // Gerar parcelas restantes
      for (let i = t.currentInstallment!; i < t.totalInstallments!; i++) {
        const futureDate = new Date(baseDate.getFullYear(), baseDate.getMonth() + i, 1);
        const m = futureDate.getMonth();
        const y = futureDate.getFullYear();
        if (y > currentYear || (y === currentYear && m > currentMonth)) {
          const key = `${y}-${m}`;
          const existing = futureMap.get(key) || { total: 0, cards: new Map() };
          
          existing.total += t.amount;
          
          const cardEntry = existing.cards.get(t.creditCardId) || { total: 0, items: [] };
          cardEntry.total += t.amount;
          
          // Create the future installment instance to push
          const futureTx = {
            ...t,
            currentInstallment: i + 1,
            date: futureDate.toISOString(),
          };
          cardEntry.items.push(futureTx);
          
          existing.cards.set(t.creditCardId, cardEntry);
          futureMap.set(key, existing);
        }
      }
    });

  return Array.from(futureMap.entries())
    .map(([key, val]) => {
      const [y, m] = key.split('-').map(Number);
      return { 
        month: m, 
        year: y, 
        total: val.total,
        cards: Array.from(val.cards.entries()).map(([cardId, cardData]) => ({
          cardId,
          total: cardData.total,
          items: cardData.items
        }))
      };
    })
    .sort((a, b) => a.year - b.year || a.month - b.month);
}

/**
 * Total da fatura de um mês para todos os cartões
 */
export function getInvoiceTotal(
  transactions: CreditCardTransaction[],
  month: number,
  year: number
): number {
  // Considerar transações diretas do mês + parcelas que caem nesse mês
  return transactions
    .filter((t) => {
      const d = new Date(t.date);
      if (t.currentInstallment) {
        const baseDate = new Date(t.date);
        const targetDate = new Date(baseDate.getFullYear(), baseDate.getMonth() + (t.currentInstallment - 1), 1);
        return targetDate.getMonth() === month && targetDate.getFullYear() === year;
      }
      return d.getMonth() === month && d.getFullYear() === year;
    })
    .reduce((sum, t) => sum + t.amount, 0);
}

export const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];
