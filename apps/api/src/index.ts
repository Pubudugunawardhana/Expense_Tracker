import mongoose from 'mongoose';
import cron from 'node-cron';
import { createApp } from './app';
import { env } from './env';
import { connectMongo } from './lib/db';
import { logger } from './lib/logger';
import { resetDemoData } from './services/demo';
import { processDueRules } from './services/recurring';

/** `MONGODB_URI=memory` runs against a throwaway in-memory MongoDB (local development only). */
const resolveMongoUri = async () => {
  if (env.MONGODB_URI !== 'memory') return env.MONGODB_URI;
  if (env.isProd) throw new Error('MONGODB_URI=memory is not allowed in production');
  const { MongoMemoryServer } = await import('mongodb-memory-server');
  const server = await MongoMemoryServer.create();
  logger.warn('Using an in-memory MongoDB – data is lost when the server stops');
  return server.getUri('spendly');
};

const start = async () => {
  await connectMongo(await resolveMongoUri());
  logger.info('MongoDB connected');
  if (env.MONGODB_URI === 'memory' && env.DEMO_ENABLED) await resetDemoData();

  const server = createApp().listen(env.PORT, () => {
    logger.info(`API listening on http://localhost:${env.PORT}`);
  });

  // Hourly: create transactions for due recurring rules.
  cron.schedule('5 * * * *', () => {
    processDueRules()
      .then((created) => created && logger.info({ created }, 'Recurring transactions created'))
      .catch((error: unknown) => logger.error({ err: error }, 'Recurring job failed'));
  });

  // Nightly: restore the public demo account to its original state.
  if (env.DEMO_ENABLED) {
    cron.schedule('0 3 * * *', () => {
      resetDemoData().catch((error: unknown) => logger.error({ err: error }, 'Demo reset failed'));
    });
  }

  const shutdown = () => {
    server.close(() => {
      void mongoose.disconnect().then(() => process.exit(0));
    });
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
};

start().catch((error: unknown) => {
  logger.fatal({ err: error }, 'Failed to start the API');
  process.exit(1);
});
