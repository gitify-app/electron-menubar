const path = require('node:path');
const { menubar } = require('../../../lib/index.cjs');

const mb = menubar({
  index: `file://${path.join(__dirname, 'index.html')}`,
  preloadWindow: true,
  browserWindow: { width: 320, height: 240 },
});

globalThis.__menubar = mb;

mb.on('ready', () => {
  console.log('E2E:ready');
});
