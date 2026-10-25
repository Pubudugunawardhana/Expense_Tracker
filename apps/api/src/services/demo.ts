import type { Types } from 'mongoose';
import { shiftMonth, toDateKey, toMonthKey, type Currency } from '@spendly/shared';
import { env } from '../env';
import { convert } from '../lib/fx';
import { randomToken } from '../lib/tokens';
import { Budget } from '../models/Budget';
import { Category } from '../models/Category';
import { AiInsight, Feedback } from '../models/misc';
import { RecurringRule } from '../models/RecurringRule';
import { RefreshToken } from '../models/RefreshToken';
import { Transaction } from '../models/Transaction';
import { User } from '../models/User';
import { listCategories } from './categories';
import { nextOccurrence } from './recurring';

/** Small deterministic PRNG so the demo data looks the same on every reset. */
const mulberry32 = (seed: number) => () => {
  let t = (seed += 0x6d2b79f5);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

interface Template {
  title: string;
  category: string;
  min: number;
  max: number;
  /** Expected occurrences per month. */
  perMonth: number;
  currency?: Currency;
}

const VARIABLE_EXPENSES: Template[] = [
  { title: 'Keells groceries', category: 'Food', min: 3500, max: 12000, perMonth: 5 },
  { title: 'Lunch', category: 'Food', min: 650, max: 1800, perMonth: 9 },
  { title: 'Coffee at Barista', category: 'Food', min: 750, max: 1400, perMonth: 4 },
  { title: 'Uber Eats dinner', category: 'Food', min: 1800, max: 4500, perMonth: 3 },
  { title: 'PickMe ride', category: 'Travel', min: 450, max: 2200, perMonth: 7 },
  { title: 'Fuel', category: 'Travel', min: 6000, max: 9500, perMonth: 2 },
  { title: 'Odel shopping', category: 'Shopping', min: 4500, max: 18000, perMonth: 1 },
  { title: 'Daraz order', category: 'Shopping', min: 1500, max: 9000, perMonth: 2 },
  { title: 'Movie at Scope Cinemas', category: 'Entertainment', min: 1800, max: 3600, perMonth: 1 },
  { title: 'Pharmacy', category: 'Health', min: 900, max: 4800, perMonth: 1 },
];

const FIXED: (Template & { day: number; type: 'income' | 'expense' })[] = [
  { title: 'Salary – Acme Software', category: 'Salary', min: 285000, max: 285000, perMonth: 1, day: 25, type: 'income' },
  { title: 'Apartment rent', category: 'Housing', min: 65000, max: 65000, perMonth: 1, day: 1, type: 'expense' },
  { title: 'CEB electricity bill', category: 'Bills', min: 5200, max: 8900, perMonth: 1, day: 8, type: 'expense' },
  { title: 'Dialog fibre', category: 'Bills', min: 4990, max: 4990, perMonth: 1, day: 12, type: 'expense' },
  { title: 'Netflix', category: 'Entertainment', min: 9.99, max: 9.99, perMonth: 1, day: 15, type: 'expense', currency: 'USD' },
  { title: 'Gym membership', category: 'Health', min: 7500, max: 7500, perMonth: 1, day: 3, type: 'expense' },
  { title: 'Udemy course', category: 'Education', min: 14.99, max: 14.99, perMonth: 0.5, day: 18, type: 'expense', currency: 'USD' },
  { title: 'Freelance – logo design', category: 'Freelance', min: 35000, max: 90000, perMonth: 0.7, day: 14, type: 'income' },
];

const round = (value: number, currency: Currency) =>
  currency === 'LKR' ? Math.round(value / 10) * 10 : Math.round(value * 100) / 100;

/** Recreates the demo account with ~4 months of realistic Sri Lankan data. */
export const resetDemoData = async () => {
  let user = await User.findOne({ email: env.DEMO_EMAIL });
  if (!user) {
    user = await User.create({
      name: 'Demo User',
      email: env.DEMO_EMAIL,
      password: randomToken(),
      baseCurrency: 'LKR',
      isDemo: true,
    });
  }
  user.name = 'Demo User';
  user.baseCurrency = 'LKR';
  user.isDemo = true;
  await user.save();

  const filter = { userId: user._id };
  await Promise.all([
    Transaction.deleteMany(filter),
    Category.deleteMany(filter),
    Budget.deleteMany(filter),
    RecurringRule.deleteMany(filter),
    AiInsight.deleteMany(filter),
    Feedback.deleteMany(filter),
    RefreshToken.deleteMany(filter),
  ]);

  const categories = await listCategories(user.id);
  const categoryId = (name: string) => categories.find((category) => category.name === name)!._id;
  const random = mulberry32(42);
  const today = new Date();
  const todayKey = toDateKey(today);
  const currentMonth = toMonthKey(today);
  const docs: Record<string, unknown>[] = [];

  const add = async (
    type: 'income' | 'expense',
    template: Template,
    date: string,
    recurringId: Types.ObjectId | null = null,
  ) => {
    const currency = template.currency ?? 'LKR';
    const amount = round(template.min + random() * (template.max - template.min), currency);
    docs.push({
      userId: user._id,
      type,
      title: template.title,
      amount,
      currency,
      baseAmount: await convert(amount, currency, 'LKR'),
      categoryId: categoryId(template.category),
      date,
      note: '',
      recurringId,
    });
  };

  for (let offset = -3; offset <= 0; offset += 1) {
    const month = shiftMonth(currentMonth, offset);
    const [y, m] = month.split('-').map(Number) as [number, number];
    const daysInMonth = new Date(y, m, 0).getDate();
    const lastDay = offset === 0 ? today.getDate() : daysInMonth;
    const dateFor = (day: number) => `${month}-${String(day).padStart(2, '0')}`;

    for (const template of FIXED) {
      if (template.day > lastDay || random() > template.perMonth) continue;
      await add(template.type, template, dateFor(template.day));
    }
    for (const template of VARIABLE_EXPENSES) {
      const count = Math.round(template.perMonth * (lastDay / daysInMonth) * (0.7 + random() * 0.6));
      for (let i = 0; i < count; i += 1) {
        await add('expense', template, dateFor(1 + Math.floor(random() * lastDay)));
      }
    }

    await Budget.create({
      userId: user._id,
      month,
      total: 210000,
      categories: {
        [categoryId('Food').toString()]: 45000,
        [categoryId('Travel').toString()]: 25000,
        [categoryId('Shopping').toString()]: 20000,
        [categoryId('Entertainment').toString()]: 10000,
        [categoryId('Bills').toString()]: 16000,
        [categoryId('Housing').toString()]: 65000,
      },
    });
  }

  await Transaction.insertMany(docs);

  const nextRunFor = (day: number) => {
    let date = `${currentMonth}-${String(day).padStart(2, '0')}`;
    while (date <= todayKey) date = nextOccurrence(date, 'monthly', date);
    return date;
  };
  await RecurringRule.insertMany(
    FIXED.filter((template) => template.perMonth === 1).map((template) => ({
      userId: user._id,
      type: template.type,
      title: template.title,
      amount: template.min,
      currency: template.currency ?? 'LKR',
      categoryId: categoryId(template.category),
      frequency: 'monthly',
      startDate: `${shiftMonth(currentMonth, -3)}-${String(template.day).padStart(2, '0')}`,
      nextRun: nextRunFor(template.day),
      active: true,
    })),
  );

  return user;
};
