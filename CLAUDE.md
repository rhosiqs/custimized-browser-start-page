# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Chrome Manifest V3 extension that replaces the new tab page. Plain HTML/CSS/ES modules: no framework, no build step, no dependencies. `README.md` (features, privacy) and `ARCHITECTURE.md` (layers, data flow) are the references; keep both in sync with code changes. Both were written by Claude, so update them without asking.

## Commands

```sh
npm run verify                                             # syntax check (node --check) + manifest JSON + unit tests
npm test                                                   # unit tests only
node --test --test-name-pattern="clockParts" tests/core.test.js   # one test
npm run pack                                               # dist/start-page.zip
python3 -m http.server                                     # quick UI work: open /newtab.html (localStorage, letter icons)
```

To see real behavior (favicons, `chrome.storage`, new-tab focus), load the folder unpacked at `chrome://extensions`. Headless checks work with Playwright and `--load-extension`; open `chrome://newtab/` and then find the tab whose URL contains `newtab.html?focus`, because the first tab closes itself (see below).

## Architecture

- `src/core.js` holds all pure logic (no DOM, no `chrome.*`) and is the only file under unit test. Put testable logic there.
- `normalizeSettings` is the single gate for stored, imported and cross-tab settings. It returns `{ settings, report }`, and the report doubles as the import review.
- **Schema migrations:** `SCHEMA_VERSION` in `core.js` is separate from the release version. When a default changes and existing saves should follow it, bump `SCHEMA_VERSION` and add a version-gated migration in `normalizeSettings`, plus a test. Past examples are starter shortcut icons (v2), seconds on (v3) and default world clocks (v4).
- `state.js`: every mutation goes through `update()` (clone → save → notify). `main.js` re-renders on notify. The search block is built once, so typed text and focus survive re-renders.
- The page is a 1440×810 design scaled with `transform: scale()`, so it never scrolls. Dialogs render inside the stage. Pointer math must divide screen deltas by the scale (see `makeDraggable` in `shortcuts.js`).
- **New-tab focus:** Chrome keeps focus in the address bar on overridden new tabs. `main.js` reopens the page as `newtab.html?focus` and closes the original so the Web box gets the cursor.
- **Website icons** (`widgets.js` `badge`): tried in order, Chrome's `_favicon` cache (its generic globe is detected by pixel comparison and skipped), then the site's `/favicon.ico` and `/apple-touch-icon.png`, then the letter.
- Extension CSP forbids inline scripts. Insert user text as text nodes only; `innerHTML` is reserved for the static SVG icon table in `dom.js`.

## Design canvas

The UI is designed in the claude.ai Design canvas "Browser Start Page" (https://claude.ai/artifact/Y4T1hWCZDzq1DqBHYGwQi5): artboards `Main`, `Settings`, `ShortcutEditor` and `ImportReview` (`.dc.html`). Keep the canvas and the code in step:
- A change made in code that affects the UI also goes to the matching artboard.
- To apply canvas changes to code, read the latest artboards and diff them against the last published copy. The user edits the canvas by hand, so always re-read before publishing and merge their edits.

## Versioning and releases

- Version format is `vX.Y.Z`, tracked with annotated git tags on the release commit. Claude chooses and bumps the version.
- The `version` in `manifest.json` (the extension version) and in `package.json` must equal the tag without the `v`.
- Every version gets release notes: a section in `CHANGELOG.md`, with the same notes in the annotated tag message.
- One bug → one patch bump. Don't spread a single fix over several patch versions. New features or behavior changes bump the minor version.
- `plugin` is the main branch, and `archive/*` tags hold old lines (`archive/main` is the abandoned web version). Do work on a branch, and **ask the user before merging into or pushing `plugin`, or pushing tags**.
