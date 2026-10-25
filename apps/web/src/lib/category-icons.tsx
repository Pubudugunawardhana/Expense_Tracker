import {
  Briefcase,
  Car,
  CircleDashed,
  Clapperboard,
  Dumbbell,
  Gift,
  GraduationCap,
  HeartPulse,
  Home,
  Laptop,
  PawPrint,
  PiggyBank,
  Plane,
  Receipt,
  Shirt,
  ShoppingBag,
  TrendingUp,
  Utensils,
  Wallet,
  Wifi,
  type LucideIcon,
} from 'lucide-react';
import type { Category, CategoryIcon as IconName } from '@spendly/shared';
import { cn } from './utils';

export const CATEGORY_ICON_MAP: Record<IconName, LucideIcon> = {
  utensils: Utensils,
  car: Car,
  receipt: Receipt,
  'shopping-bag': ShoppingBag,
  clapperboard: Clapperboard,
  'heart-pulse': HeartPulse,
  home: Home,
  'graduation-cap': GraduationCap,
  plane: Plane,
  gift: Gift,
  wifi: Wifi,
  shirt: Shirt,
  dumbbell: Dumbbell,
  'paw-print': PawPrint,
  briefcase: Briefcase,
  laptop: Laptop,
  'trending-up': TrendingUp,
  'piggy-bank': PiggyBank,
  wallet: Wallet,
  'circle-dashed': CircleDashed,
};

const SIZES = {
  sm: 'size-8 rounded-lg [&>svg]:size-4',
  md: 'size-10 rounded-xl [&>svg]:size-5',
  lg: 'size-12 rounded-2xl [&>svg]:size-6',
};

export function CategoryBadge({
  category,
  size = 'md',
  className,
}: {
  category: Pick<Category, 'icon' | 'color'> | undefined;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const Icon = CATEGORY_ICON_MAP[category?.icon ?? 'circle-dashed'];
  const color = category?.color ?? '#64748b';
  return (
    <span
      className={cn('inline-flex shrink-0 items-center justify-center', SIZES[size], className)}
      style={{ backgroundColor: `${color}1f`, color }}
    >
      <Icon aria-hidden />
    </span>
  );
}
