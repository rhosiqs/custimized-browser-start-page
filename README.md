# Custom Browser Start Page

A premium, static new-tab start page designed for fast navigation, time management, and search queries with local persistence. Open [index.html](file:///d:/01_Programs/06_BrowserStartPage/index.html) directly in your browser or serve it locally.

## 🚀 Version 0.5.0 (Address Bar Autocomplete & Website Prediction)

- **Address bar website prediction**: As you type in the address bar (e.g. `goo`), it suggests matching domains using a dropdown list.
- **Deduplicated search sources**: Matches are gathered and prioritized from:
  1. Address navigation history (saved locally).
  2. Shortcut domains (automatically extracted from your shortcut list).
  3. Default popular domains (such as `google.com`, `github.com`, `youtube.com`).
- **Enter key autocomplete integration**: Pressing Enter in the address input automatically navigates to the top predicted matching website if a prefix match is found.
- **Unified suggestion styling**: Leverages the existing modern search suggestions styling with custom navigation history indicators.

## 🚀 Version 0.4.0 (Bug Fixes & Refinements)

- **Search clipboard copy opt-in**: Added a new setting "Copy search query" under Search settings (defaults to Off) to prevent silently overwriting the user's clipboard.
- **Filter empty toolbar tabs**: Categorized tabs in the shortcut toolbar are now filtered so that empty groups/categories do not appear.
- **Shortcut URL validation**: Added validation feedback with an error toast when trying to save a shortcut with an empty URL.
- **Eliminated redundant category manager calls**: Removed duplicate UI re-render calls when renaming, deleting, or setting a default category.
- **Improved settings event handling**: Differentiated event listeners for input fields and dropdown menus in the settings drawer to avoid duplicate logic execution on select dropdowns.

## 🚀 Version 0.3.0 (Default Settings Update)

- **Clock default format**: Updated the default clock layout format from 24-hour to **12-hour**.
- **Shortcut groups**: Cleaned up default categories; kept only "All" and **"Work"**. Any other groups are removed from the default configurations.
- **Empty defaults**: Configured shortcuts to be empty by default so users can start with a clean page.
- **Port config**: Set local dev server port to **8400** to bypass Windows TCP exclusion port restrictions.

---

## 🚀 Version 0.2.0 (New Engines & Integrations)

- **Added Perplexity & Grok Integration**:
  - Configured custom query routing parameters for both platforms (`https://www.perplexity.ai/?q={query}` and `https://grok.com/?q={query}`).
  - Added new default shortcuts to the homepage search and tools panel with custom brand-colored tiles (Teal for Perplexity, Charcoal Gray for Grok).
  - Integrated local suggestions for both services into the predictive autocomplete system (e.g., `grok vs chatgpt`, `perplexity search`).
- **Added DuckDuckGo Search Engine**:
  - Integrated DuckDuckGo query routing (`https://duckduckgo.com/?q={query}`) under the primary Web Search stack.
  - Added a new brand-colored shortcut tile for DuckDuckGo (Orange, `#de5833`) inside the tools matrix.
  - Extended suggestion query auto-completions with DuckDuckGo-related lookup items.

---

## 🚀 Version 0.1.0 (New Features)

This release focuses on bringing shortcut management and interface alignment directly to the main screen, bypassing the settings panel for a faster, more intuitive experience:

### 1. Inline Shortcut Editor
- **How to use**: Click the **Edit Shortcuts** toggle button located at the top-right of the shortcut panel.
- **Features**:
  - Displays a **pen (edit) icon** ✏️ on each shortcut tile. Clicking it opens an inline modal popover to rename the shortcut, edit the URL, or move it to a different group.
  - Adds a **Delete** option directly inside the popover to quickly remove unwanted shortcuts.
  - Click outside the popover, click the close button, or press `Escape` to close the editor.

### 2. Real-Time Drag & Arrange (Pan & Reorder)
- **How to use**: While in **Edit Shortcuts** mode, grab any shortcut tile and drag it to a new position.
- **Features**:
  - Supports arranging tiles across **all group tabs** (reordering updates the master list index).
  - Hovering over a tile displays a `grab` cursor; dragging changes it to `grabbing`.
  - Supports pointer events for touch-enabled devices (with built-in ignore rules for the edit button to prevent misclicks).

### 3. Inline Group Tab Rename & Delete
- **How to use**: In **Edit Shortcuts** mode, group tabs (except "All") display a small pen icon. Clicking it opens a Group Rename Popover.
- **Features**:
  - Rename custom shortcut groups on the fly.
  - Delete a group directly from the tab bar (shortcuts inside the deleted group will automatically fall back to the default group).

### 4. Dynamic Adaptive Clock Layout
- **Features**:
  - Leverages CSS `:has()` selectors to automatically add padding on the left when **AM/PM** is active (12H format) and on the right when **seconds** are active.
  - Prevents the AM/PM suffix from overlapping the time digits.
  - Automatically collapses padding to `0` when running in 24-hour format or with seconds hidden, keeping the card neat and symmetrical.

---

## 🎨 Core Features

- **Dynamic Clock & Date**: Large, bold local time and date with optional seconds display.
- **World Time Zones**: A side-panel listing global clocks showing configured GMT time zones.
- **Unified Search Stack**:
  - Clean web search bar (Bing by default, Google and DuckDuckGo available).
  - Search suggestions powered by local query history and Datamuse API autocomplete.
  - AI Mode toggles: Direct clipboard copying and navigation to ChatGPT, Claude, Gemini, Perplexity, Grok, or Google AI Mode (`udm=50`).
- **Shortcut Grid Matrix**: Dynamically loads website favicons from Google Favicon API with initials fallback if the icon fails to load.
- **Inline Category Manager**: Accessible via settings drawer to create, delete, reorder (via drag-and-drop handles), rename, and set default landing categories.
- **Local Persistence & Data Migration**: All configurations are stored securely in browser `localStorage`. Includes a settings panel with multi-format Import/Export support (JSON, YAML, TOML, Plain Text) with file download, clipboard copy, and file upload options.

---

## 🔄 Multi-Format Settings Export / Import (New)

The **Data** section in Settings now supports exporting and importing your configuration in multiple formats:

### Supported Formats
| Format | Extension | Description |
|--------|-----------|-------------|
| **JSON** | `.json` | Standard structured format (default) |
| **YAML** | `.yaml` | Human-readable hierarchical format |
| **TOML** | `.toml` | Configuration-focused format |
| **Plain Text** | `.txt` | Simple `key = value` dot-notation format |

### Export Options
- **Save File**: Downloads settings as a file (e.g., `start-page-settings.json`)
- **Copy**: Copies serialized settings to clipboard and previews in the textarea

### Import Options
- **Load File**: Opens a file picker to select a settings file from disk
- **Paste & Import**: Reads from the textarea (paste your settings there first)

### Notes
- All formats pass through `normalizeSettings()` on import, ensuring safe defaults for missing or invalid values.
- YAML and TOML serialization is implemented from scratch (no external dependencies) and handles the settings object's flat and shallow-nested structure.

---

## 🛠️ Local Development & Testing

To serve the start page locally:
1. Run `npm install` to install dependencies (installs a lightweight `http-server` package).
2. Run `npm run dev` to start the local static server.
3. Open `http://127.0.0.1:8400` in your web browser.

*Note: The project is entirely client-side. You can safely delete `package.json`, `package-lock.json`, and `node_modules` at any time, and open `index.html` directly in the browser.*

---

## 📂 Project Structure

- [index.html](file:///d:/01_Programs/06_BrowserStartPage/index.html) - Structural markup and modal/drawer layouts.
- [styles.css](file:///d:/01_Programs/06_BrowserStartPage/styles.css) - Layout, responsive designs, color tokens, and popover animations.
- [app.js](file:///d:/01_Programs/06_BrowserStartPage/app.js) - Search, local clock formatting, categories, shortcut reordering, settings state, and event bindings.
- [.gitignore](file:///d:/01_Programs/06_BrowserStartPage/.gitignore) - Prevents temporary logs, operating system metadata, and IDE folders from being uploaded.


> All the content are generated by AI