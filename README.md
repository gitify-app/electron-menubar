<h1 align="center">➖ electron-menubar</h1>

<p align="center">
  <a href="https://github.com/gitify-app/electron-menubar/actions"><img src="https://img.shields.io/github/actions/workflow/status/gitify-app/electron-menubar/test.yml?logo=github&amp;label=ci" alt="CI Workflow" /></a>
  <a href="https://github.com/gitify-app/electron-menubar/actions"><img src="https://img.shields.io/github/actions/workflow/status/gitify-app/electron-menubar/release.yml?logo=github&amp;label=release" alt="Release Workflow" /></a>
  <a href="https://github.com/gitify-app/gitify/issues/576"><img src="https://img.shields.io/badge/renovate-enabled-brightgreen.svg?logo=renovate&amp;logoColor=white" alt="Renovate enabled" /></a>
  <a href="https://github.com/gitify-app/electron-menubar"><img src="https://img.shields.io/github/contributors/gitify-app/electron-menubar?logo=github" alt="Contributors" /></a>
  <a href="https://www.npmjs.com/package/electron-menubar"><img src="https://img.shields.io/npm/dy/electron-menubar?logo=npm" alt="Downloads - Year" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/github/license/gitify-app/electron-menubar?logo=github" alt="OSS License" /></a>
  <a href="https://www.npmjs.com/package/electron-menubar"><img src="https://img.shields.io/npm/v/electron-menubar?logo=npm" alt="NPM Latest Version" /></a>
  <a href="https://github.com/gitify-app/electron-menubar/releases/latest"><img src="https://img.shields.io/github/v/release/gitify-app/electron-menubar?logo=github" alt="Latest Release" /></a>
  <img src="https://img.shields.io/librariesio/github/gitify-app/electron-menubar?logo=libraries.io&amp;logoColor=white" alt="Libraries.io dependency status for GitHub repo" />
  <img src="https://img.shields.io/bundlephobia/minzip/electron-menubar.svg?logo=npm" alt="npm minzipped bundle size" />
  <img src="https://img.shields.io/bundlephobia/min/electron-menubar.svg?logo=npm" alt="npm minified bundle size" />
</p>

<h5 align="center"><i>formerly known as menubar</i></h5>
<h4 align="center">High level way to create menubar desktop applications with Electron.</h4>

<br />

## Features

- ⚡️ Quick start for creating menubar applications using Electron.
- 🚀 Zero runtime dependencies.
- 💻 Works on macOS, Windows and _most_ Linux distributions. See [tested platforms][platforms].

| <img src="assets/screenshot-macos-dark.png" height="250px" /> | <img src="assets/screenshot-windows.png" height="250px" /> | <img src="assets/screenshot-linux.png" height="250px" /> |
| :-----------------------------------------------------------: | :--------------------------------------------------------: | :------------------------------------------------------: |
|                             macOS                             |                         Windows 10                         |                          Ubuntu                          |

> [!NOTE]
> On native Wayland, the desktop compositor controls window placement, so the popover cannot be anchored to the tray icon and is positioned by the desktop (usually centered). This is a Wayland limitation, not something the library can override. Tray-relative positioning works under X11/XWayland. See [window positioning on Linux][platforms] for the detail and a workaround.

## Why electron-menubar?

