# Custom Browser Start Page

A premium, static new-tab start page designed for fast navigation, time management, and search queries with local persistence. Open [index.html](file:///d:/01_Programs/06_BrowserStartPage/index.html) directly in your browser or serve it locally.

---

## 🚀 Version 0.1 (New Features)

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
  - Clean web search bar (Bing by default, Google available).
  - Search suggestions powered by local query history and Datamuse API autocomplete.
  - AI Mode toggles: Direct clipboard copying and navigation to ChatGPT, Claude, Gemini, or Google AI Mode (`udm=50`).
- **Shortcut Grid Matrix**: Dynamically loads website favicons from Google Favicon API with initials fallback if the icon fails to load.
- **Inline Category Manager**: Accessible via settings drawer to create, delete, reorder (via drag-and-drop handles), rename, and set default landing categories.
- **Local Persistence & Data Migration**: All configurations are stored securely in browser `localStorage`. Includes a settings panel with Import/Export JSON support.

---

## 🛠️ Local Development & Testing

To serve the start page locally:
1. Run `npm install` to install dependencies (installs a lightweight `http-server` package).
2. Run `npm run dev` to start the local static server.
3. Open `http://localhost:8080` in your web browser.

*Note: The project is entirely client-side. You can safely delete `package.json`, `package-lock.json`, and `node_modules` at any time, and open `index.html` directly in the browser.*

---

## 📂 Project Structure

- [index.html](file:///d:/01_Programs/06_BrowserStartPage/index.html) - Structural markup and modal/drawer layouts.
- [styles.css](file:///d:/01_Programs/06_BrowserStartPage/styles.css) - Layout, responsive designs, color tokens, and popover animations.
- [app.js](file:///d:/01_Programs/06_BrowserStartPage/app.js) - Search, local clock formatting, categories, shortcut reordering, settings state, and event bindings.
- [.gitignore](file:///d:/01_Programs/06_BrowserStartPage/.gitignore) - Prevents temporary logs, operating system metadata, and IDE folders from being uploaded.
