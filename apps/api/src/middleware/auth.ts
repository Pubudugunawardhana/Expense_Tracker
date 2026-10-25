import type { RequestHandler } from 'express';
import { unauthorized } from '../lib/errors';
import { verifyAccessToken } from '../lib/tokens';

export const requireAuth: RequestHandler = (req, _res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) throw unauthorized();

  try {
    req.userId = verifyAccessToken(header.slice(7));
  } catch {
    throw unauthorized('Your session has expired.');
  }
  next();
};
