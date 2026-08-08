// Conversão centralizada BRL <-> USD

export function convertBrlToUsd(brl: number, rate: number): number {
  if (rate <= 0) return 0;
  return Math.round((brl / rate) * 100) / 100;
}

export function convertUsdToBrl(usd: number, rate: number): number {
  return Math.round(usd * rate * 100) / 100;
}

export function formatBrl(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function formatUsd(value: number): string {
  return value.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

export function formatPercent(value: number): string {
  return `${Math.round(value)}%`;
}
