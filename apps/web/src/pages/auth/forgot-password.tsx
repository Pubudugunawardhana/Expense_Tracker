import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { MailCheck } from 'lucide-react';
import { Link } from 'react-router';
import { forgotPasswordSchema, type ForgotPasswordInput } from '@spendly/shared';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';
import { AuthLayout } from './auth-layout';

export function ForgotPasswordPage() {
  const [sentTo, setSentTo] = useState<string | null>(null);
  const form = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });
  const { errors, isSubmitting } = form.formState;

  const onSubmit = form.handleSubmit(async (input) => {
    try {
      await api('/auth/forgot-password', { method: 'POST', body: input });
      setSentTo(input.email);
    } catch (error) {
      form.setError('root', { message: (error as Error).message });
    }
  });

  return (
    <AuthLayout
      title={sentTo ? 'Check your inbox' : 'Forgot your password?'}
      description={
        sentTo
          ? `If ${sentTo} has an account, we've sent a link to reset your password.`
          : "Enter your email and we'll send you a reset link."
      }
      footer={
        <Link to="/login" className="font-medium text-primary hover:underline">
          Back to sign in
        </Link>
      }
    >
      {sentTo ? (
        <div className="flex flex-col items-center gap-4 rounded-xl border bg-card p-6 text-center">
          <MailCheck className="size-10 text-primary" />
          <p className="text-sm text-muted-foreground">
            The link expires in 1 hour. Don't forget to check your spam folder.
          </p>
          <Button variant="outline" onClick={() => setSentTo(null)}>
            Use a different email
          </Button>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <Field
            label="Email"
            htmlFor="email"
            error={errors.email?.message ?? errors.root?.message}
          >
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              {...form.register('email')}
            />
          </Field>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Sending…' : 'Send reset link'}
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}
