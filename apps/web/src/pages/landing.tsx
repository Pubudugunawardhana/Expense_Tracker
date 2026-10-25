import { useState } from 'react';
import { motion } from 'motion/react';
import {
  ArrowRight,
  Camera,
  FileDown,
  Globe2,
  Loader2,
  Moon,
  PlayCircle,
  Repeat,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Sun,
  Target,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router';
import { toast } from 'sonner';
import { Wordmark } from '@/components/brand/logo';
import { useSessionBootstrap } from '@/components/layout/route-guards';
import { Button } from '@/components/ui/button';
import { useServerConfig } from '@/hooks/api';
import { useAuth } from '@/hooks/use-auth';
import { usePrefs } from '@/lib/prefs-store';

const FEATURES = [
  {
    icon: Sparkles,
    title: 'AI quick add',
    body: 'Type “lunch 1500 yesterday” and Claude fills in the amount, category and date for you.',
  },
  {
    icon: Camera,
    title: 'Receipt scanning',
    body: 'Snap a photo of a bill — the merchant, total and date are extracted automatically.',
  },
  {
    icon: Target,
    title: 'Smart budgets',
    body: 'Monthly and per-category limits with early warnings before you overspend.',
  },
  {
    icon: Globe2,
    title: 'Multi-currency',
    body: 'Log spending in LKR, USD, EUR and more. Everything converts to your base currency.',
  },
  {
    icon: Repeat,
    title: 'Recurring bills',
    body: 'Rent, subscriptions and salary are recorded automatically on schedule.',
  },
  {
    icon: FileDown,
    title: 'Reports & export',
    body: 'Beautiful charts, PDF statements and CSV exports for any month.',
  },
  {
    icon: Smartphone,
    title: 'Installable PWA',
    body: 'Add it to your home screen and check your numbers even when offline.',
  },
  {
    icon: ShieldCheck,
    title: 'Secure by design',
    body: 'httpOnly refresh tokens, rate limiting, hashed secrets and Google sign-in.',
  },
];

const STACK = [
  'React 19',
  'TypeScript',
  'Vite',
  'Tailwind CSS',
  'shadcn/ui',
  'TanStack Query',
  'Express 5',
  'MongoDB',
  'Zod',
  'Claude AI',
];

/** A lightweight, code-drawn preview of the dashboard for the hero section. */
function DashboardPreview() {
  const bars = [42, 58, 35, 70, 52, 64, 48, 76, 60, 55, 68, 50];
  return (
    <div className="rounded-2xl border bg-card/80 p-3 shadow-2xl shadow-primary/10 backdrop-blur sm:p-4">
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: 'Income', value: 'LKR 320,000', tone: 'text-income' },
          { label: 'Expenses', value: 'LKR 184,250', tone: 'text-expense' },
          { label: 'Saved', value: '42%', tone: 'text-primary' },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border bg-background p-3 text-left">
            <div className="text-xs text-muted-foreground">{stat.label}</div>
            <div className={`mt-1 text-lg font-bold tabular ${stat.tone}`}>{stat.value}</div>
          </div>
        ))}
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-[2fr_1fr]">
        <div className="flex h-40 items-end gap-1.5 rounded-xl border bg-background p-3">
          {bars.map((height, index) => (
            <motion.div
              key={index}
              className="flex-1 rounded-t bg-chart-income/80"
              initial={{ height: 0 }}
              animate={{ height: `${height}%` }}
              transition={{ delay: 0.3 + index * 0.04, duration: 0.5 }}
            />
          ))}
        </div>
        <div className="space-y-2 rounded-xl border bg-background p-3 text-left text-xs">
          <div className="flex items-center gap-1.5 font-medium text-primary">
            <Sparkles className="size-3.5" /> AI insight
          </div>
          <p className="text-muted-foreground">
            Food spending is 18% lower than last month — nice work! You're on track to save LKR
            45,000.
          </p>
        </div>
      </div>
    </div>
  );
}

