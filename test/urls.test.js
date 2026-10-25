'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { classifyUrl } = require('../src/urls');
const { APPS, appUrl } = require('../src/apps');

test('pixlr pages stay in the app', () => {
  assert.strictEqual(classifyUrl('https://pixlr.com/editor/'), 'app');
  assert.strictEqual(classifyUrl('https://static.pixlr.com/x.js'), 'app');
});

test('lookalike hosts are not treated as pixlr', () => {
  assert.strictEqual(classifyUrl('https://pixlr.com.evil.example/'), 'external');
  assert.strictEqual(classifyUrl('https://notpixlr.com/'), 'external');
  assert.strictEqual(classifyUrl('http://pixlr.com/'), 'external');
});

test('sign-in providers open as in-app popups', () => {
  assert.strictEqual(classifyUrl('https://accounts.google.com/o/oauth2/auth'), 'popup');
  assert.strictEqual(classifyUrl('https://appleid.apple.com/auth/authorize'), 'popup');
  assert.strictEqual(classifyUrl('https://www.facebook.com/dialog/oauth'), 'popup');
});

test('other links go to the system browser', () => {
  assert.strictEqual(classifyUrl('https://example.com/'), 'external');
  assert.strictEqual(classifyUrl('mailto:hi@example.com'), 'external');
});

test('dangerous or local schemes are denied', () => {
  assert.strictEqual(classifyUrl('file:///etc/passwd'), 'deny');
  assert.strictEqual(classifyUrl('javascript:alert(1)'), 'deny');
  assert.strictEqual(classifyUrl('not a url'), 'deny');
});

test('blob and data urls are internal', () => {
  assert.strictEqual(classifyUrl('blob:https://pixlr.com/abc'), 'internal');
  assert.strictEqual(classifyUrl('data:image/png;base64,AAAA'), 'internal');
});

test('every app url points at pixlr', () => {
  for (const app of APPS) assert.strictEqual(classifyUrl(appUrl(app)), 'app', app.id);
});
