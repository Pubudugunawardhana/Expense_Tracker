import { createBrowserRouter, Navigate } from 'react-router';
import { AppLayout } from '@/components/layout/app-layout';
import { RequireAuth, RequireGuest } from '@/components/layout/route-guards';
import { RouteError } from '@/components/layout/route-error';

// Pages are code-split so the landing page stays light.
export const router = createBrowserRouter([
  {
    errorElement: <RouteError />,
    children: [
      {
        path: '/',
        lazy: () => import('@/pages/landing').then((m) => ({ Component: m.LandingPage })),
      },
      {
        element: <RequireGuest />,
        children: [
          {
            path: '/login',
            lazy: () => import('@/pages/auth/login').then((m) => ({ Component: m.LoginPage })),
          },
          {
            path: '/register',
            lazy: () =>
              import('@/pages/auth/register').then((m) => ({ Component: m.RegisterPage })),
          },
          {
            path: '/forgot-password',
            lazy: () =>
              import('@/pages/auth/forgot-password').then((m) => ({
                Component: m.ForgotPasswordPage,
              })),
          },
          {
            path: '/reset-password',
            lazy: () =>
              import('@/pages/auth/reset-password').then((m) => ({
                Component: m.ResetPasswordPage,
              })),
          },
        ],
      },
      {
        element: <RequireAuth />,
        children: [
          {
            element: <AppLayout />,
            children: [
              {
                path: '/dashboard',
                lazy: () =>
                  import('@/pages/dashboard').then((m) => ({ Component: m.DashboardPage })),
              },
              {
                path: '/transactions',
                lazy: () =>
                  import('@/pages/transactions').then((m) => ({ Component: m.TransactionsPage })),
              },
              {
                path: '/budgets',
                lazy: () => import('@/pages/budgets').then((m) => ({ Component: m.BudgetsPage })),
              },
              {
                path: '/recurring',
                lazy: () =>
                  import('@/pages/recurring').then((m) => ({ Component: m.RecurringPage })),
              },
              {
                path: '/reports',
                lazy: () => import('@/pages/reports').then((m) => ({ Component: m.ReportsPage })),
              },
              {
                path: '/settings',
                lazy: () => import('@/pages/settings').then((m) => ({ Component: m.SettingsPage })),
              },
              {
                path: '/feedback',
                lazy: () => import('@/pages/feedback').then((m) => ({ Component: m.FeedbackPage })),
              },
            ],
          },
        ],
      },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
]);
