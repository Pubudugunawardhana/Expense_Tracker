import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import {
  CURRENCIES,
  toDateKey,
  transactionInputSchema,
  type TransactionInput,
  type TransactionType,
} from '@spendly/shared';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useCategories, useDeleteTransactions, useSaveTransaction, useServerConfig } from '@/hooks/api';
import { useAuthStore } from '@/lib/auth-store';
import { useTransactionSheet } from '@/lib/ui-store';
import { AiAssist } from './ai-assist';
import { CategoryPicker } from './category-picker';

export function TransactionSheet() {
  const { open, editing, draft, close } = useTransactionSheet();
  const baseCurrency = useAuthStore((state) => state.user?.baseCurrency ?? 'LKR');
  const { data: categories = [] } = useCategories();
  const { data: config } = useServerConfig();
  const save = useSaveTransaction();
  const remove = useDeleteTransactions();

  const defaults = useMemo<TransactionInput>(
    () => ({
      type: 'expense',
      title: '',
      amount: undefined as unknown as number,
      currency: baseCurrency,
      categoryId: '',
      date: toDateKey(new Date()),
      note: '',
    }),
    [baseCurrency],
  );

  const form = useForm<TransactionInput>({
    resolver: zodResolver(transactionInputSchema),
    defaultValues: defaults,
  });
  const { register, handleSubmit, control, watch, setValue, reset, formState } = form;
  const type = watch('type');
  const categoryId = watch('categoryId');
  const typeCategories = categories.filter((category) => category.type === type);

  // Load the transaction being edited (or a prefilled draft) whenever the sheet opens.
  useEffect(() => {
    if (!open) return;
    if (editing) {
      const { type, title, amount, currency, categoryId, date, note } = editing;
      reset({ type, title, amount, currency, categoryId, date, note });
    } else {
      reset({ ...defaults, ...draft });
    }
  }, [open, editing, draft, defaults, reset]);

  // Keep the selected category valid for the chosen type.
  useEffect(() => {
    if (typeCategories.length && !typeCategories.some((category) => category.id === categoryId)) {
      setValue('categoryId', typeCategories[0]!.id);
    }
  }, [type, categoryId, typeCategories, setValue]);

  const onSubmit = handleSubmit((input) => {
    save.mutate(
      { id: editing?.id, input },
      {
        onSuccess: () => {
          toast.success(editing ? 'Transaction updated' : `${input.type === 'income' ? 'Income' : 'Expense'} added`);
          close();
        },
        // Keep the form filled in so nothing is lost when saving fails.
        onError: (error) => toast.error(error.message),
      },
    );
  });

  const onDelete = () => {
    if (!editing) return;
    remove.mutate([editing.id], {
      onSuccess: () => {
        toast.success('Transaction deleted');
        close();
      },
      onError: (error) => toast.error(error.message),
    });
  };

  return (
    <Sheet open={open} onOpenChange={(next) => !next && close()}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-lg">
        <SheetHeader className="border-b p-5">
          <SheetTitle>{editing ? 'Edit transaction' : 'New transaction'}</SheetTitle>
          <SheetDescription>
            {editing ? 'Update the details below.' : 'Record money coming in or going out.'}
          </SheetDescription>
        </SheetHeader>

        <form id="transaction-form" onSubmit={onSubmit} className="flex-1 space-y-5 overflow-y-auto p-5">
          {!editing && config?.features.ai && (
            <AiAssist onResult={(result) => reset({ ...defaults, ...result })} />
          )}

          <Controller
            control={control}
            name="type"
            render={({ field }) => (
              <Tabs value={field.value} onValueChange={(value) => field.onChange(value as TransactionType)}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="expense">Expense</TabsTrigger>
                  <TabsTrigger value="income">Income</TabsTrigger>
                </TabsList>
              </Tabs>
            )}
          />

          <div className="grid grid-cols-[1fr_auto] gap-3">
            <Field label="Amount" htmlFor="amount" error={formState.errors.amount?.message}>
              <Input
                id="amount"
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                placeholder="0.00"
                className="h-12 text-xl font-semibold tabular"
                autoFocus={!editing}
                {...register('amount', { valueAsNumber: true })}
              />
            </Field>
            <Field label="Currency">
              <Controller
                control={control}
                name="currency"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="h-12! w-28" aria-label="Currency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map((currency) => (
                        <SelectItem key={currency} value={currency}>
                          {currency}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
          </div>

          <Field label="Title" htmlFor="title" error={formState.errors.title?.message}>
            <Input id="title" placeholder={type === 'income' ? 'e.g. Salary' : 'e.g. Groceries at Keells'} {...register('title')} />
          </Field>

          <Field label="Category" error={formState.errors.categoryId?.message}>
            <Controller
              control={control}
              name="categoryId"
              render={({ field }) => (
                <CategoryPicker categories={typeCategories} value={field.value} onChange={field.onChange} />
              )}
            />
          </Field>

          <Field label="Date" htmlFor="date" error={formState.errors.date?.message}>
            <Input id="date" type="date" max={toDateKey(new Date())} {...register('date')} />
          </Field>

          <Field label="Note" htmlFor="note" error={formState.errors.note?.message}>
            <Textarea id="note" rows={2} placeholder="Optional" {...register('note')} />
          </Field>
        </form>

        <SheetFooter className="flex-row border-t p-5">
          {editing && (
            <Button type="button" variant="ghost" className="text-destructive" onClick={onDelete} disabled={remove.isPending}>
              Delete
            </Button>
          )}
          <Button type="button" variant="outline" className="ml-auto" onClick={close}>
            Cancel
          </Button>
          <Button type="submit" form="transaction-form" disabled={save.isPending}>
            {save.isPending ? 'Saving…' : editing ? 'Save changes' : 'Add transaction'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
