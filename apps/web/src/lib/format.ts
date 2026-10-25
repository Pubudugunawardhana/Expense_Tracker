import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns';
import { formatMoney, parseDateKey, type Currency } from '@spendly/shared';

export { formatMoney };

export const formatDateKey = (dateKey: string, pattern = 'MMM d, yyyy') => {
  const date = parseDateKey(dateKey);
  return date ? format(date, pattern) : dateKey;
};

/** "Today", "Yesterday", or "Mon, Oct 21". */
export const formatRelativeDay = (dateKey: string) => {
  const date = parseDateKey(dateKey);
  if (!date) return dateKey;
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'EEE, MMM d');
};

export const formatMonth = (month: string, pattern = 'MMMM yyyy') =>
  formatDateKey(`${month}-01`, pattern);

export const formatPercent = (ratio: number, digits = 0) =>
  new Intl.NumberFormat('en-US', { style: 'percent', maximumFractionDigits: digits }).format(ratio);

export const formatAgo = (iso: string) => formatDistanceToNow(new Date(iso), { addSuffix: true });

/** Percent change from `previous` to `current`, or null when there's nothing to compare. */
export const percentChange = (current: number, previous: number) =>
  previous > 0 ? (current - previous) / previous : null;

export const compactMoney = (value: number, currency: Currency) =>
  formatMoney(value, currency, { compact: true });
