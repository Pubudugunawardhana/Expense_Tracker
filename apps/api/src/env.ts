import { z } from 'zod';

const optional = z
  .string()
  .optional()
  .transform((value) => (value ? value : undefined));

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(5000),
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters'),
  /**
   * Comma-separated list of allowed frontend origins. The first one is used in emails.
   * On Vercel it defaults to the project's production domain.
   */
  CLIENT_URL: z
    .string()
    .default(
      process.env.VERCEL_PROJECT_PRODUCTION_URL
        ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
        : 'http://localhost:5173',
    ),
  /** Vercel sends it as a Bearer token when calling the scheduled job. */
  CRON_SECRET: optional,
  RESEND_API_KEY: optional,
  EMAIL_FROM: z.string().default('Spendly <onboarding@resend.dev>'),
  GOOGLE_CLIENT_ID: optional,
  ANTHROPIC_API_KEY: optional,
  AI_MODEL_FAST: z.string().default('claude-haiku-5-5'),
  AI_MODEL_SMART: z.string().default('claude-sonnet-5-5'),
  DEMO_EMAIL: z.string().default('demo@spendly.app'),
  DEMO_ENABLED: z
    .enum(['true', 'false'])
    .default('true')
    .transform((value) => value === 'true'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment configuration:');
  for (const issue of parsed.error.issues) {
    console.error(`  ${issue.path.join('.')}: ${issue.message}`);
  }
  process.exit(1);
}

export const env = {
  ...parsed.data,
  isProd: parsed.data.NODE_ENV === 'production',
  clientOrigins: parsed.data.CLIENT_URL.split(',').map((origin) =>
    origin.trim().replace(/\/$/, ''),
  ),
};

export const appUrl = env.clientOrigins[0] ?? 'http://localhost:5173';
