import { AnimatePresence, motion } from 'motion/react';
import { PanelLeftClose, PanelLeftOpen, Plus } from 'lucide-react';
import { NavLink, Outlet, useLocation } from 'react-router';
import { Wordmark, Logo } from '@/components/brand/logo';
import { CommandMenu } from '@/components/layout/command-menu';
import { TopBar } from '@/components/layout/top-bar';
import { TransactionSheet } from '@/components/transactions/transaction-sheet';
import { PwaPrompt } from '@/components/layout/pwa-prompt';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { usePrefs } from '@/lib/prefs-store';
import { useTransactionSheet } from '@/lib/ui-store';
import { cn } from '@/lib/utils';
import { NAV_ITEMS, SECONDARY_NAV, type NavItem } from './nav-items';

function SidebarLink({ item, collapsed }: { item: NavItem; collapsed: boolean }) {
  const link = (
    <NavLink
      to={item.to}
      className={({ isActive }) =>
        cn(
          'group flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
          isActive && 'bg-sidebar-accent text-sidebar-accent-foreground',
          collapsed && 'justify-center px-0',
        )
      }
    >
      <item.icon className="size-[18px] shrink-0" />
      {!collapsed && <span>{item.label}</span>}
    </NavLink>
  );
  if (!collapsed) return link;
  return (
    <Tooltip>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent side="right">{item.label}</TooltipContent>
    </Tooltip>
  );
}

function Sidebar() {
  const { sidebarCollapsed: collapsed, toggleSidebar } = usePrefs();
  const openNew = useTransactionSheet((state) => state.openNew);

  return (
    <aside
      className={cn(
        'sticky top-0 hidden h-dvh shrink-0 flex-col border-r bg-sidebar transition-[width] duration-200 lg:flex',
        collapsed ? 'w-[72px]' : 'w-64',
      )}
    >
      <div className={cn('flex h-16 items-center px-5', collapsed && 'justify-center px-0')}>
        {collapsed ? <Logo className="size-8" /> : <Wordmark />}
      </div>

      <div className={cn('px-3 pb-2', collapsed && 'px-4')}>
        <Button className={cn('w-full', collapsed && 'px-0')} onClick={() => openNew()}>
          <Plus />
          {!collapsed && 'Add transaction'}
        </Button>
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-3 py-2">
        {NAV_ITEMS.map((item) => (
          <SidebarLink key={item.to} item={item} collapsed={collapsed} />
        ))}
        <div className="my-3 border-t" />
        {SECONDARY_NAV.map((item) => (
          <SidebarLink key={item.to} item={item} collapsed={collapsed} />
        ))}
      </nav>

      <div className="p-3">
        <Button
          variant="ghost"
          size="sm"
          className={cn('w-full justify-start text-muted-foreground', collapsed && 'justify-center')}
          onClick={toggleSidebar}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
          {!collapsed && 'Collapse'}
        </Button>
      </div>
    </aside>
  );
}

function MobileNav() {
  const openNew = useTransactionSheet((state) => state.openNew);
  const items = NAV_ITEMS.filter((item) => item.mobile);
  const left = items.slice(0, 2);
  const right = items.slice(2);

  const renderItem = (item: NavItem) => (
    <NavLink
      key={item.to}
      to={item.to}
      className={({ isActive }) =>
        cn(
          'flex flex-1 flex-col items-center gap-1 py-2 text-[11px] font-medium text-muted-foreground',
          isActive && 'text-primary',
        )
      }
    >
      <item.icon className="size-5" />
      {item.label}
    </NavLink>
  );

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex items-center border-t bg-background/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-lg lg:hidden">
      {left.map(renderItem)}
      <div className="flex flex-1 justify-center">
        <Button size="icon" className="-mt-6 size-14 rounded-full shadow-lg shadow-primary/30" onClick={() => openNew()} aria-label="Add transaction">
          <Plus className="size-6" />
        </Button>
      </div>
      {right.map(renderItem)}
    </nav>
  );
}

export function AppLayout() {
  const location = useLocation();
  return (
    <div className="flex min-h-dvh">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 pt-4 pb-28 sm:px-6 lg:px-8 lg:pb-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
      <MobileNav />
      <TransactionSheet />
      <CommandMenu />
      <PwaPrompt />
    </div>
  );
}
