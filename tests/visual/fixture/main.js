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
  browserWindow: { width: 200, height: 100, show: false },
});

mb.on('ready', () => {
  console.log('VISUAL:ready');
  mb.showWindow()
    .then(() => {
      // Force topmost so the screenshot captures our window even when GHA
      // runners pre-launch File Explorer / Notepad windows over the tray area.
      mb.window?.setAlwaysOnTop(true, 'screen-saver');
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
