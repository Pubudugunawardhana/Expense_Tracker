import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Download, Pencil, Plus, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import {
  CATEGORY_ICONS,
  CURRENCIES,
  categoryInputSchema,
  changePasswordSchema,
  type Category,
  type CategoryInput,
  type ChangePasswordInput,
  type Currency,
} from '@spendly/shared';
import { PageHeader } from '@/components/common';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  useCategories,
  useChangePassword,
  useDeleteCategory,
  useSaveCategory,
  useUpdateProfile,
} from '@/hooks/api';
import { useAuth } from '@/hooks/use-auth';
import { api, downloadFile } from '@/lib/api';
import { CATEGORY_ICON_MAP, CategoryBadge } from '@/lib/category-icons';
import { cn } from '@/lib/utils';

const SWATCHES = [
  '#f97316',
  '#ef4444',
  '#ec4899',
  '#8b5cf6',
  '#6366f1',
  '#0ea5e9',
  '#14b8a6',
  '#22c55e',
  '#84cc16',
  '#eab308',
  '#64748b',
  '#a855f7',
];

function ProfileCard() {
  const { user } = useAuth();
  const update = useUpdateProfile();
  const [name, setName] = useState(user?.name ?? '');
  if (!user) return null;
  const initials = user.name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
        <CardDescription>Your personal details and display currency.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center gap-4 rounded-xl border bg-muted/40 p-4">
          <Avatar className="size-14">
            {user.avatar && <AvatarImage src={user.avatar} alt="" referrerPolicy="no-referrer" />}
            <AvatarFallback className="bg-primary/15 text-lg font-semibold text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="truncate font-semibold">{user.name}</div>
            <div className="truncate text-sm text-muted-foreground">{user.email}</div>
          </div>
          {user.googleLinked && (
            <Badge variant="secondary" className="hidden sm:inline-flex">
              Google linked
            </Badge>
          )}
        </div>

        <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
          <Field label="Name" htmlFor="name">
            <Input id="name" value={name} onChange={(event) => setName(event.target.value)} />
          </Field>
          <Field
            label="Base currency"
            hint="Used for totals, budgets and charts. Existing amounts are converted at today's rates."
          >
            <Select
              value={user.baseCurrency}
              onValueChange={(value) =>
                update.mutate(
                  { baseCurrency: value as Currency },
                  {
                    onSuccess: () => toast.success(`Base currency changed to ${value}`),
                    onError: (error) => toast.error(error.message),
                  },
                )
              }
              disabled={update.isPending}
            >
              <SelectTrigger className="w-full" aria-label="Base currency">
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
          </Field>
        </div>
      </CardContent>
      <CardFooter className="justify-end">
        <Button
          disabled={name.trim() === user.name || name.trim().length < 2 || update.isPending}
          onClick={() =>
            update.mutate(
              { name: name.trim() },
              {
                onSuccess: () => toast.success('Profile updated'),
                onError: (e) => toast.error(e.message),
              },
            )
          }
        >
          Save profile
        </Button>
      </CardFooter>
    </Card>
  );
}

