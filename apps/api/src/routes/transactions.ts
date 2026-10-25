import { Router } from 'express';
import type { QueryFilter } from 'mongoose';
import {
  bulkDeleteSchema,
  monthRange,
  transactionInputSchema,
  transactionQuerySchema,
  type Currency,
  type Paginated,
  type Transaction as TransactionDto,
} from '@spendly/shared';
import { badRequest, notFound } from '../lib/errors';
import { convert } from '../lib/fx';
import { toTransactionDto } from '../lib/serialize';
import { Category } from '../models/Category';
import { Transaction, type TransactionDoc } from '../models/Transaction';
import { User } from '../models/User';
import { assertCategoryOwned } from '../services/categories';

export const transactionsRouter = Router();

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const buildFilter = (userId: string, query: ReturnType<typeof transactionQuerySchema.parse>) => {
  const filter: QueryFilter<TransactionDoc> = { userId };
  if (query.month) {
    const { start, end } = monthRange(query.month);
    filter.date = { $gte: start, $lte: end };
  } else if (query.from || query.to) {
    filter.date = { ...(query.from && { $gte: query.from }), ...(query.to && { $lte: query.to }) };
  }
  if (query.type) filter.type = query.type;
  if (query.categoryId) filter.categoryId = query.categoryId;
  if (query.search) {
    const pattern = new RegExp(escapeRegex(query.search), 'i');
    filter.$or = [{ title: pattern }, { note: pattern }];
  }
  return filter;
};

const SORTS = {
  date: { date: 1, createdAt: 1 },
  '-date': { date: -1, createdAt: -1 },
  amount: { baseAmount: 1 },
  '-amount': { baseAmount: -1 },
} as const;

const getBaseCurrency = async (userId: string) => {
  const user = await User.findById(userId, 'baseCurrency');
  return (user?.baseCurrency ?? 'LKR') as Currency;
};

transactionsRouter.get('/', async (req, res) => {
  const query = transactionQuerySchema.parse(req.query);
  const filter = buildFilter(req.userId, query);

  const [items, total] = await Promise.all([
    Transaction.find(filter)
      .sort(SORTS[query.sort])
      .skip((query.page - 1) * query.limit)
      .limit(query.limit),
    Transaction.countDocuments(filter),
  ]);

  const body: Paginated<TransactionDto> = {
    items: items.map(toTransactionDto),
    total,
    page: query.page,
    pages: Math.max(1, Math.ceil(total / query.limit)),
  };
  res.json(body);
});

const csvCell = (value: string | number) => {
  const text = String(value);
  // Quote when needed and neutralise spreadsheet formula injection.
  const safe = /^[=+\-@\t\r]/.test(text) && typeof value === 'string' ? `'${text}` : text;
  return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
};

transactionsRouter.get('/export.csv', async (req, res) => {
  const query = transactionQuerySchema.parse(req.query);
  const [items, categories, baseCurrency] = await Promise.all([
    Transaction.find(buildFilter(req.userId, query)).sort(SORTS['-date']).limit(10000),
    Category.find({ userId: req.userId }),
    getBaseCurrency(req.userId),
  ]);
  const nameById = new Map(categories.map((category) => [category.id as string, category.name]));

  const header = [
    'Date',
    'Type',
    'Title',
    'Category',
    'Amount',
    'Currency',
    `Amount (${baseCurrency})`,
    'Note',
  ];
  const rows = items.map((tx) =>
    [
      tx.date,
      tx.type,
      tx.title,
      nameById.get(tx.categoryId.toString()) ?? '',
      tx.amount,
      tx.currency,
      tx.baseAmount,
      tx.note ?? '',
    ]
      .map(csvCell)
      .join(','),
  );

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="spendly-${query.month ?? 'transactions'}.csv"`,
  );
  // A UTF-8 byte-order mark makes Excel open the file with the right encoding.
  res.send(`${String.fromCharCode(0xfeff)}${[header.join(','), ...rows].join('\r\n')}`);
});

transactionsRouter.post('/', async (req, res) => {
  const input = transactionInputSchema.parse(req.body);
  if (!(await assertCategoryOwned(req.userId, input.categoryId, input.type))) {
    throw badRequest('Pick a valid category for this transaction type.');
  }
  const baseAmount = await convert(input.amount, input.currency, await getBaseCurrency(req.userId));
  const tx = await Transaction.create({ ...input, baseAmount, userId: req.userId });
  res.status(201).json(toTransactionDto(tx));
});

transactionsRouter.put('/:id', async (req, res) => {
  const input = transactionInputSchema.parse(req.body);
  const tx = await Transaction.findOne({ _id: req.params.id, userId: req.userId });
  if (!tx) throw notFound('Transaction not found.');
  if (!(await assertCategoryOwned(req.userId, input.categoryId, input.type))) {
    throw badRequest('Pick a valid category for this transaction type.');
  }

  const amountChanged = tx.amount !== input.amount || tx.currency !== input.currency;
  tx.set(input);
  if (amountChanged)
    tx.baseAmount = await convert(input.amount, input.currency, await getBaseCurrency(req.userId));
  await tx.save();
  res.json(toTransactionDto(tx));
});

transactionsRouter.delete('/:id', async (req, res) => {
  const result = await Transaction.deleteOne({ _id: req.params.id, userId: req.userId });
  if (result.deletedCount === 0) throw notFound('Transaction not found.');
  res.status(204).end();
});

transactionsRouter.post('/bulk-delete', async (req, res) => {
  const { ids } = bulkDeleteSchema.parse(req.body);
  const result = await Transaction.deleteMany({ _id: { $in: ids }, userId: req.userId });
  res.json({ deleted: result.deletedCount });
});
