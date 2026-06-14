// electron/main.cjs — Desktop shell for PNG Payroll Pro.
// The app is fully client-side (localStorage); Electron just hosts the built SPA.
const { app, BrowserWindow, shell, Menu } = require('electron');
const path = require('node:path');

const isDev = !app.isPackaged;
const DEV_URL = 'http://localhost:4700';

function createWindow() {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    backgroundColor: '#f4f7fb',
    title: 'PNG Payroll Pro',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (isDev) {
    win.loadURL(DEV_URL);
  } else {
    win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }

  // Open any external links (Buy licence, etc.) in the user's real browser.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http')) shell.openExternal(url);
    return { action: 'deny' };
  });
}

// Minimal app menu (keep Quit + edit shortcuts; hide dev cruft in production).
function buildMenu() {
  const template = [
    { role: 'fileMenu' },
    { role: 'editMenu' },
    ...(isDev ? [{ role: 'viewMenu' }] : []),
    { role: 'windowMenu' },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

app.whenReady().then(() => {
  buildMenu();
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
