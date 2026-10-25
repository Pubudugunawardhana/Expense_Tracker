import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Save, Target, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { getBudgetProgress } from '@spendly/shared';
import { BudgetBar, BudgetStatusLabel } from '@/components/budget-bar';
import { PageHeader, StatCard } from '@/components/common';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useBudget, useCategories, useSaveBudget, useSummary } from '@/hooks/api';
import { useAuthStore } from '@/lib/auth-store';
import { CategoryBadge } from '@/lib/category-icons';
import { formatMoney, formatMonth } from '@/lib/format';
import { useMonthStore } from '@/lib/prefs-store';

type Draft = { total: string; categories: Record<string, string> };

const toNumber = (value: string | undefined) => {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : 0;
};

export function BudgetsPage() {
  const month = useMonthStore((state) => state.month);
  const currency = useAuthStore((state) => state.user?.baseCurrency ?? 'LKR');
  const { data: budget, isLoading } = useBudget(month);
  const { data: summary } = useSummary(month);
  const { data: categories = [] } = useCategories();
  const save = useSaveBudget(month);
  const expenseCategories = categories.filter((category) => category.type === 'expense');

  const [draft, setDraft] = useState<Draft>({ total: '', categories: {} });

  // Reset the form whenever a different month's budget loads.
  useEffect(() => {
    if (!budget) return;
    setDraft({
      total: budget.total ? String(budget.total) : '',
      categories: Object.fromEntries(Object.entries(budget.categories).map(([id, amount]) => [id, String(amount)])),
    });
  }, [budget]);

  const parsed = useMemo(
    () => ({
      total: toNumber(draft.total),
      categories: Object.fromEntries(
        Object.entries(draft.categories)
          .map(([id, value]) => [id, toNumber(value)] as const)
          .filter(([, amount]) => amount > 0),
      ),
    }),
    [draft],
  );

  const dirty =
    budget !== undefined &&
    (parsed.total !== budget.total ||
      JSON.stringify(Object.entries(parsed.categories).sort()) !== JSON.stringify(Object.entries(budget.categories).sort()));

  const spentBy = new Map(summary?.byCategory.map((row) => [row.categoryId, row.total]));
  const allocated = Object.values(parsed.categories).reduce((sum, amount) => sum + amount, 0);
  const overall = getBudgetProgress(summary?.expense ?? 0, parsed.total);
  const overCount = expenseCategories.filter(
    (category) => getBudgetProgress(spentBy.get(category.id) ?? 0, parsed.categories[category.id] ?? 0).status === 'over',
  ).length;

  const onSave = () =>
    save.mutate(parsed, {
      onSuccess: () => toast.success(`Budget saved for ${formatMonth(month)}`),
      onError: (error) => toast.error(error.message),
    });

  return (
    <div>
      <PageHeader
        title="Budgets"
        description={`Spending limits for ${formatMonth(month)}. Budgets carry over to later months until you change them.`}
        actions={
          <Button onClick={onSave} disabled={!dirty || save.isPending}>
            <Save /> {save.isPending ? 'Saving…' : 'Save budget'}
          </Button>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Monthly budget" icon={Target} tone="primary" value={formatMoney(parsed.total, currency)} loading={isLoading}
          footer={<BudgetStatusLabel status={overall.status} />} />
        <StatCard label="Allocated to categories" icon={Wallet} value={formatMoney(allocated, currency)} loading={isLoading}
          footer={
            parsed.total > 0 && allocated > parsed.total ? (
              <span className="text-xs text-warning">More than your monthly budget</span>
            ) : (
              <span className="text-xs text-muted-foreground">{formatMoney(Math.max(parsed.total - allocated, 0), currency)} unallocated</span>
            )
          }
        />
        <StatCard label="Categories over budget" icon={AlertTriangle} tone={overCount ? 'expense' : 'default'} value={overCount} loading={isLoading}
          footer={<span className="text-xs text-muted-foreground">of {expenseCategories.length} categories</span>} />
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Overall limit</CardTitle>
          <CardDescription>The most you want to spend this month across all categories.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex max-w-sm items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">{currency}</span>
            <Input type="number" inputMode="decimal" min="0" placeholder="0" value={draft.total}
              onChange={(event) => setDraft((current) => ({ ...current, total: event.target.value }))}
              className="text-lg font-semibold tabular" aria-label="Monthly budget" />
          </div>
          {parsed.total > 0 && (
            <div className="space-y-2">
              <BudgetBar progress={overall} className="h-3" />
              <div className="flex justify-between text-sm text-muted-foreground tabular">
                <span>{formatMoney(overall.spent, currency)} spent</span>
                <span>{overall.remaining >= 0 ? `${formatMoney(overall.remaining, currency)} left` : `${formatMoney(-overall.remaining, currency)} over`}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <h3 className="mb-3 font-semibold">By category</h3>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {isLoading
          ? Array.from({ length: 6 }, (_, index) => <Skeleton key={index} className="h-40 rounded-xl" />)
          : expenseCategories.map((category) => {
              const progress = getBudgetProgress(spentBy.get(category.id) ?? 0, parsed.categories[category.id] ?? 0);
              return (
                <Card key={category.id} className="gap-4 py-5">
                  <CardContent className="space-y-4 px-5">
                    <div className="flex items-center gap-3">
                      <CategoryBadge category={category} />
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-medium">{category.name}</div>
                        <BudgetStatusLabel status={progress.status} />
                      </div>
                      <Input type="number" inputMode="decimal" min="0" placeholder="No limit"
                        value={draft.categories[category.id] ?? ''}
                        onChange={(event) =>
                          setDraft((current) => ({ ...current, categories: { ...current.categories, [category.id]: event.target.value } }))
                        }
                        className="w-28 text-right tabular" aria-label={`${category.name} budget`} />
                    </div>
                    <BudgetBar progress={progress} />
                    <div className="flex justify-between text-xs text-muted-foreground tabular">
                      <span>{formatMoney(progress.spent, currency)} spent</span>
                      {progress.budget > 0 && <span>{Math.round(progress.percent)}%</span>}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
      </div>
    </div>
  );
}
