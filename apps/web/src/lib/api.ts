import type { ApiErrorBody, AuthResponse } from '@spendly/shared';
import { useAuthStore } from './auth-store';

const API_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public issues: ApiErrorBody['issues'] = [],
  ) {
    super(message);
  }
}

const toApiError = async (response: Response) => {
  const body = (await response.json().catch(() => null)) as ApiErrorBody | null;
  return new ApiError(response.status, body?.message ?? `Request failed (${response.status})`, body?.issues);
};

/** Endpoints whose 401 means "wrong credentials", not "access token expired". */
const PUBLIC_AUTH_PATHS = /^\/auth\/(login|register|google|demo|refresh|logout|forgot-password|reset-password)/;

let refreshing: Promise<AuthResponse | null> | null = null;

/** Exchanges the refresh cookie for a new access token. Concurrent callers share one request. */
export const refreshSession = () => {
  refreshing ??= fetch(`${API_URL}/api/auth/refresh`, { method: 'POST', credentials: 'include' })
    .then(async (response) => {
      if (!response.ok) return null;
      const session = (await response.json()) as AuthResponse;
      useAuthStore.getState().setSession(session.accessToken, session.user);
      return session;
    })
    .catch(() => null)
    .finally(() => {
      refreshing = null;
    });
  return refreshing;
};

type Body = Record<string, unknown> | unknown[] | FormData;

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: Body;
  signal?: AbortSignal;
  /** Return the raw Response (for file downloads). */
  raw?: boolean;
}

async function send(path: string, options: RequestOptions, token: string | null) {
  const isForm = options.body instanceof FormData;
  return fetch(`${API_URL}/api${path}`, {
    method: options.method ?? 'GET',
    credentials: 'include',
    signal: options.signal,
    headers: {
      ...(options.body && !isForm ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: options.body ? (isForm ? (options.body as FormData) : JSON.stringify(options.body)) : undefined,
  });
}

export async function api<T>(path: string, options: RequestOptions = {}): Promise<T> {
  let response = await send(path, options, useAuthStore.getState().accessToken);

  // Access tokens are short-lived: refresh once and retry.
  if (response.status === 401 && !PUBLIC_AUTH_PATHS.test(path)) {
    const session = await refreshSession();
    if (!session) {
      useAuthStore.getState().clear();
      throw new ApiError(401, 'Your session has expired. Please sign in again.');
    }
    response = await send(path, options, session.accessToken);
  }

  if (!response.ok) throw await toApiError(response);
  if (options.raw) return response as T;
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export const toQueryString = (params: Record<string, string | number | undefined | null>) => {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') search.set(key, String(value));
  }
  const query = search.toString();
  return query ? `?${query}` : '';
};

export const downloadFile = async (path: string, filename: string) => {
  const response = await api<Response>(path, { raw: true });
  const url = URL.createObjectURL(await response.blob());
  const link = Object.assign(document.createElement('a'), { href: url, download: filename });
  link.click();
  URL.revokeObjectURL(url);
};
