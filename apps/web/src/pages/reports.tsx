import { useState } from 'react';
import { BarChart3, FileDown, FileSpreadsheet, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { CategoryBreakdown, SeriesLegend, TrendChart } from '@/components/charts';
import { EmptyState, PageHeader } from '@/components/common';
import { Button } from '@/components/ui/button';
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useCategoryMap, useSummary, useTransactions } from '@/hooks/api';
import { api, downloadFile } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import { CategoryBadge } from '@/lib/category-icons';
import { formatDateKey, formatMoney, formatMonth, formatPercent } from '@/lib/format';
import { downloadMonthReport } from '@/lib/pdf-report';
import { useMonthStore } from '@/lib/prefs-store';
import type { Paginated, Transaction } from '@spendly/shared';

export function ReportsPage() {
  const month = useMonthStore((state) => state.month);
  const user = useAuthStore((state) => state.user);
  const currency = user?.baseCurrency ?? 'LKR';
  const categories = useCategoryMap();
  const { data: summary, isLoading } = useSummary(month);
  const { data: biggest } = useTransactions({ month, type: 'expense', sort: '-amount', limit: 5 });
  const [exporting, setExporting] = useState(false);

  const trend = summary?.trend ?? [];
  const yearIncome = trend.reduce((sum, point) => sum + point.income, 0);
  const yearExpense = trend.reduce((sum, point) => sum + point.expense, 0);
  const activeMonths = trend.filter((point) => point.expense > 0).length || 1;

  const exportPdf = async () => {
    if (!summary || !user) return;
    setExporting(true);
    try {
      const { items } = await api<Paginated<Transaction>>(`/transactions?month=${month}&limit=1000&sort=date`);
      await downloadMonthReport({ summary, transactions: items, categories, userName: user.name });
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description={`Trends and statements for ${formatMonth(month)}`}
        actions={
          <>
            <Button variant="outline" onClick={() => downloadFile(`/transactions/export.csv?month=${month}`, `spendly-${month}.csv`).catch((e: Error) => toast.error(e.message))}>
              <FileSpreadsheet /> CSV
            </Button>
            <Button onClick={exportPdf} disabled={exporting || !summary}>
              {exporting ? <Loader2 className="animate-spin" /> : <FileDown />} PDF statement
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: '12-month income', value: formatMoney(yearIncome, currency) },
          { label: '12-month expenses', value: formatMoney(yearExpense, currency) },
          { label: 'Average monthly spend', value: formatMoney(yearExpense / activeMonths, currency) },
        ].map((item) => (
          <Card key={item.label} className="py-5">
            <CardContent className="px-5">
              <div className="text-sm text-muted-foreground">{item.label}</div>
              {isLoading ? <Skeleton className="mt-2 h-7 w-32" /> : <div className="mt-1 text-xl font-bold tabular">{item.value}</div>}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Income vs expenses</CardTitle>
          <CardDescription>Last 12 months</CardDescription>
          <CardAction>
            <SeriesLegend />
          </CardAction>
        </CardHeader>
        <CardContent>
          {isLoading ? <Skeleton className="h-[300px]" /> : <TrendChart trend={trend} currency={currency} height={300} />}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Spending by category</CardTitle>
            <CardDescription>{formatMonth(month)}</CardDescription>
          </CardHeader>
          <CardContent>
            {summary?.byCategory.length ? (
              <CategoryBreakdown totals={summary.byCategory} categories={categories} currency={currency} limit={7} />
            ) : (
              <EmptyState icon={BarChart3} title="No spending this month" />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Biggest expenses</CardTitle>
            <CardDescription>Top 5 in {formatMonth(month)}</CardDescription>
          </CardHeader>
          <CardContent className="px-0">
            {biggest?.items.length ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-6">Transaction</TableHead>
                    <TableHead className="text-right">Share</TableHead>
                    <TableHead className="pr-6 text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {biggest.items.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell className="pl-6">
                        <div className="flex items-center gap-3">
                          <CategoryBadge category={categories.get(tx.categoryId)} size="sm" />
                          <div>
                            <div className="font-medium">{tx.title}</div>
                            <div className="text-xs text-muted-foreground">{formatDateKey(tx.date)}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground tabular">
                        {summary?.expense ? formatPercent(tx.baseAmount / summary.expense) : '—'}
                      </TableCell>
                      <TableCell className="pr-6 text-right font-semibold tabular">{formatMoney(tx.amount, tx.currency)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="px-6 text-sm text-muted-foreground">No expenses this month.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
