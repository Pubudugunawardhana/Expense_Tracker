import { Types } from 'mongoose';
import {
  monthRange,
  roundMoney,
  shiftMonth,
  type Currency,
  type MonthSummary,
} from '@spendly/shared';
import { Transaction } from '../models/Transaction';

interface TypeTotal {
  _id: 'income' | 'expense';
  total: number;
  count: number;
}

const totalsFor = async (userId: Types.ObjectId, start: string, end: string) => {
  const rows = await Transaction.aggregate<TypeTotal>([
    { $match: { userId, date: { $gte: start, $lte: end } } },
    { $group: { _id: '$type', total: { $sum: '$baseAmount' }, count: { $sum: 1 } } },
  ]);
  const income = rows.find((row) => row._id === 'income');
  const expense = rows.find((row) => row._id === 'expense');
  return {
    income: income?.total ?? 0,
    expense: expense?.total ?? 0,
    count: (income?.count ?? 0) + (expense?.count ?? 0),
  };
};

export const getMonthSummary = async (
  userIdString: string,
  month: string,
  currency: Currency,
): Promise<MonthSummary> => {
  const userId = new Types.ObjectId(userIdString);
  const { start, end, days } = monthRange(month);
  const previousRange = monthRange(shiftMonth(month, -1));
  const trendStart = monthRange(shiftMonth(month, -11)).start;
  const round = (value: number) => roundMoney(value, currency);

  const [current, previous, byCategory, dailyRows, trendRows] = await Promise.all([
    totalsFor(userId, start, end),
    totalsFor(userId, previousRange.start, previousRange.end),
    Transaction.aggregate<{ _id: Types.ObjectId; total: number; count: number }>([
      { $match: { userId, type: 'expense', date: { $gte: start, $lte: end } } },
      { $group: { _id: '$categoryId', total: { $sum: '$baseAmount' }, count: { $sum: 1 } } },
      { $sort: { total: -1 } },
    ]),
    Transaction.aggregate<{ _id: { date: string; type: string }; total: number }>([
      { $match: { userId, date: { $gte: start, $lte: end } } },
      { $group: { _id: { date: '$date', type: '$type' }, total: { $sum: '$baseAmount' } } },
    ]),
    Transaction.aggregate<{ _id: { month: string; type: string }; total: number }>([
      { $match: { userId, date: { $gte: trendStart, $lte: end } } },
      {
        $group: {
          _id: { month: { $substrCP: ['$date', 0, 7] }, type: '$type' },
          total: { $sum: '$baseAmount' },
        },
      },
    ]),
  ]);

  const daily = Array.from({ length: days }, (_, index) => {
    const date = `${month}-${String(index + 1).padStart(2, '0')}`;
    const pick = (type: string) =>
      round(dailyRows.find((row) => row._id.date === date && row._id.type === type)?.total ?? 0);
    return { date, income: pick('income'), expense: pick('expense') };
  });

  const trend = Array.from({ length: 12 }, (_, index) => {
    const key = shiftMonth(month, index - 11);
    const pick = (type: string) =>
      round(trendRows.find((row) => row._id.month === key && row._id.type === type)?.total ?? 0);
    return { month: key, income: pick('income'), expense: pick('expense') };
  });

  return {
    month,
    currency,
    income: round(current.income),
    expense: round(current.expense),
    net: round(current.income - current.expense),
    savingsRate: current.income > 0 ? (current.income - current.expense) / current.income : null,
    transactionCount: current.count,
    previous: { income: round(previous.income), expense: round(previous.expense) },
    byCategory: byCategory.map((row) => ({
      categoryId: row._id.toString(),
      total: round(row.total),
      count: row.count,
    })),
    daily,
    trend,
  };
};
