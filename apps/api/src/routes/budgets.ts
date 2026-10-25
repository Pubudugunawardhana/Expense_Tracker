import { Router } from 'express';
import { budgetInputSchema, monthKeySchema } from '@spendly/shared';
import { toBudgetDto } from '../lib/serialize';
import { Budget } from '../models/Budget';

export const budgetsRouter = Router();

/**
 * Returns the month's budget. Months without their own budget inherit the most
 * recent earlier one, so a budget set once keeps applying until it's changed.
 */
budgetsRouter.get('/:month', async (req, res) => {
  const month = monthKeySchema.parse(req.params.month);
  const budget = await Budget.findOne({ userId: req.userId, month: { $lte: month } }).sort({ month: -1 });
  res.json(toBudgetDto(month, budget));
});

budgetsRouter.put('/:month', async (req, res) => {
  const month = monthKeySchema.parse(req.params.month);
  const input = budgetInputSchema.parse(req.body);
  // Drop zero entries so "no budget" and "0" mean the same thing.
  const categories = Object.fromEntries(Object.entries(input.categories).filter(([, amount]) => amount > 0));

  const budget = await Budget.findOneAndUpdate(
    { userId: req.userId, month },
    { total: input.total, categories },
    { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true },
  );
  res.json(toBudgetDto(month, budget));
});
