const path = require('node:path');
const { nativeImage } = require('electron');
const { menubar } = require('../../../lib/index.cjs');

const SIZE = 22;
const buf = Buffer.alloc(SIZE * SIZE * 4);
for (let i = 0; i < buf.length; i += 4) {
  buf[i] = 255;
  buf[i + 1] = 0;
  buf[i + 2] = 255;
  buf[i + 3] = 255;
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
});
