import { Router } from 'express';
import { recurringInputSchema, toDateKey } from '@spendly/shared';
import { badRequest, notFound } from '../lib/errors';
import { toRecurringDto } from '../lib/serialize';
import { RecurringRule } from '../models/RecurringRule';
import { assertCategoryOwned } from '../services/categories';
import { nextOccurrence, processDueRules } from '../services/recurring';

export const recurringRouter = Router();

recurringRouter.get('/', async (req, res) => {
  const rules = await RecurringRule.find({ userId: req.userId }).sort({ active: -1, nextRun: 1 });
  res.json(rules.map(toRecurringDto));
});

recurringRouter.post('/', async (req, res) => {
  const input = recurringInputSchema.parse(req.body);
  if (!(await assertCategoryOwned(req.userId, input.categoryId, input.type))) {
    throw badRequest('Pick a valid category for this rule.');
  }
  const rule = await RecurringRule.create({
    ...input,
    userId: req.userId,
    nextRun: input.startDate,
  });
  // A start date in the past (or today) creates the due transactions straight away.
  await processDueRules(req.userId);
  res.status(201).json(toRecurringDto((await RecurringRule.findById(rule._id))!));
});

recurringRouter.put('/:id', async (req, res) => {
  const input = recurringInputSchema.parse(req.body);
  const rule = await RecurringRule.findOne({ _id: req.params.id, userId: req.userId });
  if (!rule) throw notFound('Recurring rule not found.');
  if (!(await assertCategoryOwned(req.userId, input.categoryId, input.type))) {
    throw badRequest('Pick a valid category for this rule.');
  }

  const scheduleChanged = rule.startDate !== input.startDate || rule.frequency !== input.frequency;
  rule.set(input);
  if (scheduleChanged) {
    // Restart from the new start date, skipping occurrences that already passed.
    const today = toDateKey(new Date());
    let next = input.startDate;
    while (next < today) next = nextOccurrence(next, input.frequency, input.startDate);
    rule.nextRun = next;
  }
  await rule.save();
  await processDueRules(req.userId);
  res.json(toRecurringDto((await RecurringRule.findById(rule._id))!));
});

recurringRouter.delete('/:id', async (req, res) => {
  const result = await RecurringRule.deleteOne({ _id: req.params.id, userId: req.userId });
  if (result.deletedCount === 0) throw notFound('Recurring rule not found.');
  res.status(204).end();
});
