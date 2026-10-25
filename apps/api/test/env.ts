import mongoose from 'mongoose';
import { afterAll, beforeAll, beforeEach, inject, vi } from 'vitest';

process.env.MONGODB_URI = inject('mongoUri');
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-that-is-long-enough';
process.env.CLIENT_URL = 'http://localhost:5173';
process.env.DEMO_ENABLED = 'true';
delete process.env.ANTHROPIC_API_KEY;
delete process.env.RESEND_API_KEY;
delete process.env.GOOGLE_CLIENT_ID;

// Never hit the real exchange-rate API from tests.
vi.stubGlobal(
  'fetch',
  vi.fn(async () =>
    Response.json({
      result: 'success',
      rates: {
        USD: 1,
        LKR: 300,
        EUR: 0.9,
        GBP: 0.8,
        INR: 84,
        AUD: 1.5,
        CAD: 1.4,
        AED: 3.67,
        JPY: 150,
        SGD: 1.3,
      },
    }),
  ),
);

beforeAll(async () => {
  // Imported here so the env vars above are set before src/env.ts validates them.
  const { connectMongo } = await import('../src/lib/db');
  await connectMongo(process.env.MONGODB_URI!);
});

beforeEach(async () => {
  const collections = await mongoose.connection.db!.collections();
  await Promise.all(collections.map((collection) => collection.deleteMany({})));
});

afterAll(async () => {
  await mongoose.disconnect();
});
