import { describe, expect, it } from 'vitest';
import {
  getBudgetProgress,
  getBudgetStatus,
  monthRange,
  parseDateKey,
  roundMoney,
  shiftMonth,
  transactionInputSchema,
} from './index';

describe('budget status', () => {
  it('uses one near-limit threshold everywhere', () => {
    expect(getBudgetStatus(100, 0)).toBe('none');
    expect(getBudgetStatus(79, 100)).toBe('safe');
    expect(getBudgetStatus(80, 100)).toBe('warning');
    expect(getBudgetStatus(100, 100)).toBe('warning');
    expect(getBudgetStatus(101, 100)).toBe('over');
  });

  it('computes remaining and percent', () => {
    expect(getBudgetProgress(150, 100)).toMatchObject({ remaining: -50, percent: 150, status: 'over' });
  });
});

describe('dates', () => {
  it('parses only real calendar dates', () => {
    expect(parseDateKey('2024-02-29')).not.toBeNull();
    expect(parseDateKey('2025-02-29')).toBeNull();
    expect(parseDateKey('nope')).toBeNull();
  });

  it('handles month ranges and shifting across years', () => {
    expect(monthRange('2024-02')).toEqual({ start: '2024-02-01', end: '2024-02-29', days: 29 });
    expect(shiftMonth('2025-01', -1)).toBe('2024-12');
    expect(shiftMonth('2024-12', 1)).toBe('2025-01');
  });
});

describe('money', () => {
  it('rounds to the currency precision', () => {
    expect(roundMoney(10.005, 'USD')).toBe(10.01);
    expect(roundMoney(10.5, 'JPY')).toBe(11);
  });
});

describe('transaction schema', () => {
  const valid = {
    type: 'expense',
    title: '  Lunch  ',
    amount: 1500,
    currency: 'LKR',
    categoryId: '0123456789abcdef01234567',
    date: '2025-03-01',
    note: '',
  };

  it('trims and accepts valid input', () => {
    expect(transactionInputSchema.parse(valid).title).toBe('Lunch');
  });

  it('rejects bad amounts, currencies and ids', () => {
    expect(transactionInputSchema.safeParse({ ...valid, amount: 0 }).success).toBe(false);
    expect(transactionInputSchema.safeParse({ ...valid, currency: 'XYZ' }).success).toBe(false);
    expect(transactionInputSchema.safeParse({ ...valid, categoryId: 'food' }).success).toBe(false);
  });
});
