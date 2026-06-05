[![CI Workflow][ci-workflow-badge]][github-actions] [![Release Workflow][release-workflow-badge]][github-actions] [![Renovate enabled][renovate-badge]][renovate] [![Contributors][contributors-badge]][github] [![Downloads - Year][downloads-badge]][npmjs] [![OSS License][license-badge]][license] [![NPM Latest Version][npmjs-version-badge]][npmjs] [![Latest Release][github-release-badge]][github-releases] ![Libraries.io dependency status for GitHub repo][librariesio-badge] ![npm minzipped bundle size][size-minzip-badge] ![npm minified bundle size][size-minified-badge]

<br />

<h1 align="center">➖ electron-menubar</h1>
<h5 align="center"><i>formerly known as menubar</i></h5>
<h4 align="center">High level way to create menubar desktop applications with Electron.</h4>

<br />

## Features

- ⚡️ Quick start for creating menubar applications using Electron. 
- 🚀 Zero runtime dependencies.
- 💻 Works on macOS, Windows and *most* Linux distributions. See [tested platforms][platforms].

| <img src="assets/screenshot-macos-dark.png" height="250px" /> | <img src="assets/screenshot-windows.png" height="250px" /> | <img src="assets/screenshot-linux.png" height="250px" /> |
| :-----------------------------------------------------------: | :--------------------------------------------------------: | :------------------------------------------------------: |
|                      macOS                      |                         Windows 10                         |                       Ubuntu                      |

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

| Property | Description |
| --- | --- |
| `app` | The [Electron App][electron-docs-app] instance. |
| `window` | The [Electron Browser Window][electron-docs-browserwindow] instance. |
| `tray` | The [Electron Tray][electron-docs-tray] instance. |
| `positioner` | The `Positioner` instance used to compute the window's on-screen coordinates. |

#### Methods

| Method | Description |
| --- | --- |
| `setOption(option, value)` | Change an option after menubar is created. |
| `getOption(option)` | Get a menubar option. |
| `showWindow()` | Show the menubar window. |
| `hideWindow()` | Hide the menubar window. |
| `toggleWindow()` | Show the window if hidden, hide it if visible. |
| `recenterOnTray()` | Re-center the window over the tray icon. |
| `setContextMenu(menu)` | Replace the tray context menu (auto-re-publishes on Linux). |
| `setGlobalShortcut(accelerator)` | Register a global accelerator that toggles the window. Returns `false` on registration failure. |
| `destroy()` | Tear down the menubar instance. |
| `isDestroyed()` | Whether the menubar is currently destroyed. |

### `menubar()` Options

You can pass an optional options object into the `menubar({ ... })` function:

