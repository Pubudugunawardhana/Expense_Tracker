import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { getBudgetProgress, type Category, type Transaction } from '@spendly/shared';
import { BudgetBar, BudgetStatusLabel } from '@/components/budget-bar';
import { Delta } from '@/components/common';
import { GroupedTransactionList } from '@/components/transactions/transaction-list';
import { formatRelativeDay, percentChange } from '@/lib/format';
import { useTransactionSheet } from '@/lib/ui-store';

const food: Category = { id: 'c1', name: 'Food', type: 'expense', icon: 'utensils', color: '#f97316' };
const tx = (overrides: Partial<Transaction>): Transaction => ({
  id: 't1',
  type: 'expense',
  title: 'Lunch',
  amount: 1500,
  currency: 'LKR',
  baseAmount: 1500,
  categoryId: 'c1',
  date: '2025-03-01',
  note: '',
  recurringId: null,
  createdAt: '2025-03-01T10:00:00Z',
  ...overrides,
});

describe('format helpers', () => {
  it('calculates percent change and labels relative days', () => {
    expect(percentChange(150, 100)).toBe(0.5);
    expect(percentChange(10, 0)).toBeNull();
    const today = new Date();
    const key = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    expect(formatRelativeDay(key)).toBe('Today');
  });
});

describe('Delta', () => {
  it('treats rising expenses as bad', () => {
    const { container } = render(<Delta change={0.25} goodWhenUp={false} />);
    expect(container.firstElementChild).toHaveClass('text-expense');
    expect(container).toHaveTextContent('25%');
  });
});

describe('budget components', () => {
  it('pairs status colour with an icon and a label', () => {
    render(<BudgetStatusLabel status="over" />);
    expect(screen.getByText('Over budget')).toBeInTheDocument();
  });

  it('caps the bar width at 100% but reports the real value', () => {
    render(<BudgetBar progress={getBudgetProgress(150, 100)} />);
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuenow', '150');
    expect(bar.firstElementChild).toHaveStyle({ width: '100%' });
  });
});

describe('GroupedTransactionList', () => {
  it('groups by day, shows converted amounts and opens the editor on click', async () => {
    render(
      <GroupedTransactionList
        transactions={[
          tx({}),
          tx({ id: 't2', title: 'Netflix', currency: 'USD', amount: 10, baseAmount: 3000 }),
          tx({ id: 't3', title: 'Salary', type: 'income', amount: 100000, baseAmount: 100000, date: '2025-02-25' }),
        ]}
        categories={new Map([[food.id, food]])}
        baseCurrency="LKR"
      />,
    );
    expect(screen.getByText('Sat, Mar 1')).toBeInTheDocument();
    expect(screen.getByText('Tue, Feb 25')).toBeInTheDocument();
    expect(screen.getByText(/≈ LKR\s?3,000\.00/)).toBeInTheDocument();

    await userEvent.click(screen.getByText('Netflix'));
    expect(useTransactionSheet.getState()).toMatchObject({ open: true, editing: { id: 't2' } });
  });
});
