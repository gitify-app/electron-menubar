import {
  app,
  autoUpdater,
  BrowserWindow,
  globalShortcut,
  Tray,
} from 'electron';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  type Mock,
  vi,
} from 'vitest';

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

        expect(autoUpdater.removeListener).toHaveBeenCalledWith(
          'before-quit-for-update',
          expect.any(Function),
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
        const closedHandler = onCalls.find(
          ([event]) => event === 'closed',
        )?.[1];
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

  const closeHandler = (
    mb: Menubar,
  ): ((event: Electron.Event) => void) | undefined => {
    const win = mb.window!;
    return (win.on as Mock).mock.calls.find(
      ([event]) => event === 'close',
    )?.[1];
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
        const event = { preventDefault: vi.fn(), defaultPrevented: false };
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
        const event = { preventDefault: vi.fn(), defaultPrevented: false };
        handler?.(event);
        expect(event.preventDefault).not.toHaveBeenCalled();
        resolve();
      });
    });
  });

  it('lets close through during `before-quit-for-update`', () => {
    const mb = new Menubar(app, { preloadWindow: true, hideOnClose: true });
    return new Promise<void>((resolve) => {
      mb.on('after-create-window', () => {
        // Installing an update closes every window without emitting
        // `before-quit`, so intercepting here would stall the install.
        const beforeQuitForUpdateHandler = (
          autoUpdater.on as Mock
        ).mock.calls.find(([event]) => event === 'before-quit-for-update')?.[1];
        expect(beforeQuitForUpdateHandler).toBeTypeOf('function');
        beforeQuitForUpdateHandler?.();

        const handler = closeHandler(mb);
        const event = { preventDefault: vi.fn(), defaultPrevented: false };
        handler?.(event);
        expect(event.preventDefault).not.toHaveBeenCalled();
        resolve();
      });
    });
  });
});

describe('Menubar showOnAllWorkspaces option', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const workspacesCall = (mb: Menubar): unknown[] | undefined =>
    (mb.window!.setVisibleOnAllWorkspaces as Mock).mock.calls[0];

  it('requests fullscreen-space visibility by default', () => {
    const mb = new Menubar(app, { preloadWindow: true });
    return new Promise<void>((resolve) => {
      mb.on('after-create-window', () => {
        // Without `visibleOnFullScreen` Electron clears
        // NSWindowCollectionBehaviorFullScreenAuxiliary, so macOS switches
        // away from a fullscreen space to show the popup.
        expect(workspacesCall(mb)).toEqual([
          true,
          { visibleOnFullScreen: true, skipTransformProcessType: true },
        ]);
        resolve();
      });
    });
  });

  it('does not touch workspace visibility when `showOnAllWorkspaces: false`', () => {
    const mb = new Menubar(app, {
      preloadWindow: true,
      showOnAllWorkspaces: false,
    });
    return new Promise<void>((resolve) => {
      mb.on('after-create-window', () => {
        expect(mb.window!.setVisibleOnAllWorkspaces).not.toHaveBeenCalled();
        resolve();
      });
    });
  });
});

