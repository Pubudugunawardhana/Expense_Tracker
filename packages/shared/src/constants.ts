export const TRANSACTION_TYPES = ['income', 'expense'] as const;
export type TransactionType = (typeof TRANSACTION_TYPES)[number];

export const CURRENCIES = ['LKR', 'USD', 'EUR', 'GBP', 'INR', 'AUD', 'CAD', 'AED', 'JPY', 'SGD'] as const;
export type Currency = (typeof CURRENCIES)[number];
export const DEFAULT_CURRENCY: Currency = 'LKR';

export const RECURRING_FREQUENCIES = ['daily', 'weekly', 'monthly', 'yearly'] as const;
export type RecurringFrequency = (typeof RECURRING_FREQUENCIES)[number];

/** Share of a budget (0–1) after which it is flagged as "near limit". */
export const NEAR_LIMIT_RATIO = 0.8;

/** Icon names map to lucide-react icons on the frontend. */
export const CATEGORY_ICONS = [
  'utensils',
  'car',
  'receipt',
  'shopping-bag',
  'clapperboard',
  'heart-pulse',
  'home',
  'graduation-cap',
  'plane',
  'gift',
  'wifi',
  'shirt',
  'dumbbell',
  'paw-print',
  'briefcase',
  'laptop',
  'trending-up',
  'piggy-bank',
  'wallet',
  'circle-dashed',
] as const;
export type CategoryIcon = (typeof CATEGORY_ICONS)[number];

export interface DefaultCategory {
  name: string;
  type: TransactionType;
  icon: CategoryIcon;
  color: string;
}

export const DEFAULT_CATEGORIES: DefaultCategory[] = [
  { name: 'Food', type: 'expense', icon: 'utensils', color: '#f97316' },
  { name: 'Travel', type: 'expense', icon: 'car', color: '#0ea5e9' },
  { name: 'Bills', type: 'expense', icon: 'receipt', color: '#8b5cf6' },
  { name: 'Shopping', type: 'expense', icon: 'shopping-bag', color: '#ec4899' },
  { name: 'Entertainment', type: 'expense', icon: 'clapperboard', color: '#eab308' },
  { name: 'Health', type: 'expense', icon: 'heart-pulse', color: '#ef4444' },
  { name: 'Housing', type: 'expense', icon: 'home', color: '#14b8a6' },
  { name: 'Education', type: 'expense', icon: 'graduation-cap', color: '#6366f1' },
  { name: 'Other', type: 'expense', icon: 'circle-dashed', color: '#64748b' },
  { name: 'Salary', type: 'income', icon: 'briefcase', color: '#22c55e' },
  { name: 'Freelance', type: 'income', icon: 'laptop', color: '#10b981' },
  { name: 'Investments', type: 'income', icon: 'trending-up', color: '#84cc16' },
  { name: 'Other Income', type: 'income', icon: 'wallet', color: '#06b6d4' },
];
