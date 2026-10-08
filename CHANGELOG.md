# Release notes

Each version matches the `version` in `manifest.json` and a `vX.Y.Z` git tag.

## v1.6.0 — 2026-10-08

### Changed
- Every color picker (Accent, background colors, shortcut and launcher colors) shows two base colors and a + button. The + opens a popup with the other preset colors and a field for any #HEX color. A color chosen there fills the + button.

### Added
- Custom #HEX colors for the accent and for shortcut and launcher colors. Their text color is picked for contrast; a custom accent looks the same in light and dark themes.

## v1.5.1 — 2026-10-08

### Changed
- Turning off the category row now hides the whole bar above the shortcuts, Edit and Add buttons and divider included, and the shortcuts move up into its place. Page arrows, when there is more than one page, sit at the bottom right. Turn the row back on to add shortcuts or use Edit mode.

## v1.5.0 — 2026-10-08

### Added
- Settings → Layout → Categories turns the category row above the shortcuts on or off. With it off, all shortcuts show.

### Changed
- A shortcut's category is optional. The editors offer "No category", and uncategorized shortcuts show under All.
- Settings lists (search engines, world clocks, launchers, launcher links, block order) reorder by dragging a grip handle instead of up and down arrow buttons. The arrow keys still move a focused handle.
- The launcher editor is shorter: labels sit beside their fields, the icon hint is one small line, Add link sits beside the Links heading, and Remove launcher is a trash button next to Close.

## v1.4.3 — 2026-10-08

### Changed
- A shortcut's edit button appears only when the pointer reaches the tile's top-right corner, instead of anywhere over the tile. Keyboard focus still shows it.
- The search boxes are shorter (46 px instead of 56 px, with smaller engine and Search buttons and tighter spacing), so they take less of the page.

## v1.4.2 — 2026-10-08

### Fixed
- Website icons that are a white logo (as Chrome saves them for sites like GitHub and ChatGPT after visiting in dark mode) no longer vanish on the white circle in light mode; they get a dark circle. Black logos get a light circle in dark mode.

## v1.4.1 — 2026-10-08

### Changed
- Fonts (Nunito, Noto Sans TC) ship with the extension instead of loading from Google Fonts on every new tab, so text renders in the right font offline and the page makes no font requests.

## v1.4.0 — 2026-10-08

### Added
- Launcher icons can be a website's icon or an image link from the web, besides the label or an uploaded image (Settings → Launchers → Edit → Icon). A website icon uses the first link when no address is given; if a web icon fails to load, the label shows.

### Changed
- Importing a backup with Merge now restores shortcuts and launchers you already have from the file (icons, images, colors and links), instead of keeping the current copy. Links only on this device stay. Replace still starts from a clean page.

## v1.3.2 — 2026-10-08

### Fixed
- World clocks all showed local time ("same time") since v1.2.0. Each clock shows its own zone's time again.

## v1.3.1 — 2026-10-08

### Fixed
- Searching the Master Journal List from the Academic box showed every journal instead of the matches. The site ignores `?search=`; the engine now uses `?issn=`, and saved settings with the old address switch over once.

## v1.3.0 — 2026-10-08

### Added
- Launcher icons can be an emoji (up to 3, kept whole) or an uploaded image that fills the button (Settings → Launchers → Edit → Image).

### Changed
- The shortcuts "Add" button is sand with dark text, so it stands apart from the accent-colored Search buttons and reads clearly.

## v1.2.0 — 2026-10-08

### Added
- Add a world clock by its abbreviation (PDT, EDT, CST, UTC, CET, JST…) in Settings → Clocks, without picking a city. The suggestions list the abbreviations too.

### Changed
- World clocks show just the zone abbreviation, such as "PDT" instead of "PACIFIC · PDT". It follows daylight saving (PDT ↔ PST), and now covers zones Intl leaves as "GMT+x", such as CEST, JST and AEDT.
- A clock's label is optional: type one to show it instead of the abbreviation, or clear it to go back. Untouched default clocks (UTC, Pacific, Eastern) drop their labels once.

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
