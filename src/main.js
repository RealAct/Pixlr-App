'use strict';

const path = require('node:path');
const { app, BrowserWindow, Menu, dialog, ipcMain, session, shell, clipboard } = require('electron');
const { HOME_URL, APPS, appUrl } = require('./apps');
const { classifyUrl, isPixlrUrl } = require('./urls');
const { IMAGE_EXTENSIONS, imagePathsFromArgv, readImageFiles } = require('./files');
const windowState = require('./window-state');
const { buildMenu } = require('./menu');

const PARTITION = 'persist:pixlr';
const EDITOR_URL = appUrl(APPS.find((a) => a.id === 'editor'));
const OFFLINE_PAGE = path.join(__dirname, 'offline.html');

app.setName('Pixlr Desktop');
app.setAboutPanelOptions({
  applicationName: 'Pixlr Desktop',
  applicationVersion: app.getVersion(),
  credits: 'Unofficial desktop client for pixlr.com. Pixlr is a trademark of its owner.',
});

// Files opened before the first window exists (macOS "Open With", or files
// passed on the command line) wait here.
let pendingPaths = imagePathsFromArgv(process.argv.slice(1));
let lastDownloadDir = null;

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', (_event, argv) => {
    const win = mainWindow();
    if (win) {
      if (win.isMinimized()) win.restore();
      win.focus();
    }
    const paths = imagePathsFromArgv(argv.slice(1));
    if (paths.length) openPaths(paths);
  });
}

app.on('open-file', (event, filePath) => {
  event.preventDefault();
  if (app.isReady()) openPaths([filePath]);
  else pendingPaths.push(filePath);
});

function mainWindow() {
  return BrowserWindow.getFocusedWindow() || BrowserWindow.getAllWindows()[0] || null;
}

// Pixlr may treat Electron's default user agent as an unsupported browser,
// so present the underlying Chrome version only.
function chromeUserAgent() {
  return app.userAgentFallback.replace(/ (?:Electron|PixlrDesktop|Pixlr Desktop|pixlr-desktop)\/\S+/gi, '');
}

function configureSession() {
  const ses = session.fromPartition(PARTITION);
  ses.setUserAgent(chromeUserAgent());

  const allowed = new Set([
    'clipboard-read', 'clipboard-sanitized-write', 'notifications', 'fullscreen',
    'pointerLock', 'media', 'fileSystem', 'window-management', 'local-fonts',
  ]);
  ses.setPermissionRequestHandler((wc, permission, callback, details) => {
    callback(allowed.has(permission) && isPixlrUrl(details.requestingUrl || wc.getURL()));
  });
  ses.setPermissionCheckHandler((_wc, permission, origin) => allowed.has(permission) && isPixlrUrl(origin + '/'));

  // Exports and downloads go through a native Save dialog.
  ses.on('will-download', (_event, item) => {
    const dir = lastDownloadDir || app.getPath('pictures');
    item.setSaveDialogOptions({
      title: 'Save Image',
      defaultPath: path.join(dir, item.getFilename()),
    });
    item.once('done', (_e, state) => {
      if (state === 'completed') {
        lastDownloadDir = path.dirname(item.getSavePath());
        app.addRecentDocument(item.getSavePath());
      }
    });
  });
}

function showOffline(wc, url, error) {
  const query = { url: isPixlrUrl(url) ? url : HOME_URL, error: error || '' };
  wc.loadFile(OFFLINE_PAGE, { query });
}

function attachHandlers(win) {
  const wc = win.webContents;

  wc.setWindowOpenHandler(({ url }) => {
    switch (classifyUrl(url)) {
      case 'app':
        return { action: 'allow', overrideBrowserWindowOptions: windowOptions() };
      case 'popup':
        return {
          action: 'allow',
          overrideBrowserWindowOptions: { parent: win, width: 520, height: 720, autoHideMenuBar: true, webPreferences: { partition: PARTITION, sandbox: true, contextIsolation: true } },
        };
      case 'internal':
        return { action: 'allow', overrideBrowserWindowOptions: windowOptions() };
      case 'external':
        shell.openExternal(url);
        return { action: 'deny' };
      default:
        return { action: 'deny' };
    }
  });

  wc.on('did-create-window', (child) => {
    if (child.getParentWindow() !== win) attachHandlers(child);
    else child.webContents.on('will-navigate', guardNavigation);
  });

  wc.on('will-navigate', guardNavigation);
  wc.on('will-redirect', guardNavigation);

  // Pixlr warns before leaving a page with unsaved work. Electron drops
  // beforeunload prompts by default, so ask natively instead.
  wc.on('will-prevent-unload', (event) => {
    const choice = dialog.showMessageBoxSync(win, {
      type: 'question',
      buttons: ['Leave', 'Stay'],
      defaultId: 1,
      cancelId: 1,
      message: 'Leave this page?',
      detail: 'Changes you made may not be saved.',
    });
    if (choice === 0) event.preventDefault();
  });

  wc.on('did-fail-load', (_event, code, description, url, isMainFrame) => {
    // -3 is an aborted load, which happens on ordinary redirects.
    if (isMainFrame && code !== -3) showOffline(wc, url, `${description} (${code})`);
  });

  wc.on('context-menu', (_event, params) => {
    const items = [];
    if (params.isEditable) {
      items.push({ role: 'cut', enabled: params.editFlags.canCut }, { role: 'copy', enabled: params.editFlags.canCopy },
        { role: 'paste', enabled: params.editFlags.canPaste }, { type: 'separator' }, { role: 'selectAll' });
    } else if (params.selectionText) {
      items.push({ role: 'copy' });
    }
    if (params.mediaType === 'image' && params.srcURL) {
      items.push({ label: 'Save Image As…', click: () => wc.downloadURL(params.srcURL) },
        { label: 'Copy Image', click: () => wc.copyImageAt(params.x, params.y) });
    }
    if (params.linkURL && /^https?:/.test(params.linkURL)) {
      items.push({ label: 'Open Link in Browser', click: () => shell.openExternal(params.linkURL) },
        { label: 'Copy Link', click: () => clipboard.writeText(params.linkURL) });
    }
    if (items.length) Menu.buildFromTemplate(items).popup({ window: win });
  });
}

