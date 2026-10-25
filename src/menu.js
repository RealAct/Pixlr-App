'use strict';

const { app, Menu, shell, BrowserWindow } = require('electron');
const { APPS, HOME_URL, appUrl } = require('./apps');

const isMac = process.platform === 'darwin';

// On Windows and Linux, menu accelerators fire before the page sees the key.
// Pixlr has its own shortcuts for undo, copy, paste and so on, so those menu
// items only show their shortcut there and let the keystroke reach Pixlr.
// On macOS the page gets the key first, so registering them is safe.
const pageShortcut = { registerAccelerator: isMac };

function focusedContents() {
  const win = BrowserWindow.getFocusedWindow();
  return win ? win.webContents : null;
}

function buildMenu({ createWindow, openImages, showDownloads, showAbout }) {
  const go = (url) => {
    const wc = focusedContents();
    if (wc) wc.loadURL(url);
    else createWindow(url);
  };

  const appsMenu = APPS.map((a) => ({
    label: a.label,
    accelerator: a.accelerator,
    click: () => go(appUrl(a)),
  }));

  const template = [
    ...(isMac ? [{
      label: app.name,
      submenu: [
        { label: `About ${app.name}`, click: () => showAbout() },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' },
      ],
    }] : []),
    {
      label: 'File',
      submenu: [
        { label: 'New Window', accelerator: 'CmdOrCtrl+N', click: () => createWindow(HOME_URL) },
        { label: 'Open Image…', accelerator: 'CmdOrCtrl+O', click: () => openImages() },
        { type: 'separator' },
        { label: 'Show Downloads Folder', click: () => showDownloads() },
        { type: 'separator' },
        isMac ? { role: 'close' } : { role: 'quit' },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo', ...pageShortcut },
        { role: 'redo', ...pageShortcut },
        { type: 'separator' },
        { role: 'cut', ...pageShortcut },
        { role: 'copy', ...pageShortcut },
        { role: 'paste', ...pageShortcut },
        { role: 'delete' },
        { role: 'selectAll', ...pageShortcut },
      ],
    },
    {
      label: 'Apps',
      submenu: [
        ...appsMenu,
        { type: 'separator' },
        {
          label: 'Open in New Window',
          submenu: APPS.map((a) => ({ label: a.label, click: () => createWindow(appUrl(a)) })),
        },
      ],
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Back',
          accelerator: isMac ? 'Cmd+[' : 'Alt+Left',
          click: () => { const wc = focusedContents(); if (wc && wc.navigationHistory.canGoBack()) wc.navigationHistory.goBack(); },
        },
        {
          label: 'Forward',
          accelerator: isMac ? 'Cmd+]' : 'Alt+Right',
          click: () => { const wc = focusedContents(); if (wc && wc.navigationHistory.canGoForward()) wc.navigationHistory.goForward(); },
        },
        { role: 'reload' },
        { role: 'forceReload' },
        { type: 'separator' },
        // Plain Ctrl +/- belong to Pixlr's canvas zoom, so interface zoom uses Alt.
        { label: 'Zoom Interface In', accelerator: 'CmdOrCtrl+Alt+=', click: () => { const wc = focusedContents(); if (wc) wc.setZoomLevel(wc.getZoomLevel() + 0.5); } },
        { label: 'Zoom Interface Out', accelerator: 'CmdOrCtrl+Alt+-', click: () => { const wc = focusedContents(); if (wc) wc.setZoomLevel(wc.getZoomLevel() - 0.5); } },
        { label: 'Actual Size', accelerator: 'CmdOrCtrl+Alt+0', click: () => { const wc = focusedContents(); if (wc) wc.setZoomLevel(0); } },
        { type: 'separator' },
        { role: 'togglefullscreen' },
        { role: 'toggleDevTools' },
      ],
    },
    {
      role: 'window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        ...(isMac ? [{ type: 'separator' }, { role: 'front' }] : [{ role: 'close' }]),
      ],
    },
    {
      role: 'help',
      submenu: [
        { label: 'Pixlr Support', click: () => shell.openExternal('https://pixlr.com/support/') },
        { label: 'Open Current Page in Browser', click: () => { const wc = focusedContents(); if (wc && wc.getURL().startsWith('https://')) shell.openExternal(wc.getURL()); } },
        ...(isMac ? [] : [{ type: 'separator' }, { label: `About ${app.name}`, click: () => showAbout() }]),
      ],
    },
  ];

  return Menu.buildFromTemplate(template);
}

module.exports = { buildMenu };
