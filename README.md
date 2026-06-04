![GitHub Actions Workflow Status](https://img.shields.io/github/actions/workflow/status/gitify-app/menubar/test.yml)
[![npm](https://img.shields.io/npm/v/electron-menubar.svg)](https://www.npmjs.com/package/electron-menubar)
![Libraries.io dependency status for GitHub repo](https://img.shields.io/librariesio/github/gitify-app/menubar)
![npm bundle size](https://img.shields.io/bundlephobia/minzip/electron-menubar.svg)
![npm bundle size](https://img.shields.io/bundlephobia/min/electron-menubar.svg)

<br /><br /><br />

<h1 align="center">➖ Menubar</h1>
<h4 align="center">High level way to create menubar desktop applications with Electron.</h4>

<br /><br /><br />

This module provides boilerplate for setting up a menubar application using Electron. All you have to do is point it at your `index.html` and `menubar` will handle the rest.

✅ Zero runtime dependencies, only one peer-dependency.

✅ Works on macOS, Windows and most Linuxes. See [tested platforms](./PLATFORMS.md).

✅ 💥 [**4.9kB minified + gzipped**](https://bundlephobia.com/result?p=electron-menubar) 💥

| <img src="assets/screenshot-macos-dark.png" height="250px" /> | <img src="assets/screenshot-windows.png" height="250px" /> | <img src="assets/screenshot-linux.png" height="250px" /> |
| :-----------------------------------------------------------: | :--------------------------------------------------------: | :------------------------------------------------------: |
|                      macOS Mojave 10.14                       |                         Windows 10                         |                       Ubuntu 18.04                       |

## Installation

```bash
bun add electron-menubar
```

## Usage

Starting with your own new project, run these commands:

```bash
$ bun add electron-menubar
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

Alternatively, see [`examples/hello-world`](/examples/hello-world) folder for a simple working example.

## `Menubar` Class

The return value of `menubar()` is a `Menubar` class instance, which has these properties:

- `app`: the [Electron App](https://electronjs.org/docs/api/app) instance,
- `window`: the [Electron Browser Window](https://electronjs.org/docs/api/browser-window) instance,
- `tray`: the [Electron Tray](https://electronjs.org/docs/api/tray) instance,
- `positioner`: the `Positioner` instance used to compute the window's on-screen coordinates,
- `setOption(option, value)`: change an option after menubar is created,
- `getOption(option)`: get an menubar option,
- `showWindow()`: show the menubar window,
- `hideWindow()`: hide the menubar window,
- `toggleWindow()`: show the window if hidden, hide it if visible,
- `recenterOnTray()`: re-center the window over the tray icon,
- `setContextMenu(menu)`: replace the tray context menu (auto-re-publishes on Linux),
- `setGlobalShortcut(accelerator)`: register a global accelerator that toggles the window — returns `false` on registration failure,
- `destroy()`: tear down the menubar instance,
- `isDestroyed()`: whether the menubar is currently destroyed.

## `menubar()` Options

You can pass an optional options object into the `menubar({ ... })` function:

- `dir` (default `process.cwd()`) - the app source directory
- `index` (default `file:// + opts.dir + index.html`) - The URL to load the menubar's browserWindow with. The url can be a remote address (e.g. `http://`) or a path to a local HTML file using the `file://` protocol.
- `browserWindow` - BrowserWindow options to be passed to the BrowserWindow constructor, see [Electron docs](https://electronjs.org/docs/api/browser-window#new-browserwindowoptions). Some interesting fields to passed down are:
  - `x` (default `undefined`) - the x position of the window
  - `y` (default `undefined`) - the y position of the window
  - `width` (default 400) - window width
  - `height` (default 400) - window height
  - `alwaysOnTop` (default false) - if true, the window will not hide on blur
- `icon` (default `opts.dir + IconTemplate.png`) - the png icon to use for the menubar. A good size to start with is 20x20. To support retina, supply a 2x sized image (e.g. 40x40) with `@2x` added to the end of the name, so `icon.png` and `icon@2x.png` and Electron will automatically use your `@2x` version on retina screens.
- `tooltip` (default empty) - menubar tray icon tooltip text
- `tray` (default created on-the-fly) - an electron `Tray` instance. if provided `opts.icon` will be ignored
- `preloadWindow` (default false) - Create [BrowserWindow](https://electronjs.org/docs/api/browser-window#new-browserwindowoptions) instance before it is used -- increasing resource usage, but making the click on the menubar load faster.
- `loadUrlOptions` - (default undefined) The options passed when loading the index URL in the menubar's browserWindow. Everything browserWindow.loadURL supports is supported; this object is simply passed onto [browserWindow.loadURL](https://electronjs.org/docs/api/browser-window#winloadurlurl-options)
- `showOnAllWorkspaces` (default true) - Makes the window available on all OS X workspaces.
- `windowPosition` (default `trayCenter` on macOS/Linux, `trayBottomCenter` on Windows) - Sets the window position (`browserWindow.x` / `browserWindow.y` will still override this). Valid values: `trayLeft`, `trayBottomLeft`, `trayRight`, `trayBottomRight`, `trayCenter`, `trayBottomCenter`, `topLeft`, `topRight`, `bottomLeft`, `bottomRight`, `topCenter`, `bottomCenter`, `leftCenter`, `rightCenter`, `center`.
- `showDockIcon` (default false) - Configure the visibility of the application dock icon.
- `trigger` (default `'click'`) - Tray event that toggles the menubar window. One of `'click'`, `'right-click'`, or `'none'`. Use `'none'` to disable automatic toggling — useful when a single tray icon serves multiple windows. The window can still be shown by calling `mb.showWindow()` directly.
- `showOnRightClick` (default false) - **Deprecated**, use `trigger: 'right-click'` instead. Show the window on 'right-click' event instead of regular 'click'.
- `contextMenu` - An Electron `Menu` to attach to the tray icon. On Linux it is bound via `tray.setContextMenu` (required by libappindicator / StatusNotifierItem) and re-published on every show/hide to defeat the indicator's menu cache. On macOS and Windows it pops up on right-click via `tray.popUpContextMenu`, so left-click continues to toggle the window. Combine with `trigger: 'none'` if you want right-click to be the only interaction.
- `hideOnClose` (default false) - Hide the window on `close` instead of destroying it, so the next tray click re-uses the same `BrowserWindow`. On Linux/Wayland the hide is deferred via `setImmediate` to work around a compositor bug that leaves frameless surfaces in a half-closed state when hidden synchronously from the `close` handler. The library tracks the app's `before-quit` event internally, so real quits go through unimpeded.
- `escapeToHide` (default false) - Hide the menubar window when the user presses `Escape` while it has focus.
- `ignoreDoubleClickEvents` (default true, macOS only) - Calls `tray.setIgnoreDoubleClickEvents(true)` so an accidental double-click doesn't race the close-on-blur handler and flicker the tray icon. Pass `false` to opt out. No-op on Linux/Windows.
- `globalShortcut` - An [Accelerator](https://electronjs.org/docs/api/accelerator) string registered as a global keyboard shortcut that toggles the menubar window. Unregistered automatically on `destroy()`. Use `mb.setGlobalShortcut(accelerator)` to change or clear it at runtime.

## Events

The `Menubar` class is an event emitter:

- `ready` - when `menubar`'s tray icon has been created and initialized, i.e. when `menubar` is ready to be used. Note: this is different than Electron app's `ready` event, which happens much earlier in the process
- `create-window` - the line before `new BrowserWindow()` is called
- `before-load` - after create window, before loadUrl (can be used for `require("@electron/remote/main").enable(webContents)`)
- `after-create-window` - the line after all window init code is done and url was loaded
- `show` - the line before `window.show()` is called
- `after-show` - the line after `window.show()` is called
- `hide` - the line before `window.hide()` is called (on window blur)
- `after-hide` - the line after `window.hide()` is called
- `after-close` - after the `.window` (BrowserWindow) property has been deleted
- `focus-lost` - emitted if always-on-top option is set and the user clicks away

## Tips

- Use `mb.on('after-create-window', callback)` to run things after your app has loaded. For example you could run `mb.window.openDevTools()` to open the developer tools for debugging, or load a different URL with `mb.window.loadURL()`
- Use `mb.on('focus-lost')` if you would like to perform some operation when using the option `browserWindow.alwaysOnTop: true`
- To restore focus of previous window after menubar hide, use `mb.on('after-hide', () => { mb.app.hide() } )` or similar
- To attach a native context menu, pass it as `contextMenu`: `menubar({ contextMenu })`. The library wires it via `setContextMenu` on Linux and `popUpContextMenu` on right-click on macOS/Windows so left-click still toggles the window. See [this example](https://github.com/gitify-app/menubar/tree/main/examples/native-menu) for more information.
- To avoid a flash when opening your menubar app, you can disable backgrounding the app using the following: `mb.app.commandLine.appendSwitch('disable-backgrounding-occluded-windows', 'true');`

## Credits

Originally created by [Max Ogden](https://github.com/maxogden) — forked from [maxogden/menubar](https://github.com/maxogden/menubar).
