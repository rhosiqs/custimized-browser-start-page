# Architecture

## Shape

A Manifest V3 extension whose only surface is `chrome_url_overrides.newtab` → `newtab.html`. There is no background service worker and no content script. The page loads `src/main.js` as an ES module; every other module is imported from there. Extension CSP forbids inline scripts, so all behavior lives in `src/`. Fonts are bundled in `fonts/` (`fonts.css` plus unicode-range woff2 slices), so the page makes no font requests.

```
newtab.html ─ main.js ─┬─ state.js ── storage.js ── chrome.storage.local
                       ├─ search.js
                       ├─ shortcuts.js ── shortcut-editor.js ── icon-picker.js
                       ├─ dock.js ─────── settings.js ── import-review.js
                       └─ appearance.js
           (all UI modules use dom.js + widgets.js; all logic lives in core.js)
```

## Layers

- **`core.js`** — pure functions with no DOM or `chrome.*` access, so Node can test them. Owns the settings schema (`defaultSettings`), validation and repair (`normalizeSettings` returns `{ settings, report }`, which doubles as the import report), query routing, history, clock math (including the zone abbreviation table used for clock names and for adding clocks), merge and serialization.
- **`storage.js`** — reads/writes `startPage:profiles`, each profile's settings, `startPage:shared` (items shown on all profiles) and `startPage:history` in `chrome.storage.local`, falling back to `localStorage` outside the extension. Loading joins the shared items into the profile's settings (`joinShared`) before `normalizeSettings`; saving splits them out again (`splitShared`). The profile list passes through `normalizeProfiles`.
- **`state.js`** — the single in-memory copy: the profile list, the active profile's settings and history. Every settings mutation goes through `update()`, which clones, saves to the active profile and notifies subscribers; profile actions (`switchProfile`, `createProfile`, `renameProfile`, `deleteProfile`) save the list and notify too. `main.js` subscribes and re-renders.
- **UI modules** — build DOM with the `h()` helper. Blocks (clocks, search, shortcuts) are long-lived elements that re-render their own contents; the search block is built once so typed text and focus survive settings changes.

## Rendering and layout

The page reproduces the design canvas’s stage rule: the 1440×810 design is scaled with `transform: scale()` to fit the window, so the page never scrolls. Dialogs render inside the stage (not the browser top layer) so they scale with it; while one is open the rest of the stage is `inert`. A new tab focuses the web search box, but Chrome keeps the caret in the address bar; `main.js` sets `page-focused` on the root only while the page has focus, and the search box ring needs it (or hover). `showModal({ nested: true })` stacks a dialog over the open one (the shortcut editor over Settings); any other dialog closes the stack first, and closing one closes those above it.

## Settings flow

