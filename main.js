const {
  app,
  BrowserWindow,
  shell,
  Menu,
  Tray,
} = require('electron');
const path = require('path');
const child = require('child_process');

let win;
let tray;
let pyProc = null;

function createWindow() {
  win = new BrowserWindow({
    width: 290,
    height: 575,
  });

  win.loadURL('http://localhost:8058/');

  win.on('closed', () => {
    win = null;
  });
}

function openConfigFolder(file) {
  const configFile = path.join(app.getPath('appData'), 'micboard', file);
  shell.showItemInFolder(configFile);
}


const createPyProc = () => {
  const script = path.join(__dirname, 'dist', 'micboard-service').replace('app.asar', 'app.asar.unpacked');
  pyProc = child.spawn(script, [], {
    stdio: ['ignore', 'inherit', 'inherit'],
  });

  if (pyProc != null) {
    console.log('child process success');
  }
};

const exitPyProc = () => {
  pyProc.kill();
  pyProc = null;
};

function restartMicboardServer() {
  pyProc.kill();
  pyProc = null;
  setTimeout(createPyProc, 250);
}


app.on('ready', () => {
  const icon = path.join(__dirname, 'build', 'trayTemplate.png').replace('app.asar', 'app.asar.unpacked');
  tray = new Tray(icon);
  const contextMenu = Menu.buildFromTemplate([
    { label: 'About' },
    { type: 'separator' },
    { label: 'Launch Micboard', click() { shell.openExternal('http://localhost:8058'); } },
    { label: 'Edit Settings', click() { shell.openExternal('http://localhost:8058/?settings'); } },
    { label: 'Open Configuration Directory', click() { openConfigFolder('config.json'); } },
    { type: 'separator' },
    { label: 'Restart Micboard Server', click() { restartMicboardServer(); } },
    { type: 'separator' },
    { role: 'quit' },
  ]);
  tray.setToolTip('micboard');
  tray.setContextMenu(contextMenu);
});


app.on('ready', createPyProc);
app.on('will-quit', exitPyProc);
