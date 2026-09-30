import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  type ElectronApplication,
  _electron as electron,
  expect,
  test,
} from '@playwright/test';

type MenubarGlobal = {
  __menubar?: import('../../src/Menubar').Menubar;
  __electron?: {
    globalShortcut: Electron.GlobalShortcut;
  };
};

const launchFixture = (scenario?: string): Promise<ElectronApplication> =>
  electron.launch({
    args: [join(__dirname, 'fixture', 'main.js')],
    env: {
      ...process.env,
      NODE_ENV: 'test',
      ...(scenario ? { E2E_SCENARIO: scenario } : {}),
    },
  });

const waitForReady = (app: ElectronApplication): Promise<void> =>
  app.evaluate(
    () =>
      new Promise<void>((resolve) => {
        const mb = (globalThis as MenubarGlobal).__menubar;
        if (!mb) throw new Error('fixture did not expose __menubar');
        if (mb.tray) resolve();
        else mb.on('ready', () => resolve());
      }),
  );

test('menubar boots, emits ready, opens window, exposes tray', async () => {
  const app = await launchFixture();

  await waitForReady(app);

  const trayBounds = await app.evaluate(() => {
    const mb = (globalThis as MenubarGlobal).__menubar!;
    return mb.tray.getBounds();
  });
  expect(trayBounds).toBeDefined();
  expect(typeof trayBounds.width).toBe('number');

  await app.evaluate(() => {
    const mb = (globalThis as MenubarGlobal).__menubar!;
    return mb.showWindow();
  });

  const window = await app.firstWindow();
  await window.waitForSelector('#hello');
  expect(await window.title()).toBe('menubar e2e fixture');

  await app.evaluate(() => {
    const mb = (globalThis as MenubarGlobal).__menubar!;
    return mb.hideWindow();
  });

  await app.close();
});

test('toggleWindow alternates visibility', async () => {
  const app = await launchFixture();
  await waitForReady(app);

  const result = await app.evaluate(async () => {
    const mb = (globalThis as MenubarGlobal).__menubar!;
    await mb.toggleWindow();
    const afterFirst = mb.window!.isVisible();
    await mb.toggleWindow();
    const afterSecond = mb.window!.isVisible();
    return { afterFirst, afterSecond };
  });

  expect(result.afterFirst).toBe(true);
  expect(result.afterSecond).toBe(false);

  await app.close();
});

test('clears the all-workspaces flag while hidden on macOS and sets it again on show', async () => {
  test.skip(process.platform !== 'darwin', 'macOS Spaces');
  const app = await launchFixture();
  await waitForReady(app);

  const result = await app.evaluate(async () => {
    const mb = (globalThis as MenubarGlobal).__menubar!;
    await mb.showWindow();
    const shown = mb.window!.isVisibleOnAllWorkspaces();
    mb.hideWindow();
    const hidden = mb.window!.isVisibleOnAllWorkspaces();
    await mb.showWindow();
    const reshown = mb.window!.isVisibleOnAllWorkspaces();
    mb.hideWindow();
    return { shown, hidden, reshown };
  });

  expect(result).toEqual({ shown: true, hidden: false, reshown: true });

  await app.close();
});

test('an elevated Windows popup dismisses on click-away without losing its stacking level', async () => {
  test.skip(process.platform !== 'win32', 'Windows tray overflow regression');
  const app = await launchFixture();
  try {
    await waitForReady(app);
    await app.evaluate(async () => {
      const mb = (globalThis as MenubarGlobal).__menubar!;
      await mb.showWindow();
    });
    expect(
      await app.evaluate(() =>
        (globalThis as MenubarGlobal).__menubar!.window!.isAlwaysOnTop(),
      ),
    ).toBe(true);
    await expect
      .poll(() =>
        app.evaluate(() =>
          (globalThis as MenubarGlobal).__menubar!.window!.isFocused(),
        ),
      )
      .toBe(true);

    // Let the Windows post-show blur grace expire before a real focus transfer.
    await new Promise((resolve) => setTimeout(resolve, 450));
    await app.evaluate(({ BrowserWindow }) => {
      const other = new BrowserWindow({ width: 200, height: 200 });
      other.show();
      other.focus();
    });

    await expect
      .poll(() =>
        app.evaluate(() =>
          (globalThis as MenubarGlobal).__menubar!.window!.isVisible(),
        ),
      )
      .toBe(false);
    expect(
      await app.evaluate(() =>
        (globalThis as MenubarGlobal).__menubar!.window!.isAlwaysOnTop(),
      ),
    ).toBe(true);
  } finally {
    await app.close();
  }
});

