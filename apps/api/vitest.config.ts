import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/e2e/**/*.test.ts'],
    setupFiles: ['tests/setup.ts'],
    hookTimeout: 60000,
    testTimeout: 20000,
    globals: false,
    fileParallelism: false,
    maxConcurrency: 1,
  },
});
