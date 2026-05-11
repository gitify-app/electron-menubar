import { app, BrowserWindow, Tray } from 'electron';
import { afterEach, beforeEach, describe, expect, it, type Mock, vi } from 'vitest';

import { Menubar } from './Menubar';

vi.mock('electron', () => import('./__mocks__/electron'));

describe('Menubar', () => {
  let mb: Menubar | undefined;

  beforeEach(() => {
    vi.clearAllMocks();
    mb = new Menubar(app, { preloadWindow: true });
  });

  it('should have property `app`', () => {
    expect(mb!.app).toBeDefined();
  });

  it('should have property `positioner`', () => {
    expect(() => mb!.positioner as unknown).toThrow();
    return new Promise<void>((resolve) => {
      mb!.on('after-create-window', () => {
        expect(mb!.positioner).toBeDefined();
        resolve();
      });
    });
  });

  it('should have property `tray`', () => {
    expect(() => mb!.tray).toThrow();
    return new Promise<void>((resolve) => {
      mb!.on('ready', () => {
        expect(mb!.tray).toBeInstanceOf(Tray);
        resolve();
      });
    });
  });

  it('should have property `window`', () => {
    expect(mb!.window).toBeUndefined();
    return new Promise<void>((resolve) => {
      mb!.on('ready', () => {
        expect(mb!.window).toBeInstanceOf(BrowserWindow);
        resolve();
      });
    });
  });

  it('is not destroyed by default', () => {
    expect(mb!.isDestroyed()).toBe(false);
  });

  it('reports as destroyed after `destroy()` is called', () => {
    return new Promise<void>((resolve) => {
      mb!.on('ready', () => {
        mb!.destroy();
        expect(mb!.isDestroyed()).toBe(true);
        expect(mb!.window).toBeUndefined();
        resolve();
      });
    });
  });

  it('removes tray and app listeners on `destroy()`', () => {
    return new Promise<void>((resolve) => {
      mb!.on('ready', () => {
        const tray = mb!.tray;
        mb!.destroy();

        const trayEvents = (tray.removeListener as Mock).mock.calls.map(
          ([event]) => event,
        );
        expect(trayEvents).toEqual(
          expect.arrayContaining(['click', 'right-click', 'double-click']),
        );

        const appEvents = (app.removeListener as Mock).mock.calls.map(
          ([event]) => event,
        );
        expect(appEvents).toEqual(
          expect.arrayContaining(['ready', 'activate']),
        );
        resolve();
      });
    });
  });

  it('keeps `window` accessible inside a user `close` listener', () => {
    return new Promise<void>((resolve) => {
      mb!.on('after-create-window', () => {
        const win = mb!.window!;
        const onCalls = (win.on as Mock).mock.calls;
        const closedHandler = onCalls.find(([event]) => event === 'closed')?.[1];
        const closeHandler = onCalls.find(([event]) => event === 'close')?.[1];

        expect(closedHandler).toBeTypeOf('function');
        // Library MUST listen on `closed`, not `close`, so user handlers win.
        expect(closeHandler).toBeUndefined();
        expect(mb!.window).toBe(win);

        // Once `closed` fires, the window is gone.
        closedHandler?.();
        expect(mb!.window).toBeUndefined();
        resolve();
      });
    });
  });

  it('is idempotent: calling `destroy()` twice is a no-op', () => {
    return new Promise<void>((resolve) => {
      mb!.on('ready', () => {
        mb!.destroy();
        const callsAfterFirst = (app.removeListener as Mock).mock.calls.length;
        mb!.destroy();
        expect(mb!.isDestroyed()).toBe(true);
        expect((app.removeListener as Mock).mock.calls.length).toBe(
          callsAfterFirst,
        );
        resolve();
      });
    });
  });
});

