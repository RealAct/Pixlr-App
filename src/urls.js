'use strict';

// Hosts that belong to Pixlr and should load inside the app window.
const PIXLR_HOST_SUFFIXES = ['pixlr.com', 'pixlr.app'];

// Hosts used by third-party sign-in and checkout flows. These open in an
// in-app child window so the popup can hand the result back to Pixlr.
const AUTH_HOST_SUFFIXES = [
  'accounts.google.com',
  'google.com',
  'gstatic.com',
  'facebook.com',
  'appleid.apple.com',
  'apple.com',
  'login.microsoftonline.com',
  'live.com',
  'paypal.com',
  'stripe.com',
  'checkout.stripe.com',
  'paddle.com',
  'chargebee.com',
];

function hostMatches(host, suffixes) {
  host = host.toLowerCase();
  return suffixes.some((s) => host === s || host.endsWith('.' + s));
}

function parse(url) {
  try {
    return new URL(url);
  } catch {
    return null;
  }
}

function isPixlrUrl(url) {
  const u = parse(url);
  return !!u && u.protocol === 'https:' && hostMatches(u.hostname, PIXLR_HOST_SUFFIXES);
}

function isAuthUrl(url) {
  const u = parse(url);
  return !!u && u.protocol === 'https:' && hostMatches(u.hostname, AUTH_HOST_SUFFIXES);
}

// Decide where a navigation or window.open target should go:
//   'app'      - load inside the Pixlr window
//   'popup'    - open in an in-app child window (sign-in, payments)
//   'internal' - blob:/data:/about: URLs Pixlr creates itself
//   'external' - hand off to the system browser / mail client
//   'deny'     - drop it (file:, javascript:, unknown schemes)
function classifyUrl(url) {
  const u = parse(url);
  if (!u) return 'deny';
  if (u.protocol === 'blob:' || u.protocol === 'data:' || url === 'about:blank') return 'internal';
  if (isPixlrUrl(url)) return 'app';
  if (isAuthUrl(url)) return 'popup';
  if (u.protocol === 'https:' || u.protocol === 'http:' || u.protocol === 'mailto:') return 'external';
  return 'deny';
}

module.exports = { classifyUrl, isPixlrUrl, isAuthUrl, hostMatches };
