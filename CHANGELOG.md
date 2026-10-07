# Release notes

Each version matches the `version` in `manifest.json` and a `vX.Y.Z` git tag.

## v1.1.1 — 2026-10-08

### Fixed
- A new tab showed the extension's address (`chrome-extension://…/newtab.html?focus`) in the address bar. The cursor stays in the address bar again, as Chrome intends for new tabs; click the Web box to search there.
- Launcher flyout links showed only a letter. They now show the website's icon, like shortcuts.

## v1.1.0 — 2026-10-08

### Added
- Drag any shortcut tile to reorder it, in normal view or Edit mode.
- Delete a shortcut from its quick-edit (pencil) popover.
- 12- or 24-hour clock setting (Settings → Clocks). In 12-hour mode the main clock shows AM over PM on its left.
- World clocks show the live zone name, such as PDT/PST or EDT/EST.
- A new tab opens with the cursor in the Web search box.

### Changed
- Seconds show by default, smaller than the hours and minutes.
- Date reads "Wednesday, October 7, 2026".
- Default world clocks are UTC, Pacific and Eastern. Saved settings that still hold the old Tokyo/London/New York list switch over once.
- Starter shortcuts use website icons instead of letters.
- The color strip moved to the bottom of the page.
- Smaller category chips and Edit/Add buttons. The "Shortcuts" heading and the footer are gone; Import and Export stay in Settings → Data.

### Fixed
- Edit-mode drag reordering never started.
- Website icons showed Chrome's generic globe for unvisited sites. They now fall back to the site's own icon files, then a letter.

## v1.0.0 — 2026-10-07

First Chrome extension release, built from the design canvas: clocks, web/AI/academic search with suggestions, shortcuts with quick edit and reordering, launcher dock, Settings, and reviewed import/export.

## v0.1.0 — 2026-05-25

The simple web version (before the extension; archived).
