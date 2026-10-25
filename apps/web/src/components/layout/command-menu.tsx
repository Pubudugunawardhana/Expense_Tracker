import { useEffect, useState } from 'react';
import { Moon, Plus, Sparkles, Sun } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useCategoryMap, useServerConfig, useTransactions } from '@/hooks/api';
import { CategoryBadge } from '@/lib/category-icons';
import { formatDateKey, formatMoney } from '@/lib/format';
import { usePrefs } from '@/lib/prefs-store';
import { useCommandMenu, useTransactionSheet } from '@/lib/ui-store';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { NAV_ITEMS, SECONDARY_NAV } from './nav-items';

export function CommandMenu() {
  const { open, setOpen } = useCommandMenu();
  const [search, setSearch] = useState('');
  const debounced = useDebouncedValue(search.trim(), 250);
  const navigate = useNavigate();
  const { openNew, openEdit } = useTransactionSheet();
  const { theme, setTheme } = usePrefs();
  const categories = useCategoryMap();
  const { data: config } = useServerConfig();
  const { data: results } = useTransactions(
    { search: debounced, limit: 6 },
    { enabled: open && Boolean(debounced) },
  );

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === 'k' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen(!useCommandMenu.getState().open);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [setOpen]);

  const run = (action: () => void) => {
    setOpen(false);
    setSearch('');
    action();
  };

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      title="Command menu"
      description="Search transactions or jump to a page"
    >
      <CommandInput
        placeholder="Search transactions, pages, actions…"
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        <CommandEmpty>No results.</CommandEmpty>
        {debounced && results && results.items.length > 0 && (
          <CommandGroup heading="Transactions" forceMount>
            {results.items.map((tx) => (
              // The server already matched these, so include the query in the value to keep cmdk from hiding them.
              <CommandItem
                key={tx.id}
                value={`tx-${tx.id} ${debounced}`}
                onSelect={() => run(() => openEdit(tx))}
              >
                <CategoryBadge category={categories.get(tx.categoryId)} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="truncate">{tx.title}</div>
                  <div className="text-xs text-muted-foreground">{formatDateKey(tx.date)}</div>
                </div>
                <span className={tx.type === 'income' ? 'text-income tabular' : 'tabular'}>
                  {formatMoney(tx.amount, tx.currency)}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        <CommandGroup heading="Actions">
          <CommandItem onSelect={() => run(() => openNew({ type: 'expense' }))}>
            <Plus /> Add expense
          </CommandItem>
          <CommandItem onSelect={() => run(() => openNew({ type: 'income' }))}>
            <Plus /> Add income
          </CommandItem>
          {config?.features.ai && (
            <CommandItem onSelect={() => run(() => navigate('/transactions?quick=1'))}>
              <Sparkles /> Quick add with AI
            </CommandItem>
          )}
          <CommandItem onSelect={() => run(() => setTheme(theme === 'dark' ? 'light' : 'dark'))}>
            {theme === 'dark' ? <Sun /> : <Moon />} Toggle theme
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Go to">
          {[...NAV_ITEMS, ...SECONDARY_NAV].map((item) => (
            <CommandItem key={item.to} onSelect={() => run(() => navigate(item.to))}>
              <item.icon /> {item.label}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
