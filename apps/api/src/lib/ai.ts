import Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { z } from 'zod';
import {
  CURRENCIES,
  TRANSACTION_TYPES,
  toDateKey,
  type Category,
  type Currency,
  type Insight,
  type MonthSummary,
} from '@spendly/shared';
import { env } from '../env';
import { AppError } from './errors';
import { logger } from './logger';

const client = env.ANTHROPIC_API_KEY ? new Anthropic({ apiKey: env.ANTHROPIC_API_KEY }) : null;

export const aiEnabled = Boolean(client);

const getClient = () => {
  if (!client) throw new AppError(503, 'AI features are not configured on this server.');
  return client;
};

const extractedTransactionSchema = z.object({
  type: z.enum(TRANSACTION_TYPES),
  title: z.string().describe('Short, human-friendly title, e.g. "Lunch at Ministry of Crab"'),
  amount: z.number().describe('Positive amount in `currency`'),
  currency: z.enum(CURRENCIES),
  categoryId: z.string().describe('id of the best matching category from the list'),
  date: z.string().describe('YYYY-MM-DD'),
  note: z.string().describe('Optional extra detail, or an empty string'),
});

export type ExtractedTransaction = z.infer<typeof extractedTransactionSchema>;

const insightsSchema = z.object({
  insights: z
    .array(
      z.object({
        title: z.string().describe('At most 6 words'),
        body: z.string().describe('One or two sentences with concrete numbers'),
        tone: z.enum(['positive', 'warning', 'info']),
      }),
    )
    .describe('Between 3 and 5 insights, most important first'),
});

const describeCategories = (categories: Category[]) =>
  categories.map((category) => `- ${category.id}: ${category.name} (${category.type})`).join('\n');

const extractionSystemPrompt = (
  categories: Category[],
  baseCurrency: Currency,
) => `You turn a user's input into one transaction for a personal finance app.
Today is ${toDateKey(new Date())}. Resolve relative dates ("yesterday", "last Friday") against today; default to today.
Default currency is ${baseCurrency} unless the input clearly says otherwise ("$" means USD, "Rs" or "rupees" means ${baseCurrency === 'INR' ? 'INR' : 'LKR'}).
Treat salary, refunds, payments received and sales as income; everything else is an expense.
Pick categoryId only from this list, matching the transaction type:
${describeCategories(categories)}`;

const handleApiError = (error: unknown): never => {
  if (error instanceof AppError) throw error;
  if (error instanceof Anthropic.RateLimitError) {
    throw new AppError(429, 'The AI service is busy right now. Please try again in a moment.');
  }
  if (error instanceof Anthropic.APIError) {
    logger.error({ status: error.status, message: error.message }, 'Anthropic API error');
    throw new AppError(502, 'The AI service could not process this request.');
  }
  throw error;
};

const parseOrThrow = <T>(response: { stop_reason: string | null; parsed_output?: T | null }) => {
  if (response.stop_reason === 'refusal') {
    throw new AppError(422, 'The AI declined to process this request.');
  }
  if (!response.parsed_output) {
    throw new AppError(422, "Couldn't understand that. Try something like “lunch 1500 yesterday”.");
  }
  return response.parsed_output;
};

/** "lunch 1500 yesterday" → a transaction draft. */
export const parseTransactionText = async (
  text: string,
  categories: Category[],
  baseCurrency: Currency,
): Promise<ExtractedTransaction> => {
  try {
    const response = await getClient().messages.parse({
      model: env.AI_MODEL_FAST,
      max_tokens: 2000,
      output_config: { effort: 'low', format: zodOutputFormat(extractedTransactionSchema) },
      system: extractionSystemPrompt(categories, baseCurrency),
      messages: [{ role: 'user', content: text }],
    });
    return parseOrThrow(response);
  } catch (error) {
    return handleApiError(error);
  }
};

export const RECEIPT_MEDIA_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const;
export type ReceiptMediaType = (typeof RECEIPT_MEDIA_TYPES)[number];

/** Reads a receipt photo and drafts a transaction from its total. */
export const parseReceiptImage = async (
  image: Buffer,
  mediaType: ReceiptMediaType,
  categories: Category[],
  baseCurrency: Currency,
): Promise<ExtractedTransaction> => {
  try {
    const response = await getClient().messages.parse({
      model: env.AI_MODEL_SMART,
      max_tokens: 4000,
      output_config: { effort: 'medium', format: zodOutputFormat(extractedTransactionSchema) },
      system: extractionSystemPrompt(categories, baseCurrency),
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mediaType, data: image.toString('base64') },
            },
            {
              type: 'text',
              text: 'This is a receipt. Use the grand total as the amount, the merchant as the title, the receipt date if printed, and list up to 3 main items in the note.',
            },
          ],
        },
      ],
    });
    return parseOrThrow(response);
  } catch (error) {
    return handleApiError(error);
  }
};

/** Short, specific coaching notes for one month of (already aggregated) data. */
export const generateInsights = async (
  summary: MonthSummary,
  categories: Category[],
  budget: { total: number; categories: Record<string, number> },
): Promise<Insight[]> => {
  const nameOf = (id: string) =>
    categories.find((category) => category.id === id)?.name ?? 'Unknown';
  // Only aggregates are sent – never raw transaction titles or notes.
  const payload = {
    month: summary.month,
    currency: summary.currency,
    income: summary.income,
    expense: summary.expense,
    savingsRate: summary.savingsRate,
    previousMonth: summary.previous,
    spendingByCategory: summary.byCategory.map((row) => ({
      category: nameOf(row.categoryId),
      total: row.total,
      transactions: row.count,
      budget: budget.categories[row.categoryId] ?? null,
    })),
    monthlyBudget: budget.total || null,
    last12Months: summary.trend,
    today: toDateKey(new Date()),
  };

  try {
    const response = await getClient().messages.parse({
      model: env.AI_MODEL_SMART,
      max_tokens: 4000,
      output_config: { effort: 'medium', format: zodOutputFormat(insightsSchema) },
      system:
        'You are a friendly, practical personal finance coach. Give specific observations grounded in the numbers provided (compare to last month, budgets and the 12-month trend). Mention amounts with the currency. If the month is still in progress, account for that. Never invent data.',
      messages: [{ role: 'user', content: JSON.stringify(payload) }],
    });
    return parseOrThrow(response).insights.slice(0, 5);
  } catch (error) {
    return handleApiError(error);
  }
};
