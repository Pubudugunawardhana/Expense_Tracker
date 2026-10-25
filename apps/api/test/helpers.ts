import request from 'supertest';
import type { AuthResponse, Category } from '@spendly/shared';
import { createApp } from '../src/app';

export const app = createApp();

let counter = 0;

/** Registers a fresh user and returns an authenticated supertest agent. */
export async function signUp() {
  counter += 1;
  const agent = request.agent(app);
  const response = await agent
    .post('/api/auth/register')
    .send({ name: 'Test User', email: `user${counter}@example.com`, password: 'password123' })
    .expect(201);
  const session = response.body as AuthResponse;
  const auth = { Authorization: `Bearer ${session.accessToken}` };
  const categories = (await agent.get('/api/categories').set(auth).expect(200)).body as Category[];
  const categoryId = (name: string) => categories.find((category) => category.name === name)!.id;
  return { agent, auth, session, categories, categoryId };
}
