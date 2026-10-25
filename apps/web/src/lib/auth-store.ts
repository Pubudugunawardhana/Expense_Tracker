import { create } from 'zustand';
import type { User } from '@spendly/shared';

type Status = 'loading' | 'authenticated' | 'anonymous';

interface AuthState {
  status: Status;
  user: User | null;
  /** Short-lived JWT kept in memory only; the refresh token lives in an httpOnly cookie. */
  accessToken: string | null;
  setSession: (accessToken: string, user: User) => void;
  setUser: (user: User) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  status: 'loading',
  user: null,
  accessToken: null,
  setSession: (accessToken, user) => set({ status: 'authenticated', accessToken, user }),
  setUser: (user) => set({ user }),
  clear: () => set({ status: 'anonymous', accessToken: null, user: null }),
}));
