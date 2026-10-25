import { Router, type Response } from 'express';
import { OAuth2Client } from 'google-auth-library';
import {
  changePasswordSchema,
  forgotPasswordSchema,
  googleAuthSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  updateProfileSchema,
  type AuthResponse,
  type Currency,
} from '@spendly/shared';
import { appUrl, env } from '../env';
import { sendPasswordResetEmail } from '../lib/email';
import { AppError, badRequest, conflict, notFound, unauthorized } from '../lib/errors';
import { convert } from '../lib/fx';
import { toUserDto } from '../lib/serialize';
import {
  REFRESH_COOKIE,
  clearRefreshCookie,
  issueRefreshToken,
  randomToken,
  sha256,
  signAccessToken,
} from '../lib/tokens';
import { requireAuth } from '../middleware/auth';
import { authLimiter } from '../middleware/rateLimit';
import { Budget } from '../models/Budget';
import { Category } from '../models/Category';
import { AiInsight, Feedback } from '../models/misc';
import { RecurringRule } from '../models/RecurringRule';
import { RefreshToken } from '../models/RefreshToken';
import { Transaction } from '../models/Transaction';
import { User, comparePassword, type UserDoc } from '../models/User';
import { ensureDefaultCategories } from '../services/categories';
import { resetDemoData } from '../services/demo';
import { processDueRules } from '../services/recurring';

export const authRouter = Router();
const googleClient = env.GOOGLE_CLIENT_ID ? new OAuth2Client(env.GOOGLE_CLIENT_ID) : null;

const hasPassword = async (userId: string) =>
  Boolean(await User.exists({ _id: userId, password: { $exists: true, $ne: null } }));

/** Issues a fresh access + refresh token pair and sends the auth payload. */
const sendSession = async (res: Response, user: UserDoc, status = 200) => {
  await issueRefreshToken(res, user.id);
  // Catch up on recurring transactions whenever someone signs in.
  await processDueRules(user.id);
  const body: AuthResponse = {
    accessToken: signAccessToken(user.id),
    user: toUserDto(user, await hasPassword(user.id)),
  };
  res.status(status).json(body);
};

authRouter.post('/register', authLimiter, async (req, res) => {
  const input = registerSchema.parse(req.body);
  if (await User.exists({ email: input.email }))
    throw conflict('That email is already registered.');

  const user = await User.create(input);
  await ensureDefaultCategories(user.id);
  await sendSession(res, user, 201);
});

authRouter.post('/login', authLimiter, async (req, res) => {
  const { email, password } = loginSchema.parse(req.body);
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await comparePassword(user, password))) {
    throw unauthorized('Incorrect email or password.');
  }
  await sendSession(res, user);
});

authRouter.post('/google', authLimiter, async (req, res) => {
  if (!googleClient) throw new AppError(503, 'Google sign-in is not configured.');
  const { credential } = googleAuthSchema.parse(req.body);

  const ticket = await googleClient
    .verifyIdToken({ idToken: credential, audience: env.GOOGLE_CLIENT_ID })
    .catch(() => {
      throw unauthorized('Google sign-in failed. Please try again.');
    });
  const profile = ticket.getPayload();
  if (!profile?.email || !profile.email_verified)
    throw unauthorized('Your Google email is not verified.');

  let user = await User.findOne({
    $or: [{ googleId: profile.sub }, { email: profile.email.toLowerCase() }],
  });
  let created = false;
  if (!user) {
    user = await User.create({
      name: profile.name ?? profile.email.split('@')[0],
      email: profile.email,
      googleId: profile.sub,
      avatar: profile.picture ?? null,
    });
    created = true;
  } else if (!user.googleId) {
    // Link Google to an existing email/password account.
    user.googleId = profile.sub;
    user.avatar ??= profile.picture ?? null;
    await user.save();
  }

  await ensureDefaultCategories(user.id);
  await sendSession(res, user, created ? 201 : 200);
});

authRouter.post('/demo', authLimiter, async (_req, res) => {
  if (!env.DEMO_ENABLED) throw notFound('The demo account is disabled.');
  const user = (await User.findOne({ email: env.DEMO_EMAIL })) ?? (await resetDemoData());
  await sendSession(res, user);
});

