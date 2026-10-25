import { rateLimit } from 'express-rate-limit';
import { env } from '../env';

const skip = () => env.NODE_ENV === 'test';

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  skip,
  message: { message: 'Too many attempts. Please wait a few minutes and try again.' },
});

/** Limits AI calls per signed-in user (runs after `requireAuth`). */
export const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 40,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  skip,
  keyGenerator: (req) => req.userId,
  message: { message: "You've reached the hourly AI limit. Please try again later." },
});
