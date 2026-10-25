import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Link, useLocation, useNavigate } from 'react-router';
import { loginSchema, type LoginInput } from '@spendly/shared';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/use-auth';
import { AuthLayout, SocialAuth } from './auth-layout';
import { PasswordInput } from './password-input';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const form = useForm<LoginInput>({ resolver: zodResolver(loginSchema), defaultValues: { email: '', password: '' } });
  const { errors, isSubmitting } = form.formState;

  const onSubmit = form.handleSubmit(async (input) => {
    try {
      await login(input);
      navigate((location.state as { from?: string } | null)?.from ?? '/dashboard', { replace: true });
    } catch (error) {
      form.setError('root', { message: (error as Error).message });
    }
  });

  return (
    <AuthLayout
      title="Welcome back"
      description="Sign in to keep your finances on track."
      footer={
        <>
          New to Spendly?{' '}
          <Link to="/register" className="font-medium text-primary hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <SocialAuth />
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <Field label="Email" htmlFor="email" error={errors.email?.message}>
          <Input id="email" type="email" autoComplete="email" placeholder="you@example.com" {...form.register('email')} />
        </Field>
        <Field
          label={
            <span className="flex w-full items-center justify-between">
              Password
              <Link to="/forgot-password" className="text-xs font-normal text-primary hover:underline">
                Forgot password?
              </Link>
            </span>
          }
          htmlFor="password"
          error={errors.password?.message}
        >
          <PasswordInput id="password" autoComplete="current-password" {...form.register('password')} />
        </Field>
        {errors.root && (
          <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
            {errors.root.message}
          </p>
        )}
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>
    </AuthLayout>
  );
}
