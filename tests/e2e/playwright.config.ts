import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  testMatch: /.*\.e2e\.test\.ts/,
  timeout: 60_000,
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  retries: process.env.CI ? 1 : 0,
});
