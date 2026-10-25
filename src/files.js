'use strict';

const fs = require('node:fs');
const path = require('node:path');

const MIME_TYPES = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.bmp': 'image/bmp',
  '.svg': 'image/svg+xml',
  '.tif': 'image/tiff',
  '.tiff': 'image/tiff',
  '.avif': 'image/avif',
  '.heic': 'image/heic',
  '.psd': 'image/vnd.adobe.photoshop',
  '.pxd': 'application/octet-stream',
};

const IMAGE_EXTENSIONS = Object.keys(MIME_TYPES).map((e) => e.slice(1));

function isSupportedImage(filePath) {
  return Object.prototype.hasOwnProperty.call(MIME_TYPES, path.extname(filePath).toLowerCase());
}

// Picks image files out of a command line (used for "Open with" and for
// files dropped on the app icon on Windows and Linux).
function imagePathsFromArgv(argv) {
  return argv.filter((arg) => {
    if (!arg || arg.startsWith('-') || !isSupportedImage(arg)) return false;
    try {
      return fs.statSync(arg).isFile();
    } catch {
      return false;
    }
  }).map((p) => path.resolve(p));
}

// Reads files into plain objects that can be sent over IPC and rebuilt as
// File objects in the page.
async function readImageFiles(paths) {
  return Promise.all(paths.map(async (p) => ({
    name: path.basename(p),
    type: MIME_TYPES[path.extname(p).toLowerCase()] || 'application/octet-stream',
    lastModified: (await fs.promises.stat(p)).mtimeMs,
    data: await fs.promises.readFile(p),
  })));
}

module.exports = { IMAGE_EXTENSIONS, isSupportedImage, imagePathsFromArgv, readImageFiles };
