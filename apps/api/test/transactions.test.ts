import { describe, expect, it } from 'vitest';
import { shiftMonth, toDateKey, toMonthKey, type MonthSummary, type Paginated, type Transaction } from '@spendly/shared';
import { signUp } from './helpers';

const today = toDateKey(new Date());
const month = toMonthKey(new Date());

describe('transactions', () => {
  it('creates, lists, updates and deletes a transaction', async () => {
    const { agent, auth, categoryId } = await signUp();
    const created = await agent
      .post('/api/transactions')
      .set(auth)
      .send({ type: 'expense', title: 'Lunch', amount: 1500, currency: 'LKR', categoryId: categoryId('Food'), date: today, note: '' })
      .expect(201);
    expect(created.body).toMatchObject({ title: 'Lunch', baseAmount: 1500 });

    const list = (await agent.get(`/api/transactions?month=${month}`).set(auth).expect(200)).body as Paginated<Transaction>;
    expect(list.total).toBe(1);

    await agent
      .put(`/api/transactions/${created.body.id}`)
      .set(auth)
      .send({ ...created.body, title: 'Team lunch', amount: 2000 })
      .expect(200);
    const updated = (await agent.get('/api/transactions').set(auth)).body as Paginated<Transaction>;
    expect(updated.items[0]).toMatchObject({ title: 'Team lunch', baseAmount: 2000 });

    await agent.delete(`/api/transactions/${created.body.id}`).set(auth).expect(204);
    await agent.delete(`/api/transactions/${created.body.id}`).set(auth).expect(404);
  });

  it('converts foreign currency to the base currency', async () => {
    const { agent, auth, categoryId } = await signUp();
    const response = await agent
      .post('/api/transactions')
      .set(auth)
      .send({ type: 'expense', title: 'Netflix', amount: 10, currency: 'USD', categoryId: categoryId('Entertainment'), date: today, note: '' })
      .expect(201);
    expect(response.body.baseAmount).toBe(3000);
  });

  it('rejects invalid input and categories of the wrong type', async () => {
    const { agent, auth, categoryId } = await signUp();
    const base = { type: 'expense', title: 'X', amount: 10, currency: 'LKR', categoryId: categoryId('Food'), date: today, note: '' };
    await agent.post('/api/transactions').set(auth).send({ ...base, amount: -5 }).expect(400);
    await agent.post('/api/transactions').set(auth).send({ ...base, date: '2024-13-40' }).expect(400);
    await agent.post('/api/transactions').set(auth).send({ ...base, categoryId: categoryId('Salary') }).expect(400);
  });

  it("never exposes another user's data", async () => {
    const alice = await signUp();
    const bob = await signUp();
    const tx = await alice.agent
      .post('/api/transactions')
      .set(alice.auth)
      .send({ type: 'expense', title: 'Secret', amount: 10, currency: 'LKR', categoryId: alice.categoryId('Food'), date: today, note: '' });
    expect((await bob.agent.get('/api/transactions').set(bob.auth)).body.total).toBe(0);
    await bob.agent.delete(`/api/transactions/${tx.body.id}`).set(bob.auth).expect(404);
    // Bob can't file a transaction under Alice's category either.
    await bob.agent
      .post('/api/transactions')
      .set(bob.auth)
      .send({ type: 'expense', title: 'X', amount: 1, currency: 'LKR', categoryId: alice.categoryId('Food'), date: today, note: '' })
      .expect(400);
  });

  it('summarises a month and compares it with the previous one', async () => {
    const { agent, auth, categoryId } = await signUp();
    const lastMonthDate = `${shiftMonth(month, -1)}-15`;
    const post = (body: object) => agent.post('/api/transactions').set(auth).send({ currency: 'LKR', note: '', ...body }).expect(201);
    await post({ type: 'income', title: 'Salary', amount: 100000, categoryId: categoryId('Salary'), date: today });
    await post({ type: 'expense', title: 'Rent', amount: 40000, categoryId: categoryId('Housing'), date: today });
    await post({ type: 'expense', title: 'Food', amount: 10000, categoryId: categoryId('Food'), date: today });
    await post({ type: 'expense', title: 'Old', amount: 5000, categoryId: categoryId('Food'), date: lastMonthDate });

    const summary = (await agent.get(`/api/stats/summary?month=${month}`).set(auth).expect(200)).body as MonthSummary;
    expect(summary).toMatchObject({ income: 100000, expense: 50000, net: 50000, savingsRate: 0.5, transactionCount: 3 });
    expect(summary.previous.expense).toBe(5000);
    expect(summary.byCategory[0]).toMatchObject({ categoryId: categoryId('Housing'), total: 40000 });
    expect(summary.trend).toHaveLength(12);
    expect(summary.trend.at(-1)).toMatchObject({ month, income: 100000, expense: 50000 });
  });

  it('exports CSV and neutralises spreadsheet formulas', async () => {
    const { agent, auth, categoryId } = await signUp();
    await agent
      .post('/api/transactions')
      .set(auth)
      .send({ type: 'expense', title: '=HYPERLINK("x")', amount: 10, currency: 'LKR', categoryId: categoryId('Food'), date: today, note: 'a, b' });
    const response = await agent.get(`/api/transactions/export.csv?month=${month}`).set(auth).expect(200);
    expect(response.headers['content-type']).toContain('text/csv');
    expect(response.text).toContain(`"'=HYPERLINK(""x"")"`);
    expect(response.text).toContain('"a, b"');
  });

  it('bulk deletes only the caller’s transactions', async () => {
    const { agent, auth, categoryId } = await signUp();
    const ids = [];
    for (let i = 0; i < 3; i += 1) {
      const res = await agent
        .post('/api/transactions')
        .set(auth)
        .send({ type: 'expense', title: `T${i}`, amount: 10, currency: 'LKR', categoryId: categoryId('Food'), date: today, note: '' });
      ids.push(res.body.id);
    }
    const response = await agent.post('/api/transactions/bulk-delete').set(auth).send({ ids: ids.slice(0, 2) }).expect(200);
    expect(response.body.deleted).toBe(2);
  });
});
