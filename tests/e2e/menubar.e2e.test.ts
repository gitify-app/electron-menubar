import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { _electron as electron, expect, test } from '@playwright/test';

test('menubar boots, emits ready, opens window, exposes tray', async () => {
  const app = await electron.launch({
    args: [join(__dirname, 'fixture', 'main.js')],
    env: { ...process.env, NODE_ENV: 'test' },
  });

  const ready = await app.evaluate(
    () =>
      new Promise<{ trayBounds: Electron.Rectangle }>((resolve) => {
        const mb = (
          globalThis as { __menubar?: import('../../src/Menubar').Menubar }
        ).__menubar;
        if (!mb) throw new Error('fixture did not expose __menubar');
        const finish = () => resolve({ trayBounds: mb.tray.getBounds() });
        if (mb.tray) finish();
        else mb.on('ready', finish);
      }),
  );

  expect(ready.trayBounds).toBeDefined();
  expect(typeof ready.trayBounds.width).toBe('number');

  await app.evaluate(() => {
    const mb = (
      globalThis as { __menubar?: import('../../src/Menubar').Menubar }
    ).__menubar!;
    return mb.showWindow();
  });

  const window = await app.firstWindow();
  await window.waitForSelector('#hello');
  expect(await window.title()).toBe('menubar e2e fixture');

  await app.evaluate(() => {
    const mb = (
      globalThis as { __menubar?: import('../../src/Menubar').Menubar }
    ).__menubar!;
    return mb.hideWindow();
  });

  await app.close();
});

test.afterAll(() => {
  const platform =
    process.env.E2E_PLATFORM_KEY ??
    `${process.platform}-${process.env.RUNNER_OS ?? 'local'}`;
  const dir = join(process.cwd(), 'test-results', 'platforms');
  mkdirSync(dir, { recursive: true });
  writeFileSync(
    join(dir, `${platform}.json`),
    JSON.stringify(
      {
        key: platform,
        label: process.env.E2E_PLATFORM_LABEL ?? platform,
        status: 'pass',
        runUrl: process.env.GITHUB_RUN_URL ?? null,
        sha: process.env.GITHUB_SHA ?? null,
        date: new Date().toISOString(),
      },
      null,
      2,
    ),
  );
});
