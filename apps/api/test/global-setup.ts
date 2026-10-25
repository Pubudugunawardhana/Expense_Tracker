import type { TestProject } from 'vitest/node';

declare module 'vitest' {
  export interface ProvidedContext {
    mongoUri: string;
  }
}

let stop: (() => Promise<unknown>) | undefined;

/** Points `uri` at a dedicated `spendly-test` database so tests never touch real data. */
const toTestDatabase = (uri: string) => {
  const url = new URL(uri);
  url.pathname = '/spendly-test';
  return url.toString();
};

/**
 * `npm run test:atlas` loads `.env`, so tests run against that cluster's `spendly-test`
 * database. Plain `npm test` (and CI) starts a throwaway in-memory MongoDB instead.
 */
export async function setup(project: TestProject) {
  const external = process.env.TEST_MONGODB_URI ?? process.env.MONGODB_URI;
  if (external?.startsWith('mongodb')) {
    project.provide('mongoUri', toTestDatabase(external));
    return;
  }
  const { MongoMemoryServer } = await import('mongodb-memory-server');
  const server = await MongoMemoryServer.create();
  stop = () => server.stop();
  project.provide('mongoUri', server.getUri('spendly-test'));
}

export async function teardown() {
  await stop?.();
}
