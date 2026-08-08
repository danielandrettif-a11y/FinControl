// ===== Entidades do sistema =====

export interface UserSettings {
  monthlyLimit: number; // BRL
  exchangeRateUsdBrl: number; // 1 USD = X BRL
}

export interface CreditCard {
  id: string;
  name: string;
  institution: string;
  brand: 'visa' | 'mastercard' | 'elo' | 'amex' | 'other';
  last4Digits: string;
  color: string;
  gradientEnd?: string;
  totalLimit: number; // BRL
  closingDay: number;
  dueDay: number;
  isActive: boolean;
  imageUrl?: string;
}

export interface CryptoCard {
  id: string;
  name: string;
  institution: string;
  color: string;
  gradientEnd?: string;
  mainCurrency: 'USD' | 'BRL';
  isActive: boolean;
  imageUrl?: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
}

export interface CreditCardTransaction {
  id: string;
  creditCardId: string;
  description: string;
  categoryId: string;
  amount: number; // BRL, centavos conceptualmente tratados como float controlado via toFixed(2)
  date: string; // ISO
  installments: number; // 1 = à vista
  currentInstallment?: number; // preenchido nas parcelas geradas
  totalInstallments?: number;
  parentTransactionId?: string; // se for parcela gerada
  notes: string;
}

export interface CryptoTopUp {
  id: string;
  cryptoCardId: string;
  amountUsd: number;
  amountBrl: number;
  exchangeRate: number;
  date: string; // ISO
}

export interface CryptoTransaction {
  id: string;
  cryptoCardId: string;
  description: string;
  categoryId: string;
  amountUsd: number;
  date: string; // ISO
}

// ponytail: usando number pra dinheiro com toFixed(2) nos displays.
// Se precisar de precisão de centavo em cálculos pesados, migrar pra lib tipo dinero.js