describe('Menubar global shortcut', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('registers the configured accelerator on ready', () => {
    const mb = new Menubar(app, {
      preloadWindow: true,
      globalShortcut: 'CmdOrCtrl+Shift+G',
    });
    return new Promise<void>((resolve) => {
      mb.on('ready', () => {
        expect(globalShortcut.register).toHaveBeenCalledWith(
          'CmdOrCtrl+Shift+G',
          expect.any(Function),
        );
        resolve();
      });
    });
  });

  it('unregisters the previous accelerator when replacing it', () => {
    const mb = new Menubar(app, {
      preloadWindow: true,
      globalShortcut: 'CmdOrCtrl+Shift+G',
    });
    return new Promise<void>((resolve) => {
      mb.on('ready', () => {
        mb.setGlobalShortcut('Alt+Space');
        expect(globalShortcut.unregister).toHaveBeenCalledWith(
          'CmdOrCtrl+Shift+G',
        );
        expect(globalShortcut.register).toHaveBeenLastCalledWith(
          'Alt+Space',
          expect.any(Function),
        );
        resolve();
      });
    });
  });

  it('clears the accelerator when called with undefined', () => {
    const mb = new Menubar(app, {
      preloadWindow: true,
      globalShortcut: 'CmdOrCtrl+Shift+G',
    });
    return new Promise<void>((resolve) => {
      mb.on('ready', () => {
        (globalShortcut.register as Mock).mockClear();
        mb.setGlobalShortcut(undefined);
        expect(globalShortcut.unregister).toHaveBeenCalledWith(
          'CmdOrCtrl+Shift+G',
        );
        expect(globalShortcut.register).not.toHaveBeenCalled();
        resolve();
      });
    });
  });

  it('does not retain a failed registration', () => {
    (globalShortcut.register as Mock).mockReturnValueOnce(false);
    const mb = new Menubar(app, { preloadWindow: true });
    return new Promise<void>((resolve) => {
      mb.on('ready', () => {
        const ok = mb.setGlobalShortcut('CmdOrCtrl+Shift+G');
        expect(ok).toBe(false);
        (globalShortcut.unregister as Mock).mockClear();
        mb.destroy();
        expect(globalShortcut.unregister).not.toHaveBeenCalled();
        resolve();
      });
    });
  });

  it('unregisters on destroy()', () => {
    const mb = new Menubar(app, {
      preloadWindow: true,
      globalShortcut: 'CmdOrCtrl+Shift+G',
    });
    return new Promise<void>((resolve) => {
      mb.on('ready', () => {
        mb.destroy();
        expect(globalShortcut.unregister).toHaveBeenCalledWith(
          'CmdOrCtrl+Shift+G',
        );
        resolve();
      });
    });
  });
});

