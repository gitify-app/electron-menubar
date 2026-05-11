const { app, Menu } = require('electron');

const { menubar } = require('../../');

app.on('ready', () => {
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Item1', type: 'radio' },
    { label: 'Item2', type: 'radio' },
    { label: 'Item3', type: 'radio', checked: true },
    { label: 'Item4', type: 'radio' },
    { type: 'separator' },
    { role: 'quit' },
  ]);

  // Pass `contextMenu` to menubar — it wires `setContextMenu` on Linux and
  // `popUpContextMenu` on right-click on macOS/Windows so left-click still
  // toggles the menubar window.
  const mb = menubar({ contextMenu });

  mb.on('ready', () => {
    console.log('Menubar app is ready.');
    // your app code here
  });
});
