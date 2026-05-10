import type {
  BrowserWindowConstructorOptions,
  LoadURLOptions,
  Tray,
} from 'electron';

import type { WindowPosition } from './Positioner';

/**
 * Options for creating a menubar application
 */
export interface Options {
  /**
   * Listen on `app.on('activate')` to open menubar when app is activated.
   * @default `true`
   */
  activateWithApp?: boolean;
  /**
   * An Electron BrowserWindow instance, or an options object to be passed into
   * the BrowserWindow constructor.
   * @example
   * ```typescript
   * const options = { height: 640, width: 480 };
   *
   * const mb = new Menubar({
   *   browserWindow: options
   * });
   * ```
   */
  browserWindow: BrowserWindowConstructorOptions;
  /**
   * The app source directory.
   */
  dir: string;
  /**
   * Hide the window on `close` instead of letting it be destroyed, so the
   * next tray click re-uses the same {@link BrowserWindow} instance. On
   * Linux/Wayland the hide is deferred via `setImmediate` to work around a
   * compositor bug that leaves frameless surfaces in a half-closed state
   * when hidden synchronously from the `close` handler.
   *
   * Respects `app.isQuitting === true` (set this in your `before-quit`
   * handler) so the close goes through during real quits. Has no effect
   * when the close event was triggered by {@link Menubar.destroy}.
   * @default `false`
   */
  hideOnClose?: boolean;
  /**
   * Hide the menubar window when the user presses `Escape` while it has
   * focus. Wires up a `before-input-event` listener on the BrowserWindow.
   * @default `false`
   */
  escapeToHide?: boolean;
  /**
   * The png icon to use for the menubar. A good size to start with is 20x20.
   * To support retina, supply a 2x sized image (e.g. 40x40) with @2x added to
   * the end of the name, so icon.png and icon@2x.png and Electron will
   * automatically use your @2x version on retina screens.
   */
  icon?: string | Electron.NativeImage;
  /**
   * The URL to load the menubar's browserWindow with. The url can be a remote
   * address (e.g. `http://`) or a path to a local HTML file using the
   * `file://` protocol. If false, then menubar won't call `loadURL` on
   * start.
   * @default `file:// + options.dir + index.html`
   * @see https://electronjs.org/docs/api/browser-window#winloadurlurl-options
   */
  index: string | false;
  /**
   * The options passed when loading the index URL in the menubar's
   * browserWindow. Everything browserWindow.loadURL supports is supported;
   * this object is simply passed onto browserWindow.loadURL
   * @default `{}`
   * @see https://electronjs.org/docs/api/browser-window#winloadurlurl-options
   */
  loadUrlOptions?: LoadURLOptions;
  /**
   * Ignore the tray's `double-click` event on macOS. Prevents a flicker
   * caused by the close-on-blur handler racing the second click of an
   * accidental double-click. No-op on Linux/Windows. Calls
   * [`tray.setIgnoreDoubleClickEvents`](https://electronjs.org/docs/api/tray#traysetignoredoubleclickeventsignore-macos).
   * @default `true`
   */
  ignoreDoubleClickEvents?: boolean;
  /**
   * Create BrowserWindow instance before it is used -- increasing resource
   * usage, but making the click on the menubar load faster.
   */
  preloadWindow?: boolean;
  /**
   * Configure the visibility of the application dock icon, macOS only. Calls
   * [`app.dock.hide`](https://electronjs.org/docs/api/app#appdockhide-macos).
   */
  showDockIcon?: boolean;
  /**
   * Makes the window available on all OS X workspaces. Calls
   * [`setVisibleOnAllWorkspaces`](https://electronjs.org/docs/api/browser-window#winsetvisibleonallworkspacesvisible-options).
   */
  showOnAllWorkspaces?: boolean;
  /**
   * Show the window on 'right-click' event instead of regular 'click'.
   * @deprecated Use {@link Options.trigger} instead. Will be removed in the
   * next major release.
   */
  showOnRightClick?: boolean;
  /**
   * Tray event that toggles the menubar window. Set to `'none'` to disable
   * automatic toggling — the window can still be shown by calling
   * {@link Menubar.showWindow} directly. Useful when a single tray icon serves
   * multiple windows.
   * @default `'click'` (or `'right-click'` if the deprecated
   * {@link Options.showOnRightClick} is `true`)
   */
  trigger?: 'click' | 'right-click' | 'none';
  /**
   * Menubar tray icon tooltip text. Calls [`tray.setTooltip`](https://electronjs.org/docs/api/tray#traysettooltiptooltip).
   */
  tooltip: string;
  /**
   * An electron Tray instance. If provided, `options.icon` will be ignored.
   */
  tray?: Tray;
  /**
   * Sets the window position (x and y will still override this). See
   * {@link WindowPosition} for the list of valid values.
   */
  windowPosition?: WindowPosition;
}
