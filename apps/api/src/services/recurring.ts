import { parseDateKey, toDateKey, type Currency, type RecurringFrequency } from '@spendly/shared';
import { convert } from '../lib/fx';
import { logger } from '../lib/logger';
import { RecurringRule, type RecurringRuleDoc } from '../models/RecurringRule';
import { Transaction } from '../models/Transaction';
import { User } from '../models/User';

/** Safety cap so a rule with an old start date can't create thousands of rows at once. */
const MAX_RUNS_PER_RULE = 120;

/**
 * Next occurrence after `current`. Monthly and yearly rules keep the start date's
 * day of month, clamped to shorter months (Jan 31 → Feb 28 → Mar 31).
 */
export const nextOccurrence = (
  current: string,
  frequency: RecurringFrequency,
  startDate: string,
) => {
  const date = parseDateKey(current)!;
  const anchorDay = Number(startDate.slice(8, 10));

  switch (frequency) {
    case 'daily':
      return toDateKey(new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1));
    case 'weekly':
      return toDateKey(new Date(date.getFullYear(), date.getMonth(), date.getDate() + 7));
    case 'monthly':
    case 'yearly': {
      const year = date.getFullYear() + (frequency === 'yearly' ? 1 : 0);
      const month = date.getMonth() + (frequency === 'monthly' ? 1 : 0);
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      return toDateKey(new Date(year, month, Math.min(anchorDay, daysInMonth)));
    }
  }
};

const materializeRule = async (rule: RecurringRuleDoc, today: string, baseCurrency: Currency) => {
  let runs = 0;
  const docs = [];
  let nextRun = rule.nextRun;

  while (nextRun <= today && runs < MAX_RUNS_PER_RULE) {
    docs.push({
      userId: rule.userId,
      type: rule.type,
      title: rule.title,
      amount: rule.amount,
      currency: rule.currency,
      baseAmount: await convert(rule.amount, rule.currency as Currency, baseCurrency),
      categoryId: rule.categoryId,
      date: nextRun,
      note: '',
      recurringId: rule._id,
    });
    nextRun = nextOccurrence(nextRun, rule.frequency, rule.startDate);
    runs += 1;
  }

  if (docs.length === 0) return 0;
  await Transaction.insertMany(docs);
  // Only advance if nobody else processed this rule in the meantime.
  await RecurringRule.updateOne({ _id: rule._id, nextRun: rule.nextRun }, { nextRun });
  return docs.length;
};

/** Creates transactions for every due recurring rule (optionally for one user only). */
export const processDueRules = async (userId?: string) => {
  const today = toDateKey(new Date());
  const rules = await RecurringRule.find({
    active: true,
    nextRun: { $lte: today },
    ...(userId ? { userId } : {}),
  });
  if (rules.length === 0) return 0;

  const owners = await User.find(
    { _id: { $in: rules.map((rule) => rule.userId) } },
    'baseCurrency',
  );
  const currencyByUser = new Map(
    owners.map((owner) => [owner.id as string, owner.baseCurrency as Currency]),
  );

  let created = 0;
  for (const rule of rules) {
    try {
      const baseCurrency = currencyByUser.get(rule.userId.toString());
      if (baseCurrency) created += await materializeRule(rule, today, baseCurrency);
    } catch (error) {
      logger.error({ err: error, ruleId: rule.id }, 'Failed to process recurring rule');
    }
  }
  return created;
};
