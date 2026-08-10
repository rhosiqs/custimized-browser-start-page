# Lightweight Browser Start Page

A fast, local-first browser start page built with plain HTML, CSS, and JavaScript. It combines smart search, customizable shortcuts, service launchers, clocks, and appearance controls without a framework, build step, or runtime dependency.

## Features

- Three smart input bars:
  - Web search with Bing, Google, or DuckDuckGo.
  - AI search with Google AI, ChatGPT, Claude, Gemini, Perplexity, or Grok.
  - DOI resolution for raw identifiers, `doi:` values, and `doi.org` URLs.
- Direct navigation when any input contains a valid HTTP(S) URL.
- Search suggestions from local history, built-in suggestions, and Datamuse, with keyboard navigation and offline fallback.
- User-managed shortcuts with categories, colors, favicon or initial fallbacks, drag-and-drop ordering, and an edit mode.
- A customizable launcher dock with editable service groups and links.
- Local time, date, and configurable world clocks.
- Light and dark themes, density and accent controls, solid/gradient/image backgrounds, and a desktop layout editor.
- Local settings persistence plus JSON, YAML, TOML, and plain-text import/export.
- Migration support for settings exported from the earlier V1 start page.
- Responsive layouts and keyboard-friendly interactions, including `/` to focus web search and `Escape` to close or discard the active overlay.

## Quick Start

No installation or build is required.

1. Clone or download this repository.
2. Open `index.html` in a modern browser.
3. Optionally configure the browser's home or startup page to use the local file or a URL served by any static file server.

All application code runs in the browser. Node.js is needed only to run the automated checks.

## Customization and Data

Open the settings drawer to configure appearance, search providers, clocks, shortcuts, launchers, and layout. Settings and query history are stored in browser `localStorage` under:

- `browser-start-page-v3:settings`
- `browser-start-page-v3:history`

Use the Data section to back up or restore settings in JSON, YAML, TOML, or plain text. Imported values are normalized before they are saved.

## Privacy and Network Access

Settings and search history remain in the browser unless you explicitly export them. The page makes network requests only when needed for:

- Datamuse search suggestions.
- Google-hosted favicons for shortcut and launcher icons.
- A remote background image, if you configure one.
- Navigation to a search provider, AI service, DOI resolver, shortcut, or launcher link.

User-entered destinations are restricted to HTTP(S); unsafe schemes such as `javascript:` and `data:` are rejected.

## Development

The project has no package dependencies. Use the included npm scripts to check syntax and run the Node.js test suite:

```sh
npm run verify
```

Individual commands are also available:

```sh
npm run check
npm test
```

The tests cover URL and DOI routing, query history, settings normalization, collection ordering, multi-format import/export, and V1 data migration.

## Project Structure

| Path | Purpose |
| --- | --- |
| `index.html` | Semantic page structure, settings panels, and editor dialogs. |
| `styles.css` | Theme tokens, responsive layout, components, and interaction states. |
| `core.js` | Pure routing, validation, normalization, migration, and serialization logic. |
| `app.js` | Browser state, rendering, persistence, events, and UI behavior. |
| `tests/core.test.js` | Node.js tests for the framework-independent core. |
| `package.json` | Syntax-check and test commands; no dependencies. |

## Design Goals

- Stay lightweight and immediately usable as a static page.
- Keep personal configuration local and portable.
- Make shortcuts and launchers fully user-managed.
- Fail safely when remote suggestions or favicons are unavailable.
