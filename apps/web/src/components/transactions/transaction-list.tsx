import { Repeat } from 'lucide-react';
import type { Category, Currency, Transaction } from '@spendly/shared';
import { Skeleton } from '@/components/ui/skeleton';
import { CategoryBadge } from '@/lib/category-icons';
import { formatMoney, formatRelativeDay } from '@/lib/format';
import { useTransactionSheet } from '@/lib/ui-store';
import { cn } from '@/lib/utils';

export function TransactionRow({
  tx,
  category,
  baseCurrency,
}: {
  tx: Transaction;
  category: Category | undefined;
  baseCurrency: Currency;
}) {
  const openEdit = useTransactionSheet((state) => state.openEdit);
  const income = tx.type === 'income';
  return (
    <button
      type="button"
      onClick={() => openEdit(tx)}
      className="flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left transition-colors hover:bg-muted/60 focus-visible:bg-muted/60 focus-visible:outline-none"
    >
      <CategoryBadge category={category} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 truncate font-medium">
          {tx.title}
          {tx.recurringId && <Repeat className="size-3 shrink-0 text-muted-foreground" aria-label="Recurring" />}
        </div>
        <div className="truncate text-xs text-muted-foreground">{category?.name ?? 'Uncategorised'}</div>
      </div>
      <div className="text-right">
        <div className={cn('font-semibold tabular', income ? 'text-income' : 'text-foreground')}>
          {income ? '+' : '−'}
          {formatMoney(tx.amount, tx.currency)}
        </div>
        {tx.currency !== baseCurrency && (
          <div className="text-xs text-muted-foreground tabular">≈ {formatMoney(tx.baseAmount, baseCurrency)}</div>
        )}
      </div>
    </button>
  );
}

/** Transactions grouped under "Today", "Yesterday", "Mon, Oct 21"… */
export function GroupedTransactionList({
  transactions,
  categories,
  baseCurrency,
}: {
  transactions: Transaction[];
  categories: Map<string, Category>;
  baseCurrency: Currency;
}) {
  const groups = new Map<string, Transaction[]>();
  for (const tx of transactions) groups.set(tx.date, [...(groups.get(tx.date) ?? []), tx]);

  return (
    <div className="space-y-4">
      {[...groups.entries()].map(([date, items]) => {
        const net = items.reduce((sum, tx) => sum + (tx.type === 'income' ? tx.baseAmount : -tx.baseAmount), 0);
        return (
          <section key={date}>
            <div className="flex items-center justify-between px-2 pb-1 text-xs font-medium text-muted-foreground">
              <span>{formatRelativeDay(date)}</span>
              <span className="tabular">{formatMoney(net, baseCurrency, { signed: true })}</span>
            </div>
            <div className="space-y-0.5">
              {items.map((tx) => (
                <TransactionRow key={tx.id} tx={tx} category={categories.get(tx.categoryId)} baseCurrency={baseCurrency} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

export function TransactionListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3 p-2">
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="flex items-center gap-3">
          <Skeleton className="size-10 rounded-xl" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-4 w-20" />
        </div>
      ))}
    </div>
  );
}
