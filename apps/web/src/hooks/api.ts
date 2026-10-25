import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  Budget,
  BudgetInput,
  Category,
  CategoryInput,
  ChangePasswordInput,
  Feedback,
  FeedbackInput,
  InsightsResponse,
  MonthSummary,
  Paginated,
  ParsedTransaction,
  RecurringInput,
  RecurringRule,
  Transaction,
  TransactionInput,
  TransactionQuery,
  UpdateProfileInput,
  User,
} from '@spendly/shared';
import { api, toQueryString } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';

export const keys = {
  config: ['config'] as const,
  categories: ['categories'] as const,
  transactions: (query?: TransactionQuery) => ['transactions', query ?? {}] as const,
  summary: (month: string) => ['summary', month] as const,
  budget: (month: string) => ['budget', month] as const,
  recurring: ['recurring'] as const,
  insights: (month: string) => ['insights', month] as const,
  feedback: ['feedback'] as const,
};

// ─── Server config ───────────────────────────────────────────────────────

export interface ServerConfig {
  googleClientId: string | null;
  features: { ai: boolean; email: boolean; demo: boolean };
}

export const useServerConfig = () =>
  useQuery({
    queryKey: keys.config,
    queryFn: () => api<ServerConfig>('/config'),
    staleTime: Infinity,
  });

// ─── Categories ──────────────────────────────────────────────────────────

export const useCategories = () =>
  useQuery({
    queryKey: keys.categories,
    queryFn: () => api<Category[]>('/categories'),
    staleTime: 5 * 60 * 1000,
  });

/** Category lookup by id. */
export const useCategoryMap = () => {
  const { data } = useCategories();
  return new Map((data ?? []).map((category) => [category.id, category]));
};

export const useSaveCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id?: string; input: CategoryInput }) =>
      id
        ? api<Category>(`/categories/${id}`, { method: 'PUT', body: input })
        : api<Category>('/categories', { method: 'POST', body: input }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.categories }),
  });
};

export const useDeleteCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api<void>(`/categories/${id}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries(),
  });
};

// ─── Transactions ────────────────────────────────────────────────────────

export const useTransactions = (query: TransactionQuery, { enabled = true } = {}) =>
  useQuery({
    queryKey: keys.transactions(query),
    queryFn: ({ signal }) =>
      api<Paginated<Transaction>>(`/transactions${toQueryString({ ...query })}`, { signal }),
    placeholderData: keepPreviousData,
    enabled,
  });

/** Anything that changes transactions invalidates every derived view. */
const invalidateMoneyData = (queryClient: ReturnType<typeof useQueryClient>) =>
  Promise.all(
    ['transactions', 'summary', 'insights', 'recurring'].map((key) =>
      queryClient.invalidateQueries({ queryKey: [key] }),
    ),
  );

export const useSaveTransaction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id?: string; input: TransactionInput }) =>
      id
        ? api<Transaction>(`/transactions/${id}`, { method: 'PUT', body: input })
        : api<Transaction>('/transactions', { method: 'POST', body: input }),
    onSuccess: () => invalidateMoneyData(queryClient),
  });
};

export const useDeleteTransactions = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (ids: string[]) => {
      if (ids.length === 1) await api<void>(`/transactions/${ids[0]}`, { method: 'DELETE' });
      else await api('/transactions/bulk-delete', { method: 'POST', body: { ids } });
    },
    // Optimistically hide deleted rows from every cached list.
    onMutate: async (ids) => {
      await queryClient.cancelQueries({ queryKey: ['transactions'] });
      const snapshots = queryClient.getQueriesData<Paginated<Transaction>>({
        queryKey: ['transactions'],
      });
      for (const [key, data] of snapshots) {
        if (!data) continue;
        queryClient.setQueryData<Paginated<Transaction>>(key, {
          ...data,
          items: data.items.filter((tx) => !ids.includes(tx.id)),
          total: data.total - ids.length,
        });
      }
      return { snapshots };
    },
    onError: (_error, _ids, context) => {
      for (const [key, data] of context?.snapshots ?? []) queryClient.setQueryData(key, data);
    },
    onSettled: () => invalidateMoneyData(queryClient),
  });
};

// ─── Stats & budgets ─────────────────────────────────────────────────────

export const useSummary = (month: string) =>
  useQuery({
    queryKey: keys.summary(month),
    queryFn: () => api<MonthSummary>(`/stats/summary?month=${month}`),
    placeholderData: keepPreviousData,
  });

export const useBudget = (month: string) =>
  useQuery({
    queryKey: keys.budget(month),
    queryFn: () => api<Budget>(`/budgets/${month}`),
  });

export const useSaveBudget = (month: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: BudgetInput) =>
      api<Budget>(`/budgets/${month}`, { method: 'PUT', body: input }),
    onSuccess: (budget) => {
      queryClient.setQueryData(keys.budget(month), budget);
      // Later months may inherit this budget.
      void queryClient.invalidateQueries({ queryKey: ['budget'] });
      void queryClient.invalidateQueries({ queryKey: ['insights'] });
    },
  });
};

// ─── Recurring ───────────────────────────────────────────────────────────

export const useRecurring = () =>
  useQuery({ queryKey: keys.recurring, queryFn: () => api<RecurringRule[]>('/recurring') });

export const useSaveRecurring = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id?: string; input: RecurringInput }) =>
      id
        ? api<RecurringRule>(`/recurring/${id}`, { method: 'PUT', body: input })
        : api<RecurringRule>('/recurring', { method: 'POST', body: input }),
    onSuccess: () => invalidateMoneyData(queryClient),
  });
};

export const useDeleteRecurring = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api<void>(`/recurring/${id}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.recurring }),
  });
};

// ─── AI ──────────────────────────────────────────────────────────────────

export const useInsights = (month: string, enabled: boolean) =>
  useQuery({
    queryKey: keys.insights(month),
    queryFn: () => api<InsightsResponse>(`/ai/insights?month=${month}`),
    enabled,
    staleTime: 10 * 60 * 1000,
    retry: false,
  });

export const useRefreshInsights = (month: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api<InsightsResponse>(`/ai/insights?month=${month}&refresh=1`),
    onSuccess: (data) => queryClient.setQueryData(keys.insights(month), data),
  });
};

export const useParseText = () =>
  useMutation({
    mutationFn: (text: string) =>
      api<ParsedTransaction>('/ai/parse', { method: 'POST', body: { text } }),
  });

export const useScanReceipt = () =>
  useMutation({
    mutationFn: (file: File) => {
      const form = new FormData();
      form.append('receipt', file);
      return api<ParsedTransaction>('/ai/receipt', { method: 'POST', body: form });
    },
  });

// ─── Feedback ────────────────────────────────────────────────────────────

export const useFeedback = () =>
  useQuery({ queryKey: keys.feedback, queryFn: () => api<Feedback[]>('/feedback') });

export const useSendFeedback = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: FeedbackInput) =>
      api<Feedback>('/feedback', { method: 'POST', body: input }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.feedback }),
  });
};

// ─── Profile ─────────────────────────────────────────────────────────────

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((state) => state.setUser);
  return useMutation({
    mutationFn: (input: UpdateProfileInput) =>
      api<User>('/auth/me', { method: 'PATCH', body: input }),
    onSuccess: (user, input) => {
      setUser(user);
      if (input.baseCurrency) void queryClient.invalidateQueries();
    },
  });
};

export const useChangePassword = () =>
  useMutation({
    mutationFn: (input: ChangePasswordInput) =>
      api<{ message: string }>('/auth/change-password', { method: 'POST', body: input }),
  });
