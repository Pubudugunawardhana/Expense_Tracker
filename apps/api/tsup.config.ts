import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/scripts/seed.ts', 'src/scripts/migrate-v1.ts'],
  format: 'esm',
  target: 'node20',
  platform: 'node',
  clean: true,
  sourcemap: true,
  // The shared workspace package ships TypeScript source, so bundle it in.
  noExternal: ['@spendly/shared'],
});
