import { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router';
import { refreshSession } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import { Logo } from '@/components/brand/logo';

/** Restores the session from the refresh cookie once per page load. */
export function useSessionBootstrap() {
  const status = useAuthStore((state) => state.status);
  useEffect(() => {
    if (status !== 'loading') return;
    void refreshSession().then((session) => {
      if (!session) useAuthStore.getState().clear();
    });
  }, [status]);
  return status;
}

function SplashScreen() {
  return (
    <div className="grid min-h-dvh place-items-center">
      <div className="flex animate-pulse flex-col items-center gap-3">
        <Logo className="size-12" />
        <span className="text-sm text-muted-foreground">Loading your finances…</span>
      </div>
    </div>
  );
}

export function RequireAuth() {
  const status = useSessionBootstrap();
  const location = useLocation();
  if (status === 'loading') return <SplashScreen />;
  if (status === 'anonymous')
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return <Outlet />;
}

export function RequireGuest() {
  const status = useSessionBootstrap();
  if (status === 'loading') return <SplashScreen />;
  if (status === 'authenticated') return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}
