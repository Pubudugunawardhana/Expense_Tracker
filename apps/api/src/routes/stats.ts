import { Router } from 'express';
import { monthKeySchema, toMonthKey, type Currency } from '@spendly/shared';
import { User } from '../models/User';
import { getMonthSummary } from '../services/stats';

export const statsRouter = Router();

statsRouter.get('/summary', async (req, res) => {
  const month = monthKeySchema.parse(req.query.month ?? toMonthKey(new Date()));
  const user = await User.findById(req.userId, 'baseCurrency');
  res.json(await getMonthSummary(req.userId, month, (user?.baseCurrency ?? 'LKR') as Currency));
});
