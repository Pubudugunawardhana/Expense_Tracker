import type {
  Budget as BudgetDto,
  Category as CategoryDto,
  Currency,
  RecurringRule as RecurringRuleDto,
  Transaction as TransactionDto,
  User as UserDto,
} from '@spendly/shared';
import type { BudgetDoc } from '../models/Budget';
import type { CategoryDoc } from '../models/Category';
import type { RecurringRuleDoc } from '../models/RecurringRule';
import type { TransactionDoc } from '../models/Transaction';
import type { UserDoc } from '../models/User';

export const toUserDto = (user: UserDoc, hasPassword: boolean): UserDto => ({
  id: user.id,
  name: user.name,
  email: user.email,
  avatar: user.avatar ?? null,
  baseCurrency: user.baseCurrency as Currency,
  hasPassword,
  googleLinked: Boolean(user.googleId),
  createdAt: user.createdAt.toISOString(),
});

export const toCategoryDto = (category: CategoryDoc): CategoryDto => ({
  id: category.id,
  name: category.name,
  type: category.type,
  icon: category.icon,
  color: category.color,
});

export const toTransactionDto = (tx: TransactionDoc): TransactionDto => ({
  id: tx.id,
  type: tx.type,
  title: tx.title,
  amount: tx.amount,
  currency: tx.currency as Currency,
  baseAmount: tx.baseAmount,
  categoryId: tx.categoryId.toString(),
  date: tx.date,
  note: tx.note ?? '',
  recurringId: tx.recurringId ? tx.recurringId.toString() : null,
  createdAt: tx.createdAt.toISOString(),
});

export const toBudgetDto = (month: string, budget: BudgetDoc | null): BudgetDto => ({
  month,
  total: budget?.total ?? 0,
  categories: budget ? Object.fromEntries(budget.categories ?? new Map()) : {},
});

export const toRecurringDto = (rule: RecurringRuleDoc): RecurringRuleDto => ({
  id: rule.id,
  type: rule.type,
  title: rule.title,
  amount: rule.amount,
  currency: rule.currency as Currency,
  categoryId: rule.categoryId.toString(),
  frequency: rule.frequency,
  startDate: rule.startDate,
  nextRun: rule.nextRun,
  active: rule.active,
});
