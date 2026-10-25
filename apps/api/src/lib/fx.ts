import { roundMoney, type Currency } from '@spendly/shared';
import { FxRate } from '../models/misc';
import { logger } from './logger';

const RATES_URL = 'https://open.er-api.com/v6/latest/USD';
const MAX_AGE_MS = 12 * 60 * 60 * 1000;

/** Approximate USD rates used only when the rates API and cache are both unavailable. */
const FALLBACK_RATES: Record<Currency, number> = {
  USD: 1,
  LKR: 300,
  EUR: 0.92,
  GBP: 0.78,
  INR: 84,
  AUD: 1.52,
  CAD: 1.37,
  AED: 3.67,
  JPY: 150,
  SGD: 1.34,
};

let memo: { rates: Record<string, number>; fetchedAt: number } | null = null;

const fetchRates = async () => {
  const response = await fetch(RATES_URL, { signal: AbortSignal.timeout(5000) });
  if (!response.ok) throw new Error(`Rates API responded ${response.status}`);
  const body = (await response.json()) as { result: string; rates: Record<string, number> };
  if (body.result !== 'success') throw new Error('Rates API returned an error');
  return body.rates;
};

/** USD-based exchange rates, cached in memory and MongoDB for 12 hours. */
export const getRates = async (): Promise<Record<string, number>> => {
  if (memo && Date.now() - memo.fetchedAt < MAX_AGE_MS) return memo.rates;

  const cached = await FxRate.findOne({ base: 'USD' }).lean();
  if (cached && Date.now() - cached.fetchedAt.getTime() < MAX_AGE_MS) {
    memo = { rates: Object.fromEntries(Object.entries(cached.rates)), fetchedAt: cached.fetchedAt.getTime() };
    return memo.rates;
  }

  try {
    const rates = await fetchRates();
    const fetchedAt = new Date();
    await FxRate.updateOne({ base: 'USD' }, { rates, fetchedAt }, { upsert: true });
    memo = { rates, fetchedAt: fetchedAt.getTime() };
    return rates;
  } catch (error) {
    logger.warn({ err: error }, 'Could not refresh exchange rates');
    if (cached) return Object.fromEntries(Object.entries(cached.rates));
    return FALLBACK_RATES;
  }
};

export const convert = async (amount: number, from: Currency, to: Currency) => {
  if (from === to) return amount;
  const rates = await getRates();
  const fromRate = rates[from] ?? FALLBACK_RATES[from];
  const toRate = rates[to] ?? FALLBACK_RATES[to];
  return roundMoney((amount / fromRate) * toRate, to);
};
