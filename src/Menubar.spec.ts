import { app, BrowserWindow, Tray } from 'electron';
import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest';

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