describe('Menubar hideOnClose option', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const closeHandler = (mb: Menubar): ((event: { preventDefault: Mock }) => void) | undefined => {
    const win = mb.window!;
    return (win.on as Mock).mock.calls.find(([event]) => event === 'close')?.[1];
  };

  it('does not register a `close` handler by default', () => {
    const mb = new Menubar(app, { preloadWindow: true });
    return new Promise<void>((resolve) => {
      mb.on('after-create-window', () => {
        expect(closeHandler(mb)).toBeUndefined();
        resolve();
      });
    });
  });

  it('intercepts close when `hideOnClose: true`', () => {
    const mb = new Menubar(app, { preloadWindow: true, hideOnClose: true });
    return new Promise<void>((resolve) => {
      mb.on('after-create-window', () => {
        const handler = closeHandler(mb);
        expect(handler).toBeTypeOf('function');
        const event = { preventDefault: vi.fn() };
        handler?.(event);
        expect(event.preventDefault).toHaveBeenCalled();
        resolve();
      });
    });
  });

  it('lets close through during `before-quit`', () => {
    const mb = new Menubar(app, { preloadWindow: true, hideOnClose: true });
    return new Promise<void>((resolve) => {
      mb.on('after-create-window', () => {
        // Simulate before-quit firing
        const beforeQuitHandler = (app.on as Mock).mock.calls.find(
          ([event]) => event === 'before-quit',
        )?.[1];
        beforeQuitHandler?.();

        const handler = closeHandler(mb);
        const event = { preventDefault: vi.fn() };
        handler?.(event);
        expect(event.preventDefault).not.toHaveBeenCalled();
        resolve();
      });
    });
  });
});

describe('Menubar contextMenu option', () => {
  const originalPlatform = process.platform;
  const fakeMenu = { __menu: true } as unknown as Electron.Menu;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    Object.defineProperty(process, 'platform', { value: originalPlatform });
  });

  it('binds via setContextMenu on Linux', () => {
    Object.defineProperty(process, 'platform', { value: 'linux' });
    const mb = new Menubar(app, { preloadWindow: true, contextMenu: fakeMenu });
    return new Promise<void>((resolve) => {
      mb.on('ready', () => {
        expect(mb.tray.setContextMenu).toHaveBeenCalledWith(fakeMenu);
        const trayOnCalls = (mb.tray.on as Mock).mock.calls;
        expect(trayOnCalls.map(([event]) => event)).not.toContain('right-click');
        resolve();
      });
    });
  });

  it('binds via right-click popup on macOS', () => {
    Object.defineProperty(process, 'platform', { value: 'darwin' });
    const mb = new Menubar(app, { preloadWindow: true, contextMenu: fakeMenu });
    return new Promise<void>((resolve) => {
      mb.on('ready', () => {
        const trayOn = (mb.tray.on as Mock).mock.calls;
        const handler = trayOn.find(([event]) => event === 'right-click')?.[1];
        expect(handler).toBeTypeOf('function');
        handler?.({}, { x: 5, y: 9, width: 32, height: 32 });
        expect(mb.tray.popUpContextMenu).toHaveBeenCalledWith(fakeMenu, {
          x: 5,
          y: 9,
        });
        resolve();
      });
    });
  });

  it('re-publishes the menu on show/hide on Linux', () => {
    Object.defineProperty(process, 'platform', { value: 'linux' });
    const mb = new Menubar(app, { preloadWindow: true, contextMenu: fakeMenu });
    return new Promise<void>((resolve) => {
      mb.on('after-create-window', async () => {
        (mb.tray.setContextMenu as Mock).mockClear();
        await mb.showWindow();
        expect(mb.tray.setContextMenu).toHaveBeenCalledWith(fakeMenu);
        (mb.tray.setContextMenu as Mock).mockClear();
        mb.hideWindow();
        expect(mb.tray.setContextMenu).toHaveBeenCalledWith(fakeMenu);
        resolve();
      });
    });
  });

  it('replaces the menu via setContextMenu()', () => {
    Object.defineProperty(process, 'platform', { value: 'linux' });
    const mb = new Menubar(app, { preloadWindow: true, contextMenu: fakeMenu });
    const replacement = { __menu: 'replacement' } as unknown as Electron.Menu;
    return new Promise<void>((resolve) => {
      mb.on('ready', () => {
        mb.setContextMenu(replacement);
        expect(mb.tray.setContextMenu).toHaveBeenLastCalledWith(replacement);
        expect(mb.getOption('contextMenu')).toBe(replacement);
        resolve();
      });
    });
  });
});

