import { Router } from 'express';
import { categoryInputSchema } from '@spendly/shared';
import { badRequest, notFound } from '../lib/errors';
import { toCategoryDto } from '../lib/serialize';
import { Budget } from '../models/Budget';
import { Category } from '../models/Category';
import { RecurringRule } from '../models/RecurringRule';
import { Transaction } from '../models/Transaction';
import { getFallbackCategory, listCategories } from '../services/categories';

export const categoriesRouter = Router();

categoriesRouter.get('/', async (req, res) => {
  const categories = await listCategories(req.userId);
  res.json(categories.map(toCategoryDto));
});

categoriesRouter.post('/', async (req, res) => {
  const input = categoryInputSchema.parse(req.body);
  const category = await Category.create({ ...input, userId: req.userId });
  res.status(201).json(toCategoryDto(category));
});

categoriesRouter.put('/:id', async (req, res) => {
  const input = categoryInputSchema.parse(req.body);
  const category = await Category.findOne({ _id: req.params.id, userId: req.userId });
  if (!category) throw notFound('Category not found.');
  if (input.type !== category.type && (await Transaction.exists({ categoryId: category._id }))) {
    throw badRequest("A category that already has transactions can't switch between income and expense.");
  }
  category.set(input);
  await category.save();
  res.json(toCategoryDto(category));
});

categoriesRouter.delete('/:id', async (req, res) => {
  const category = await Category.findOne({ _id: req.params.id, userId: req.userId });
  if (!category) throw notFound('Category not found.');

  const fallback = await getFallbackCategory(req.userId, category.type);
  if (fallback.id === category.id) throw badRequest(`"${category.name}" is the default category and can't be deleted.`);

  // Move everything that used this category to the fallback before deleting it.
  await Promise.all([
    Transaction.updateMany({ userId: req.userId, categoryId: category._id }, { categoryId: fallback._id }),
    RecurringRule.updateMany({ userId: req.userId, categoryId: category._id }, { categoryId: fallback._id }),
    Budget.updateMany({ userId: req.userId }, { $unset: { [`categories.${category.id}`]: '' } }),
  ]);
  await category.deleteOne();
  res.status(204).end();
});
