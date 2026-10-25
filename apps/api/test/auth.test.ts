import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { RefreshToken } from '../src/models/RefreshToken';
import { User } from '../src/models/User';
import { sha256 } from '../src/lib/tokens';
import { app, signUp } from './helpers';

const cookieValue = (setCookie: string[] | string | undefined) => {
  const header = Array.isArray(setCookie) ? setCookie.join(';') : (setCookie ?? '');
  return /spendly_rt=([^;]+)/.exec(header)?.[1];
};

describe('auth', () => {
  it('registers, seeds default categories and returns a session', async () => {
    const { session, categories } = await signUp();
    expect(session.accessToken).toBeTruthy();
    expect(session.user).toMatchObject({
      name: 'Test User',
      baseCurrency: 'LKR',
      hasPassword: true,
    });
    expect(categories.length).toBeGreaterThan(5);
  });

  it('rejects duplicate emails and weak passwords', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ name: 'A', email: 'bad', password: '1' })
      .expect(400);
    const body = { name: 'Dup', email: 'dup@example.com', password: 'password123' };
    await request(app).post('/api/auth/register').send(body).expect(201);
    await request(app).post('/api/auth/register').send(body).expect(409);
  });

  it('logs in with the right password only', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ name: 'Login', email: 'login@example.com', password: 'password123' });
    await request(app)
      .post('/api/auth/login')
      .send({ email: 'login@example.com', password: 'wrong-pass' })
      .expect(401);
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'LOGIN@example.com', password: 'password123' })
      .expect(200);
    expect(response.body.user.email).toBe('login@example.com');
  });

  it('rotates refresh tokens and rejects reuse', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Rotate', email: 'rotate@example.com', password: 'password123' });
    const first = cookieValue(response.headers['set-cookie']);
    expect(first).toBeTruthy();

    const refreshed = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', `spendly_rt=${first}`)
      .expect(200);
    const second = cookieValue(refreshed.headers['set-cookie']);
    expect(second).toBeTruthy();
    expect(second).not.toBe(first);

    await request(app).post('/api/auth/refresh').set('Cookie', `spendly_rt=${first}`).expect(401);
  });

  it('requires a valid access token on protected routes', async () => {
    await request(app).get('/api/transactions').expect(401);
    await request(app).get('/api/transactions').set('Authorization', 'Bearer nope').expect(401);
  });

  it('resets a password with a valid token and signs out other sessions', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ name: 'Reset', email: 'reset@example.com', password: 'password123' });
    await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'reset@example.com' })
      .expect(200);

    // The token is only emailed, so plant a known one for the test.
    const token = 'known-reset-token-123456';
    await User.updateOne(
      { email: 'reset@example.com' },
      {
        resetPasswordTokenHash: sha256(token),
        resetPasswordExpires: new Date(Date.now() + 60_000),
      },
    );
    await request(app)
      .post('/api/auth/reset-password')
      .send({ token, password: 'brand-new-pass' })
      .expect(200);
    await request(app)
      .post('/api/auth/reset-password')
      .send({ token, password: 'brand-new-pass' })
      .expect(400);
    await request(app)
      .post('/api/auth/login')
      .send({ email: 'reset@example.com', password: 'brand-new-pass' })
      .expect(200);
    expect(
      await RefreshToken.countDocuments({
        userId: (await User.findOne({ email: 'reset@example.com' }))!._id,
      }),
    ).toBe(1);
  });

  it('does not reveal whether an email is registered', async () => {
    const response = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'nobody@example.com' })
      .expect(200);
    expect(response.body.message).toMatch(/if that email/i);
  });

  it('signs into the demo account', async () => {
    const response = await request(app).post('/api/auth/demo').expect(200);
    expect(response.body.user.email).toBe('demo@spendly.app');
    const auth = { Authorization: `Bearer ${response.body.accessToken}` };
    const transactions = await request(app).get('/api/transactions?limit=5').set(auth).expect(200);
    expect(transactions.body.total).toBeGreaterThan(20);
    await request(app).delete('/api/auth/me').set(auth).expect(400);
  });
});
