import type { IncomingMessage, ServerResponse } from 'node:http';
import { createApp } from './app';
import { env } from './env';
import { connectMongo } from './lib/db';

/**
 * Vercel serverless entry point. Warm invocations reuse the app and the MongoDB
 * connection; a failed connection is retried on the next request.
 */
const app = createApp();
let ready: Promise<void> | null = null;

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  ready ??= connectMongo(env.MONGODB_URI).catch((error: unknown) => {
    ready = null;
    throw error;
  });
  await ready;
  app(req, res);
}
