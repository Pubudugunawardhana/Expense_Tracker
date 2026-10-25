import {
  ArrowLeftRight,
  BarChart3,
  LayoutDashboard,
  MessageSquareHeart,
  Repeat,
  Settings,
  Target,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  /** Shown in the mobile bottom bar. */
  mobile?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, mobile: true },
  { to: '/transactions', label: 'Transactions', icon: ArrowLeftRight, mobile: true },
  { to: '/budgets', label: 'Budgets', icon: Target, mobile: true },
  { to: '/recurring', label: 'Recurring', icon: Repeat },
  { to: '/reports', label: 'Reports', icon: BarChart3, mobile: true },
];

export const SECONDARY_NAV: NavItem[] = [
  { to: '/settings', label: 'Settings', icon: Settings },
  { to: '/feedback', label: 'Feedback', icon: MessageSquareHeart },
];