- Quick edits (engine menu, shortcut popover, reorder, theme toggle) call `update()` directly.
- Every color picker is `colorChoice()` in `widgets.js` (`swatchPicker()` wraps it for shortcut and launcher swatches): the first two options, then a + that opens a popup with the rest and a #HEX field. Icon colors, and the accent, are a preset key or a custom `#rrggbb`; `colorOf()` in `core.js` resolves either to fill and text colors (`readableOn()` picks the text by contrast), and `applyAppearance` sets `--acc`/`--on-acc` inline for a custom accent.
- Settings lists (search engines, world clocks, launchers and their links, block order) reorder with `sortHandle()` in `widgets.js`: drag the grip on a `[data-sort-row]` row, or press the up and down arrow keys on it. The list change goes through the dialog's `change()`, and focus returns to the moved item's handle.
- With `layout.showCategories` off, `shortcuts.js` drops the whole head row (chips, pager, Edit, Add) and leaves Edit mode; `.shortcuts.no-head` keeps the row's height as bottom padding, so the grid moves up while the other blocks stay put, and a pager (if any) sits in that space.
- Shortcuts reorder by pointer drag (any mode; a press under 6 px stays a click) or arrow keys on the Edit-mode handle. Website icons try Chrome's favicon cache first (its generic globe is detected by pixel comparison and skipped), then the site's own `/favicon.ico` and `/apple-touch-icon.png`, then the letter. A loaded icon that is all white or all black on transparency (`iconTone` in `core.js`; Chrome caches dark-mode favicons such as GitHub's white one) sets `data-tone`, and the stylesheet puts it on a contrasting disc for the current theme. Cross-origin icons are read through a CORS probe and keep the plain disc when the site refuses. Launcher flyout links use the same `badge()`. A launcher button (`launcherMark`) shows its icon (see Icons): a site's logo (the same walk, for the icon's address or else the first link), an image or an upload fills the circle; a picture that fails shows the letters. The launcher color (`--fill`/`--fg` on `.launcher-face`, from `launcherFaceStyle`) shows only behind letters; a picture fills the circle with no background (`:has()` in the stylesheet, so a failed image that falls back to the letters gets its color back).
- Background colors are kept per theme (`background.light` and `background.dark`, each a solid color and gradient ends; the image is shared). `applyAppearance` uses the current theme's set, and an empty solid color ("Use theme color") follows the theme's `--bg`. The dark theme's default solid color is `#333333`. Saves from before schema v7 had one shared set; `normalizeSettings` moves a custom color to the theme it suits by luminance (`isDarkColor`). Schema v8 gives saves whose dark solid color was empty the new `#333333`.
- Settings › Shortcuts lists `draft.shortcuts`. Edit and Add open `openShortcutEditor` with that list and a `commit` callback, so the editor opens nested and changes the draft instead of saving; from the page it saves through `update()` as before.
- The Settings dialog edits a draft; appearance previews live via `applyAppearance(draft)` and reverts on close. Save validates engines and launcher links, then commits once.
- Imports parse the file (`parseBackup`), normalize it into a report, and apply as **merge** (`mergeSettings`, starting from current settings; a shortcut or launcher in both takes the file's version, keeping its id and any links only on this device) or **replace** (starting from defaults, but keeping the shortcuts and launchers shown on all profiles, `keepSharedFrom`). An import never changes what is shared: its items are read without the shared flag (`stripShared`). Export writes the saved settings object whole, so every format round-trips exactly.
- Other open new tabs pick up saved changes through `chrome.storage.onChanged`.

## Icons

Every configurable icon (shortcut, launcher, profile) is one icon object, normalized by `normalizeIcon` in `core.js`:

| kind | fields | shows |
| --- | --- | --- |
| `site` | `color`, `text`, `url` | the website's logo (`url` empty: the item's own address; launchers: first link) |
| `image` | `color`, `text`, `url` | an image from a web address |
| `upload` | `color`, `text`, `data` | an uploaded image (data URL) |
| `emoji` | `text` | an emoji or up to 3 characters on a plain disc |
| `color` | `color`, `letter`, `text` | a solid color, with the letter (`text`, else the name's first letter, `letterOf`) or none |
| `none` | | nothing (profiles only) |

`color` is a swatch key or `#rrggbb` and also sits behind the letter that shows when a picture can't load. A kind that lacks what it needs (an image without an address, an emoji without text) becomes a `color` icon.

The icon itself is the control: `iconButton()` wraps the badge, and a click opens `openIconPicker()` (`icon-picker.js`), a nested dialog with the six kinds, a color row and a live preview. Uploads are scaled to 128 px on the longer side by `readIconImage` (`dom.js`) and stored as WebP or PNG. The settings, shortcut editor and profile list have no separate icon fields.

Icons before schema v9 were a mode string plus separate `image`, `color`, `iconMode`, `iconUrl` and (launchers) `icon` label fields; `normalizeSettings` converts them by shape (`legacyShortcutIcon`, `legacyLauncherIcon`) and tests cover each mode.

## Items shown on all profiles

A shortcut or launcher with `shared: true` appears on every profile. Its content is stored once in `startPage:shared` (`{ shortcuts, launchers }`); each profile's own settings keep only a stub `{ id, shared: true }` at the item's place in that profile's order. The page always works with the joined view, so the rest of the code sees ordinary items with a `shared` flag.

- `splitShared(settings)` → `{ profile, shared }` is applied on every save; `joinShared(raw, shared)` is applied on every load, before `normalizeSettings`. A stub whose item is gone is dropped (so deleting a shared item removes it everywhere), a shared item without a stub is added at the end (so a new one appears in every profile), and a local item that is the same one (same id, or the same name and address; for launchers the same name) gives way, so a shared item is never lost to normalization.
- Editing a shared item edits the one copy. Turning "Show on all profiles" off removes it from the shared store, so it stays in the profile where it was turned off and disappears from the others. Deleting asks for confirmation.
- A new profile (blank or copy) shows the shared items. `storage.js` writes the shared store only when it changed. Another tab's change to it reloads the profile in use unless a dialog is open.
- Existing saves need no migration: nothing is shared until the user chooses it.

## Profiles

`startPage:profiles` holds `{ active, list: [{ id, name, icon? }] }`. A profile's icon is an icon object (see Icons), or nothing stored for the name's first letter on the neutral badge; `{ kind: 'none' }` leaves the dock button with the name only; `profileIcon` in `core.js` resolves it. Profiles saved by v1.9.1 (`icon: 'custom'` with `iconText`, or `'none'`) are converted by `normalizeProfiles`. Each profile's whole settings object lives under its own key (`profileSettingsKey` in `core.js`): the first profile, `default`, keeps `startPage:settings` from before profiles, so older saves need no migration, and the others use `startPage:settings:<id>`. A profile with nothing saved loads the defaults. History is shared.

- The dock's profile switcher (`dock.js`) switches profiles or adds one, then opens Settings › Profiles. Settings edits a draft of the active profile only; switching or adding a profile there (after the unsaved-changes check) reloads the draft from the new profile, and the dialog's kicker names it. Renaming, changing the icon (click it) and deleting apply at once; the profile in use can't be deleted, so one always remains.
- Export and import act on the active profile.
- Cross-tab sync: another tab's profile list change is followed, including its active profile, unless a dialog is open here (then this tab keeps the profile it is editing). Settings changes from other tabs apply only for the active profile.

## Export format

JSON is canonical. YAML, TOML and text wrap the same JSON payload under a single key so every format round-trips exactly.

## Security notes

- User-entered destinations are normalized by `normalizeHttpUrl`; only `http:`/`https:` are stored or opened.
- User text is always inserted with text nodes; `innerHTML` is used only for the static SVG icon table in `dom.js`.
- Uploaded images are type-checked, icon images are scaled to 128 px, and both are stored as data URLs (512 KB per icon, 3 MB background). `isImageDataUrl` accepts only a value that is entirely one base64 image data URL, so a stored image can't break out of the CSS `url("…")` in `appearance.js`, which also escapes it.
