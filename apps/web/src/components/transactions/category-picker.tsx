import type { Category } from '@spendly/shared';
import { CategoryBadge } from '@/lib/category-icons';
import { cn } from '@/lib/utils';

export function CategoryPicker({
  categories,
  value,
  onChange,
}: {
  categories: Category[];
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <div role="radiogroup" aria-label="Category" className="grid grid-cols-3 gap-2 sm:grid-cols-4">
      {categories.map((category) => {
        const selected = category.id === value;
        return (
          <button
            key={category.id}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(category.id)}
            className={cn(
              'flex flex-col items-center gap-1.5 rounded-xl border p-2.5 text-xs font-medium transition-all hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
              selected && 'border-primary bg-primary/5 ring-1 ring-primary',
            )}
          >
            <CategoryBadge category={category} size="sm" />
            <span className="w-full truncate text-center">{category.name}</span>
          </button>
        );
      })}
    </div>
  );
}
