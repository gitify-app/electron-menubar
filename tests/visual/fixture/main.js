const path = require('node:path');
const { nativeImage, screen } = require('electron');
const { menubar } = require('../../../lib/index.cjs');

const SIZE = 22;
const buf = Buffer.alloc(SIZE * SIZE * 4);
for (let y = 0; y < SIZE; y++) {
  for (let x = 0; x < SIZE; x++) {
    const i = (y * SIZE + x) * 4;
    const checker = (x >> 1) + (y >> 1);
    if (checker & 1) {
      buf[i] = 255;
      buf[i + 1] = 0;
      buf[i + 2] = 255;
    } else {
      buf[i] = 0;
      buf[i + 1] = 255;
      buf[i + 2] = 0;
    }
    buf[i + 3] = 255;
  }
}
const icon = nativeImage.createFromBuffer(buf, { width: SIZE, height: SIZE });

const mb = menubar({
  icon,
  index: `file://${path.join(__dirname, 'index.html')}`,
  preloadWindow: false,
  showDockIcon: false,
  tooltip: 'menubar-visual-fixture',
  browserWindow: {
    width: 200,
    height: 100,
    show: false,
    // Force opaque white background — Electron's default leaves the window
    // transparent on Linux, which let GNOME's dark mode backdrop bleed
    // through and made the bounds-rect detection see 0 white pixels.
    transparent: false,
    backgroundColor: '#FFFFFF',
    // No window chrome: avoids GNOME Mutter's CSD header bar painting
    // a blue/themed strip inside our 200x100 region.
    frame: false,
    // 200x100 is the *content* size; without this, the window's outer rect
    // includes header bar/decorations and the inner HTML viewport ends up
    // smaller, throwing off white-pixel counts.
    useContentSize: true,
  },
});

mb.on('ready', () => {
  console.log('VISUAL:ready');
  mb.showWindow()
    .then(() => {
      // Force topmost so the screenshot captures our window even when GHA
      // runners pre-launch File Explorer / Notepad windows over the tray area.
      mb.window?.setAlwaysOnTop(true, 'screen-saver');
      // Move the window away from any OS panel/taskbar. Linux SNI panels
      // return {0,0,0,0} for tray bounds, so menubar's Positioner falls back
      // to the bottom-right corner — which on bottom-panel DEs (Budgie,
      // Cinnamon, KDE) puts our opaque window right on top of the tray icon
      // and the test can no longer detect it. Moving to a fixed mid-screen
      // position guarantees no overlap on any platform.
      mb.window?.setPosition(400, 200);
      // Focus prevents Mutter from rendering the window as "unfocused" with
      // a dimming/tint overlay (was producing a navy-blue rect on GNOME).
      mb.window?.focus();
      // Wait for the WM (especially Mutter on GNOME) to settle the window's
      // final position before querying — getBounds() right after showWindow()
      // returned a stale/intended coord on GNOME while the actual paint was
      // elsewhere.
      setTimeout(() => {
        const trayBounds = mb.tray.getBounds();
        const windowBounds = mb.window?.getBounds() ?? {
          x: 0,
          y: 0,
          width: 0,
          height: 0,
        };
        const scale = screen.getPrimaryDisplay().scaleFactor;
        console.log(
          `VISUAL:bounds=${JSON.stringify({ tray: trayBounds, window: windowBounds, scale })}`,
        );
        console.log('VISUAL:window-shown');
      }, 1500);
    })
    .catch((err) => {
      console.error('VISUAL:window-error', err);
    });
});
