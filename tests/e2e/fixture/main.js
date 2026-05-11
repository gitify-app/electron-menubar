const path = require('node:path');
const { globalShortcut, Menu } = require('electron');
const { menubar } = require('../../../lib/index.cjs');

const scenario = process.env.E2E_SCENARIO || 'default';

const options = {
  index: `file://${path.join(__dirname, 'index.html')}`,
  preloadWindow: true,
  browserWindow: { width: 320, height: 240 },
};

switch (scenario) {
  case 'hideOnClose':
    options.hideOnClose = true;
    break;
  case 'globalShortcut':
    options.globalShortcut = 'CmdOrCtrl+Alt+Shift+E';
    break;
  case 'contextMenu':
    options.contextMenu = Menu.buildFromTemplate([
      { label: 'First', type: 'normal' },
      { label: 'Second', type: 'normal' },
    ]);
    break;
}

const mb = menubar(options);
globalThis.__menubar = mb;
globalThis.__electron = { globalShortcut };

mb.on('ready', () => {
  console.log('E2E:ready');
});
