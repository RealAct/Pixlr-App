'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { app, screen } = require('electron');

const DEFAULTS = { width: 1440, height: 900, maximized: false };

function stateFile() {
  return path.join(app.getPath('userData'), 'window-state.json');
}

function isVisible(bounds) {
  return screen.getAllDisplays().some(({ workArea: a }) =>
    bounds.x < a.x + a.width && bounds.x + bounds.width > a.x &&
    bounds.y < a.y + a.height && bounds.y + bounds.height > a.y);
}

function load() {
  try {
    const state = JSON.parse(fs.readFileSync(stateFile(), 'utf8'));
    if (state.x !== undefined && !isVisible(state)) {
      delete state.x;
      delete state.y;
    }
    return { ...DEFAULTS, ...state };
  } catch {
    return { ...DEFAULTS };
  }
}

// Saves the window's size and position when it closes, so the next launch
// opens where the user left it.
function track(win) {
  win.on('close', () => {
    const state = { ...win.getNormalBounds(), maximized: win.isMaximized() };
    try {
      fs.writeFileSync(stateFile(), JSON.stringify(state));
    } catch {
      // Not worth interrupting a close over.
    }
  });
}

module.exports = { load, track };
