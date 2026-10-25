import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { Category, CategoryTotal, Currency, DailyPoint, MonthPoint } from '@spendly/shared';
import { compactMoney, formatDateKey, formatMoney, formatMonth, formatPercent } from '@/lib/format';
import { cn } from '@/lib/utils';

const INCOME = 'var(--chart-income)';
const EXPENSE = 'var(--chart-expense)';
const axisProps = {
  tickLine: false,
  axisLine: false,
  tick: { fill: 'var(--muted-foreground)', fontSize: 12 },
} as const;

function ChartTooltip({
  active,
  payload,
  label,
  currency,
  formatLabel,
}: {
  active?: boolean;
  payload?: ReadonlyArray<{ dataKey?: unknown; name?: unknown; value?: unknown; color?: string }>;
  label?: unknown;
  currency: Currency;
  formatLabel: (label: string) => string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="min-w-40 rounded-lg border bg-popover px-3 py-2 text-sm shadow-lg">
      <div className="mb-1.5 font-medium">{formatLabel(String(label))}</div>
      {payload.map((entry) => (
        <div key={String(entry.dataKey)} className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <span className="size-2.5 rounded-sm" style={{ background: entry.color }} />
            {String(entry.name)}
          </span>
          <span className="font-medium tabular">{formatMoney(Number(entry.value), currency)}</span>
        </div>
      ))}
    </div>
  );
}

export function SeriesLegend({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-4 text-xs text-muted-foreground', className)}>
      <span className="flex items-center gap-1.5">
        <span className="size-2.5 rounded-sm" style={{ background: INCOME }} /> Income
      </span>
      <span className="flex items-center gap-1.5">
        <span className="size-2.5 rounded-sm" style={{ background: EXPENSE }} /> Expenses
      </span>
    </div>
  );
}

/** Running totals of income and expenses through the month. */
export function CashFlowChart({ daily, currency }: { daily: DailyPoint[]; currency: Currency }) {
  let income = 0;
  let expense = 0;
  const data = daily.map((point) => {
    income += point.income;
    expense += point.expense;
    return { date: point.date, income, expense };
  });

  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="fill-income" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={INCOME} stopOpacity={0.25} />
            <stop offset="100%" stopColor={INCOME} stopOpacity={0} />
          </linearGradient>
          <linearGradient id="fill-expense" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={EXPENSE} stopOpacity={0.25} />
            <stop offset="100%" stopColor={EXPENSE} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
        <XAxis
          dataKey="date"
          {...axisProps}
          tickFormatter={(value: string) => value.slice(8)}
          minTickGap={16}
        />
        <YAxis
          {...axisProps}
          width={56}
          tickFormatter={(value: number) => compactMoney(value, currency)}
        />
        <Tooltip
          cursor={{ stroke: 'var(--muted-foreground)', strokeDasharray: '4 4' }}
          content={(props) => (
            <ChartTooltip
              {...props}
              currency={currency}
              formatLabel={(label) => `Up to ${formatDateKey(label, 'MMM d')}`}
            />
          )}
        />
        <Area
          type="monotone"
          dataKey="income"
          name="Income"
          stroke={INCOME}
          strokeWidth={2}
          fill="url(#fill-income)"
          activeDot={{ r: 4, strokeWidth: 2, stroke: 'var(--card)' }}
        />
        <Area
          type="monotone"
          dataKey="expense"
          name="Expenses"
          stroke={EXPENSE}
          strokeWidth={2}
          fill="url(#fill-expense)"
          activeDot={{ r: 4, strokeWidth: 2, stroke: 'var(--card)' }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

/** Income vs expenses for the last 12 months. */
export function TrendChart({
  trend,
  currency,
  height = 260,
}: {
  trend: MonthPoint[];
  currency: Currency;
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={trend}
        margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
        barGap={2}
        barCategoryGap="24%"
      >
        <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
        <XAxis
          dataKey="month"
          {...axisProps}
          tickFormatter={(value: string) => formatMonth(value, 'MMM')}
        />
        <YAxis
          {...axisProps}
          width={56}
          tickFormatter={(value: number) => compactMoney(value, currency)}
        />
        <Tooltip
          cursor={{ fill: 'var(--muted)', opacity: 0.5 }}
          content={(props) => (
            <ChartTooltip
              {...props}
              currency={currency}
              formatLabel={(label) => formatMonth(label)}
            />
          )}
        />
        <Bar dataKey="income" name="Income" fill={INCOME} radius={[4, 4, 0, 0]} maxBarSize={22} />
        <Bar
          dataKey="expense"
          name="Expenses"
          fill={EXPENSE}
          radius={[4, 4, 0, 0]}
          maxBarSize={22}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

/** Spending split by category: donut plus a labelled list (identity never relies on colour alone). */
export function CategoryBreakdown({
  totals,
  categories,
  currency,
  limit = 6,
}: {
  totals: CategoryTotal[];
  categories: Map<string, Category>;
  currency: Currency;
  limit?: number;
}) {
  const sum = totals.reduce((acc, row) => acc + row.total, 0);
  // Fold the long tail into "Other" instead of inventing more colours.
  const top = totals.slice(0, limit);
  const rest = totals.slice(limit).reduce((acc, row) => acc + row.total, 0);
  const rows = [
    ...top.map((row) => {
      const category = categories.get(row.categoryId);
      return {
        id: row.categoryId,
        name: category?.name ?? 'Unknown',
        color: category?.color ?? '#64748b',
        total: row.total,
      };
    }),
    ...(rest > 0 ? [{ id: 'rest', name: 'Everything else', color: '#94a3b8', total: rest }] : []),
  ];

  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row">
      <div className="relative size-44 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={rows}
              dataKey="total"
              nameKey="name"
              innerRadius="68%"
              outerRadius="100%"
              paddingAngle={rows.length > 1 ? 2 : 0}
              cornerRadius={4}
              stroke="var(--card)"
              strokeWidth={2}
              isAnimationActive={false}
            >
              {rows.map((row) => (
                <Cell key={row.id} fill={row.color} />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) =>
                active && payload?.[0] ? (
                  <div className="rounded-lg border bg-popover px-3 py-2 text-sm shadow-lg">
                    <div className="font-medium">{payload[0].name}</div>
                    <div className="tabular text-muted-foreground">
                      {formatMoney(Number(payload[0].value), currency)} ·{' '}
                      {formatPercent(Number(payload[0].value) / sum)}
                    </div>
                  </div>
                ) : null
              }
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
          <div>
            <div className="text-xs text-muted-foreground">Spent</div>
            <div className="text-lg font-bold tabular">{compactMoney(sum, currency)}</div>
          </div>
        </div>
      </div>
      <ul className="w-full space-y-2.5">
        {rows.map((row) => (
          <li key={row.id} className="flex items-center gap-2 text-sm">
            <span className="size-2.5 shrink-0 rounded-sm" style={{ background: row.color }} />
            <span className="flex-1 truncate">{row.name}</span>
            <span className="text-muted-foreground tabular">{formatPercent(row.total / sum)}</span>
            <span className="w-24 text-right font-medium tabular">
              {compactMoney(row.total, currency)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
