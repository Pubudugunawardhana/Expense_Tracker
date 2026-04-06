const padNumber = (value) => value.toString().padStart(2, '0');

const formatDateKey = (date) =>
  `${date.getFullYear()}-${padNumber(date.getMonth() + 1)}-${padNumber(
    date.getDate()
  )}`;

const parseExpenseDate = (value) => {
  if (typeof value !== 'string') {
    return null;
  }

  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (!match) {
    return null;
  }

  const [, year, month, day] = match;
  const parsedDate = new Date(Number(year), Number(month) - 1, Number(day));

  if (
    parsedDate.getFullYear() !== Number(year) ||
    parsedDate.getMonth() !== Number(month) - 1 ||
    parsedDate.getDate() !== Number(day)
  ) {
    return null;
  }

  return parsedDate;
};

export const normalizeExpenseDate = (value) => {
  const parsedDate = parseExpenseDate(value);

  if (parsedDate) {
    return formatDateKey(parsedDate);
  }

  return formatDateKey(new Date());
};

export const formatExpenseDate = (value, options = {}) => {
  const parsedDate = parseExpenseDate(normalizeExpenseDate(value));

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    ...options,
  }).format(parsedDate);
};

const buildGroupedSeries = (expenses, createGroup) => {
  const groupedData = expenses.reduce((totals, expense) => {
    const group = createGroup(expense);
    const currentTotal = totals[group.key]?.total ?? 0;

    totals[group.key] = {
      key: group.key,
      label: group.label,
      total: currentTotal + expense.amount,
    };

    return totals;
  }, {});

  return Object.values(groupedData).sort((firstItem, secondItem) =>
    firstItem.key.localeCompare(secondItem.key)
  );
};

export const getDailyExpenseData = (expenses) =>
  buildGroupedSeries(expenses, (expense) => ({
    key: normalizeExpenseDate(expense.date),
    label: formatExpenseDate(expense.date),
  }));

export const getMonthlyExpenseData = (expenses) =>
  buildGroupedSeries(expenses, (expense) => {
    const parsedDate = parseExpenseDate(normalizeExpenseDate(expense.date));
    const key = `${parsedDate.getFullYear()}-${padNumber(parsedDate.getMonth() + 1)}`;
    const label = new Intl.DateTimeFormat('en-US', {
      month: 'short',
      year: 'numeric',
    }).format(parsedDate);

    return { key, label };
  });

export const getYearlyExpenseData = (expenses) =>
  buildGroupedSeries(expenses, (expense) => {
    const parsedDate = parseExpenseDate(normalizeExpenseDate(expense.date));
    const key = parsedDate.getFullYear().toString();

    return { key, label: key };
  });

export const getCategoryExpenseData = (expenses) =>
  Object.values(
    expenses.reduce((totals, expense) => {
      const category = expense.category || 'Other';
      const currentTotal = totals[category]?.total ?? 0;

      totals[category] = {
        category,
        total: currentTotal + expense.amount,
      };

      return totals;
    }, {})
  ).sort((firstItem, secondItem) => secondItem.total - firstItem.total);

export const getExpenseAnalytics = (expenses) => ({
  daily: getDailyExpenseData(expenses),
  monthly: getMonthlyExpenseData(expenses),
  yearly: getYearlyExpenseData(expenses),
  categories: getCategoryExpenseData(expenses),
});
