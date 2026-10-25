'use strict';

const path = require('node:path');
const { app, BrowserWindow, shell } = require('electron');

const AUTHOR = { name: 'Eli Linares', website: 'https://realact.net' };

let aboutWindow = null;

// A small custom About window, so it looks the same on every platform and
// the author's website link works (the native macOS panel has no links).
function showAbout(parent) {
  if (aboutWindow) {
    aboutWindow.focus();
    return;
  }
  aboutWindow = new BrowserWindow({
    width: 380,
    height: 460,
    resizable: false,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    autoHideMenuBar: true,
    title: `About ${app.name}`,
    parent: parent || undefined,
    show: false,
    backgroundColor: '#1a1530',
    icon: path.join(__dirname, '..', 'build', 'icon.png'),
    webPreferences: { contextIsolation: true, sandbox: true, nodeIntegration: false },
  });
  aboutWindow.setMenu(null);

  // The only link on the page is the author's website; open it in the browser.
  const openOutside = (url) => {
    if (url === AUTHOR.website || url === AUTHOR.website + '/') shell.openExternal(AUTHOR.website);
  };
  aboutWindow.webContents.setWindowOpenHandler(({ url }) => {
    openOutside(url);
    return { action: 'deny' };
  });
  aboutWindow.webContents.on('will-navigate', (event, url) => {
    event.preventDefault();
    openOutside(url);
  });

  aboutWindow.once('ready-to-show', () => aboutWindow.show());
  aboutWindow.on('closed', () => { aboutWindow = null; });
  aboutWindow.loadFile(path.join(__dirname, 'about.html'), {
    query: { version: app.getVersion(), electron: process.versions.electron, chrome: process.versions.chrome },
  });
}

module.exports = { AUTHOR, showAbout };
