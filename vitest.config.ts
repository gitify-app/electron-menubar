import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.spec.ts', 'tests/shared/**/*.spec.ts'],
    environment: 'node',
  },
});
