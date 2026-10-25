import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import mongoose from 'mongoose';
import { pinoHttp } from 'pino-http';
import { env } from './env';
import { aiEnabled } from './lib/ai';
import { emailEnabled } from './lib/email';
import { logger } from './lib/logger';
import { requireAuth } from './middleware/auth';
import { errorHandler, notFoundHandler } from './middleware/error';
import { aiRouter } from './routes/ai';
import { authRouter } from './routes/auth';
import { budgetsRouter } from './routes/budgets';
import { categoriesRouter } from './routes/categories';
import { feedbackRouter } from './routes/feedback';
import { recurringRouter } from './routes/recurring';
import { statsRouter } from './routes/stats';
import { transactionsRouter } from './routes/transactions';

export const createApp = () => {
  const app = express();

  app.set('trust proxy', 1); // Render / Vercel sit behind a proxy.
  app.use(helmet());
  app.use(
    cors({
      origin: (origin, callback) => callback(null, !origin || env.clientOrigins.includes(origin)),
      credentials: true,
    }),
  );
  app.use(compression());
  app.use(express.json({ limit: '100kb' }));
  app.use(cookieParser());
  if (env.NODE_ENV !== 'test') {
    app.use(pinoHttp({ logger, autoLogging: { ignore: (req) => req.url === '/api/health' } }));
  }

  app.get('/', (_req, res) => {
    res.json({ name: 'Spendly API', docs: 'https://github.com/Pubudugunawardhana/Expense_Tracker' });
  });

  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    });
  });

  /** Lets the frontend hide features the server isn't configured for. */
  app.get('/api/config', (_req, res) => {
    res.json({
      googleClientId: env.GOOGLE_CLIENT_ID ?? null,
      features: { ai: aiEnabled, email: emailEnabled, demo: env.DEMO_ENABLED },
    });
  });

  app.use('/api/auth', authRouter);
  app.use('/api/categories', requireAuth, categoriesRouter);
  app.use('/api/transactions', requireAuth, transactionsRouter);
  app.use('/api/budgets', requireAuth, budgetsRouter);
  app.use('/api/recurring', requireAuth, recurringRouter);
  app.use('/api/stats', requireAuth, statsRouter);
  app.use('/api/ai', requireAuth, aiRouter);
  app.use('/api/feedback', requireAuth, feedbackRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
};
