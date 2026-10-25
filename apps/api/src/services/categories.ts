import { DEFAULT_CATEGORIES, type TransactionType } from '@spendly/shared';
import { Category } from '../models/Category';

/** Gives a user the default categories if they have none yet (new or migrated accounts). */
export const ensureDefaultCategories = async (userId: string) => {
  const count = await Category.countDocuments({ userId });
  if (count > 0) return;
  await Category.insertMany(
    DEFAULT_CATEGORIES.map((category) => ({ ...category, userId })),
    {
      ordered: false,
    },
  ).catch(() => undefined); // A concurrent request may have seeded them already.
};

export const listCategories = async (userId: string) => {
  await ensureDefaultCategories(userId);
  return Category.find({ userId }).sort({ type: 1, name: 1 });
};

/** The catch-all category of a type that orphaned transactions are moved to. */
export const getFallbackCategory = async (userId: string, type: TransactionType) => {
  const name = type === 'income' ? 'Other Income' : 'Other';
  const existing = await Category.findOne({ userId, type, name });
  if (existing) return existing;
  const preset = DEFAULT_CATEGORIES.find((category) => category.name === name)!;
  return Category.create({ ...preset, userId });
};

export const assertCategoryOwned = async (
  userId: string,
  categoryId: string,
  type?: TransactionType,
) => {
  const category = await Category.findOne({ _id: categoryId, userId });
  if (!category) return null;
  if (type && category.type !== type) return null;
  return category;
};
