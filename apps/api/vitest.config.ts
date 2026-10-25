import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: ['./test/env.ts'],
    globalSetup: ['./test/global-setup.ts'],
    // One in-memory MongoDB is shared, so run files one at a time.
    fileParallelism: false,
    testTimeout: 20_000,
    hookTimeout: 120_000,
  },
});