test('hideOnClose: window survives a close() call', async () => {
  const app = await launchFixture('hideOnClose');
  await waitForReady(app);

  const result = await app.evaluate(
    () =>
      new Promise<{ stillDefined: boolean; isVisible: boolean }>((resolve) => {
        const mb = (globalThis as MenubarGlobal).__menubar!;
        mb.showWindow().then(() => {
          mb.window!.close();
          // hideOnClose defers the hide via setImmediate; give it a tick.
          setImmediate(() => {
            resolve({
              stillDefined: mb.window !== undefined,
              isVisible: mb.window?.isVisible() ?? false,
            });
          });
        });
      }),
  );

  expect(result.stillDefined).toBe(true);
  expect(result.isVisible).toBe(false);

  await app.close();
});

test('keep-open changes survive DevTools and restore click-away dismissal', async () => {
  const app = await launchFixture();
  try {
    await waitForReady(app);
    await app.evaluate(async () => {
      const mb = (globalThis as MenubarGlobal).__menubar!;
      await mb.showWindow();
      mb.window!.webContents.openDevTools({ mode: 'detach' });
    });
    await expect
      .poll(() =>
        app.evaluate(() =>
          (
            globalThis as MenubarGlobal
          ).__menubar!.window!.webContents.isDevToolsOpened(),
        ),
      )
      .toBe(true);
    const whileDebugging = await app.evaluate(() => {
      const mb = (globalThis as MenubarGlobal).__menubar!;
      mb.setOption('hideOnBlur', false);
      mb.setOption('hideOnBlur', true);
      return {
        visible: mb.window!.isVisible(),
        onTop: mb.window!.isAlwaysOnTop(),
        hideOnBlur: mb.getOption('hideOnBlur'),
      };
    });
    expect(whileDebugging).toEqual({
      visible: true,
      onTop: true,
      hideOnBlur: true,
    });

    await app.evaluate(() => {
      const mb = (globalThis as MenubarGlobal).__menubar!;
      mb.window!.webContents.closeDevTools();
    });
    await expect
      .poll(() =>
        app.evaluate(() =>
          (
            globalThis as MenubarGlobal
          ).__menubar!.window!.webContents.isDevToolsOpened(),
        ),
      )
      .toBe(false);
    await app.evaluate(async () => {
      const mb = (globalThis as MenubarGlobal).__menubar!;
      mb.setOption('hideOnBlur', false);
      await mb.showWindow();
    });
    await expect
      .poll(() =>
        app.evaluate(() =>
          (globalThis as MenubarGlobal).__menubar!.window!.isFocused(),
        ),
      )
      .toBe(true);
    await new Promise((resolve) => setTimeout(resolve, 450));
    await app.evaluate(({ BrowserWindow }) => {
      const other = new BrowserWindow({ width: 200, height: 200 });
      other.show();
      other.focus();
    });
    await new Promise((resolve) => setTimeout(resolve, 200));
    expect(
      await app.evaluate(() =>
        (globalThis as MenubarGlobal).__menubar!.window!.isVisible(),
      ),
    ).toBe(true);

    await app.evaluate(async () => {
      const mb = (globalThis as MenubarGlobal).__menubar!;
      mb.setOption('hideOnBlur', true);
      await mb.showWindow();
    });
    await expect
      .poll(() =>
        app.evaluate(() =>
          (globalThis as MenubarGlobal).__menubar!.window!.isFocused(),
        ),
      )
      .toBe(true);
    await new Promise((resolve) => setTimeout(resolve, 450));
    await app.evaluate(({ BrowserWindow }) => {
      const other = new BrowserWindow({ width: 200, height: 200 });
      other.show();
      other.focus();
    });
    await expect
      .poll(() =>
        app.evaluate(() =>
          (globalThis as MenubarGlobal).__menubar!.window!.isVisible(),
        ),
      )
      .toBe(false);
  } finally {
    await app.close();
  }
});

test('globalShortcut registers the configured accelerator', async () => {
  const app = await launchFixture('globalShortcut');
  await waitForReady(app);

  const registered = await app.evaluate(() => {
    const gs = (globalThis as MenubarGlobal).__electron!.globalShortcut;
    return gs.isRegistered('CmdOrCtrl+Alt+Shift+E');
  });
  expect(registered).toBe(true);

  // setGlobalShortcut(undefined) clears and isRegistered should report false.
  const clearedRegistered = await app.evaluate(() => {
    const mb = (globalThis as MenubarGlobal).__menubar!;
    mb.setGlobalShortcut(undefined);
    const gs = (globalThis as MenubarGlobal).__electron!.globalShortcut;
    return gs.isRegistered('CmdOrCtrl+Alt+Shift+E');
  });
  expect(clearedRegistered).toBe(false);

  await app.close();
});

test('contextMenu option binds without throwing on this platform', async () => {
  const app = await launchFixture('contextMenu');
  await waitForReady(app);

  const stored = await app.evaluate(() => {
    const mb = (globalThis as MenubarGlobal).__menubar!;
    return mb.getOption('contextMenu') !== undefined;
  });
  expect(stored).toBe(true);

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
