import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { CalendarClock, Pencil, Plus, Repeat, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  CURRENCIES,
  RECURRING_FREQUENCIES,
  recurringInputSchema,
  toDateKey,
  type RecurringInput,
  type RecurringRule,
} from '@spendly/shared';
import { EmptyState, PageHeader } from '@/components/common';
import { CategoryPicker } from '@/components/transactions/category-picker';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCategories, useCategoryMap, useDeleteRecurring, useRecurring, useSaveRecurring } from '@/hooks/api';
import { useAuthStore } from '@/lib/auth-store';
import { CategoryBadge } from '@/lib/category-icons';
import { formatDateKey, formatMoney } from '@/lib/format';
import { cn } from '@/lib/utils';

const FREQUENCY_LABEL = { daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly', yearly: 'Yearly' } as const;

function RecurringDialog({
  open,
  onOpenChange,
  rule,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rule: RecurringRule | null;
}) {
  const currency = useAuthStore((state) => state.user?.baseCurrency ?? 'LKR');
  const { data: categories = [] } = useCategories();
  const save = useSaveRecurring();
  const form = useForm<RecurringInput>({
    resolver: zodResolver(recurringInputSchema),
    values: rule
      ? { type: rule.type, title: rule.title, amount: rule.amount, currency: rule.currency, categoryId: rule.categoryId, frequency: rule.frequency, startDate: rule.startDate, active: rule.active }
      : {
          type: 'expense',
          title: '',
          amount: undefined as unknown as number,
          currency,
          categoryId: categories.find((category) => category.type === 'expense')?.id ?? '',
          frequency: 'monthly',
          startDate: toDateKey(new Date()),
          active: true,
        },
  });
  const { register, control, handleSubmit, watch, setValue, formState } = form;
  const type = watch('type');

  const onSubmit = handleSubmit((input) =>
    save.mutate(
      { id: rule?.id, input },
      {
        onSuccess: () => {
          toast.success(rule ? 'Recurring rule updated' : 'Recurring rule created');
          onOpenChange(false);
        },
        onError: (error) => toast.error(error.message),
      },
    ),
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{rule ? 'Edit recurring rule' : 'New recurring rule'}</DialogTitle>
          <DialogDescription>Spendly adds the transaction automatically on every due date.</DialogDescription>
        </DialogHeader>
        <form id="recurring-form" onSubmit={onSubmit} className="space-y-4">
          <Controller control={control} name="type" render={({ field }) => (
            <Tabs value={field.value} onValueChange={(value) => {
              field.onChange(value);
              setValue('categoryId', categories.find((category) => category.type === value)?.id ?? '');
            }}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="expense">Expense</TabsTrigger>
                <TabsTrigger value="income">Income</TabsTrigger>
              </TabsList>
            </Tabs>
          )} />
          <Field label="Title" htmlFor="r-title" error={formState.errors.title?.message}>
            <Input id="r-title" placeholder="e.g. Rent, Netflix, Salary" {...register('title')} />
          </Field>
          <div className="grid grid-cols-[1fr_auto] gap-3">
            <Field label="Amount" htmlFor="r-amount" error={formState.errors.amount?.message}>
              <Input id="r-amount" type="number" step="0.01" inputMode="decimal" {...register('amount', { valueAsNumber: true })} />
            </Field>
            <Field label="Currency">
              <Controller control={control} name="currency" render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-28" aria-label="Currency"><SelectValue /></SelectTrigger>
                  <SelectContent>{CURRENCIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              )} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Repeats">
              <Controller control={control} name="frequency" render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full" aria-label="Frequency"><SelectValue /></SelectTrigger>
                  <SelectContent>{RECURRING_FREQUENCIES.map((f) => <SelectItem key={f} value={f}>{FREQUENCY_LABEL[f]}</SelectItem>)}</SelectContent>
                </Select>
              )} />
            </Field>
            <Field label="Starting" htmlFor="r-start" error={formState.errors.startDate?.message}>
              <Input id="r-start" type="date" {...register('startDate')} />
            </Field>
          </div>
          <Field label="Category" error={formState.errors.categoryId?.message}>
            <Controller control={control} name="categoryId" render={({ field }) => (
              <CategoryPicker categories={categories.filter((category) => category.type === type)} value={field.value} onChange={field.onChange} />
            )} />
          </Field>
          <Controller control={control} name="active" render={({ field }) => (
            <label className="flex items-center justify-between rounded-lg border p-3 text-sm">
              <span>
                <span className="font-medium">Active</span>
                <span className="block text-muted-foreground">Paused rules don't create transactions.</span>
              </span>
              <Switch checked={field.value} onCheckedChange={field.onChange} />
            </label>
          )} />
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="submit" form="recurring-form" disabled={save.isPending}>{save.isPending ? 'Saving…' : 'Save'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function RecurringPage() {
  const { data: rules, isLoading } = useRecurring();
  const categories = useCategoryMap();
  const remove = useDeleteRecurring();
  const [dialog, setDialog] = useState<{ open: boolean; rule: RecurringRule | null }>({ open: false, rule: null });
  const openNew = () => setDialog({ open: true, rule: null });

  return (
    <div>
      <PageHeader
        title="Recurring"
        description="Bills, subscriptions and salary that repeat on a schedule."
        actions={<Button onClick={openNew}><Plus /> New rule</Button>}
      />
      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 4 }, (_, index) => <Skeleton key={index} className="h-20 rounded-xl" />)}</div>
      ) : !rules?.length ? (
        <Card>
          <EmptyState icon={Repeat} title="No recurring transactions" description="Add rent, subscriptions or your salary once and Spendly records them for you."
            action={<Button onClick={openNew}><Plus /> Create your first rule</Button>} />
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {rules.map((rule) => (
            <Card key={rule.id} className={cn('py-4', !rule.active && 'opacity-60')}>
              <CardContent className="flex items-center gap-4 px-4">
                <CategoryBadge category={categories.get(rule.categoryId)} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-medium">{rule.title}</span>
                    <Badge variant="secondary">{FREQUENCY_LABEL[rule.frequency]}</Badge>
                    {!rule.active && <Badge variant="outline">Paused</Badge>}
                  </div>
                  <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                    <CalendarClock className="size-3.5" />
                    {rule.active ? `Next on ${formatDateKey(rule.nextRun)}` : 'Not scheduled'}
                  </div>
                </div>
                <div className={cn('font-semibold tabular', rule.type === 'income' && 'text-income')}>
                  {rule.type === 'income' ? '+' : '−'}{formatMoney(rule.amount, rule.currency)}
                </div>
                <div className="flex">
                  <Button variant="ghost" size="icon" onClick={() => setDialog({ open: true, rule })} aria-label={`Edit ${rule.title}`}><Pencil /></Button>
                  <Button variant="ghost" size="icon" aria-label={`Delete ${rule.title}`}
                    onClick={() => remove.mutate(rule.id, { onSuccess: () => toast.success('Rule deleted'), onError: (e) => toast.error(e.message) })}>
                    <Trash2 />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <RecurringDialog open={dialog.open} rule={dialog.rule} onOpenChange={(open) => setDialog((current) => ({ ...current, open }))} />
    </div>
  );
}
