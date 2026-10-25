import {
  ChevronLeft,
  ChevronRight,
  LogOut,
  Monitor,
  Moon,
  Search,
  Settings,
  Sun,
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router';
import { shiftMonth, toMonthKey } from '@spendly/shared';
import { Logo } from '@/components/brand/logo';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/use-auth';
import { formatMonth } from '@/lib/format';
import { useMonthStore, usePrefs, type Theme } from '@/lib/prefs-store';
import { useCommandMenu } from '@/lib/ui-store';
import { NAV_ITEMS, SECONDARY_NAV } from './nav-items';

/** Pages where the selected month matters. */
const MONTH_PAGES = ['/dashboard', '/transactions', '/budgets', '/reports'];

export function MonthPicker() {
  const { month, setMonth } = useMonthStore();
  const current = toMonthKey(new Date());
  return (
    <div className="flex items-center rounded-lg border bg-card">
      <Button
        variant="ghost"
        size="icon"
        className="size-8"
        onClick={() => setMonth(shiftMonth(month, -1))}
        aria-label="Previous month"
      >
        <ChevronLeft />
      </Button>
      <button
        type="button"
        className="min-w-24 px-1 text-center text-sm font-medium tabular sm:min-w-32"
        onClick={() => setMonth(current)}
        title="Jump to this month"
      >
        <span className="sm:hidden">{formatMonth(month, 'MMM yyyy')}</span>
        <span className="hidden sm:inline">{formatMonth(month)}</span>
      </button>
      <Button
        variant="ghost"
        size="icon"
        className="size-8"
        onClick={() => setMonth(shiftMonth(month, 1))}
        disabled={month >= current}
        aria-label="Next month"
      >
        <ChevronRight />
      </Button>
    </div>
  );
}

export function UserMenu() {
  const { user, logout } = useAuth();
  const { theme, setTheme } = usePrefs();
  const navigate = useNavigate();
  const initials = (user?.name ?? '?')
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Account menu"
        >
          <Avatar className="size-9">
            {user?.avatar && <AvatarImage src={user.avatar} alt="" referrerPolicy="no-referrer" />}
            <AvatarFallback className="bg-primary/15 text-xs font-semibold text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="font-normal">
          <div className="truncate font-medium">{user?.name}</div>
          <div className="truncate text-xs text-muted-foreground">{user?.email}</div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-xs text-muted-foreground">Theme</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={theme} onValueChange={(value) => setTheme(value as Theme)}>
          <DropdownMenuRadioItem value="light">
            <Sun /> Light
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="dark">
            <Moon /> Dark
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="system">
            <Monitor /> System
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/settings">
            <Settings /> Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={() => {
            void logout().then(() => navigate('/login'));
          }}
        >
          <LogOut /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function TopBar() {
  const { pathname } = useLocation();
  const setCommandOpen = useCommandMenu((state) => state.setOpen);
  const title =
    [...NAV_ITEMS, ...SECONDARY_NAV].find((item) => pathname.startsWith(item.to))?.label ?? '';
  const showMonth = MONTH_PAGES.some((page) => pathname.startsWith(page));

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur-lg sm:px-6 lg:px-8">
      <Logo className="size-8 lg:hidden" />
      <h1 className="hidden text-lg font-semibold tracking-tight sm:block">{title}</h1>
      <div className="ml-auto flex items-center gap-2">
        {showMonth && <MonthPicker />}
        <Button
          variant="outline"
          className="hidden h-9 w-56 justify-start text-muted-foreground md:flex"
          onClick={() => setCommandOpen(true)}
        >
          <Search />
          Search or jump to…
          <kbd className="ml-auto rounded border bg-muted px-1.5 font-mono text-[10px]">⌘K</kbd>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setCommandOpen(true)}
          aria-label="Search"
        >
          <Search />
        </Button>
        <UserMenu />
      </div>
    </header>
  );
}
