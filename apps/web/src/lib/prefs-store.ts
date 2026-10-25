import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { toMonthKey } from '@spendly/shared';

export type Theme = 'light' | 'dark' | 'system';

interface PrefsState {
  theme: Theme;
  sidebarCollapsed: boolean;
  setTheme: (theme: Theme) => void;
  toggleSidebar: () => void;
}

export const usePrefs = create<PrefsState>()(
  persist(
    (set) => ({
      theme: 'system',
      sidebarCollapsed: false,
      setTheme: (theme) => set({ theme }),
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
    }),
    { name: 'spendly-prefs' },
  ),
);

export const applyTheme = (theme: Theme) => {
  const dark =
    theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.classList.toggle('dark', dark);
};

/** The month every page is looking at (shared by the month picker in the top bar). */
interface MonthState {
  month: string;
  setMonth: (month: string) => void;
}

export const useMonthStore = create<MonthState>((set) => ({
  month: toMonthKey(new Date()),
  setMonth: (month) => set({ month }),
}));