authRouter.post('/refresh', async (req, res) => {
  const token: unknown = req.cookies?.[REFRESH_COOKIE];
  if (typeof token !== 'string') throw unauthorized('No active session.');

  // Rotate: each refresh token can be used exactly once.
  const stored = await RefreshToken.findOneAndDelete({ tokenHash: sha256(token) });
  if (!stored || stored.expiresAt < new Date()) {
    clearRefreshCookie(res);
    throw unauthorized('Your session has expired.');
  }

  const user = await User.findById(stored.userId);
  if (!user) {
    clearRefreshCookie(res);
    throw unauthorized('Account not found.');
  }
  await sendSession(res, user);
});

authRouter.post('/logout', async (req, res) => {
  const token: unknown = req.cookies?.[REFRESH_COOKIE];
  if (typeof token === 'string') await RefreshToken.deleteOne({ tokenHash: sha256(token) });
  clearRefreshCookie(res);
  res.status(204).end();
});

authRouter.post('/forgot-password', authLimiter, async (req, res) => {
  const { email } = forgotPasswordSchema.parse(req.body);
  const user = await User.findOne({ email });

  // Same response either way so the endpoint can't be used to discover accounts.
  if (user && !user.isDemo) {
    const token = randomToken();
    user.resetPasswordTokenHash = sha256(token);
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();
    await sendPasswordResetEmail(user.email, user.name, `${appUrl}/reset-password?token=${token}`);
  }

  res.json({ message: 'If that email is registered, a reset link is on its way.' });
});

authRouter.post('/reset-password', authLimiter, async (req, res) => {
  const { token, password } = resetPasswordSchema.parse(req.body);
  const user = await User.findOne({
    resetPasswordTokenHash: sha256(token),
    resetPasswordExpires: { $gt: new Date() },
  });
  if (!user) throw badRequest('This reset link is invalid or has expired.');

  user.password = password;
  user.resetPasswordTokenHash = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();
  // Sign out every other session.
  await RefreshToken.deleteMany({ userId: user._id });
  res.json({ message: 'Your password has been reset. You can sign in now.' });
});

// ─── Authenticated profile routes ────────────────────────────────────────

authRouter.get('/me', requireAuth, async (req, res) => {
  const user = await User.findById(req.userId);
  if (!user) throw unauthorized('Account not found.');
  res.json(toUserDto(user, await hasPassword(user.id)));
});

authRouter.patch('/me', requireAuth, async (req, res) => {
  const input = updateProfileSchema.parse(req.body);
  const user = await User.findById(req.userId);
  if (!user) throw unauthorized('Account not found.');
  if (user.isDemo && input.baseCurrency) throw badRequest('The demo account currency is fixed.');

  const previousCurrency = user.baseCurrency as Currency;
  if (input.name) user.name = input.name;
  if (input.baseCurrency) user.baseCurrency = input.baseCurrency;
  await user.save();

  if (input.baseCurrency && input.baseCurrency !== previousCurrency) {
    const newCurrency = input.baseCurrency;
    // Re-express every transaction in the new base currency at today's rates.
    const transactions = await Transaction.find({ userId: user._id }, 'amount currency');
    const updates = await Promise.all(
      transactions.map(async (tx) => ({
        updateOne: {
          filter: { _id: tx._id },
          update: { baseAmount: await convert(tx.amount, tx.currency as Currency, newCurrency) },
        },
      })),
    );
    if (updates.length) await Transaction.bulkWrite(updates);
    await AiInsight.deleteMany({ userId: user._id });
  }

  res.json(toUserDto(user, await hasPassword(user.id)));
});

authRouter.post('/change-password', requireAuth, async (req, res) => {
  const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);
  const user = await User.findById(req.userId).select('+password');
  if (!user) throw unauthorized('Account not found.');
  if (user.isDemo) throw badRequest("The demo account's password can't be changed.");

  if (user.password && !(await comparePassword(user, currentPassword ?? ''))) {
    throw badRequest('Your current password is incorrect.');
  }
  user.password = newPassword;
  await user.save();
  res.json({ message: 'Password updated.' });
});

authRouter.delete('/me', requireAuth, async (req, res) => {
  const user = await User.findById(req.userId);
  if (!user) throw unauthorized('Account not found.');
  if (user.isDemo) throw badRequest("The demo account can't be deleted.");

  const filter = { userId: user._id };
  await Promise.all([
    Transaction.deleteMany(filter),
    Category.deleteMany(filter),
    Budget.deleteMany(filter),
    RecurringRule.deleteMany(filter),
    RefreshToken.deleteMany(filter),
    AiInsight.deleteMany(filter),
    Feedback.deleteMany(filter),
  ]);
  await user.deleteOne();
  clearRefreshCookie(res);
  res.status(204).end();
});
