'use strict';

// Runs in an isolated world next to pixlr.com. It only receives files the
// user chose in the native Open dialog and hands them to the page the same
// way a drag-and-drop or file picker would.
const { ipcRenderer } = require('electron');

function toFiles(payload) {
  return payload.map((f) => new File([f.data], f.name, { type: f.type, lastModified: f.lastModified }));
}

function dropFiles(files) {
  const dt = new DataTransfer();
  files.forEach((f) => dt.items.add(f));
  const target = document.elementFromPoint(window.innerWidth / 2, window.innerHeight / 2) || document.body;
  const opts = { bubbles: true, cancelable: true, dataTransfer: dt, clientX: window.innerWidth / 2, clientY: window.innerHeight / 2 };
  target.dispatchEvent(new DragEvent('dragenter', opts));
  target.dispatchEvent(new DragEvent('dragover', opts));
  const drop = new DragEvent('drop', opts);
  target.dispatchEvent(drop);
  // A page that accepts a drop cancels the event.
  return drop.defaultPrevented;
}

function useFileInput(files) {
  const inputs = [...document.querySelectorAll('input[type=file]')];
  const input = inputs.find((i) => /image|\*/.test(i.accept || '*')) || inputs[0];
  if (!input) return false;
  const dt = new DataTransfer();
  (input.multiple ? files : files.slice(0, 1)).forEach((f) => dt.items.add(f));
  input.files = dt.files;
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
  return true;
}

ipcRenderer.on('open-files', (_event, payload) => {
  const files = toFiles(payload);
  const handled = dropFiles(files) || useFileInput(files);
  ipcRenderer.send('open-files-result', handled);
});
