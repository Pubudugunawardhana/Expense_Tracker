import type { CategoryIcon, Currency, RecurringFrequency, TransactionType } from './constants';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  baseCurrency: Currency;
  hasPassword: boolean;
  googleLinked: boolean;
  createdAt: string;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  icon: CategoryIcon;
  color: string;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  title: string;
  amount: number;
  currency: Currency;
  /** Amount converted to the user's base currency. */
  baseAmount: number;
  categoryId: string;
  date: string;
  note: string;
  recurringId: string | null;
  createdAt: string;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pages: number;
}

export interface Budget {
  month: string;
  total: number;
  categories: Record<string, number>;
}

export interface RecurringRule {
  id: string;
  type: TransactionType;
  title: string;
  amount: number;
  currency: Currency;
  categoryId: string;
  frequency: RecurringFrequency;
  startDate: string;
  nextRun: string;
  active: boolean;
}

export interface CategoryTotal {
  categoryId: string;
  total: number;
  count: number;
}

export interface DailyPoint {
  date: string;
  income: number;
  expense: number;
}

export interface MonthPoint {
  month: string;
  income: number;
  expense: number;
}

export interface MonthSummary {
  month: string;
  currency: Currency;
  income: number;
  expense: number;
  net: number;
  /** Net / income, 0–1 (null when there is no income). */
  savingsRate: number | null;
  transactionCount: number;
  previous: { income: number; expense: number };
  /** Expense totals per category for the month. */
  byCategory: CategoryTotal[];
  daily: DailyPoint[];
  /** Last 12 months, oldest first, for trend charts. */
  trend: MonthPoint[];
}

export type InsightTone = 'positive' | 'warning' | 'info';

export interface Insight {
  title: string;
  body: string;
  tone: InsightTone;
}

export interface InsightsResponse {
  month: string;
  insights: Insight[];
  generatedAt: string;
}

export interface ParsedTransaction {
  type: TransactionType;
  title: string;
  amount: number;
  currency: Currency;
  categoryId: string;
  date: string;
  note: string;
}

export interface Feedback {
  id: string;
  rating: number;
  message: string;
  createdAt: string;
}

export interface ApiErrorBody {
  message: string;
  issues?: { path: string; message: string }[];
}
