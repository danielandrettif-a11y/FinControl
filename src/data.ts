import type {
  UserSettings,
  CreditCard,
  CryptoCard,
  Category,
  CreditCardTransaction,
  CryptoTopUp,
  CryptoTransaction,
} from './types';

export const DEFAULT_SETTINGS: UserSettings = {
  monthlyLimit: 1500,
  exchangeRateUsdBrl: 5.11,
};

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'food', name: 'Alimentação', icon: '🍔' },
  { id: 'transport', name: 'Transporte', icon: '🚗' },
  { id: 'shopping', name: 'Compras', icon: '🛍️' },
  { id: 'subscriptions', name: 'Assinaturas', icon: '📺' },
  { id: 'health', name: 'Saúde', icon: '💊' },
  { id: 'entertainment', name: 'Lazer', icon: '🎮' },
  { id: 'education', name: 'Educação', icon: '📚' },
  { id: 'housing', name: 'Moradia', icon: '🏠' },
  { id: 'other', name: 'Outros', icon: '📦' },
];

export const INITIAL_CREDIT_CARDS: CreditCard[] = [
  {
    id: 'nubank',
    name: 'Nubank',
    institution: 'Nubank',
    brand: 'mastercard',
    last4Digits: '1234',
    color: '#820AD1',
    gradientEnd: '#6B07AB',
    totalLimit: 5000,
    closingDay: 3,
    dueDay: 8,
    isActive: true,
  },
  {
    id: 'revolut',
    name: 'Revolut',
    institution: 'Revolut',
    brand: 'visa',
    last4Digits: '5678',
    color: '#0075EB',
    gradientEnd: '#003A75',
    totalLimit: 3000,
    closingDay: 2,
    dueDay: 7,
    isActive: true,
  },
  {
    id: 'bipa',
    name: 'Bipa',
    institution: 'Bipa',
    brand: 'visa',
    last4Digits: '9012',
    color: '#FF6B35',
    gradientEnd: '#CC5529',
    totalLimit: 2000,
    closingDay: 4,
    dueDay: 9,
    isActive: true,
  },
  {
    id: 'itau',
    name: 'Itaú',
    institution: 'Itaú',
    brand: 'visa',
    last4Digits: '3456',
    color: '#003399',
    gradientEnd: '#FF6600',
    totalLimit: 4000,
    closingDay: 5,
    dueDay: 10,
    isActive: true,
  },
];

export const INITIAL_CRYPTO_CARDS: CryptoCard[] = [
  {
    id: 'okx',
    name: 'OKX Card',
    institution: 'OKX',
    color: '#000000',
    gradientEnd: '#1a1a1a',
    mainCurrency: 'USD',
    isActive: true,
  },
  {
    id: 'bitget',
    name: 'Bitget Card',
    institution: 'Bitget',
    color: '#00D4AA',
    gradientEnd: '#009977',
    mainCurrency: 'USD',
    isActive: true,
  },
];

// Transações de exemplo — Agosto 2026
export const INITIAL_CREDIT_TRANSACTIONS: CreditCardTransaction[] = [
  {
    id: 'tx1',
    creditCardId: 'nubank',
    description: 'Supermercado Extra',
    categoryId: 'food',
    amount: 235.50,
    date: '2026-08-02T10:00:00Z',
    installments: 1,
    notes: '',
  },
  {
    id: 'tx2',
    creditCardId: 'nubank',
    description: 'Spotify',
    categoryId: 'subscriptions',
    amount: 21.90,
    date: '2026-08-01T10:00:00Z',
    installments: 1,
    notes: '',
  },
  {
    id: 'tx3',
    creditCardId: 'nubank',
    description: 'Farmácia',
    categoryId: 'health',
    amount: 47.91,
    date: '2026-08-03T10:00:00Z',
    installments: 1,
    notes: '',
  },
  {
    id: 'tx4',
    creditCardId: 'nubank',
    description: 'Curso Udemy',
    categoryId: 'education',
    amount: 80.00,
    date: '2026-08-04T10:00:00Z',
    installments: 4,
    notes: 'Curso de React avançado',
  },
  {
    id: 'tx5',
    creditCardId: 'bipa',
    description: 'Amazon',
    categoryId: 'shopping',
    amount: 100.96,
    date: '2026-08-01T10:00:00Z',
    installments: 1,
    notes: '',
  },
  {
    id: 'tx6',
    creditCardId: 'itau',
    description: 'Uber',
    categoryId: 'transport',
    amount: 6.87,
    date: '2026-08-05T10:00:00Z',
    installments: 1,
    notes: '',
  },
];

export const INITIAL_CRYPTO_TOPUPS: CryptoTopUp[] = [
  {
    id: 'topup1',
    cryptoCardId: 'okx',
    amountUsd: 36.96,
    amountBrl: 188.85,
    exchangeRate: 5.11,
    date: '2026-08-03T14:00:00Z',
  },
];

export const INITIAL_CRYPTO_TRANSACTIONS: CryptoTransaction[] = [
  {
    id: 'ctx1',
    cryptoCardId: 'okx',
    description: 'Netflix',
    categoryId: 'subscriptions',
    amountUsd: 12.00,
    date: '2026-08-04T10:00:00Z',
  },
  {
    id: 'ctx2',
    cryptoCardId: 'okx',
    description: 'ChatGPT Plus',
    categoryId: 'subscriptions',
    amountUsd: 20.00,
    date: '2026-08-05T10:00:00Z',
  },
];
