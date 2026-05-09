import { app, BrowserWindow, Tray } from 'electron';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Menubar } from './Menubar';

vi.mock('electron', () => import('./__mocks__/electron'));

describe('Menubar', () => {
  let mb: Menubar | undefined;

  beforeEach(() => {
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

  it('is idempotent: calling `destroy()` twice is a no-op', () => {
    return new Promise<void>((resolve) => {
      mb!.on('ready', () => {
        mb!.destroy();
        mb!.destroy();
        expect(mb!.isDestroyed()).toBe(true);
        resolve();
      });
    });
  });
});