`electron-menubar` builds on [max-mapper/menubar][github-upstream-repo], with fixes and controls developed for [Gitify](https://github.com/gitify-app/gitify). The original provides the tray-app foundation. This fork brings more of the platform-specific behavior into the library so applications have less to implement themselves.

| Area                          | What this fork adds                                                                                                                                                                                                   |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Windows focus and positioning | Ignores transient blur events immediately after opening, keeps resized windows clear of the taskbar, handles left-side taskbars, and prevents recursive resize events during repositioning.                           |
| Windows tray overflow         | Raises popups above the hidden-icons panel automatically and still dismisses on click-away. Apps use the same keep-open option on every platform. **Available since 11.0.0.**                                         |
| macOS                         | Opens on the active Space when another app is fullscreen, hides the Dock icon again after Electron's startup race, and ignores tray double-clicks by default to avoid flicker.                                        |
| Linux tray menus              | Publishes native tray context menus and provides `refreshContextMenu()` to update them after menu items change. Documents native Wayland positioning limits and the XWayland workaround.                              |
| Window controls               | Built-in `hideOnClose`, `escapeToHide`, configurable tray triggers, global shortcuts, `toggleWindow()`, and `recenterOnTray()`. Closing can hide the window while real quits and updater restarts still work.         |
| Instance cleanup              | `destroy()` removes the instance's listeners and unregisters its global shortcut.                                                                                                                                     |
| Packaging                     | Zero runtime dependencies, including a built-in positioner. Ships CommonJS and ESM entry points with TypeScript declarations.                                                                                         |
| Verification                  | Unit tests, native Electron end-to-end tests on macOS, Windows, and Linux, and visual checks that the tray icon and window render. The [platform report][platforms] includes screenshots and positioning limitations. |

### Popup behavior without platform checks

Menubar manages popup stacking and focus on every platform. A plain `menubar()` dismisses on click-away and opens above the Windows hidden-icons panel. To keep it open, change one option:

```javascript
const mb = menubar();

mb.setOption('hideOnBlur', false); // Keep open and on top.
mb.setOption('hideOnBlur', true); // Resume click-away dismissal.
```

Opening DevTools temporarily keeps the popup open. Closing DevTools restores the latest `hideOnBlur` preference. Options set before window creation also apply when the window is recreated.

#### Migrating from 10.x

These defaults apply starting with 11.0.0. Previously, menubar inferred dismissal from `window.isAlwaysOnTop()`. Use `hideOnBlur: false` for persistent popups instead of `browserWindow.alwaysOnTop: true` or runtime `window.setAlwaysOnTop(true)` calls. `browserWindow.alwaysOnTop` now controls stacking only; it does not disable dismissal. Setting `hideOnBlur: false` also keeps the popup on top on macOS and Linux.

Remove Windows `pop-up-menu` workarounds and DevTools focus handlers from apps. Menubar owns stacking during window creation, showing, preference changes, and DevTools transitions. Apps can still customize DevTools dimensions and layout.
See the [changelog](CHANGELOG.md) for released changes and the [API documentation](#api-documentation) for all options.

## Installation

```bash
pnpm add electron-menubar
```

## Usage

Starting with your own new project, run these commands:

```bash
$ pnpm add electron-menubar
$ touch myApp.js
$ touch index.html
```

Fill `index.html` with some HTML, and `myApp.js` like this:

```javascript
const { menubar } = require('electron-menubar');

const mb = menubar();

mb.on('ready', () => {
  console.log('app is ready');
  // your app code here
});
```

Then use `electron` to run the app:

```bash
$ electron myApp.js
```

## Examples

See [`examples`][examples] folder for a selection of working examples.

## API Documentation

### `Menubar` Class

The return value of `menubar()` is a `Menubar` class instance, which exposes the following properties and methods.

#### Properties

| Property     | Description                                                                   |
| ------------ | ----------------------------------------------------------------------------- |
| `app`        | The [Electron App][electron-docs-app] instance.                               |
| `window`     | The [Electron Browser Window][electron-docs-browserwindow] instance.          |
| `tray`       | The [Electron Tray][electron-docs-tray] instance.                             |
| `positioner` | The `Positioner` instance used to compute the window's on-screen coordinates. |

#### Methods

| Method                           | Description                                                                                                  |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `setOption(option, value)`       | Change an option after menubar is created.                                                                   |
| `getOption(option)`              | Get a menubar option.                                                                                        |
| `showWindow()`                   | Show the menubar window.                                                                                     |
| `hideWindow()`                   | Hide the menubar window.                                                                                     |
| `toggleWindow()`                 | Show the window if hidden, hide it if visible.                                                               |
| `recenterOnTray()`               | Re-center the window over the tray icon.                                                                     |
| `setContextMenu(menu)`           | Replace the tray context menu (auto-re-publishes on Linux).                                                  |
| `refreshContextMenu()`           | Re-publish the current context menu after mutating its items in place. Required on Linux, a no-op elsewhere. |
| `setGlobalShortcut(accelerator)` | Register a global accelerator that toggles the window. Returns `false` on registration failure.              |
| `destroy()`                      | Tear down the menubar instance.                                                                              |
| `isDestroyed()`                  | Whether the menubar is currently destroyed.                                                                  |

### `menubar()` Options

You can pass an optional options object into the `menubar({ ... })` function:

| Option                    | Default                                                  | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| ------------------------- | -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `dir`                     | `process.cwd()`                                          | The app source directory.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `index`                   | `file:// + opts.dir + index.html`                        | The URL to load the menubar's `browserWindow` with. The url can be a remote address (e.g. `http://`) or a path to a local HTML file using the `file://` protocol.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `browserWindow`           |                                                          | BrowserWindow options passed to the BrowserWindow constructor, see [Electron docs][electron-docs-browserwindow-options]. <details><summary>Useful fields</summary>• `x` (default `undefined`) - the x position of the window<br>• `y` (default `undefined`) - the y position of the window<br>• `width` (default `400`) - window width<br>• `height` (default `400`) - window height<br>• `alwaysOnTop` (default `false`) - keeps the window on top without changing click-away dismissal; Windows popups are always raised above the tray</details>                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `icon`                    | `opts.dir + IconTemplate.png`                            | The png icon to use for the menubar. A good size to start with is 20x20. To support retina, supply a 2x sized image (e.g. 40x40) with `@2x` added to the end of the name, so `icon.png` and `icon@2x.png`, and Electron will automatically use your `@2x` version on retina screens.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `tooltip`                 | empty                                                    | Menubar tray icon tooltip text.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `tray`                    | created on-the-fly                                       | An Electron `Tray` instance. If provided, `opts.icon` will be ignored.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `preloadWindow`           | `false`                                                  | Create [BrowserWindow][electron-docs-browserwindow-options] instance before it is used, increasing resource usage but making the click on the menubar load faster.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `loadUrlOptions`          | `undefined`                                              | The options passed when loading the index URL in the menubar's `browserWindow`. Everything `browserWindow.loadURL` supports is supported; this object is simply passed onto [browserWindow.loadURL][electron-docs-browserwindow-loadurl].                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `showOnAllWorkspaces`     | `true`                                                   | Makes the window available on all macOS workspaces. On macOS the window leaves all workspaces while hidden and rejoins them on `showWindow()`, so show it with `showWindow()` rather than `window.show()` or `window.showInactive()`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `windowPosition`          | `trayCenter` (macOS/Linux), `trayBottomCenter` (Windows) | Sets the window position (`browserWindow.x` / `browserWindow.y` will still override this). Valid values: `trayLeft`, `trayBottomLeft`, `trayRight`, `trayBottomRight`, `trayCenter`, `trayBottomCenter`, `topLeft`, `topRight`, `bottomLeft`, `bottomRight`, `topCenter`, `bottomCenter`, `leftCenter`, `rightCenter`, `center`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `showDockIcon`            | `false`                                                  | Configure the visibility of the application dock icon, macOS only. <details><summary>Hiding reliably</summary>When `false`, the library calls [`app.dock.hide()`](https://www.electronjs.org/docs/latest/api/app#appdockhide-macos) at startup and re-asserts it once shortly after, because macOS can silently drop the underlying process transform when it races the launch activation. The transform only runs after the process has already launched as a regular dock app, so the tile briefly exists on every launch and hiding it stays best-effort. Packaged apps that never want a dock tile should also declare [`LSUIElement`](https://developer.apple.com/documentation/bundleresources/information-property-list/lsuielement) in their `Info.plist` (with electron-builder: `mac.extendInfo.LSUIElement: true`), so the process starts as an agent app and no tile is ever created. `showDockIcon: false` then still covers development runs, where the stock Electron binary's plist is not under your control.</details> |
| `trigger`                 | `'click'`                                                | Tray event that toggles the menubar window. One of `'click'`, `'right-click'`, or `'none'`. Use `'none'` to disable automatic toggling, useful when a single tray icon serves multiple windows. The window can still be shown by calling `mb.showWindow()` directly.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `showOnRightClick`        | `false`                                                  | **Deprecated**, use `trigger: 'right-click'` instead. Show the window on `right-click` event instead of regular `click`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `contextMenu`             |                                                          | An Electron `Menu` to attach to the tray icon. <details><summary>Platform behavior</summary>On Linux it is bound via `tray.setContextMenu` (required by libappindicator / StatusNotifierItem) and re-published on every show/hide to defeat the indicator's menu cache. On macOS and Windows it pops up on right-click via `tray.popUpContextMenu`, so left-click continues to toggle the window. Combine with `trigger: 'none'` if you want right-click to be the only interaction.</details>                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `hideOnBlur`              | `true`                                                   | Set `false` to keep the popup open and on top, emitting `focus-lost` on click-away. Defaults to `true`. DevTools temporarily suspends dismissal without changing this preference. Supports runtime changes through `setOption`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `hideOnClose`             | `false`                                                  | Hide the window on `close` instead of destroying it, so the next tray click re-uses the same `BrowserWindow`. <details><summary>Platform notes</summary>On Linux/Wayland the hide is deferred via `setImmediate` to work around a compositor bug that leaves frameless surfaces in a half-closed state when hidden synchronously from the `close` handler. The library tracks the app's `before-quit` event and the auto updater's `before-quit-for-update` event internally, so real quits and update restarts go through unimpeded.</details>                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `escapeToHide`            | `false`                                                  | Hide the menubar window when the user presses `Escape` while it has focus.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `ignoreDoubleClickEvents` | `true` (macOS only)                                      | Calls `tray.setIgnoreDoubleClickEvents(true)` so an accidental double-click doesn't race the close-on-blur handler and flicker the tray icon. Pass `false` to opt out. No-op on Linux/Windows.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `globalShortcut`          |                                                          | An [Accelerator][electron-docs-accelerator] string registered as a global keyboard shortcut that toggles the menubar window. Unregistered automatically on `destroy()`. Use `mb.setGlobalShortcut(accelerator)` to change or clear it at runtime.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |

### Events

The `Menubar` class is an event emitter:

| Event                 | Description                                                                                                                                                                                                     |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ready`               | When `menubar`'s tray icon has been created and initialized, i.e. when `menubar` is ready to be used. Note: this is different from the Electron app's `ready` event, which happens much earlier in the process. |
| `create-window`       | The line before `new BrowserWindow()` is called.                                                                                                                                                                |
| `before-load`         | After create window, before `loadUrl` (can be used for `require("@electron/remote/main").enable(webContents)`).                                                                                                 |
| `after-create-window` | The line after all window init code is done and the url was loaded.                                                                                                                                             |
| `show`                | The line before `window.show()` is called.                                                                                                                                                                      |
| `after-show`          | The line after `window.show()` is called.                                                                                                                                                                       |
| `hide`                | The line before `window.hide()` is called (on window blur).                                                                                                                                                     |
| `after-hide`          | The line after `window.hide()` is called.                                                                                                                                                                       |
| `after-close`         | After the `.window` (BrowserWindow) property has been deleted.                                                                                                                                                  |
| `focus-lost`          | Emitted on click-away when `hideOnBlur` is `false` or DevTools is open.                                                                                                                                         |

## Tips

- Use `mb.on('after-create-window', callback)` to run things after your app has loaded. For example you could run `mb.window.openDevTools()` to open the developer tools for debugging, or load a different URL with `mb.window.loadURL()`
- Use `mb.on('focus-lost')` if you would like to perform some operation when using the option `hideOnBlur: false`
- To restore focus of previous window after menubar hide, use `mb.on('after-hide', () => { mb.app.hide() } )` or similar
- To attach a native context menu, pass it as `contextMenu`: `menubar({ contextMenu })`. The library wires it via `setContextMenu` on Linux and `popUpContextMenu` on right-click on macOS/Windows so left-click still toggles the window. See [this example][examples-native] for more information.
- To avoid a flash when opening your menubar app, you can disable backgrounding the app using the following: `mb.app.commandLine.appendSwitch('disable-backgrounding-occluded-windows', 'true');`

## Acknowledgements

Originally created by [Max][github-upstream-creator] — hard-forked from [max-mapper/menubar][github-upstream-repo].

<!-- LINK LABELS -->

[github]: https://github.com/gitify-app/electron-menubar
[github-actions]: https://github.com/gitify-app/electron-menubar/actions
[github-issues]: https://github.com/gitify-app/electron-menubar/issues
[github-releases]: https://github.com/gitify-app/electron-menubar/releases/latest
[github-upstream-creator]: https://github.com/max-mapper
[github-upstream-repo]: https://github.com/max-mapper/menubar
[examples]: examples
[examples-native]: examples/native-menu
[platforms]: PLATFORMS.md
[electron-docs-accelerator]: https://electronjs.org/docs/api/accelerator
[electron-docs-app]: https://electronjs.org/docs/api/app
[electron-docs-browserwindow]: https://electronjs.org/docs/api/browser-window
[electron-docs-browserwindow-options]: https://electronjs.org/docs/api/browser-window#new-browserwindowoptions
[electron-docs-browserwindow-loadurl]: https://electronjs.org/docs/api/browser-window#winloadurlurl-options
[electron-docs-tray]: https://electronjs.org/docs/api/tray
[ci-workflow-badge]: https://img.shields.io/github/actions/workflow/status/gitify-app/electron-menubar/test.yml?logo=github&label=CI
[release-workflow-badge]: https://img.shields.io/github/actions/workflow/status/gitify-app/electron-menubar/release.yml?logo=github&label=Release
[downloads-badge]: https://img.shields.io/npm/dy/electron-menubar?logo=npm
[contributors-badge]: https://img.shields.io/github/contributors/gitify-app/electron-menubar?logo=github
[librariesio-badge]: https://img.shields.io/librariesio/github/gitify-app/electron-menubar?logo=libraries.io&logoColor=white
[license]: LICENSE
[license-badge]: https://img.shields.io/github/license/gitify-app/electron-menubar?logo=github
[github-release-badge]: https://img.shields.io/github/v/release/gitify-app/electron-menubar?logo=github
[npmjs]: https://www.npmjs.com/package/electron-menubar
[npmjs-version-badge]: https://img.shields.io/npm/v/electron-menubar?logo=npm
[renovate]: https://github.com/gitify-app/gitify/issues/576
[renovate-badge]: https://img.shields.io/badge/renovate-enabled-brightgreen.svg?logo=renovate&logoColor=white
[size-minzip-badge]: https://img.shields.io/bundlephobia/minzip/electron-menubar.svg?logo=npm
[size-minified-badge]: https://img.shields.io/bundlephobia/min/electron-menubar.svg?logo=npm
