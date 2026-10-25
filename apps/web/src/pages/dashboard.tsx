import { ArrowDownCircle, ArrowUpCircle, PiggyBank, Plus, Scale, Target } from 'lucide-react';
import { Link } from 'react-router';
import { getBudgetProgress } from '@spendly/shared';
import { BudgetBar, BudgetStatusLabel } from '@/components/budget-bar';
import { CashFlowChart, CategoryBreakdown, SeriesLegend } from '@/components/charts';
import { Delta, EmptyState, StatCard } from '@/components/common';
import { InsightsCard } from '@/components/insights-card';
import { GroupedTransactionList, TransactionListSkeleton } from '@/components/transactions/transaction-list';
import { Button } from '@/components/ui/button';
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useBudget, useCategoryMap, useSummary, useTransactions } from '@/hooks/api';
import { useAuthStore } from '@/lib/auth-store';
import { formatMoney, formatMonth, formatPercent, percentChange } from '@/lib/format';
import { useMonthStore } from '@/lib/prefs-store';
import { useTransactionSheet } from '@/lib/ui-store';

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export function DashboardPage() {
  const user = useAuthStore((state) => state.user);
  const currency = user?.baseCurrency ?? 'LKR';
  const month = useMonthStore((state) => state.month);
  const openNew = useTransactionSheet((state) => state.openNew);
  const categories = useCategoryMap();
  const { data: summary, isLoading } = useSummary(month);
  const { data: budget } = useBudget(month);
  const { data: recent, isLoading: recentLoading } = useTransactions({ month, limit: 8 });

  const progress = getBudgetProgress(summary?.expense ?? 0, budget?.total ?? 0);
  const hasData = (summary?.transactionCount ?? 0) > 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            {greeting()}, {user?.name.split(' ')[0]} 👋
          </h2>
          <p className="text-sm text-muted-foreground">Here's how {formatMonth(month)} is going.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Income"
          icon={ArrowDownCircle}
          tone="income"
          loading={isLoading}
          value={formatMoney(summary?.income ?? 0, currency)}
          footer={summary && <Delta change={percentChange(summary.income, summary.previous.income)} />}
        />
        <StatCard
          label="Expenses"
          icon={ArrowUpCircle}
          tone="expense"
          loading={isLoading}
          value={formatMoney(summary?.expense ?? 0, currency)}
          footer={summary && <Delta change={percentChange(summary.expense, summary.previous.expense)} goodWhenUp={false} />}
        />
        <StatCard
          label="Net balance"
          icon={Scale}
          tone="primary"
          loading={isLoading}
          value={formatMoney(summary?.net ?? 0, currency, { signed: true })}
          footer={<span className="text-xs text-muted-foreground">{summary?.transactionCount ?? 0} transactions</span>}
        />
        <StatCard
          label="Savings rate"
          icon={PiggyBank}
          loading={isLoading}
          value={summary?.savingsRate == null ? '—' : formatPercent(summary.savingsRate)}
          footer={<span className="text-xs text-muted-foreground">of income kept this month</span>}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Cash flow</CardTitle>
            <CardDescription>Running totals through the month</CardDescription>
            <CardAction>
              <SeriesLegend />
            </CardAction>
          </CardHeader>
          <CardContent>
            {isLoading || !summary ? <Skeleton className="h-[260px] w-full" /> : <CashFlowChart daily={summary.daily} currency={currency} />}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Monthly budget</CardTitle>
            <CardDescription>{progress.status === 'none' ? 'No budget set yet' : `${formatMoney(progress.budget, currency)} limit`}</CardDescription>
            <CardAction>
              <Button variant="ghost" size="icon" asChild aria-label="Edit budgets">
                <Link to="/budgets">
                  <Target />
                </Link>
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent className="space-y-4">
            {progress.status === 'none' ? (
              <EmptyState
                className="py-4"
                icon={Target}
                title="Set a spending limit"
                description="Budgets help you notice overspending before the month ends."
                action={
                  <Button size="sm" asChild>
                    <Link to="/budgets">Create budget</Link>
                  </Button>
                }
              />
            ) : (
              <>
                <div className="flex items-end justify-between">
                  <div>
                    <div className="text-3xl font-bold tracking-tight tabular">{formatPercent(progress.percent / 100)}</div>
                    <div className="text-sm text-muted-foreground">of budget used</div>
                  </div>
                  <BudgetStatusLabel status={progress.status} />
                </div>
                <BudgetBar progress={progress} className="h-3" />
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-lg bg-muted/60 p-3">
                    <div className="text-muted-foreground">Spent</div>
                    <div className="font-semibold tabular">{formatMoney(progress.spent, currency)}</div>
                  </div>
                  <div className="rounded-lg bg-muted/60 p-3">
                    <div className="text-muted-foreground">{progress.remaining >= 0 ? 'Left' : 'Over by'}</div>
                    <div className="font-semibold tabular">{formatMoney(Math.abs(progress.remaining), currency)}</div>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent transactions</CardTitle>
            <CardAction>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/transactions">View all</Link>
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent>
            {recentLoading ? (
              <TransactionListSkeleton />
            ) : recent?.items.length ? (
              <GroupedTransactionList transactions={recent.items} categories={categories} baseCurrency={currency} />
            ) : (
              <EmptyState
                icon={Plus}
                title="No transactions this month"
                description="Add your first income or expense to see your dashboard come alive."
                action={<Button onClick={() => openNew()}>Add transaction</Button>}
              />
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <InsightsCard month={month} hasData={hasData} />
          <Card>
            <CardHeader>
              <CardTitle>Where it went</CardTitle>
              <CardDescription>Spending by category</CardDescription>
            </CardHeader>
            <CardContent>
              {summary?.byCategory.length ? (
                <CategoryBreakdown totals={summary.byCategory} categories={categories} currency={currency} limit={5} />
              ) : (
                <p className="text-sm text-muted-foreground">No spending recorded for this month.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
