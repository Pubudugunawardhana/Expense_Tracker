import crypto from 'node:crypto';
import type { CookieOptions, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../env';
import { RefreshToken } from '../models/RefreshToken';

const ACCESS_TOKEN_TTL = '15m';
const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;
export const REFRESH_COOKIE = 'spendly_rt';

export const sha256 = (value: string) => crypto.createHash('sha256').update(value).digest('hex');
export const randomToken = () => crypto.randomBytes(48).toString('base64url');

export const signAccessToken = (userId: string) =>
  jwt.sign({ sub: userId }, env.JWT_SECRET, { expiresIn: ACCESS_TOKEN_TTL });

export const verifyAccessToken = (token: string) => {
  const payload = jwt.verify(token, env.JWT_SECRET);
  if (typeof payload === 'string' || !payload.sub) throw new Error('Invalid token payload');
  return payload.sub;
};

// The web app and API share one origin (Vite proxy locally, Vercel in production),
// so the refresh cookie can be first-party and `SameSite=Lax`.
const cookieOptions: CookieOptions = {
  httpOnly: true,
  secure: env.isProd,
  sameSite: 'lax',
  path: '/api/auth',
};

/** Creates a refresh token, stores its hash, and sets it as an httpOnly cookie. */
export const issueRefreshToken = async (res: Response, userId: string) => {
  const token = randomToken();
  await RefreshToken.create({
    userId,
    tokenHash: sha256(token),
    expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
  });
  res.cookie(REFRESH_COOKIE, token, { ...cookieOptions, maxAge: REFRESH_TOKEN_TTL_MS });
};

export const clearRefreshCookie = (res: Response) => res.clearCookie(REFRESH_COOKIE, cookieOptions);