| Option | Default | Description |
| --- | --- | --- |
| `dir` | `process.cwd()` | The app source directory. |
| `index` | `file:// + opts.dir + index.html` | The URL to load the menubar's `browserWindow` with. The url can be a remote address (e.g. `http://`) or a path to a local HTML file using the `file://` protocol. |
| `browserWindow` | | BrowserWindow options passed to the BrowserWindow constructor, see [Electron docs][electron-docs-browserwindow-options]. <details><summary>Useful fields</summary>• `x` (default `undefined`) - the x position of the window<br>• `y` (default `undefined`) - the y position of the window<br>• `width` (default `400`) - window width<br>• `height` (default `400`) - window height<br>• `alwaysOnTop` (default `false`) - if `true`, the window will not hide on blur</details> |
| `icon` | `opts.dir + IconTemplate.png` | The png icon to use for the menubar. A good size to start with is 20x20. To support retina, supply a 2x sized image (e.g. 40x40) with `@2x` added to the end of the name, so `icon.png` and `icon@2x.png`, and Electron will automatically use your `@2x` version on retina screens. |
| `tooltip` | empty | Menubar tray icon tooltip text. |
| `tray` | created on-the-fly | An Electron `Tray` instance. If provided, `opts.icon` will be ignored. |
| `preloadWindow` | `false` | Create [BrowserWindow][electron-docs-browserwindow-options] instance before it is used, increasing resource usage but making the click on the menubar load faster. |
| `loadUrlOptions` | `undefined` | The options passed when loading the index URL in the menubar's `browserWindow`. Everything `browserWindow.loadURL` supports is supported; this object is simply passed onto [browserWindow.loadURL][electron-docs-browserwindow-loadurl]. |
| `showOnAllWorkspaces` | `true` | Makes the window available on all macOS workspaces. |
| `windowPosition` | `trayCenter` (macOS/Linux), `trayBottomCenter` (Windows) | Sets the window position (`browserWindow.x` / `browserWindow.y` will still override this). Valid values: `trayLeft`, `trayBottomLeft`, `trayRight`, `trayBottomRight`, `trayCenter`, `trayBottomCenter`, `topLeft`, `topRight`, `bottomLeft`, `bottomRight`, `topCenter`, `bottomCenter`, `leftCenter`, `rightCenter`, `center`. |
| `showDockIcon` | `false` | Configure the visibility of the application dock icon. |
| `trigger` | `'click'` | Tray event that toggles the menubar window. One of `'click'`, `'right-click'`, or `'none'`. Use `'none'` to disable automatic toggling, useful when a single tray icon serves multiple windows. The window can still be shown by calling `mb.showWindow()` directly. |
| `showOnRightClick` | `false` | **Deprecated**, use `trigger: 'right-click'` instead. Show the window on `right-click` event instead of regular `click`. |
| `contextMenu` | | An Electron `Menu` to attach to the tray icon. <details><summary>Platform behavior</summary>On Linux it is bound via `tray.setContextMenu` (required by libappindicator / StatusNotifierItem) and re-published on every show/hide to defeat the indicator's menu cache. On macOS and Windows it pops up on right-click via `tray.popUpContextMenu`, so left-click continues to toggle the window. Combine with `trigger: 'none'` if you want right-click to be the only interaction.</details> |
| `hideOnClose` | `false` | Hide the window on `close` instead of destroying it, so the next tray click re-uses the same `BrowserWindow`. <details><summary>Platform notes</summary>On Linux/Wayland the hide is deferred via `setImmediate` to work around a compositor bug that leaves frameless surfaces in a half-closed state when hidden synchronously from the `close` handler. The library tracks the app's `before-quit` event internally, so real quits go through unimpeded.</details> |
| `escapeToHide` | `false` | Hide the menubar window when the user presses `Escape` while it has focus. |
| `ignoreDoubleClickEvents` | `true` (macOS only) | Calls `tray.setIgnoreDoubleClickEvents(true)` so an accidental double-click doesn't race the close-on-blur handler and flicker the tray icon. Pass `false` to opt out. No-op on Linux/Windows. |
| `globalShortcut` | | An [Accelerator][electron-docs-accelerator] string registered as a global keyboard shortcut that toggles the menubar window. Unregistered automatically on `destroy()`. Use `mb.setGlobalShortcut(accelerator)` to change or clear it at runtime. |

### Events

The `Menubar` class is an event emitter:

| Event | Description |
| --- | --- |
| `ready` | When `menubar`'s tray icon has been created and initialized, i.e. when `menubar` is ready to be used. Note: this is different from the Electron app's `ready` event, which happens much earlier in the process. |
| `create-window` | The line before `new BrowserWindow()` is called. |
| `before-load` | After create window, before `loadUrl` (can be used for `require("@electron/remote/main").enable(webContents)`). |
| `after-create-window` | The line after all window init code is done and the url was loaded. |
| `show` | The line before `window.show()` is called. |
| `after-show` | The line after `window.show()` is called. |
| `hide` | The line before `window.hide()` is called (on window blur). |
| `after-hide` | The line after `window.hide()` is called. |
| `after-close` | After the `.window` (BrowserWindow) property has been deleted. |
| `focus-lost` | Emitted if the always-on-top option is set and the user clicks away. |

## Tips

- Use `mb.on('after-create-window', callback)` to run things after your app has loaded. For example you could run `mb.window.openDevTools()` to open the developer tools for debugging, or load a different URL with `mb.window.loadURL()`
- Use `mb.on('focus-lost')` if you would like to perform some operation when using the option `browserWindow.alwaysOnTop: true`
- To restore focus of previous window after menubar hide, use `mb.on('after-hide', () => { mb.app.hide() } )` or similar
- To attach a native context menu, pass it as `contextMenu`: `menubar({ contextMenu })`. The library wires it via `setContextMenu` on Linux and `popUpContextMenu` on right-click on macOS/Windows so left-click still toggles the window. See [this example][examples-native] for more information.
- To avoid a flash when opening your menubar app, you can disable backgrounding the app using the following: `mb.app.commandLine.appendSwitch('disable-backgrounding-occluded-windows', 'true');`

## Acknowledgements

Originally created by [Max][github-upstream-creator] — hard-forked from [max-mapper/menubar][github-upstream-repo].


<!-- LINK LABELS -->

[github]: https://github.com/gitify-app/electron-menubar
[github-actions]: https://github.com/gitify-app/electron-menubar/actions
[github-issues]: https://github.com/gitify-app/electron-menubar/issues
[github-releases]: https://github.com/gitify-app/gitify/electron-menubar/latest
[github-upstream-creator]: https://github.com/max-mapper
[github-upstream-repo]: https://github.com/max-mapper/menubar

[examples]: examples
[examples-native]: examples/native-menu

[platforms]: PLATFORMS

[electron-docs-accelerator]: https://electronjs.org/docs/api/accelerator
[electron-docs-app]:https://electronjs.org/docs/api/app
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