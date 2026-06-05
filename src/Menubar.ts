import { EventEmitter } from 'node:events';
import fs from 'node:fs';
import path from 'node:path';

import { BrowserWindow, globalShortcut, type Menu, Tray } from 'electron';

import { Positioner } from './Positioner';
import type { Options } from './types';
import { cleanOptions } from './util/cleanOptions';
import { getWindowPosition } from './util/getWindowPosition';

/**
 * The main Menubar class.
 */
export class Menubar extends EventEmitter {
  private _app: Electron.App;
  private _browserWindow?: BrowserWindow;
  private _contextMenu?: Menu;
  private _blurTimeout: NodeJS.Timeout | null = null; // track blur events with timeout
  private _isDestroyed: boolean;
  private _isQuitting: boolean; // set on app `before-quit`, used by hideOnClose
  private _isVisible: boolean; // track visibility
  private _cachedBounds?: Electron.Rectangle; // _cachedBounds are needed for double-clicked event
  private _options: Options;
  private _positioner: Positioner | undefined;
  private _shortcut?: Electron.Accelerator;
  private _rightClickContextMenuBound = false;
  private _warnedNoPositioning = false; // guards the one-time Wayland warning
  private _tray?: Tray;

  constructor(app: Electron.App, options?: Partial<Options>) {
    super();
    this._app = app;
    this._options = cleanOptions(options);
    this._isDestroyed = false;
    this._isQuitting = false;
    this._isVisible = false;

    app.on('before-quit', this.onBeforeQuit);

    if (app.isReady()) {
      // See https://github.com/maxogden/menubar/pull/151
      process.nextTick(this.onAppReady);
    } else {
      app.on('ready', this.onAppReady);
    }
  }

  /**
   * The Electron [App](https://electronjs.org/docs/api/app)
   * instance.
   */
  get app(): Electron.App {
    return this._app;
  }

  /**
   * The {@link Positioner} instance used to compute where the menubar window
   * should appear on screen. Available after the `after-create-window` event.
   */
  get positioner(): Positioner {
    if (!this._positioner) {
      throw new Error(
        'Please access `this.positioner` after the `after-create-window` event has fired.',
      );
    }

    return this._positioner;
  }

  /**
   * The Electron [Tray](https://electronjs.org/docs/api/tray) instance.
   */
  get tray(): Tray {
    if (!this._tray) {
      throw new Error(
        'Please access `this.tray` after the `ready` event has fired.',
      );
    }

    return this._tray;
  }

  /**
   * The Electron [BrowserWindow](https://electronjs.org/docs/api/browser-window)
   * instance, if it's present.
   */
  get window(): BrowserWindow | undefined {
    return this._browserWindow;
  }

  /**
   * Tear down the menubar instance: destroy the window, remove the tray, and
   * detach all listeners. Subsequent clicks on the tray will be no-ops until a
   * new {@link Menubar} instance is created.
   */
  destroy(): void {
    if (this.isDestroyed()) {
      return;
    }
    // Set first so `hideOnClose` lets the close go through instead of
    // intercepting it.
    this._isDestroyed = true;

    if (this._shortcut) {
      globalShortcut.unregister(this._shortcut);
      this._shortcut = undefined;
    }

    if (this._browserWindow) {
      this._browserWindow.destroy();
      this._browserWindow = undefined;
    }

    if (this._tray) {
      // Ensure all potential listeners are removed.
      for (const event of ['click', 'right-click', 'double-click']) {
        this._tray.removeListener(
          event as Parameters<Tray['on']>[0],
          this.clicked,
        );
      }
      this._tray.setToolTip('');
      this._tray = undefined;
    }

    this._app.removeListener('ready', this.onAppReady);
    this._app.removeListener('activate', this.onAppActivate);
    this._app.removeListener('before-quit', this.onBeforeQuit);
  }

  /**
   * Whether {@link destroy} has been called on this menubar instance.
   */
  isDestroyed(): boolean {
    return this._isDestroyed;
  }

  /**
   * Retrieve a menubar option.
   *
   * @param key - The option key to retrieve, see {@link Options}.
   */
  getOption<K extends keyof Options>(key: K): Options[K] {
    return this._options[key];
  }

  /**
   * Hide the menubar window.
   */
  hideWindow(): void {
    if (!this._browserWindow || !this._isVisible) {
      return;
    }
    this.emit('hide');
    this._browserWindow.hide();
    this.emit('after-hide');
    this._isVisible = false;
    if (this._blurTimeout) {
      clearTimeout(this._blurTimeout);
      this._blurTimeout = null;
    }
    this.refreshLinuxContextMenu();
  }

