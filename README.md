# Start Page — Chrome New Tab Extension

A Chrome extension (Manifest V3) that replaces the new tab page with a calm, local-first start page: clocks, three smart search boxes, shortcuts, and a launcher dock. Plain HTML, CSS and JavaScript modules — no framework, no build step.

## Features

- **Clocks** — local time (12- or 24-hour; seconds shown smaller, on by default) and date plus configurable world clocks (UTC, Pacific and Eastern by default) with live zone names such as PDT/PST, day and offset (“Tomorrow · +1h”).
- **Three search boxes** — Web, AI and Academic, each with its own engine list and default. Any box opens `http(s)` links directly and sends DOIs (`10.x/…`, `doi:…`, `doi.org/…`) to doi.org; other schemes such as `javascript:` are blocked.
- **Suggestions** — recent queries from local history, plus web suggestions (Datamuse) in the Web box. ↑ ↓ to move, Enter to choose, Esc to close.
- **Shortcuts** — category filter chips, paging (rows × per row), drag any tile to reorder, a quick-edit popover on each tile (with delete), a full editor (website icon, letter, or uploaded image), and an Edit mode with remove buttons and arrow-key reordering.
- **Launcher dock** — groups of links that preview on hover or focus and pin open on click.
- **Appearance** — light, dark or system theme; green, brown or ink accent; solid, gradient or image background.
- **Data** — export to JSON, YAML, TOML or text; imports are reviewed (fixed, skipped, merge or replace) before anything changes.
- Keyboard: `/` focuses web search; `Esc` closes menus and dialogs; Ctrl/⌘ + Enter or click opens in a new tab.

## Install (unpacked)

1. Open `chrome://extensions` and turn on **Developer mode**.
2. Click **Load unpacked** and select this folder (the one containing `manifest.json`).
3. Open a new tab. Chrome may ask once whether to keep the page changed by the extension — choose **Keep it**.

To update after pulling changes, click the reload icon on the extension card. Chrome 104 or later is required.

To build a zip for the Chrome Web Store or sharing:

```sh
npm run pack   # writes dist/start-page.zip
```

## Privacy and network access

Settings and search history are stored in `chrome.storage.local` on this device and leave it only when you export them. Permissions:

- `storage` — save settings and history.
- `favicon` — show website icons from Chrome’s local favicon cache (no request to Google). When Chrome has no icon for a site yet, the page tries that site’s own `/favicon.ico` and `/apple-touch-icon.png`, then shows a letter.

Network requests happen only for Datamuse suggestions in the Web box, the Google Fonts stylesheet (Nunito, Noto Sans TC), icon files from your shortcut sites (as above), and the destinations you open.

## Development

No dependencies. Node.js is needed only for the checks:

```sh
npm run verify   # syntax check + unit tests
```

The tests cover URL/DOI routing, engine templates, history, clocks, settings normalization and import reporting, merge, and every export format.

For quick UI work outside the extension, serve the folder (`python3 -m http.server`) and open `newtab.html`; settings then fall back to `localStorage` and website icons fall back to letters.

## Project structure

| Path | Purpose |
| --- | --- |
| `manifest.json` | Extension manifest: new tab override, permissions, icons. |
| `newtab.html` | Page shell: stage, main column, footer, dock. |
| `styles/newtab.css` | Design tokens (light/dark, accents) and all component styles. |
| `src/main.js` | Entry: loads settings, renders blocks, stage scaling, page-wide keys, cross-tab sync. |
| `src/core.js` | Pure logic: routing, validation, normalization, merge, import/export. |
| `src/storage.js` | `chrome.storage.local` (or `localStorage`) persistence and favicon URLs. |
| `src/state.js` | In-memory settings/history store with save-and-notify updates. |
| `src/search.js`, `src/shortcuts.js`, `src/dock.js` | Main page blocks. |
| `src/shortcut-editor.js`, `src/settings.js`, `src/import-review.js` | Dialogs. |
| `src/dom.js`, `src/widgets.js`, `src/appearance.js` | DOM helpers, shared widgets, theme application. |
| `icons/` | Extension icons. |
| `tests/core.test.js` | Node tests for `src/core.js`. |