describe('Menubar toggleWindow and recenterOnTray', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('toggleWindow shows when hidden and hides when visible', () => {
    const mb = new Menubar(app, { preloadWindow: true });
    return new Promise<void>((resolve) => {
      mb.on('after-create-window', async () => {
        await mb.toggleWindow();
        expect(mb.window!.show).toHaveBeenCalledTimes(1);
        await mb.toggleWindow();
        expect(mb.window!.hide).toHaveBeenCalledTimes(1);
        resolve();
      });
    });
  });

  it('recenterOnTray sets a new position from tray bounds', () => {
    const mb = new Menubar(app, { preloadWindow: true });
    return new Promise<void>((resolve) => {
      mb.on('after-create-window', () => {
        (mb.window!.setPosition as Mock).mockClear();
        mb.recenterOnTray();
        expect(mb.window!.setPosition).toHaveBeenCalled();
        resolve();
      });
    });
  });

  it('recenterOnTray is a no-op without a window', () => {
    const mb = new Menubar(app, {});
    return new Promise<void>((resolve) => {
      mb.on('ready', () => {
        expect(() => mb.recenterOnTray()).not.toThrow();
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
        expect(trayOnCalls.map(([event]) => event)).not.toContain(
          'right-click',
        );
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

  it('re-publishes the menu on refreshContextMenu() on Linux', () => {
    Object.defineProperty(process, 'platform', { value: 'linux' });
    const mb = new Menubar(app, { preloadWindow: true, contextMenu: fakeMenu });
    return new Promise<void>((resolve) => {
      mb.on('ready', () => {
        (mb.tray.setContextMenu as Mock).mockClear();
        mb.refreshContextMenu();
        expect(mb.tray.setContextMenu).toHaveBeenCalledWith(fakeMenu);
        resolve();
      });
    });
  });

  it('refreshContextMenu() is a no-op on macOS', () => {
    Object.defineProperty(process, 'platform', { value: 'darwin' });
    const mb = new Menubar(app, { preloadWindow: true, contextMenu: fakeMenu });
    return new Promise<void>((resolve) => {
      mb.on('ready', () => {
        (mb.tray.setContextMenu as Mock).mockClear();
        mb.refreshContextMenu();
        expect(mb.tray.setContextMenu).not.toHaveBeenCalled();
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

  it('right-click popup reads the current menu reference on macOS', () => {
    Object.defineProperty(process, 'platform', { value: 'darwin' });
    const mb = new Menubar(app, { preloadWindow: true, contextMenu: fakeMenu });
    const replacement = { __menu: 'replacement' } as unknown as Electron.Menu;
    return new Promise<void>((resolve) => {
      mb.on('ready', () => {
        mb.setContextMenu(replacement);
        const handler = (mb.tray.on as Mock).mock.calls.find(
          ([event]) => event === 'right-click',
        )?.[1];
        handler?.({}, { x: 1, y: 2, width: 32, height: 32 });
        expect(mb.tray.popUpContextMenu).toHaveBeenLastCalledWith(replacement, {
          x: 1,
          y: 2,
        });
        resolve();
      });
    });
  });

  it('setContextMenu(null) makes the right-click popup a no-op on macOS', () => {
    Object.defineProperty(process, 'platform', { value: 'darwin' });
    const mb = new Menubar(app, { preloadWindow: true, contextMenu: fakeMenu });
    return new Promise<void>((resolve) => {
      mb.on('ready', () => {
        mb.setContextMenu(null);
        (mb.tray.popUpContextMenu as Mock).mockClear();
        const handler = (mb.tray.on as Mock).mock.calls.find(
          ([event]) => event === 'right-click',
        )?.[1];
        handler?.({}, { x: 1, y: 2, width: 32, height: 32 });
        expect(mb.tray.popUpContextMenu).not.toHaveBeenCalled();
        resolve();
      });
    });
  });

  it('setContextMenu() wires popup on macOS even without an initial menu', () => {
    Object.defineProperty(process, 'platform', { value: 'darwin' });
    const mb = new Menubar(app, { preloadWindow: true });
    return new Promise<void>((resolve) => {
      mb.on('ready', () => {
        mb.setContextMenu(fakeMenu);
        const handler = (mb.tray.on as Mock).mock.calls.find(
          ([event]) => event === 'right-click',
        )?.[1];
        expect(handler).toBeTypeOf('function');
        handler?.({}, { x: 3, y: 4, width: 32, height: 32 });
        expect(mb.tray.popUpContextMenu).toHaveBeenLastCalledWith(fakeMenu, {
          x: 3,
          y: 4,
        });
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
        expect(calls.map(([event]) => event)).not.toContain(
          'before-input-event',
        );
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

describe('Menubar repositioning on resize', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const findHandler = (
    win: BrowserWindow,
    event: string,
  ): ((...args: unknown[]) => void) | undefined => {
    const call = (win.on as Mock).mock.calls.find(([name]) => name === event);
    return call?.[1] as ((...args: unknown[]) => void) | undefined;
  };

  it('positions the window on `showWindow`', async () => {
    const mb = new Menubar(app, { preloadWindow: true });
    await new Promise<void>((resolve) => mb.on('ready', () => resolve()));

    await mb.showWindow();

    expect(mb.window!.setPosition).toHaveBeenCalledTimes(1);
    const [x, y] = (mb.window!.setPosition as Mock).mock.calls[0] as [
      number,
      number,
    ];
    expect(Number.isInteger(x)).toBe(true);
    expect(Number.isInteger(y)).toBe(true);
  });

  it('repositions the window when it resizes (e.g. via `setSize`)', async () => {
    const mb = new Menubar(app, { preloadWindow: true });
    await new Promise<void>((resolve) => mb.on('ready', () => resolve()));
    await mb.showWindow();

    const onResize = findHandler(mb.window!, 'resize');
    expect(onResize, 'a resize handler should be registered').toBeDefined();

    onResize!();

    expect(mb.window!.setPosition).toHaveBeenCalledTimes(2);
  });
});

describe('Menubar Wayland positioning warning', () => {
  const originalPlatform = process.platform;
  const originalWaylandDisplay = process.env.WAYLAND_DISPLAY;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    Object.defineProperty(process, 'platform', { value: originalPlatform });
    if (originalWaylandDisplay === undefined) {
      delete process.env.WAYLAND_DISPLAY;
    } else {
      process.env.WAYLAND_DISPLAY = originalWaylandDisplay;
    }
    vi.restoreAllMocks();
  });

  const ready = (mb: Menubar): Promise<void> =>
    new Promise<void>((resolve) => mb.on('ready', () => resolve()));

  it('warns once in a Wayland session when the window position is ignored', async () => {
    Object.defineProperty(process, 'platform', { value: 'linux' });
    process.env.WAYLAND_DISPLAY = 'wayland-0';
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const mb = new Menubar(app, { preloadWindow: true });
    await ready(mb);

    // Simulate native Wayland: the compositor ignores `setPosition`, so the
    // window reports a position that diverges from what we requested.
    (mb.window!.getPosition as Mock).mockReturnValue([0, 0]);

    await mb.showWindow();
    await mb.showWindow();

    expect(warn).toHaveBeenCalledTimes(1);
    expect(String(warn.mock.calls[0][0])).toContain('--ozone-platform=x11');
  });

  it('does not warn in a Wayland session when positioning takes effect (XWayland)', async () => {
    Object.defineProperty(process, 'platform', { value: 'linux' });
    process.env.WAYLAND_DISPLAY = 'wayland-0';
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const mb = new Menubar(app, { preloadWindow: true });
    await ready(mb);

    // Default mock: `getPosition` echoes the value passed to `setPosition`.
    await mb.showWindow();

    expect(warn).not.toHaveBeenCalled();
  });

  it('does not warn on a pure X11 session (no WAYLAND_DISPLAY)', async () => {
    Object.defineProperty(process, 'platform', { value: 'linux' });
    delete process.env.WAYLAND_DISPLAY;
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const mb = new Menubar(app, { preloadWindow: true });
    await ready(mb);

    (mb.window!.getPosition as Mock).mockReturnValue([0, 0]);

    await mb.showWindow();

    expect(warn).not.toHaveBeenCalled();
  });

  it('does not warn on macOS even when positions diverge', async () => {
    Object.defineProperty(process, 'platform', { value: 'darwin' });
    process.env.WAYLAND_DISPLAY = 'wayland-0';
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const mb = new Menubar(app, { preloadWindow: true });
    await ready(mb);

    (mb.window!.getPosition as Mock).mockReturnValue([0, 0]);

    await mb.showWindow();

    expect(warn).not.toHaveBeenCalled();
  });
});

describe('Menubar blur-to-hide behavior', () => {
  const originalPlatform = process.platform;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    Object.defineProperty(process, 'platform', { value: originalPlatform });
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  const ready = (mb: Menubar): Promise<void> =>
    new Promise<void>((resolve) => mb.on('ready', () => resolve()));

  const findHandler = (
    win: BrowserWindow,
    event: string,
  ): ((...args: unknown[]) => void) | undefined => {
    const call = (win.on as Mock).mock.calls.find(([name]) => name === event);
    return call?.[1] as ((...args: unknown[]) => void) | undefined;
  };

  it('hides the window ~100ms after a blur on non-Windows platforms', async () => {
    Object.defineProperty(process, 'platform', { value: 'darwin' });
    const mb = new Menubar(app, { preloadWindow: true });
    await ready(mb);
    await mb.showWindow();

    vi.useFakeTimers();
    const blur = findHandler(mb.window!, 'blur');
    expect(blur, 'a blur handler should be registered').toBeDefined();

    blur!();
    expect(mb.window!.hide).not.toHaveBeenCalled();
    vi.advanceTimersByTime(100);
    expect(mb.window!.hide).toHaveBeenCalledTimes(1);
  });

  it('ignores the transient post-show blur on Windows (gitify-app/gitify#3064)', async () => {
    Object.defineProperty(process, 'platform', { value: 'win32' });
    const mb = new Menubar(app, { preloadWindow: true });
    await ready(mb);

    vi.useFakeTimers();
    await mb.showWindow(); // stamps `_lastShowTime` with the current fake clock

    // The blur Windows fires right after `show()`, inside the grace window.
    findHandler(mb.window!, 'blur')!();
    vi.advanceTimersByTime(100);

    expect(mb.window!.hide).not.toHaveBeenCalled();
  });

  it('still hides on Windows for a blur after the grace window (real click-away)', async () => {
    Object.defineProperty(process, 'platform', { value: 'win32' });
    const mb = new Menubar(app, { preloadWindow: true });
    await ready(mb);

    vi.useFakeTimers();
    await mb.showWindow();

    // A genuine click-away lands well after the popup has settled.
    vi.advanceTimersByTime(1000);
    findHandler(mb.window!, 'blur')!();
    vi.advanceTimersByTime(100);

    expect(mb.window!.hide).toHaveBeenCalledTimes(1);
  });

  it('emits `focus-lost` instead of hiding when the window is pinned alwaysOnTop', async () => {
    const mb = new Menubar(app, { preloadWindow: true });
    await ready(mb);
    await mb.showWindow();

    (mb.window!.isAlwaysOnTop as Mock).mockReturnValue(true);
    const focusLost = vi.fn();
    mb.on('focus-lost', focusLost);

    findHandler(mb.window!, 'blur')!();

    expect(focusLost).toHaveBeenCalledTimes(1);
    expect(mb.window!.hide).not.toHaveBeenCalled();
  });
});

describe('Menubar dock hide startup race', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    (app.dock!.isVisible as Mock).mockReturnValue(false);
    vi.useRealTimers();
  });

  const ready = (mb: Menubar): Promise<void> =>
    new Promise<void>((resolve) => mb.on('ready', () => resolve()));

  it('re-hides the dock when the startup hide was dropped (gitify-app/gitify#3069)', async () => {
    const mb = new Menubar(app, { preloadWindow: true });
    await ready(mb);

    expect(app.dock!.hide).toHaveBeenCalledTimes(1);

    // Simulate macOS having dropped the initial hide.
    (app.dock!.isVisible as Mock).mockReturnValue(true);
    vi.advanceTimersByTime(2_000);

    expect(app.dock!.hide).toHaveBeenCalledTimes(2);
  });

  it('does not touch the dock again when the initial hide stuck', async () => {
    const mb = new Menubar(app, { preloadWindow: true });
    await ready(mb);

    expect(app.dock!.hide).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(2_000);

    expect(app.dock!.hide).toHaveBeenCalledTimes(1);
  });

  it('does not hide at all when `showDockIcon: true`', async () => {
    const mb = new Menubar(app, { preloadWindow: true, showDockIcon: true });
    await ready(mb);

    (app.dock!.isVisible as Mock).mockReturnValue(true);
    vi.advanceTimersByTime(2_000);

    expect(app.dock!.hide).not.toHaveBeenCalled();
  });

  it('cancels the pending re-check on destroy', async () => {
    const mb = new Menubar(app, { preloadWindow: true });
    await ready(mb);

    mb.destroy();
    (app.dock!.isVisible as Mock).mockReturnValue(true);
    vi.advanceTimersByTime(2_000);

    expect(app.dock!.hide).toHaveBeenCalledTimes(1);
  });
});

describe('Menubar positionWindow re-entrancy', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const ready = (mb: Menubar): Promise<void> =>
    new Promise<void>((resolve) => mb.on('ready', () => resolve()));

  const findHandler = (
    win: BrowserWindow,
    event: string,
  ): ((...args: unknown[]) => void) | undefined => {
    const call = (win.on as Mock).mock.calls.find(([name]) => name === event);
    return call?.[1] as ((...args: unknown[]) => void) | undefined;
  };

  it('does not recurse when `setPosition` synchronously emits `resize` (gitify-app/gitify#3064)', async () => {
    const mb = new Menubar(app, { preloadWindow: true });
    await ready(mb);

    const win = mb.window!;
    const onResize = findHandler(win, 'resize');
    expect(onResize, 'a resize handler should be registered').toBeDefined();

    // Windows dispatches WM_SIZE inline, so `setPosition` can re-enter
    // `positionWindow` via the `resize` listener. Unguarded this recurses
    // until the stack blows, wedging the main process.
    let depth = 0;
    let maxDepth = 0;
    (win.setPosition as Mock).mockImplementation(() => {
      depth += 1;
      maxDepth = Math.max(maxDepth, depth);
      onResize!();
      depth -= 1;
    });

    expect(() => onResize!()).not.toThrow();
    expect(maxDepth).toBe(1);
  });

  it('still repositions on a later, non-reentrant resize', async () => {
    const mb = new Menubar(app, { preloadWindow: true });
    await ready(mb);
    await mb.showWindow();

    const win = mb.window!;
    const before = (win.setPosition as Mock).mock.calls.length;

    findHandler(win, 'resize')!();

    expect((win.setPosition as Mock).mock.calls.length).toBe(before + 1);
  });
});
