export const normalizeBudgetValue = (value) => {
  const numericValue = Number(value);

  return Number.isFinite(numericValue) && numericValue >= 0 ? numericValue : 0;
};

export const normalizeCategoryBudgets = (value, categories) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }

  return categories.reduce((normalizedBudgets, category) => {
    normalizedBudgets[category] = normalizeBudgetValue(value[category]);
    return normalizedBudgets;
  }, {});
};

export const getBudgetComparisonStatus = (spending, budget) => {
  if (budget <= 0) {
    return {
      label: 'No budget set',
      modifier: 'neutral',
    };
  }

  if (spending > budget) {
    return {
      label: 'Over budget',
      modifier: 'over',
    };
  }

  if ((spending / budget) * 100 > 80) {
    return {
      label: 'Near limit',
      modifier: 'warning',
    };
  }

  return {
    label: 'Within budget',
    modifier: 'safe',
  };
};

export const createCategoryBudgetSummary = ({
  categories,
  categoryBudgets,
  spendingByCategory,
}) =>
  categories.map((category) => {
    const budget = normalizeBudgetValue(categoryBudgets[category]);
    const spending = normalizeBudgetValue(spendingByCategory[category]);
    const percentageUsed = budget > 0 ? (spending / budget) * 100 : 0;
    const remaining = budget - spending;

    return {
      category,
      budget,
      spending,
      remaining,
      percentageUsed,
      status: getBudgetComparisonStatus(spending, budget),
    };
  });
