# Pixlr Desktop

An unofficial desktop client for the [pixlr.com](https://pixlr.com) suite on macOS, Windows and Linux. It runs Pixlr Editor, Express, Remove Background, the AI generators and the other Pixlr tools in their own app window, so you don't need to open a web browser.

> Pixlr Desktop is not made by or affiliated with Pixlr. "Pixlr" is a trademark of its owner.

## What it does

- **Every Pixlr app in one window.** The Apps menu switches between Editor (`Ctrl/Cmd+1`), Express (`2`), Remove Background (`3`), AI Image Generator (`4`), Photo Collage (`5`), Image Converter (`6`), AI Video Generator, Face Swap and Community. "Open in New Window" runs two apps side by side.
- **Native file handling.** File → Open Image… (`Ctrl/Cmd+O`) picks images from disk and hands them to Pixlr. You can also drag images onto the window, or set Pixlr Desktop as the "Open with" app for PNG, JPEG, WebP, GIF, BMP, SVG, TIFF, AVIF, HEIC, PSD and PXD files.
- **Native saving.** Exports and downloads open a system Save dialog that defaults to your Pictures folder, then remembers the last folder you used.
- **Stays signed in.** Your Pixlr session, settings and cache are kept in the app's own profile between launches. Google, Facebook, Apple and Microsoft sign-in, and checkout pages, open in a small in-app window.
- **Keeps your work.** If Pixlr warns about unsaved changes, the app asks before closing or reloading the page.
- **Pixlr's shortcuts win.** Undo, copy, paste and canvas zoom go to Pixlr. Interface zoom uses `Ctrl/Cmd+Alt+=` / `-` / `0`.
- Remembers window size and position, runs as a single instance, and opens links that leave Pixlr in your normal browser.

## Offline use

Pixlr's editors run on pixlr.com, and its AI tools run on Pixlr's servers, so **the app needs an internet connection**. It does not bundle or mirror Pixlr. Without a connection it shows a "Can't reach pixlr.com" page and reloads automatically once you're back online. Files you open and save stay on your computer; what Pixlr uploads for AI features is governed by Pixlr's own terms.

## Install

Download the build for your platform from the [Releases](../../releases) page, or from the artifacts of the latest **Build** workflow run:

| Platform | Files |
| --- | --- |
| macOS (Intel and Apple Silicon) | `.dmg`, `.zip` |
| Windows (x64 and ARM64) | `.exe` installer, portable `.exe` |
| Linux (x64) | `.AppImage`, `.deb`, `.tar.gz` |

Builds are unsigned until signing secrets are added (see below). On macOS, right-click the app and choose Open the first time. On Windows, choose "More info" then "Run anyway" in SmartScreen.

## Develop

Requires Node.js 22.

```sh
npm install
npm start          # run the app
npm test           # unit tests for link handling
npm run dist       # package for the current OS into dist/
npm run dist:mac   # or dist:win / dist:linux
```

macOS packages must be built on macOS. The GitHub Actions workflow in `.github/workflows/build.yml` builds all three platforms on every push and pull request, and publishes a GitHub Release when you push a `v*` tag.

### Code signing

Add these repository secrets and remove `CSC_IDENTITY_AUTO_DISCOVERY: false` from the workflow:

- `CSC_LINK`, `CSC_KEY_PASSWORD`: a base64 `.p12` certificate (Developer ID for macOS, Authenticode for Windows).
- `APPLE_ID`, `APPLE_APP_SPECIFIC_PASSWORD`, `APPLE_TEAM_ID`: for macOS notarization.

## Layout

| File | Purpose |
| --- | --- |
| `src/main.js` | Windows, session, permissions, downloads, file opening |
| `src/menu.js` | Native application menu |
| `src/apps.js` | The list of Pixlr apps in the Apps menu |
| `src/urls.js` | Decides which links stay in the app, open as sign-in popups, or go to the browser |
| `src/preload.js` | Passes files from the Open dialog to the Pixlr page |
| `src/files.js` | Supported image types and reading files from disk |
| `src/window-state.js` | Remembers window size and position |
| `src/offline.html` | Shown when pixlr.com can't be reached |

## Security

The Pixlr page runs sandboxed with context isolation and no Node.js access. The preload script only accepts files the user picked. Only `https://pixlr.com` pages get permissions such as clipboard and notifications; `file:`, `javascript:` and other schemes are blocked.
