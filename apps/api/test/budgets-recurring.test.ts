import { describe, expect, it } from 'vitest';
import {
  shiftMonth,
  toDateKey,
  toMonthKey,
  type Paginated,
  type RecurringRule,
  type Transaction,
} from '@spendly/shared';
import { nextOccurrence } from '../src/services/recurring';
import { signUp } from './helpers';

const month = toMonthKey(new Date());

describe('budgets', () => {
  it('saves a monthly budget that later months inherit', async () => {
    const { agent, auth, categoryId } = await signUp();
    const empty = await agent.get(`/api/budgets/${month}`).set(auth).expect(200);
    expect(empty.body).toEqual({ month, total: 0, categories: {} });

    const food = categoryId('Food');
    await agent
      .put(`/api/budgets/${month}`)
      .set(auth)
      .send({ total: 100000, categories: { [food]: 30000 } })
      .expect(200);

    const next = await agent
      .get(`/api/budgets/${shiftMonth(month, 1)}`)
      .set(auth)
      .expect(200);
    expect(next.body).toEqual({
      month: shiftMonth(month, 1),
      total: 100000,
      categories: { [food]: 30000 },
    });

    const previous = await agent
      .get(`/api/budgets/${shiftMonth(month, -1)}`)
      .set(auth)
      .expect(200);
    expect(previous.body.total).toBe(0);
  });

  it('validates the month', async () => {
    const { agent, auth } = await signUp();
    await agent.get('/api/budgets/2024-13').set(auth).expect(400);
  });
});

describe('recurring rules', () => {
  it('computes the next occurrence, clamping month ends', () => {
    expect(nextOccurrence('2025-01-31', 'monthly', '2025-01-31')).toBe('2025-02-28');
    expect(nextOccurrence('2025-02-28', 'monthly', '2025-01-31')).toBe('2025-03-31');
    expect(nextOccurrence('2024-02-29', 'yearly', '2024-02-29')).toBe('2025-02-28');
    expect(nextOccurrence('2025-12-29', 'weekly', '2025-12-29')).toBe('2026-01-05');
    expect(nextOccurrence('2025-12-31', 'daily', '2025-12-31')).toBe('2026-01-01');
  });

  it('back-fills transactions for a rule that started in the past', async () => {
    const { agent, auth, categoryId } = await signUp();
    const start = new Date();
    start.setDate(start.getDate() - 14);

    const response = await agent
      .post('/api/recurring')
      .set(auth)
      .send({
        type: 'expense',
        title: 'Gym',
        amount: 500,
        currency: 'LKR',
        categoryId: categoryId('Health'),
        frequency: 'weekly',
        startDate: toDateKey(start),
        active: true,
      })
      .expect(201);
    const rule = response.body as RecurringRule;
    expect(rule.nextRun > toDateKey(new Date())).toBe(true);

    const list = (await agent.get('/api/transactions?search=Gym').set(auth))
      .body as Paginated<Transaction>;
    expect(list.total).toBe(3); // 14 days ago, 7 days ago, today
    expect(list.items.every((tx) => tx.recurringId === rule.id)).toBe(true);
  });

  it('does not create transactions for paused rules', async () => {
    const { agent, auth, categoryId } = await signUp();
    await agent
      .post('/api/recurring')
      .set(auth)
      .send({
        type: 'income',
        title: 'Salary',
        amount: 1000,
        currency: 'LKR',
        categoryId: categoryId('Salary'),
        frequency: 'monthly',
        startDate: toDateKey(new Date()),
        active: false,
      })
      .expect(201);
    expect((await agent.get('/api/transactions').set(auth)).body.total).toBe(0);
  });
});

describe('categories', () => {
  it('moves transactions to "Other" when a category is deleted', async () => {
    const { agent, auth, categoryId } = await signUp();
    await agent
      .post('/api/transactions')
      .set(auth)
      .send({
        type: 'expense',
        title: 'Shoes',
        amount: 10,
        currency: 'LKR',
        categoryId: categoryId('Shopping'),
        date: toDateKey(new Date()),
        note: '',
      });
    await agent
      .delete(`/api/categories/${categoryId('Shopping')}`)
      .set(auth)
      .expect(204);
    const list = (await agent.get('/api/transactions').set(auth)).body as Paginated<Transaction>;
    expect(list.items[0]!.categoryId).toBe(categoryId('Other'));
    await agent
      .delete(`/api/categories/${categoryId('Other')}`)
      .set(auth)
      .expect(400);
  });
});

describe('ai', () => {
  it('reports that AI is unavailable without an API key', async () => {
    const { agent, auth } = await signUp();
    await agent.post('/api/ai/parse').set(auth).send({ text: 'lunch 1500' }).expect(503);
    const config = await agent.get('/api/config').expect(200);
    expect(config.body.features.ai).toBe(false);
  });
});
