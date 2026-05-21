# Custom Browser Start Page

Open `index.html` in your browser and set it as your home page or new-tab replacement.

## Features

- Web search row: Bing by default, Google available.
- AI row: Google AI Mode by default, plus ChatGPT, Claude, and Gemini.
- Search suggestions from local history and Datamuse autocomplete.
- Shortcut matrix with favicon icons based on each shortcut URL.
- Bold local time and fixed global time panel.
- Settings drawer for theme, background, default engines, grid size, shortcuts, time zones, and import/export.

## Files

- `index.html`: page structure.
- `styles.css`: layout, dark/light themes, responsive styling.
- `app.js`: clocks, search routing, shortcuts, settings, and persistence.

## Notes

- Settings are saved in browser `localStorage`.
- AI prompts are copied to the clipboard when possible before the target AI page opens.
- Google AI Mode uses the current `udm=50` Google Search URL pattern.
