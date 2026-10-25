import type { ReactNode } from 'react';
import { ArrowDownRight, ArrowUpRight, type LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatPercent } from '@/lib/format';
import { cn } from '@/lib/utils';

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

/** Percentage change badge. `goodWhenUp` flips the colours for expenses. */
export function Delta({
  change,
  goodWhenUp = true,
}: {
  change: number | null;
  goodWhenUp?: boolean;
}) {
  if (change === null || !Number.isFinite(change)) {
    return <span className="text-xs text-muted-foreground">No data last month</span>;
  }
  const up = change >= 0;
  const good = up === goodWhenUp;
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 text-xs font-medium',
        good ? 'text-income' : 'text-expense',
      )}
    >
      <Icon className="size-3.5" />
      {formatPercent(Math.abs(change), 1)}
      <span className="ml-1 font-normal text-muted-foreground">vs last month</span>
    </span>
  );
}

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = 'default',
  footer,
  loading,
}: {
  label: string;
  value: ReactNode;
  icon: LucideIcon;
  tone?: 'default' | 'income' | 'expense' | 'primary';
  footer?: ReactNode;
  loading?: boolean;
}) {
  const tones = {
    default: 'bg-muted text-foreground',
    income: 'bg-income/12 text-income',
    expense: 'bg-expense/12 text-expense',
    primary: 'bg-primary/12 text-primary',
  };
  return (
    <Card className="gap-0 py-0">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">{label}</span>
          <span className={cn('grid size-9 place-items-center rounded-xl', tones[tone])}>
            <Icon className="size-[18px]" />
          </span>
        </div>
        {loading ? (
          <Skeleton className="mt-3 h-8 w-32" />
        ) : (
          <div className="mt-2 truncate text-2xl font-bold tracking-tight tabular">{value}</div>
        )}
        <div className="mt-1 min-h-5">{!loading && footer}</div>
      </CardContent>
    </Card>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn('flex flex-col items-center justify-center px-6 py-12 text-center', className)}
    >
      <div className="relative mb-4">
        <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl" />
        <div className="relative grid size-14 place-items-center rounded-2xl border bg-card text-primary shadow-sm">
          <Icon className="size-6" />
        </div>
      </div>
      <h3 className="font-semibold">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
