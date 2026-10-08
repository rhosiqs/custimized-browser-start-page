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

To see real behavior (favicons, `chrome.storage`), load the folder unpacked at `chrome://extensions`. Headless checks work with Playwright and `--load-extension`; open `chrome://newtab/`.

## Architecture

- `src/core.js` holds all pure logic (no DOM, no `chrome.*`) and is the only file under unit test. Put testable logic there.
- `normalizeSettings` is the single gate for stored, imported and cross-tab settings. It returns `{ settings, report }`, and the report doubles as the import review.
- **Schema migrations:** `SCHEMA_VERSION` in `core.js` is separate from the release version. When a default changes and existing saves should follow it, bump `SCHEMA_VERSION` and add a version-gated migration in `normalizeSettings`, plus a test. Past examples are starter shortcut icons (v2), seconds on (v3), default world clocks (v4), unlabeled default clocks (v5), the Master Journal List `?issn=` URL (v6), the dark theme's `#333333` background (v8) and icon objects replacing the per-place icon fields (v9).
- `state.js`: every mutation goes through `update()` (clone → save → notify). `main.js` re-renders on notify. The search block is built once, so typed text and focus survive re-renders.
- The page is a 1440×810 design scaled with `transform: scale()`, so it never scrolls. Dialogs render inside the stage. Pointer math must divide screen deltas by the scale (see `makeDraggable` in `shortcuts.js`).
- **New-tab focus:** Chrome keeps the cursor in the address bar on overridden new tabs, and that is intended. v1.1.0 reopened the page as an ordinary tab to move the cursor into web search, but Chrome then shows the extension URL in the address bar, so v1.1.1 removed it. Don't bring it back.
- **Website icons** (`widgets.js` `badge`): tried in order, Chrome's `_favicon` cache (its generic globe is detected by pixel comparison and skipped), then the site's `/favicon.ico` and `/apple-touch-icon.png`, then the letter.
- Extension CSP forbids inline scripts. Insert user text as text nodes only; `innerHTML` is reserved for the static SVG icon table in `dom.js`.

## Design canvas

The UI is designed in the claude.ai Design canvas "Browser Start Page" (https://claude.ai/artifact/Y4T1hWCZDzq1DqBHYGwQi5): artboards `Main`, `Settings`, `ShortcutEditor` and `ImportReview` (`.dc.html`). Keep the canvas and the code in step:
- A change made in code that affects the UI also goes to the matching artboard.
- To apply canvas changes to code, read the latest artboards and diff them against the last published copy. The user edits the canvas by hand, so always re-read before publishing and merge their edits.

## Versioning and releases

- Version format is `vX.Y.Z`, tracked with annotated git tags on the release commit. Claude chooses and bumps the version.
- Release tags go only on commits in `plugin`: merge the release branch into `plugin` first, then tag (the old `v0.1.0` stays on the archived web line).
- The `version` in `manifest.json` (the extension version) and in `package.json` must equal the tag without the `v`.
- The version badge at the top of `README.md` must show the new tag on every release.
- Every version gets release notes: a section in `CHANGELOG.md`, with the same notes in the annotated tag message.
- One bug → one patch bump. Don't spread a single fix over several patch versions. New features or behavior changes bump the minor version.
- `plugin` is the main branch, and `archive/*` tags hold old lines (`archive/main` is the abandoned web version). Do work on a branch, and **ask the user before merging into or pushing `plugin`, or pushing tags**.
