import { cn } from '@/lib/utils';

export function Logo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn('size-8', className)} aria-hidden>
      <defs>
        <linearGradient id="spendly-logo" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#8b5cf6" />
          <stop offset="1" stopColor="#d946ef" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill="url(#spendly-logo)" />
      <path
        d="M20.5 11.2c-.9-1.2-2.5-2-4.4-2-2.6 0-4.4 1.4-4.4 3.4 0 4.6 9 2.5 9 6.9 0 2-1.9 3.5-4.6 3.5-2.1 0-3.8-.9-4.7-2.3"
        fill="none"
        stroke="#fff"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn('flex items-center gap-2 text-lg font-bold tracking-tight', className)}>
      <Logo className="size-7" />
      Spendly
    </span>
  );
}
