const pad = (value: number) => value.toString().padStart(2, '0');

export const DATE_KEY_RE = /^\d{4}-\d{2}-\d{2}$/;
export const MONTH_KEY_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

/** `YYYY-MM-DD` in local time. */
export const toDateKey = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

/** `YYYY-MM` in local time. */
export const toMonthKey = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;

/** Parses `YYYY-MM-DD` (or an ISO string) to a local date, or null when invalid. */
export const parseDateKey = (value: string): Date | null => {
  const match = value.slice(0, 10).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const y = Number(match[1]);
  const m = Number(match[2]);
  const d = Number(match[3]);
  const date = new Date(y, m - 1, d);
  if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) return null;
  return date;
};

/** First and last `YYYY-MM-DD` of a `YYYY-MM` month. */
export const monthRange = (month: string) => {
  const [y, m] = month.split('-').map(Number) as [number, number];
  const lastDay = new Date(y, m, 0).getDate();
  return { start: `${month}-01`, end: `${month}-${pad(lastDay)}`, days: lastDay };
};

export const shiftMonth = (month: string, delta: number) => {
  const [y, m] = month.split('-').map(Number) as [number, number];
  return toMonthKey(new Date(y, m - 1 + delta, 1));
};