describe('Menubar ignoreDoubleClickEvents option', () => {
  const originalPlatform = process.platform;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    Object.defineProperty(process, 'platform', { value: originalPlatform });
  });

  it('calls setIgnoreDoubleClickEvents(true) on macOS by default', () => {
    Object.defineProperty(process, 'platform', { value: 'darwin' });
    const mb = new Menubar(app, { preloadWindow: true });
    return new Promise<void>((resolve) => {
      mb.on('ready', () => {
        expect(mb.tray.setIgnoreDoubleClickEvents).toHaveBeenCalledWith(true);
        resolve();
      });
    });
  });

  it('respects ignoreDoubleClickEvents: false on macOS', () => {
    Object.defineProperty(process, 'platform', { value: 'darwin' });
    const mb = new Menubar(app, {
      preloadWindow: true,
      ignoreDoubleClickEvents: false,
    });
    return new Promise<void>((resolve) => {
      mb.on('ready', () => {
        expect(mb.tray.setIgnoreDoubleClickEvents).not.toHaveBeenCalled();
        resolve();
      });
    });
  });

  it('is a no-op on non-macOS platforms', () => {
    Object.defineProperty(process, 'platform', { value: 'linux' });
    const mb = new Menubar(app, { preloadWindow: true });
    return new Promise<void>((resolve) => {
      mb.on('ready', () => {
        expect(mb.tray.setIgnoreDoubleClickEvents).not.toHaveBeenCalled();
        resolve();
      });
    });
  });
});

describe('Menubar escapeToHide option', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('wires up a before-input-event listener when enabled', () => {
    const mb = new Menubar(app, { preloadWindow: true, escapeToHide: true });
    return new Promise<void>((resolve) => {
      mb.on('after-create-window', () => {
        const calls = (mb.window!.webContents.on as Mock).mock.calls;
        expect(calls.map(([event]) => event)).toContain('before-input-event');
        resolve();
      });
    });
  });

  it('does not wire a listener when disabled', () => {
    const mb = new Menubar(app, { preloadWindow: true });
    return new Promise<void>((resolve) => {
      mb.on('after-create-window', () => {
        const calls = (mb.window!.webContents.on as Mock).mock.calls;
        expect(calls.map(([event]) => event)).not.toContain('before-input-event');
        resolve();
      });
    });
  });
});

describe('Menubar trigger option', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const trayEvents = (mb: Menubar): string[] =>
    (mb.tray.on as Mock).mock.calls.map(([event]) => event as string);

  const onReady = (mb: Menubar, assertions: () => void): Promise<void> =>
    new Promise<void>((resolve) => {
      mb.on('ready', () => {
        assertions();
        resolve();
      });
    });

  it('defaults to binding `click` and `double-click`', () => {
    const mb = new Menubar(app, { preloadWindow: true });
    return onReady(mb, () => {
      expect(trayEvents(mb)).toEqual(
        expect.arrayContaining(['click', 'double-click']),
      );
      expect(trayEvents(mb)).not.toContain('right-click');
    });
  });

  it('binds `right-click` when `trigger: "right-click"`', () => {
    const mb = new Menubar(app, {
      preloadWindow: true,
      trigger: 'right-click',
    });
    return onReady(mb, () => {
      expect(trayEvents(mb)).toEqual(
        expect.arrayContaining(['right-click', 'double-click']),
      );
      expect(trayEvents(mb)).not.toContain('click');
    });
  });

  it('binds nothing when `trigger: "none"`', () => {
    const mb = new Menubar(app, { preloadWindow: true, trigger: 'none' });
    return onReady(mb, () => {
      expect(trayEvents(mb)).not.toContain('click');
      expect(trayEvents(mb)).not.toContain('right-click');
      expect(trayEvents(mb)).not.toContain('double-click');
    });
  });

  it('falls back to `showOnRightClick` when `trigger` is unset', () => {
    const mb = new Menubar(app, {
      preloadWindow: true,
      showOnRightClick: true,
    });
    return onReady(mb, () => {
      expect(trayEvents(mb)).toContain('right-click');
      expect(trayEvents(mb)).not.toContain('click');
    });
  });

  it('lets `trigger` win over the deprecated `showOnRightClick`', () => {
    const mb = new Menubar(app, {
      preloadWindow: true,
      showOnRightClick: true,
      trigger: 'click',
    });
    return onReady(mb, () => {
      expect(trayEvents(mb)).toContain('click');
      expect(trayEvents(mb)).not.toContain('right-click');
    });
  });
});
