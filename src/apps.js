'use strict';

// The Pixlr apps exposed in the "Apps" menu. Paths are relative to HOME_URL.
const HOME_URL = 'https://pixlr.com/';

const APPS = [
  { id: 'home', label: 'Pixlr Home', path: '/', accelerator: 'CmdOrCtrl+Shift+H' },
  { id: 'editor', label: 'Pixlr Editor', path: '/editor/', accelerator: 'CmdOrCtrl+1' },
  { id: 'express', label: 'Pixlr Express', path: '/express/', accelerator: 'CmdOrCtrl+2' },
  { id: 'remove-background', label: 'Remove Background', path: '/remove-background/', accelerator: 'CmdOrCtrl+3' },
  { id: 'image-generator', label: 'AI Image Generator', path: '/image-generator/', accelerator: 'CmdOrCtrl+4' },
  { id: 'photo-collage', label: 'Photo Collage', path: '/photo-collage/', accelerator: 'CmdOrCtrl+5' },
  { id: 'converter', label: 'Image Converter', path: '/converter/', accelerator: 'CmdOrCtrl+6' },
  { id: 'video-generator', label: 'AI Video Generator', path: '/video-generator/' },
  { id: 'face-swap', label: 'Face Swap', path: '/face-swap/' },
  { id: 'community', label: 'Community', path: '/community/' },
];

function appUrl(app) {
  return new URL(app.path, HOME_URL).toString();
}

module.exports = { HOME_URL, APPS, appUrl };
