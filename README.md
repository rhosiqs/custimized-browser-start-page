# Custom Browser Start Page

Open `index.html` in your browser and set it as your home page or new-tab replacement.

## Features

- Web search row: Bing by default, Google available.
- AI row: Google AI Mode by default, plus ChatGPT, Claude, and Gemini.
- Search suggestions from local history and Datamuse autocomplete.
- Shortcut matrix with favicon icons based on each shortcut URL.
- Bold local time and fixed global time panel.
- Settings drawer for theme, background, default engines, grid size, shortcuts, time zones, and import/export.
- **Inline Category Manager**: Styled category editor within the settings drawer to create, delete, reorder (via drag-and-drop), rename, and set default categories on load. Features drag handles, tag icons, star toggles, and trash buttons.
- **Inline Shortcut Editor & Arranger**: Toggle "Edit Shortcuts" directly on the page to edit shortcut titles/URLs, delete them, or rename/delete group tabs. When edit mode is active, shortcut tiles can be grabbed and dragged to reorder/arrange them directly within the grid in real-time.

## Local Development & Testing

To serve the start page locally:
1. Run `npm install` to install dependencies (a lightweight static `http-server`).
2. Run `npm run dev` to start the server.
3. Open `http://localhost:8080` in your browser.

*Note: The project remains entirely static. You can safely delete `package.json`, `package-lock.json`, and `node_modules` at any time, and the page will still function perfectly when opened directly in a browser.*

## Files

- `index.html`: page structure.
- `styles.css`: layout, dark/light themes, responsive styling.
- `app.js`: clocks, search routing, shortcuts, settings, and persistence.

## Notes

- **Desktop Layout Alignment**: The page header containing the local clock has been positioned absolutely on desktop viewports (widths > 720px) to prevent it from pushing the main content downwards. The top of the search stack and shortcuts panel now aligns with the top edge of the clock card by default.
- Settings are saved in browser `localStorage`.
- AI prompts are copied to the clipboard when possible before the target AI page opens.
- Google AI Mode uses the current `udm=50` Google Search URL pattern.
