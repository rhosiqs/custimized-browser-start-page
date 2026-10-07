# Architecture

## Shape

A Manifest V3 extension whose only surface is `chrome_url_overrides.newtab` → `newtab.html`. There is no background service worker and no content script. The page loads `src/main.js` as an ES module; every other module is imported from there. Extension CSP forbids inline scripts, so all behavior lives in `src/`.

```
newtab.html ─ main.js ─┬─ state.js ── storage.js ── chrome.storage.local
                       ├─ search.js
                       ├─ shortcuts.js ── shortcut-editor.js
                       ├─ dock.js ─────── settings.js ── import-review.js
                       └─ appearance.js
           (all UI modules use dom.js + widgets.js; all logic lives in core.js)
```

## Layers

- **`core.js`** — pure functions with no DOM or `chrome.*` access, so Node can test them. Owns the settings schema (`defaultSettings`), validation and repair (`normalizeSettings` returns `{ settings, report }`, which doubles as the import report), query routing, history, clock math (including the zone abbreviation table used for clock names and for adding clocks), merge and serialization.
- **`storage.js`** — reads/writes `startPage:settings` and `startPage:history` in `chrome.storage.local`, falling back to `localStorage` outside the extension. Loaded settings always pass through `normalizeSettings`.
- **`state.js`** — the single in-memory copy. Every mutation goes through `update()`, which clones, saves and notifies subscribers. `main.js` subscribes and re-renders.
- **UI modules** — build DOM with the `h()` helper. Blocks (clocks, search, shortcuts) are long-lived elements that re-render their own contents; the search block is built once so typed text and focus survive settings changes.

## Rendering and layout

The page reproduces the design canvas’s stage rule: the 1440×810 design is scaled with `transform: scale()` to fit the window, so the page never scrolls. Dialogs render inside the stage (not the browser top layer) so they scale with it; while one is open the rest of the stage is `inert`.

## Settings flow

- Quick edits (engine menu, shortcut popover, reorder, theme toggle) call `update()` directly.
- Shortcuts reorder by pointer drag (any mode; a press under 6 px stays a click) or arrow keys on the Edit-mode handle. Website icons try Chrome's favicon cache first (its generic globe is detected by pixel comparison and skipped), then the site's own `/favicon.ico` and `/apple-touch-icon.png`, then the letter. Launcher flyout links use the same `badge()`. A launcher button (`launcherMark`) shows by `iconMode`: `label`, `site` (the same icon walk for `iconUrl`, else the first link, on a light disc), `url` (an online image) or `upload`; a web icon that fails shows the label.
- The Settings dialog edits a draft; appearance previews live via `applyAppearance(draft)` and reverts on close. Save validates engines and launcher links, then commits once.
- Imports parse the file (`parseBackup`), normalize it into a report, and apply as **merge** (`mergeSettings`, starting from current settings; a shortcut or launcher in both takes the file's version, keeping its id and any links only on this device) or **replace** (starting from defaults). Export writes the saved settings object whole, so every format round-trips exactly.
- Other open new tabs pick up saved changes through `chrome.storage.onChanged`.

## Export format

JSON is canonical. YAML, TOML and text wrap the same JSON payload under a single key so every format round-trips exactly.

## Security notes

- User-entered destinations are normalized by `normalizeHttpUrl`; only `http:`/`https:` are stored or opened.
- User text is always inserted with text nodes; `innerHTML` is used only for the static SVG icon table in `dom.js`.
- Uploaded images are type- and size-checked and stored as data URLs (512 KB per shortcut or launcher icon, 3 MB background).
