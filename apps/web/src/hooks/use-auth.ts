import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import type { AuthResponse, LoginInput, RegisterInput } from '@spendly/shared';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';

export function useAuth() {
  const { user, status, setSession, clear } = useAuthStore();
  const queryClient = useQueryClient();

  const start = useCallback(
    (session: AuthResponse) => {
      queryClient.clear();
      setSession(session.accessToken, session.user);
      return session.user;
    },
    [queryClient, setSession],
  );

  const login = useCallback(
    async (input: LoginInput) => start(await api<AuthResponse>('/auth/login', { method: 'POST', body: input })),
    [start],
  );

  const register = useCallback(
    async (input: RegisterInput) =>
      start(await api<AuthResponse>('/auth/register', { method: 'POST', body: input })),
    [start],
  );

  const loginWithGoogle = useCallback(
    async (credential: string) =>
      start(await api<AuthResponse>('/auth/google', { method: 'POST', body: { credential } })),
    [start],
  );

  const loginDemo = useCallback(
    async () => start(await api<AuthResponse>('/auth/demo', { method: 'POST' })),
    [start],
  );

  const logout = useCallback(async () => {
    await api('/auth/logout', { method: 'POST' }).catch(() => undefined);
    clear();
    queryClient.clear();
  }, [clear, queryClient]);

  return { user, status, login, register, loginWithGoogle, loginDemo, logout };
}
