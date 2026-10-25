/**
 * One-off migration from the v1 schema (`expenses` + single `budgets` doc per user)
 * to v2 (`transactions`, `categories`, `monthlybudgets`). Safe to run more than once.
 *
 *   npm run migrate:v1
 */
import mongoose, { type Types } from 'mongoose';
import { toDateKey, toMonthKey } from '@spendly/shared';
import { env } from '../env';
import { connectMongo } from '../lib/db';
import { Budget } from '../models/Budget';
import { Category } from '../models/Category';
import { Transaction } from '../models/Transaction';
import { User } from '../models/User';
import { getFallbackCategory, listCategories } from '../services/categories';

interface V1Expense {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  title: string;
  amount: number;
  category: string;
  date: Date;
  createdAt?: Date;
}

interface V1Budget {
  userId: Types.ObjectId;
  monthlyBudget?: number;
  categoryBudgets?: Record<string, number>;
}

await connectMongo(env.MONGODB_URI);
const db = mongoose.connection.db!;
const users = await User.find();
let migrated = 0;

for (const user of users) {
  const categories = await listCategories(user.id);
  const byName = new Map(
    categories.filter((c) => c.type === 'expense').map((c) => [c.name.toLowerCase(), c]),
  );
  const fallback = await getFallbackCategory(user.id, 'expense');

  const expenses = await db.collection<V1Expense>('expenses').find({ userId: user._id }).toArray();
  for (const expense of expenses) {
    // Reuse the old _id so re-running the script doesn't create duplicates.
    if (await Transaction.exists({ _id: expense._id })) continue;
    const category = byName.get(expense.category?.toLowerCase()) ?? fallback;
    await Transaction.create({
      _id: expense._id,
      userId: user._id,
      type: 'expense',
      title: expense.title,
      amount: expense.amount,
      currency: 'LKR',
      baseAmount: expense.amount,
      categoryId: category._id,
      date: toDateKey(new Date(expense.date)),
      note: '',
      createdAt: expense.createdAt,
    });
    migrated += 1;
  }

  const oldBudget = await db.collection<V1Budget>('budgets').findOne({ userId: user._id });
  if (oldBudget && !(await Budget.exists({ userId: user._id }))) {
    const categoryBudgets: Record<string, number> = {};
    for (const [name, amount] of Object.entries(oldBudget.categoryBudgets ?? {})) {
      const category = await Category.findOne({ userId: user._id, type: 'expense', name });
      if (category && amount > 0) categoryBudgets[category.id] = amount;
    }
    await Budget.create({
      userId: user._id,
      month: toMonthKey(new Date()),
      total: oldBudget.monthlyBudget ?? 0,
      categories: categoryBudgets,
    });
  }
}

console.log(`Migrated ${migrated} expenses for ${users.length} users.`);
await mongoose.disconnect();