  /**
   * Register a global keyboard accelerator that toggles the menubar window.
   * Replaces any previously registered shortcut owned by this Menubar.
   * Pass `undefined` to clear the current shortcut without registering a new
   * one. Returns whether the registration succeeded.
   *
   * @param accelerator - An Electron
   * [Accelerator](https://electronjs.org/docs/api/accelerator) string, or
   * `undefined` to clear.
   */
  setGlobalShortcut(accelerator: Electron.Accelerator | undefined): boolean {
    if (this._shortcut) {
      globalShortcut.unregister(this._shortcut);
      this._shortcut = undefined;
    }
    this._options.globalShortcut = accelerator;
    if (!accelerator) {
      return true;
    }
    const ok = globalShortcut.register(accelerator, () => this.toggleWindow());
    if (ok) {
      this._shortcut = accelerator;
    }
    return ok;
  }

  /**
   * Toggle the menubar window: hide it if visible, show it otherwise.
   * Resolves once the window finishes showing or hiding.
   */
  async toggleWindow(): Promise<void> {
    if (this._browserWindow && this._isVisible) {
      this.hideWindow();
      return;
    }
    await this.showWindow();
  }

  /**
   * Re-center the menubar window over the tray icon. Convenience wrapper for
   * `positioner.move('trayCenter', tray.getBounds())` that's safe to call
   * after the `after-create-window` event. No-op if the window doesn't
   * exist yet.
   */
  recenterOnTray(): void {
    if (!this._browserWindow || !this._tray) {
      return;
    }
    const bounds = this._tray.getBounds();
    const { x, y } = this.positioner.calculate('trayCenter', bounds);
    this._browserWindow.setPosition(Math.round(x), Math.round(y));
  }

  /**
   * Replace the tray context menu after construction. On Linux this also
   * re-publishes the menu to the SNI host, which is required after mutating
   * items in-place since libappindicator caches the previous serialization.
   * On macOS/Windows the right-click popup handler reads the current menu
   * reference, so swapping or clearing here takes effect immediately.
   *
   * @param menu - The new menu, or `null` to clear it.
   */
  setContextMenu(menu: Menu | null): void {
    this._contextMenu = menu ?? undefined;
    this._options.contextMenu = menu ?? undefined;
    if (!this._tray) {
      return;
    }
    if (process.platform === 'linux') {
      // `setContextMenu(null)` clears the menu on Linux.
      this._tray.setContextMenu(menu);
      return;
    }
    // macOS / Windows: bind the right-click popup once on first non-empty
    // assignment. The handler reads `this._contextMenu` at invoke time, so
    // later swaps and clears take effect without rebinding (and never leak
    // a stale closure reference).
    if (menu && !this._rightClickContextMenuBound) {
      this.bindRightClickContextMenu();
    }
  }

  /**
   * Change an option after menubar is created.
   *
   * @param key - The option key to modify, see {@link Options}.
   * @param value - The value to set.
   */
  setOption<K extends keyof Options>(key: K, value: Options[K]): void {
    this._options[key] = value;
  }

  /**
   * Show the menubar window.
   *
   * @param trayPos - The bounds to show the window in.
   */
  async showWindow(trayPos?: Electron.Rectangle): Promise<void> {
    if (!this.tray) {
      throw new Error('Tray should have been instantiated by now');
    }

    if (!this._browserWindow) {
      await this.createWindow();
    }

    // Use guard for TypeScript, to avoid ! everywhere
    if (!this._browserWindow) {
      throw new Error('Window has been initialized just above. qed.');
    }

    this.emit('show');

    // Cache fresh tray bounds (or fall back to existing cache / tray bounds)
    // so `positionWindow` can reposition without an event payload — for
    // example when the window resizes via `setSize`.
    if (trayPos && trayPos.x !== 0) {
      this._cachedBounds = trayPos;
    } else if (!this._cachedBounds && this.tray.getBounds) {
      this._cachedBounds = this.tray.getBounds();
    }

    this.positionWindow();
    this._browserWindow.show();
    this._isVisible = true;
    this.emit('after-show');
    this.refreshLinuxContextMenu();
  }

