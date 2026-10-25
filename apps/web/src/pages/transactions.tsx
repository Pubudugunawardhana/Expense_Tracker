import { useEffect, useState } from 'react';
import {
  ArrowDownUp,
  ChevronLeft,
  ChevronRight,
  Download,
  Plus,
  Receipt,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { useSearchParams } from 'react-router';
import { toast } from 'sonner';
import type { TransactionQuery, TransactionType } from '@spendly/shared';
import { EmptyState, PageHeader } from '@/components/common';
import { AiAssist } from '@/components/transactions/ai-assist';
import {
  GroupedTransactionList,
  TransactionListSkeleton,
} from '@/components/transactions/transaction-list';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  useCategories,
  useCategoryMap,
  useDeleteTransactions,
  useServerConfig,
  useTransactions,
} from '@/hooks/api';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { downloadFile } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import { CategoryBadge } from '@/lib/category-icons';
import { formatDateKey, formatMoney, formatMonth } from '@/lib/format';
import { useMonthStore } from '@/lib/prefs-store';
import { useTransactionSheet } from '@/lib/ui-store';
import { cn } from '@/lib/utils';

const PAGE_SIZE = 25;
const ALL = 'all';

export function TransactionsPage() {
  const month = useMonthStore((state) => state.month);
  const currency = useAuthStore((state) => state.user?.baseCurrency ?? 'LKR');
  const { openNew, openEdit } = useTransactionSheet();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: config } = useServerConfig();
  const { data: categoryList = [] } = useCategories();
  const categories = useCategoryMap();

  const [search, setSearch] = useState('');
  const [type, setType] = useState<TransactionType | typeof ALL>(ALL);
  const [categoryId, setCategoryId] = useState<string>(ALL);
  const [sort, setSort] = useState<NonNullable<TransactionQuery['sort']>>('-date');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmOpen, setConfirmOpen] = useState(false);
  const debouncedSearch = useDebouncedValue(search.trim());

  const query: TransactionQuery = {
    month,
    search: debouncedSearch || undefined,
    type: type === ALL ? undefined : type,
    categoryId: categoryId === ALL ? undefined : categoryId,
    sort,
    page,
    limit: PAGE_SIZE,
  };
  const { data, isLoading, isFetching } = useTransactions(query);
  const remove = useDeleteTransactions();
  const items = data?.items ?? [];
  const filtersActive = Boolean(debouncedSearch) || type !== ALL || categoryId !== ALL;

  // New filters or month → back to page 1 with nothing selected.
  useEffect(() => {
    setPage(1);
    setSelected(new Set());
  }, [month, debouncedSearch, type, categoryId, sort]);

  const toggle = (id: string) =>
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const allSelected = items.length > 0 && items.every((tx) => selected.has(tx.id));

  const deleteSelected = () => {
    const ids = [...selected];
    remove.mutate(ids, {
      onSuccess: () => {
        toast.success(`Deleted ${ids.length} transaction${ids.length > 1 ? 's' : ''}`);
        setSelected(new Set());
      },
      onError: (error) => toast.error(error.message),
    });
    setConfirmOpen(false);
  };

  const exportCsv = () =>
    downloadFile(`/transactions/export.csv?month=${month}`, `spendly-${month}.csv`).catch(
      (error: Error) => toast.error(error.message),
    );

  const clearFilters = () => {
    setSearch('');
    setType(ALL);
    setCategoryId(ALL);
  };

  return (
    <div>
      <PageHeader
        title="Transactions"
        description={`${data?.total ?? 0} transactions in ${formatMonth(month)}`}
        actions={
          <>
            <Button variant="outline" onClick={exportCsv}>
              <Download /> Export CSV
            </Button>
            <Button onClick={() => openNew()}>
              <Plus /> Add
            </Button>
          </>
        }
      />

      {config?.features.ai && (
        <div className="mb-4">
          <AiAssist
            onResult={(draft) => {
              openNew(draft);
              if (searchParams.has('quick')) setSearchParams({}, { replace: true });
            }}
          />
        </div>
      )}

      <Card className="gap-0 py-0">
        <div className="flex flex-col gap-2 border-b p-3 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search title or note…"
              className="pl-9"
              aria-label="Search transactions"
            />
          </div>
          <div className="grid grid-cols-3 gap-2 md:flex">
            <Select value={type} onValueChange={(value) => setType(value as typeof type)}>
              <SelectTrigger className="md:w-32" aria-label="Type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All types</SelectItem>
                <SelectItem value="expense">Expenses</SelectItem>
                <SelectItem value="income">Income</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger className="md:w-40" aria-label="Category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All categories</SelectItem>
                {categoryList
                  .filter((category) => type === ALL || category.type === type)
                  .map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <Select value={sort} onValueChange={(value) => setSort(value as typeof sort)}>
              <SelectTrigger className="md:w-40" aria-label="Sort">
                <ArrowDownUp className="size-4" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="-date">Newest first</SelectItem>
                <SelectItem value="date">Oldest first</SelectItem>
                <SelectItem value="-amount">Largest first</SelectItem>
                <SelectItem value="amount">Smallest first</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {selected.size > 0 && (
          <div className="flex items-center gap-3 border-b bg-primary/5 px-4 py-2 text-sm">
            <span className="font-medium">{selected.size} selected</span>
            <Button variant="ghost" size="sm" onClick={() => setSelected(new Set())}>
              Clear
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="ml-auto"
              onClick={() => setConfirmOpen(true)}
            >
              <Trash2 /> Delete
            </Button>
          </div>
        )}

        <CardContent
          className={cn('p-0 transition-opacity', isFetching && !isLoading && 'opacity-60')}
        >
          {isLoading ? (
            <TransactionListSkeleton rows={8} />
          ) : items.length === 0 ? (
            <EmptyState
              icon={Receipt}
              title={filtersActive ? 'No matching transactions' : 'Nothing here yet'}
              description={
                filtersActive
                  ? 'Try a different search or filter.'
                  : `No transactions recorded in ${formatMonth(month)}.`
              }
              action={
                filtersActive ? (
                  <Button variant="outline" onClick={clearFilters}>
                    <X /> Clear filters
                  </Button>
                ) : (
                  <Button onClick={() => openNew()}>
                    <Plus /> Add transaction
                  </Button>
                )
              }
            />
          ) : (
            <>
              {/* Mobile: grouped list */}
              <div className="p-2 md:hidden">
                <GroupedTransactionList
                  transactions={items}
                  categories={categories}
                  baseCurrency={currency}
                />
              </div>
              {/* Desktop: table */}
              <Table className="hidden md:table">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10 pl-4">
                      <Checkbox
                        checked={allSelected}
                        onCheckedChange={(checked) =>
                          setSelected(checked ? new Set(items.map((tx) => tx.id)) : new Set())
                        }
                        aria-label="Select all"
                      />
                    </TableHead>
                    <TableHead>Transaction</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="pr-4 text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((tx) => {
                    const category = categories.get(tx.categoryId);
                    return (
                      <TableRow
                        key={tx.id}
                        data-state={selected.has(tx.id) ? 'selected' : undefined}
                        className="cursor-pointer"
                        onClick={() => openEdit(tx)}
                      >
                        <TableCell className="pl-4" onClick={(event) => event.stopPropagation()}>
                          <Checkbox
                            checked={selected.has(tx.id)}
                            onCheckedChange={() => toggle(tx.id)}
                            aria-label={`Select ${tx.title}`}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <CategoryBadge category={category} size="sm" />
                            <div className="min-w-0">
                              <div className="truncate font-medium">{tx.title}</div>
                              {tx.note && (
                                <div className="max-w-xs truncate text-xs text-muted-foreground">
                                  {tx.note}
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="font-normal">
                            {category?.name ?? '—'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDateKey(tx.date)}
                        </TableCell>
                        <TableCell className="pr-4 text-right">
                          <div
                            className={cn(
                              'font-semibold tabular',
                              tx.type === 'income' && 'text-income',
                            )}
                          >
                            {tx.type === 'income' ? '+' : '−'}
                            {formatMoney(tx.amount, tx.currency)}
                          </div>
                          {tx.currency !== currency && (
                            <div className="text-xs text-muted-foreground tabular">
                              ≈ {formatMoney(tx.baseAmount, currency)}
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </>
          )}
        </CardContent>

        {data && data.pages > 1 && (
          <div className="flex items-center justify-between border-t px-4 py-3 text-sm">
            <span className="text-muted-foreground">
              Page {data.page} of {data.pages}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p - 1)}
                disabled={page <= 1}
              >
                <ChevronLeft /> Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= data.pages}
              >
                Next <ChevronRight />
              </Button>
            </div>
          </div>
        )}
      </Card>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selected.size} transactions?</AlertDialogTitle>
            <AlertDialogDescription>This can't be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteSelected}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
