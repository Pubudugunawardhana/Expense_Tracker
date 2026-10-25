import crypto from 'node:crypto';
import { Router } from 'express';
import multer from 'multer';
import {
  aiParseSchema,
  monthKeySchema,
  toDateKey,
  toMonthKey,
  type Currency,
  type InsightsResponse,
  type ParsedTransaction,
} from '@spendly/shared';
import {
  RECEIPT_MEDIA_TYPES,
  generateInsights,
  parseReceiptImage,
  parseTransactionText,
  type ExtractedTransaction,
  type ReceiptMediaType,
} from '../lib/ai';
import { badRequest } from '../lib/errors';
import { toBudgetDto, toCategoryDto } from '../lib/serialize';
import { aiLimiter } from '../middleware/rateLimit';
import { Budget } from '../models/Budget';
import { AiInsight } from '../models/misc';
import { User } from '../models/User';
import { getFallbackCategory, listCategories } from '../services/categories';
import { getMonthSummary } from '../services/stats';

export const aiRouter = Router();
aiRouter.use(aiLimiter);

const upload = multer({
  storage: multer.memoryStorage(),
  // Vercel rejects request bodies over 4.5 MB.
  limits: { fileSize: 4 * 1024 * 1024, files: 1 },
});

const loadContext = async (userId: string) => {
  const [user, categories] = await Promise.all([
    User.findById(userId, 'baseCurrency'),
    listCategories(userId),
  ]);
  return {
    baseCurrency: (user?.baseCurrency ?? 'LKR') as Currency,
    categories: categories.map(toCategoryDto),
  };
};

/** Makes sure the model's draft only references the user's own categories and sane values. */
const sanitize = async (
  userId: string,
  draft: ExtractedTransaction,
  categories: { id: string; type: string }[],
): Promise<ParsedTransaction> => {
  const category = categories.find(
    (item) => item.id === draft.categoryId && item.type === draft.type,
  );
  const categoryId = category?.id ?? (await getFallbackCategory(userId, draft.type)).id;
  const date = /^\d{4}-\d{2}-\d{2}$/.test(draft.date) ? draft.date : toDateKey(new Date());

  return {
    type: draft.type,
    title: draft.title.slice(0, 120) || 'Untitled',
    amount: Math.abs(draft.amount),
    currency: draft.currency,
    categoryId,
    date,
    note: draft.note.slice(0, 500),
  };
};

aiRouter.post('/parse', async (req, res) => {
  const { text } = aiParseSchema.parse(req.body);
  const { baseCurrency, categories } = await loadContext(req.userId);
  const draft = await parseTransactionText(text, categories, baseCurrency);
  res.json(await sanitize(req.userId, draft, categories));
});

aiRouter.post('/receipt', upload.single('receipt'), async (req, res) => {
  const file = req.file;
  if (!file) throw badRequest('Attach a receipt image.');
  if (!RECEIPT_MEDIA_TYPES.includes(file.mimetype as ReceiptMediaType)) {
    throw badRequest('Upload a JPG, PNG, WebP or GIF image.');
  }
  const { baseCurrency, categories } = await loadContext(req.userId);
  const draft = await parseReceiptImage(
    file.buffer,
    file.mimetype as ReceiptMediaType,
    categories,
    baseCurrency,
  );
  res.json(await sanitize(req.userId, draft, categories));
});

aiRouter.get('/insights', async (req, res) => {
  const month = monthKeySchema.parse(req.query.month ?? toMonthKey(new Date()));
  const refresh = req.query.refresh === '1';
  const { baseCurrency, categories } = await loadContext(req.userId);

  const [summary, budgetDoc] = await Promise.all([
    getMonthSummary(req.userId, month, baseCurrency),
    Budget.findOne({ userId: req.userId, month: { $lte: month } }).sort({ month: -1 }),
  ]);
  const budget = toBudgetDto(month, budgetDoc);

  if (summary.transactionCount === 0) {
    const body: InsightsResponse = { month, insights: [], generatedAt: new Date().toISOString() };
    res.json(body);
    return;
  }

  // Reuse cached insights until the month's numbers or budget change.
  const dataHash = crypto
    .createHash('sha1')
    .update(JSON.stringify({ summary: { ...summary, trend: undefined }, budget }))
    .digest('hex');
  const cached = await AiInsight.findOne({ userId: req.userId, month });
  if (cached && cached.dataHash === dataHash && !refresh) {
    const body: InsightsResponse = {
      month,
      insights: cached.insights.map((item) => ({
        title: item.title ?? '',
        body: item.body ?? '',
        tone: (item.tone ?? 'info') as InsightsResponse['insights'][number]['tone'],
      })),
      generatedAt: cached.updatedAt.toISOString(),
    };
    res.json(body);
    return;
  }

  const insights = await generateInsights(summary, categories, budget);
  const saved = await AiInsight.findOneAndUpdate(
    { userId: req.userId, month },
    { dataHash, insights },
    { upsert: true, returnDocument: 'after' },
  );
  const body: InsightsResponse = { month, insights, generatedAt: saved.updatedAt.toISOString() };
  res.json(body);
});