export function LandingPage() {
  const status = useSessionBootstrap();
  const { data: config } = useServerConfig();
  const { loginDemo } = useAuth();
  const navigate = useNavigate();
  const { theme, setTheme } = usePrefs();
  const [demoLoading, setDemoLoading] = useState(false);
  const signedIn = status === 'authenticated';

  const tryDemo = async () => {
    setDemoLoading(true);
    try {
      await loginDemo();
      navigate('/dashboard');
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <div className="relative min-h-dvh overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-grid [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />
      <div className="pointer-events-none absolute -top-40 left-1/2 size-[640px] -translate-x-1/2 rounded-full bg-primary/25 blur-[120px]" />

      <header className="relative mx-auto flex max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
        <Wordmark />
        <nav className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            aria-label="Toggle theme"
          >
            <Sun className="dark:hidden" />
            <Moon className="hidden dark:block" />
          </Button>
          {signedIn ? (
            <Button asChild>
              <Link to="/dashboard">Open dashboard</Link>
            </Button>
          ) : (
            <>
              <Button variant="ghost" asChild>
                <Link to="/login">Sign in</Link>
              </Button>
              <Button asChild className="hidden sm:inline-flex">
                <Link to="/register">Get started</Link>
              </Button>
            </>
          )}
        </nav>
      </header>

      <main className="relative">
        <section className="mx-auto max-w-6xl px-4 pt-12 pb-20 text-center sm:px-6 sm:pt-20">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-flex items-center gap-2 rounded-full border bg-card/60 px-3 py-1 text-xs font-medium backdrop-blur">
              <Sparkles className="size-3.5 text-primary" /> Now with Claude-powered insights
            </span>
            <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-extrabold tracking-tight text-balance sm:text-6xl">
              Know where every <span className="text-gradient">rupee</span> goes.
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-lg text-pretty text-muted-foreground">
              Spendly is a modern expense tracker with AI quick-add, receipt scanning, smart budgets
              and multi-currency support.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              {config?.features.demo && !signedIn && (
                <Button
                  size="lg"
                  onClick={tryDemo}
                  disabled={demoLoading}
                  className="shadow-lg shadow-primary/25"
                >
                  {demoLoading ? <Loader2 className="animate-spin" /> : <PlayCircle />}
                  Try the live demo
                </Button>
              )}
              <Button
                size="lg"
                variant={config?.features.demo && !signedIn ? 'outline' : 'default'}
                asChild
              >
                <Link to={signedIn ? '/dashboard' : '/register'}>
                  {signedIn ? 'Go to dashboard' : 'Create a free account'} <ArrowRight />
                </Link>
              </Button>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              No credit card. The demo resets every night.
            </p>
          </motion.div>

          <motion.div
            className="mx-auto mt-14 max-w-4xl"
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
          >
            <DashboardPreview />
          </motion.div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight">
              Everything you need to master your money
            </h2>
            <p className="mt-3 text-muted-foreground">
              Built for real life in Sri Lanka and beyond.
            </p>
          </div>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="rounded-2xl border bg-card p-5 transition-shadow hover:shadow-lg hover:shadow-primary/5"
              >
                <div className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
                  <feature.icon className="size-5" />
                </div>
                <h3 className="mt-4 font-semibold">{feature.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{feature.body}</p>
              </motion.div>
            ))}
          </div>
        </section>

        <section className="border-y bg-card/50 py-10">
          <div className="mx-auto max-w-6xl px-4 text-center sm:px-6">
            <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
              Built with
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {STACK.map((item) => (
                <span key={item} className="rounded-full border bg-background px-3 py-1 text-sm">
                  {item}
                </span>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:px-6">
        <Wordmark className="text-base" />
        <p>© {new Date().getFullYear()} Spendly · Designed & built by Pubudu Gunawardhana</p>
      </footer>
    </div>
  );
}