  /**
   * Compute and apply the tray-anchored position of the browser window. Safe
   * to call any time after `createWindow` has run — invoked from
   * {@link showWindow} on every show, and from the window's `resize` event so
   * `setSize` calls reposition the window correctly.
   */
  private positionWindow = (): void => {
    if (!this._browserWindow || !this._tray) {
      return;
    }

    // 'Windows' taskbar: sync window position each time before positioning.
    // https://github.com/maxogden/menubar/issues/232
    if (['win32', 'linux'].includes(process.platform)) {
      this._options.windowPosition = getWindowPosition(this._tray);
    }

    const trayPos = this._cachedBounds ?? this._tray.getBounds?.();

    // Default the window to the right if `trayPos` bounds are undefined or null.
    let noBoundsPosition: Options['windowPosition'];
    if (
      (trayPos === undefined || trayPos.x === 0) &&
      this._options.windowPosition?.startsWith('tray')
    ) {
      noBoundsPosition =
        process.platform === 'win32' ? 'bottomRight' : 'topRight';
    }

    const position = this.positioner.calculate(
      this._options.windowPosition || noBoundsPosition,
      trayPos,
    ) as { x: number; y: number };

    // Not using `||` because x and y can be zero.
    const x =
      this._options.browserWindow.x !== undefined
        ? this._options.browserWindow.x
        : position.x;
    const y =
      this._options.browserWindow.y !== undefined
        ? this._options.browserWindow.y
        : position.y;

    // `.setPosition` crashed on non-integers
    // https://github.com/maxogden/menubar/issues/233
    const targetX = Math.round(x);
    const targetY = Math.round(y);
    this._browserWindow.setPosition(targetX, targetY);

    // Native Wayland gives an application no way to position its own window:
    // `setPosition` is a no-op and `getPosition` reads back [0, 0]
    // (https://github.com/electron/electron/issues/40886). The compositor
    // decides where the window lands, usually centered, so the popover can't
    // be anchored to the tray. Detect that the move didn't take and warn once,
    // pointing at the X11 fallback. Gated on a Wayland session (`WAYLAND_DISPLAY`)
    // so pure X11 never trips it; the tolerance absorbs the few-pixel offsets
    // X11 window managers add for decorations, so XWayland (where positioning
    // works) doesn't trip it either.
    if (
      process.platform === 'linux' &&
      !!process.env.WAYLAND_DISPLAY &&
      !this._warnedNoPositioning
    ) {
      const [actualX, actualY] = this._browserWindow.getPosition();
      const ignored =
        Math.abs(actualX - targetX) > 24 || Math.abs(actualY - targetY) > 24;
      if (ignored) {
        this._warnedNoPositioning = true;
        console.warn(
          '[menubar] The window could not be positioned programmatically, ' +
            'which is expected on native Wayland where the compositor controls ' +
            'placement. The popover will not be anchored to the tray icon. Run ' +
            'with --ozone-platform=x11 to restore tray-relative positioning.',
        );
      }
    }
  };

  private async appReady(): Promise<void> {
    if (this.app.dock && !this._options.showDockIcon) {
      this.app.dock.hide();
    }

    if (this._options.activateWithApp) {
      this.app.on('activate', this.onAppActivate);
    }

    let trayImage =
      this._options.icon || path.join(this._options.dir, 'IconTemplate.png');
    if (typeof trayImage === 'string' && !fs.existsSync(trayImage)) {
      trayImage = path.join(__dirname, '..', 'assets', 'IconTemplate.png'); // Default cat icon
    }

    const trigger =
      this._options.trigger ??
      (this._options.showOnRightClick ? 'right-click' : 'click');

    this._tray = this._options.tray || new Tray(trayImage);
    // Type guards for TS not to complain
    if (!this.tray) {
      throw new Error('Tray has been initialized above');
    }
    if (trigger !== 'none') {
      this.tray.on(trigger as Parameters<Tray['on']>[0], this.clicked);
      this.tray.on('double-click', this.clicked);
    }
    // macOS-only: ignore double-click so an accidental second click doesn't
    // race the blur handler and cause a tray-icon flicker.
    if (
      process.platform === 'darwin' &&
      this._options.ignoreDoubleClickEvents
    ) {
      this.tray.setIgnoreDoubleClickEvents(true);
    }
    this.tray.setToolTip(this._options.tooltip);

    if (this._options.contextMenu) {
      this.bindContextMenu(this._options.contextMenu);
    }

    if (this._options.globalShortcut) {
      this.setGlobalShortcut(this._options.globalShortcut);
    }

    if (!this._options.windowPosition) {
      this._options.windowPosition = getWindowPosition(this.tray);
    }

    if (this._options.preloadWindow) {
      await this.createWindow();
    }

    this.emit('ready');
  }

  /**
   * Callback on tray icon click or double-click.
   *
   * @param e
   * @param bounds
   */
  private clicked = async (
    event?: Electron.KeyboardEvent,
    bounds?: Electron.Rectangle,
  ): Promise<void> => {
    if (event && (event.shiftKey || event.ctrlKey || event.metaKey)) {
      return this.hideWindow();
    }

    // if blur was invoked clear timeout
    if (this._blurTimeout) {
      clearInterval(this._blurTimeout);
    }

    if (this._browserWindow && this._isVisible) {
      return this.hideWindow();
    }

    this._cachedBounds = bounds || this._cachedBounds;
    await this.showWindow(this._cachedBounds);
  };