function PasswordCard() {
  const { user } = useAuth();
  const change = useChangePassword();
  const form = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: '', newPassword: '' },
  });
  const onSubmit = form.handleSubmit((input) =>
    change.mutate(input, {
      onSuccess: () => {
        toast.success('Password updated');
        form.reset();
      },
      onError: (error) => toast.error(error.message),
    }),
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>{user?.hasPassword ? 'Change password' : 'Set a password'}</CardTitle>
        <CardDescription>
          {user?.hasPassword
            ? 'Use at least 8 characters.'
            : 'Add a password so you can also sign in with your email.'}
        </CardDescription>
      </CardHeader>
      <form onSubmit={onSubmit}>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          {user?.hasPassword && (
            <Field label="Current password" htmlFor="current">
              <Input
                id="current"
                type="password"
                autoComplete="current-password"
                {...form.register('currentPassword')}
              />
            </Field>
          )}
          <Field
            label="New password"
            htmlFor="new"
            error={form.formState.errors.newPassword?.message}
          >
            <Input
              id="new"
              type="password"
              autoComplete="new-password"
              {...form.register('newPassword')}
            />
          </Field>
        </CardContent>
        <CardFooter className="mt-6 justify-end">
          <Button type="submit" disabled={change.isPending}>
            Update password
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

function CategoryDialog({
  category,
  open,
  onOpenChange,
}: {
  category: Category | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const save = useSaveCategory();
  const form = useForm<CategoryInput>({
    resolver: zodResolver(categoryInputSchema),
    values: category
      ? { name: category.name, type: category.type, icon: category.icon, color: category.color }
      : { name: '', type: 'expense', icon: 'gift', color: SWATCHES[3]! },
  });
  const { icon, color } = form.watch();

  const onSubmit = form.handleSubmit((input) =>
    save.mutate(
      { id: category?.id, input },
      {
        onSuccess: () => {
          toast.success(category ? 'Category updated' : 'Category created');
          onOpenChange(false);
        },
        onError: (error) => toast.error(error.message),
      },
    ),
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{category ? 'Edit category' : 'New category'}</DialogTitle>
          <DialogDescription>Pick a name, icon and colour.</DialogDescription>
        </DialogHeader>
        <form id="category-form" onSubmit={onSubmit} className="space-y-4">
          <div className="flex items-end gap-3">
            <CategoryBadge category={{ icon, color }} size="lg" />
            <Field
              label="Name"
              htmlFor="c-name"
              error={form.formState.errors.name?.message}
              className="flex-1"
            >
              <Input id="c-name" {...form.register('name')} />
            </Field>
          </div>
          <Controller
            control={form.control}
            name="type"
            render={({ field }) => (
              <Tabs value={field.value} onValueChange={field.onChange}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="expense">Expense</TabsTrigger>
                  <TabsTrigger value="income">Income</TabsTrigger>
                </TabsList>
              </Tabs>
            )}
          />
          <Field label="Icon">
            <div className="grid grid-cols-10 gap-1.5">
              {CATEGORY_ICONS.map((name) => {
                const Icon = CATEGORY_ICON_MAP[name];
                return (
                  <button
                    key={name}
                    type="button"
                    aria-label={name}
                    onClick={() => form.setValue('icon', name, { shouldDirty: true })}
                    className={cn(
                      'grid aspect-square place-items-center rounded-lg border hover:bg-accent',
                      icon === name && 'border-primary bg-primary/10 text-primary',
                    )}
                  >
                    <Icon className="size-4" />
                  </button>
                );
              })}
            </div>
          </Field>
          <Field label="Colour">
            <div className="flex flex-wrap gap-2">
              {SWATCHES.map((swatch) => (
                <button
                  key={swatch}
                  type="button"
                  aria-label={swatch}
                  onClick={() => form.setValue('color', swatch, { shouldDirty: true })}
                  className={cn(
                    'size-7 rounded-full ring-offset-2 ring-offset-background',
                    color === swatch && 'ring-2 ring-foreground',
                  )}
                  style={{ background: swatch }}
                />
              ))}
            </div>
          </Field>
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form="category-form" disabled={save.isPending}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CategoriesCard() {
  const { data: categories = [] } = useCategories();
  const remove = useDeleteCategory();
  const [dialog, setDialog] = useState<{ open: boolean; category: Category | null }>({
    open: false,
    category: null,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Categories</CardTitle>
        <CardDescription>Deleting a category moves its transactions to “Other”.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {(['expense', 'income'] as const).map((type) => (
          <div key={type}>
            <div className="mb-2 text-sm font-medium capitalize text-muted-foreground">{type}</div>
            <div className="grid gap-2 sm:grid-cols-2">
              {categories
                .filter((category) => category.type === type)
                .map((category) => (
                  <div
                    key={category.id}
                    className="flex items-center gap-3 rounded-lg border p-2 pr-1"
                  >
                    <CategoryBadge category={category} size="sm" />
                    <span className="flex-1 truncate text-sm font-medium">{category.name}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      aria-label={`Edit ${category.name}`}
                      onClick={() => setDialog({ open: true, category })}
                    >
                      <Pencil />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      aria-label={`Delete ${category.name}`}
                      onClick={() =>
                        remove.mutate(category.id, {
                          onSuccess: () => toast.success('Category deleted'),
                          onError: (e) => toast.error(e.message),
                        })
                      }
                    >
                      <Trash2 />
                    </Button>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </CardContent>
      <CardFooter className="justify-end">
        <Button variant="outline" onClick={() => setDialog({ open: true, category: null })}>
          <Plus /> New category
        </Button>
      </CardFooter>
      <CategoryDialog
        {...dialog}
        onOpenChange={(open) => setDialog((current) => ({ ...current, open }))}
      />
    </Card>
  );
}

function DataCard() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const deleteAccount = async () => {
    try {
      await api('/auth/me', { method: 'DELETE' });
      await logout();
      toast.success('Your account has been deleted');
      navigate('/');
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  return (
    <Card className="border-destructive/30">
      <CardHeader>
        <CardTitle>Your data</CardTitle>
        <CardDescription>Download everything, or delete your account permanently.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-3">
        <Button
          variant="outline"
          onClick={() =>
            downloadFile(
              '/transactions/export.csv?limit=1000',
              'spendly-all-transactions.csv',
            ).catch((e: Error) => toast.error(e.message))
          }
        >
          <Download /> Export all transactions
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive">
              <Trash2 /> Delete account
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete your account?</AlertDialogTitle>
              <AlertDialogDescription>
                All transactions, budgets, categories and recurring rules will be permanently
                deleted. This can't be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={deleteAccount}
                className="bg-destructive text-white hover:bg-destructive/90"
              >
                Delete forever
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}

export function SettingsPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader title="Settings" description="Manage your profile, categories and data." />
      <ProfileCard />
      <CategoriesCard />
      <PasswordCard />
      <DataCard />
    </div>
  );
}
