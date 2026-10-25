import { z } from 'zod';
import { CATEGORY_ICONS, CURRENCIES, RECURRING_FREQUENCIES, TRANSACTION_TYPES } from './constants';
import { DATE_KEY_RE, MONTH_KEY_RE, parseDateKey } from './dates';

export const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');
const dateKey = z
  .string()
  .regex(DATE_KEY_RE, 'Use YYYY-MM-DD')
  .refine((value) => parseDateKey(value) !== null, 'Not a real date');
export const monthKeySchema = z.string().regex(MONTH_KEY_RE, 'Use YYYY-MM');
const money = z
  .number({ error: 'Enter an amount' })
  .positive('Must be greater than 0')
  .max(1e12, 'Too large');
const email = z.string().trim().toLowerCase().pipe(z.email('Enter a valid email'));

// ─── Auth ────────────────────────────────────────────────────────────────
const password = z.string().min(8, 'At least 8 characters').max(128);

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Enter your name').max(60),
  email,
  password,
});
export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Enter your password'),
});
export const forgotPasswordSchema = z.object({ email });
export const resetPasswordSchema = z.object({ token: z.string().min(10), password });
export const googleAuthSchema = z.object({ credential: z.string().min(10) });
export const updateProfileSchema = z.object({
  name: z.string().trim().min(2, 'Enter your name').max(60).optional(),
  baseCurrency: z.enum(CURRENCIES).optional(),
});
export const changePasswordSchema = z.object({
  currentPassword: z.string().optional(),
  newPassword: password,
});

// ─── Categories ──────────────────────────────────────────────────────────
export const categoryInputSchema = z.object({
  name: z.string().trim().min(1, 'Enter a name').max(40),
  type: z.enum(TRANSACTION_TYPES),
  icon: z.enum(CATEGORY_ICONS),
  color: z.string().regex(/^#[0-9a-f]{6}$/i, 'Use a hex color'),
});

// ─── Transactions ────────────────────────────────────────────────────────
export const transactionInputSchema = z.object({
  type: z.enum(TRANSACTION_TYPES),
  title: z.string().trim().min(1, 'Enter a title').max(120),
  amount: money,
  currency: z.enum(CURRENCIES),
  categoryId: objectIdSchema,
  date: dateKey,
  note: z.string().trim().max(500),
});

export const transactionQuerySchema = z.object({
  month: monthKeySchema.optional(),
  from: dateKey.optional(),
  to: dateKey.optional(),
  type: z.enum(TRANSACTION_TYPES).optional(),
  categoryId: objectIdSchema.optional(),
  search: z.string().trim().max(100).optional(),
  sort: z.enum(['date', '-date', 'amount', '-amount']).default('-date'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(1000).default(50),
});

export const bulkDeleteSchema = z.object({ ids: z.array(objectIdSchema).min(1).max(500) });

// ─── Budgets ─────────────────────────────────────────────────────────────
export const budgetInputSchema = z.object({
  total: z.number().min(0).max(1e12),
  categories: z.record(z.string(), z.number().min(0).max(1e12)),
});

// ─── Recurring ───────────────────────────────────────────────────────────
export const recurringInputSchema = z.object({
  type: z.enum(TRANSACTION_TYPES),
  title: z.string().trim().min(1, 'Enter a title').max(120),
  amount: money,
  currency: z.enum(CURRENCIES),
  categoryId: objectIdSchema,
  frequency: z.enum(RECURRING_FREQUENCIES),
  startDate: dateKey,
  active: z.boolean(),
});

// ─── AI ──────────────────────────────────────────────────────────────────
export const aiParseSchema = z.object({ text: z.string().trim().min(2).max(300) });

// ─── Feedback ────────────────────────────────────────────────────────────
export const feedbackInputSchema = z.object({
  rating: z.number().int().min(1, 'Pick a rating').max(5),
  message: z.string().trim().min(3, 'Tell us a bit more').max(1000),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type CategoryInput = z.infer<typeof categoryInputSchema>;
export type TransactionInput = z.infer<typeof transactionInputSchema>;
export type TransactionQuery = Partial<z.infer<typeof transactionQuerySchema>>;
export type BudgetInput = z.infer<typeof budgetInputSchema>;
export type RecurringInput = z.infer<typeof recurringInputSchema>;
export type FeedbackInput = z.infer<typeof feedbackInputSchema>;