  private onAppActivate = (
    _event: Electron.Event,
    hasVisibleWindows: boolean,
  ): void => {
    if (!hasVisibleWindows) {
      this.showWindow().catch(console.error);
    }
  };

  private onBeforeQuit = (): void => {
    this._isQuitting = true;
  };

  private bindContextMenu(menu: Menu): void {
    this._contextMenu = menu;
    if (process.platform === 'linux') {
      // libappindicator / StatusNotifierItem requires the menu to live on the
      // tray itself; right-click is handled by the desktop environment.
      this.tray.setContextMenu(menu);
      return;
    }
    this.bindRightClickContextMenu();
  }

  private bindRightClickContextMenu(): void {
    // macOS / Windows: pop up the current menu on right-click so left-click
    // stays bound to toggling the menubar window. Read `this._contextMenu`
    // at invoke time so `setContextMenu()` swaps and clears take effect
    // without rebinding (and without leaking a stale closure reference).
    this.tray.on('right-click', (_event, bounds) => {
      const current = this._contextMenu;
      if (!current) {
        return;
      }
      this.tray.popUpContextMenu(current, { x: bounds.x, y: bounds.y });
    });
    this._rightClickContextMenuBound = true;
  }

  private refreshLinuxContextMenu(): void {
    // libappindicator caches the menu's serialized state, so consumers that
    // mutate items in-place need the menu re-published. Cheap to do; safe to
    // call unconditionally on every show/hide.
    if (
      process.platform === 'linux' &&
      this._contextMenu &&
      this._tray &&
      !this._tray.isDestroyed?.()
    ) {
      this._tray.setContextMenu(this._contextMenu);
    }
  }

  private onAppReady = (): void => {
    // Guard against `destroy()` being called between construction and the
    // scheduled `process.nextTick`/`'ready'` firing.
    if (this._isDestroyed) {
      return;
    }
    this.appReady().catch((err) => console.error('menubar: ', err));
  };

  private async createWindow(): Promise<void> {
    this.emit('create-window');

    // We add some default behavior for menubar's browserWindow, to make it
    // look like a menubar
    const defaults = {
      show: false, // Don't show it at first
      frame: false, // Remove window frame
    };

    this._browserWindow = new BrowserWindow({
      ...defaults,
      ...this._options.browserWindow,
    });

    this._positioner = new Positioner(this._browserWindow);

    this._browserWindow.on('blur', () => {
      if (!this._browserWindow) {
        return;
      }

      // hack to close if icon clicked when open
      this._browserWindow.isAlwaysOnTop()
        ? this.emit('focus-lost')
        : (this._blurTimeout = setTimeout(() => {
            this.hideWindow();
          }, 100));
    });

    if (this._options.showOnAllWorkspaces !== false) {
      // https://github.com/electron/electron/issues/37832#issuecomment-1497882944
      this._browserWindow.setVisibleOnAllWorkspaces(true, {
        skipTransformProcessType: true, // Avoid damaging the original visible state of app.dock
      });
    }

    if (this._options.hideOnClose) {
      this._browserWindow.on('close', (event) => {
        if (this._isDestroyed || this._isQuitting) {
          return;
        }
        event.preventDefault();
        // Defer the hide for Wayland: hiding synchronously from the `close`
        // handler can leave frameless surfaces in a half-closed state.
        setImmediate(() => this.hideWindow());
      });
    }

    if (this._options.escapeToHide) {
      this._browserWindow.webContents.on(
        'before-input-event',
        (_event, input) => {
          if (input.type === 'keyDown' && input.key === 'Escape') {
            this.hideWindow();
          }
        },
      );
    }

    // Use `closed` (not `close`) so consumer `close` listeners can still read
    // `mb.window` and call `event.preventDefault()` without racing our cleanup.
    this._browserWindow.on('closed', this.windowClear.bind(this));

    // Re-anchor the window to the tray when its size changes (e.g. via
    // `mb.window.setSize(...)`), so the window doesn't end up clipped under
    // the taskbar. https://github.com/maxogden/menubar/issues/349
    this._browserWindow.on('resize', this.positionWindow);

    this.emit('before-load');

    // If the user explicity set options.index to false, we don't loadURL
    // https://github.com/maxogden/menubar/issues/255
    if (this._options.index !== false) {
      await this._browserWindow.loadURL(
        this._options.index,
        this._options.loadUrlOptions,
      );
    }
    this.emit('after-create-window');
  }

  private windowClear(): void {
    this._browserWindow = undefined;
    this.emit('after-close');
  }
}
