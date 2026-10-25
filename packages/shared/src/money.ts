import type { Currency } from './constants';

const ZERO_DECIMAL: readonly Currency[] = ['JPY'];

export const roundMoney = (value: number, currency: Currency) => {
  const factor = ZERO_DECIMAL.includes(currency) ? 1 : 100;
  return Math.round(value * factor) / factor;
};

export const formatMoney = (
  value: number,
  currency: Currency,
  options: { compact?: boolean; signed?: boolean } = {},
) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    notation: options.compact ? 'compact' : 'standard',
    maximumFractionDigits: options.compact ? 1 : ZERO_DECIMAL.includes(currency) ? 0 : 2,
    signDisplay: options.signed ? 'exceptZero' : 'auto',
  }).format(value);
