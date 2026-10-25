import { AlertTriangle, CheckCircle2, CircleSlash, XCircle } from 'lucide-react';
import { BUDGET_STATUS_LABEL, type BudgetProgress, type BudgetStatus } from '@spendly/shared';
import { cn } from '@/lib/utils';

const STATUS_STYLES: Record<
  BudgetStatus,
  { bar: string; text: string; icon: typeof CheckCircle2 }
> = {
  none: { bar: 'bg-muted-foreground/40', text: 'text-muted-foreground', icon: CircleSlash },
  safe: { bar: 'bg-primary', text: 'text-primary', icon: CheckCircle2 },
  warning: { bar: 'bg-warning', text: 'text-warning', icon: AlertTriangle },
  over: { bar: 'bg-destructive', text: 'text-destructive', icon: XCircle },
};

/** Status always ships with an icon and a label, never colour alone. */
export function BudgetStatusLabel({
  status,
  className,
}: {
  status: BudgetStatus;
  className?: string;
}) {
  const { text, icon: Icon } = STATUS_STYLES[status];
  return (
    <span className={cn('inline-flex items-center gap-1 text-xs font-medium', text, className)}>
      <Icon className="size-3.5" />
      {BUDGET_STATUS_LABEL[status]}
    </span>
  );
}

export function BudgetBar({
  progress,
  className,
}: {
  progress: BudgetProgress;
  className?: string;
}) {
  const width = Math.min(progress.percent, 100);
  return (
    <div
      className={cn('h-2 overflow-hidden rounded-full bg-muted', className)}
      role="progressbar"
      aria-valuenow={Math.round(progress.percent)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={BUDGET_STATUS_LABEL[progress.status]}
    >
      <div
        className={cn(
          'h-full rounded-full transition-[width] duration-500',
          STATUS_STYLES[progress.status].bar,
        )}
        style={{ width: `${width}%` }}
      />
    </div>
  );
}
