import type { CurrencyCode } from '@dealos/types';

export const formatCurrency = (
  amount: number,
  currency: CurrencyCode = 'USD',
  locale = 'en-US',
): string =>
  new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 2
  }).format(amount);

export const calculateSavingsPercent = (
  previousPrice: number | null,
  currentPrice: number,
): number => {
  if (!previousPrice || previousPrice <= 0) {
    return 0;
  }

  return Math.max(0, ((previousPrice - currentPrice) / previousPrice) * 100);
};
