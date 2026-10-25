import type { ReactNode } from 'react';
import { GoogleLogin, GoogleOAuthProvider } from '@react-oauth/google';
import { Loader2, PlayCircle, Sparkles } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router';
import { toast } from 'sonner';
import { Wordmark } from '@/components/brand/logo';
import { Button } from '@/components/ui/button';
import { useServerConfig } from '@/hooks/api';
import { useAuth } from '@/hooks/use-auth';
import { usePrefs } from '@/lib/prefs-store';
import { useState } from 'react';

export function AuthLayout({ title, description, children, footer }: { title: string; description: string; children: ReactNode; footer?: ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <div className="flex flex-col px-6 py-8 sm:px-12">
        <Link to="/" className="w-fit">
          <Wordmark />
        </Link>
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10">
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          <p className="mt-1 mb-8 text-sm text-muted-foreground">{description}</p>
          {children}
          {footer && <div className="mt-8 text-center text-sm text-muted-foreground">{footer}</div>}
        </div>
      </div>

      <div className="relative hidden overflow-hidden bg-zinc-950 lg:block">
        <div className="absolute inset-0 bg-grid opacity-20" />
        <div className="absolute -top-32 -left-24 size-[480px] rounded-full bg-violet-600/40 blur-3xl" />
        <div className="absolute -right-24 -bottom-32 size-[420px] rounded-full bg-fuchsia-500/30 blur-3xl" />
        <div className="relative flex h-full flex-col justify-end p-12 text-white">
          <div className="mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs backdrop-blur">
            <Sparkles className="size-3.5 text-violet-300" /> AI-powered personal finance
          </div>
          <blockquote className="max-w-md text-2xl leading-snug font-semibold">
            “Type <span className="text-violet-300">lunch 1500 yesterday</span> or snap a receipt — Spendly does the bookkeeping for you.”
          </blockquote>
          <p className="mt-4 max-w-md text-sm text-white/60">
            Income, expenses, budgets and recurring bills in any currency, with insights that actually help you save.
          </p>
        </div>
      </div>
    </div>
  );
}

/** Google button + "Try the demo", shared by sign in and sign up. */
export function SocialAuth() {
  const { data: config } = useServerConfig();
  const { loginWithGoogle, loginDemo } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = usePrefs((state) => state.theme);
  const [demoLoading, setDemoLoading] = useState(false);
  const destination = (location.state as { from?: string } | null)?.from ?? '/dashboard';
  const dark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

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

  if (!config?.googleClientId && !config?.features.demo) return null;

  return (
    <div className="space-y-3">
      {config.googleClientId && (
        <GoogleOAuthProvider clientId={config.googleClientId}>
          <div className="flex justify-center [&>div]:w-full">
            <GoogleLogin
              theme={dark ? 'filled_black' : 'outline'}
              size="large"
              width="384"
              shape="rectangular"
              text="continue_with"
              onSuccess={async ({ credential }) => {
                if (!credential) return;
                try {
                  await loginWithGoogle(credential);
                  navigate(destination);
                } catch (error) {
                  toast.error((error as Error).message);
                }
              }}
              onError={() => toast.error('Google sign-in was cancelled or failed.')}
            />
          </div>
        </GoogleOAuthProvider>
      )}
      {config.features.demo && (
        <Button variant="outline" className="w-full" onClick={tryDemo} disabled={demoLoading}>
          {demoLoading ? <Loader2 className="animate-spin" /> : <PlayCircle />}
          Explore the live demo
        </Button>
      )}
      <div className="flex items-center gap-3 py-2 text-xs text-muted-foreground">
        <div className="h-px flex-1 bg-border" />
        or with email
        <div className="h-px flex-1 bg-border" />
      </div>
    </div>
  );
}