function guardNavigation(event, url) {
  const kind = classifyUrl(url);
  if (kind === 'app' || kind === 'popup' || kind === 'internal') return;
  event.preventDefault();
  if (kind === 'external') shell.openExternal(url);
}

function windowOptions() {
  return {
    width: 1280,
    height: 820,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: '#1c1f24',
    autoHideMenuBar: false,
    icon: path.join(__dirname, '..', 'build', 'icon.png'),
    webPreferences: {
      partition: PARTITION,
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
      spellcheck: false,
    },
  };
}

function createWindow(url = HOME_URL, { restoreState = false } = {}) {
  const opts = windowOptions();
  let state = null;
  if (restoreState) {
    state = windowState.load();
    Object.assign(opts, { width: state.width, height: state.height });
    if (state.x !== undefined) Object.assign(opts, { x: state.x, y: state.y });
  }
  const win = new BrowserWindow({ ...opts, show: false });
  if (restoreState) windowState.track(win);
  attachHandlers(win);
  win.once('ready-to-show', () => {
    if (state && state.maximized) win.maximize();
    win.show();
  });
  win.loadURL(url).catch(() => {});
  return win;
}

// Opens local images in Pixlr. If the current page isn't one that edits
// images, switch to the Editor first and wait for it to load.
async function openPaths(paths) {
  if (!paths.length) return;
  let win = mainWindow();
  if (!win) win = createWindow(EDITOR_URL);
  const wc = win.webContents;
  const files = await readImageFiles(paths);
  paths.forEach((p) => app.addRecentDocument(p));

  const current = wc.getURL();
  const onEditingPage = /^https:\/\/pixlr\.com\/(editor|express|remove-background|photo-collage|converter)\//.test(current);
  if (!onEditingPage || wc.isLoading()) {
    // A brand-new window has no URL yet but is already loading the Editor.
    const alreadyLoading = current === '' && wc.isLoading();
    if (!onEditingPage && !alreadyLoading) wc.loadURL(EDITOR_URL).catch(() => {});
    await new Promise((resolve) => wc.once('did-finish-load', resolve));
    // Give Pixlr's scripts time to set up their drop handlers.
    await new Promise((resolve) => setTimeout(resolve, 2500));
  }

  const handled = await new Promise((resolve) => {
    ipcMain.once('open-files-result', (_e, ok) => resolve(ok));
    wc.send('open-files', files);
    setTimeout(() => resolve(false), 5000);
  });
  if (!handled) {
    dialog.showMessageBox(win, {
      type: 'info',
      message: 'Pixlr is not ready for files yet',
      detail: 'Wait for the editor to finish loading, then try again. You can also drag images straight onto the window.',
    });
  }
}

async function openImages() {
  const win = mainWindow();
  const result = await dialog.showOpenDialog(win, {
    title: 'Open Image',
    properties: ['openFile', 'multiSelections'],
    filters: [{ name: 'Images', extensions: IMAGE_EXTENSIONS }, { name: 'All Files', extensions: ['*'] }],
  });
  if (!result.canceled) openPaths(result.filePaths);
}

function showDownloads() {
  shell.openPath(lastDownloadDir || app.getPath('pictures'));
}

app.whenReady().then(() => {
  configureSession();
  Menu.setApplicationMenu(buildMenu({ createWindow, openImages, showDownloads }));

  createWindow(pendingPaths.length ? EDITOR_URL : HOME_URL, { restoreState: true });
  if (pendingPaths.length) {
    const paths = pendingPaths;
    pendingPaths = [];
    openPaths(paths);
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow(HOME_URL, { restoreState: true });
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
