(function initializeCore(globalScope) {
  "use strict";

  const SETTINGS_STORAGE_KEY = "browser-start-page-v3:settings";
  const HISTORY_STORAGE_KEY = "browser-start-page-v3:history";
  const HISTORY_LIMIT = 30;
  const SUGGESTION_LIMIT = 8;

  const WEB_ENGINES = Object.freeze({
    bing: {
      label: "Bing",
      searchUrl: "https://www.bing.com/search?q={query}"
    },
    google: {
      label: "Google",
      searchUrl: "https://www.google.com/search?q={query}"
    },
    duckduckgo: {
      label: "DuckDuckGo",
      searchUrl: "https://duckduckgo.com/?q={query}"
    }
  });

  const AI_ENGINES = Object.freeze({
    googleAi: {
      label: "Google AI",
      searchUrl: "https://www.google.com/search?udm=50&q={query}"
    },
    chatgpt: {
      label: "ChatGPT",
      searchUrl: "https://chatgpt.com/?q={query}"
    },
    claude: {
      label: "Claude",
      searchUrl: "https://claude.ai/new?q={query}"
    },
    gemini: {
      label: "Gemini",
      searchUrl: "https://gemini.google.com/app?q={query}"
    },
    perplexity: {
      label: "Perplexity",
      searchUrl: "https://www.perplexity.ai/search?q={query}"
    },
    grok: {
      label: "Grok",
      searchUrl: "https://grok.com/?q={query}"
    }
  });

  const TIME_ZONES = Object.freeze([
    "Pacific/Honolulu",
    "America/Los_Angeles",
    "America/Denver",
    "America/Chicago",
    "America/New_York",
    "America/Sao_Paulo",
    "Atlantic/Reykjavik",
    "Europe/London",
    "Europe/Paris",
    "Europe/Berlin",
    "Europe/Moscow",
    "Asia/Dubai",
    "Asia/Kolkata",
    "Asia/Bangkok",
    "Asia/Shanghai",
    "Asia/Taipei",
    "Asia/Tokyo",
    "Australia/Sydney"
  ]);

  const LOCAL_SUGGESTIONS = Object.freeze([
    "weather today",
    "news today",
    "translate english to chinese",
    "time zone converter",
    "currency converter",
    "google maps",
    "github actions",
    "javascript documentation",
    "css grid guide",
    "open source projects",
    "research paper search",
    "chatgpt prompts",
    "claude ai",
    "gemini ai",
    "perplexity search",
    "grok ai"
  ]);

  const DEFAULT_LAUNCHERS = Object.freeze([
    {
      id: "launcher-google",
      name: "Google",
      icon: "G",
      color: "#4285f4",
      order: 0,
      links: [
        { id: "google-search", label: "Google Search", url: "https://www.google.com", order: 0 },
        { id: "google-gmail", label: "Gmail", url: "https://mail.google.com", order: 1 },
        { id: "google-drive", label: "Google Drive", url: "https://drive.google.com", order: 2 },
        { id: "google-calendar", label: "Google Calendar", url: "https://calendar.google.com", order: 3 },
        { id: "google-maps", label: "Google Maps", url: "https://maps.google.com", order: 4 },
        { id: "google-translate", label: "Google Translate", url: "https://translate.google.com", order: 5 }
      ]
    },
    {
      id: "launcher-microsoft",
      name: "Microsoft",
      icon: "M",
      color: "#00a4ef",
      order: 1,
      links: [
        { id: "microsoft-bing", label: "Bing", url: "https://www.bing.com", order: 0 },
        { id: "microsoft-outlook", label: "Outlook", url: "https://outlook.live.com", order: 1 },
        { id: "microsoft-onedrive", label: "OneDrive", url: "https://onedrive.live.com", order: 2 },
        { id: "microsoft-365", label: "Microsoft 365", url: "https://www.microsoft365.com", order: 3 },
        { id: "microsoft-teams", label: "Microsoft Teams", url: "https://teams.microsoft.com", order: 4 },
        { id: "microsoft-copilot", label: "Microsoft Copilot", url: "https://copilot.microsoft.com", order: 5 }
      ]
    },
    {
      id: "launcher-ai",
      name: "AI",
      icon: "AI",
      color: "#8b5cf6",
      order: 2,
      links: [
        { id: "ai-chatgpt", label: "ChatGPT", url: "https://chatgpt.com", order: 0 },
        { id: "ai-claude", label: "Claude", url: "https://claude.ai", order: 1 },
        { id: "ai-gemini", label: "Gemini", url: "https://gemini.google.com", order: 2 },
        { id: "ai-perplexity", label: "Perplexity", url: "https://www.perplexity.ai", order: 3 },
        { id: "ai-grok", label: "Grok", url: "https://grok.com", order: 4 }
      ]
    },
    {
      id: "launcher-developer",
      name: "Developer",
      icon: "<>" ,
      color: "#22c55e",
      order: 3,
      links: [
        { id: "dev-github", label: "GitHub", url: "https://github.com", order: 0 },
        { id: "dev-stackoverflow", label: "Stack Overflow", url: "https://stackoverflow.com", order: 1 },
        { id: "dev-mdn", label: "MDN Web Docs", url: "https://developer.mozilla.org", order: 2 },
        { id: "dev-npm", label: "npm", url: "https://www.npmjs.com", order: 3 },
        { id: "dev-vercel", label: "Vercel", url: "https://vercel.com", order: 4 }
      ]
    }
  ]);

  const DEFAULT_SETTINGS = Object.freeze({
    schemaVersion: 1,
    theme: "dark",
    density: "comfortable",
    accent: "#4f8cff",
    backgroundType: "solid",
    backgroundValue: "#080b18",
    clockBackground: false,
    clockFormat: "12",
    showSeconds: false,
    timeZones: ["Asia/Taipei", "America/New_York"],
    defaultWebEngine: "bing",
    defaultAiEngine: "googleAi",
    defaultFocus: "web",
    copyQueryToClipboard: false,
    shortcutColumns: 6,
    shortcutSlots: 24,
    shortcutAlign: "center",
    defaultCategory: "All",
    categories: ["Work"],
    shortcuts: [],
    launchers: DEFAULT_LAUNCHERS,
    layout: {
      clock: { x: 0, y: 0 },
      search: { x: 0, y: 0 },
      shortcuts: { x: 0, y: 0 },
      worldClock: { x: 0, y: 0 },
      settingsButton: { x: 0, y: 0 }
    }
  });

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function createId(prefix) {
    const random = Math.random().toString(36).slice(2, 9);
    return `${prefix}-${Date.now().toString(36)}-${random}`;
  }

  function clamp(value, min, max, fallback) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return fallback;
    return Math.min(max, Math.max(min, Math.round(numeric)));
  }

  function normalizeHexColor(value, fallback) {
    const text = String(value || "").trim();
    if (/^#[0-9a-f]{6}$/i.test(text)) return text.toLowerCase();
    if (/^#[0-9a-f]{3}$/i.test(text)) {
      return `#${text.slice(1).split("").map((part) => part + part).join("")}`.toLowerCase();
    }
    return fallback;
  }

  function hexToRgb(value) {
    const color = normalizeHexColor(value, "#4f8cff");
    return [
      Number.parseInt(color.slice(1, 3), 16),
      Number.parseInt(color.slice(3, 5), 16),
      Number.parseInt(color.slice(5, 7), 16)
    ];
  }

  function normalizePosition(value) {
    return {
      x: clamp(value?.x, -3000, 3000, 0),
      y: clamp(value?.y, -3000, 3000, 0)
    };
  }

  function normalizeShortcut(item, index, categories, accent) {
    if (!item || typeof item !== "object") return null;
    const url = normalizeHttpUrl(item.url);
    if (!url) return null;
    const requestedGroup = String(item.group || item.category || "Work").trim() || "Work";
    if (!categories.includes(requestedGroup)) categories.push(requestedGroup);
    return {
      id: String(item.id || createId("shortcut")),
      title: String(item.title || item.name || initial(url)).trim().slice(0, 64) || "Shortcut",
      url,
      group: requestedGroup,
      color: normalizeHexColor(item.color, accent),
      order: clamp(item.order, 0, 100000, index)
    };
  }

  function normalizeLauncherLink(item, index) {
    if (!item || typeof item !== "object") return null;
    const url = normalizeHttpUrl(item.url);
    if (!url) return null;
    return {
      id: String(item.id || createId("link")),
      label: String(item.label || item.name || initial(url)).trim().slice(0, 48) || "Service",
      url,
      order: clamp(item.order, 0, 100000, index)
    };
  }

  function normalizeLauncher(item, index) {
    if (!item || typeof item !== "object") return null;
    const links = (Array.isArray(item.links) ? item.links : [])
      .map(normalizeLauncherLink)
      .filter(Boolean)
      .sort((a, b) => a.order - b.order)
      .map((link, linkIndex) => ({ ...link, order: linkIndex }));
    return {
      id: String(item.id || createId("launcher")),
      name: String(item.name || "Launcher").trim().slice(0, 32) || "Launcher",
      icon: String(item.icon || initial(item.name)).trim().slice(0, 4) || "•",
      color: normalizeHexColor(item.color, "#4f8cff"),
      order: clamp(item.order, 0, 100000, index),
      links
    };
  }

  function normalizeSettings(input) {
    const value = input && typeof input === "object" ? input : {};
    const defaults = clone(DEFAULT_SETTINGS);
    const settings = { ...defaults, ...value };

    settings.schemaVersion = 1;
    settings.theme = ["dark", "light"].includes(settings.theme) ? settings.theme : defaults.theme;
    settings.density = ["comfortable", "compact"].includes(settings.density) ? settings.density : defaults.density;
    settings.accent = normalizeHexColor(settings.accent, defaults.accent);
    settings.backgroundType = ["solid", "gradient", "image"].includes(settings.backgroundType)
      ? settings.backgroundType
      : defaults.backgroundType;
    settings.backgroundValue = String(settings.backgroundValue || defaults.backgroundValue).trim();
    if (settings.backgroundType === "solid") {
      settings.backgroundValue = normalizeHexColor(settings.backgroundValue, defaults.backgroundValue);
    }
    settings.clockBackground = settings.clockBackground === true;
    settings.clockFormat = ["12", "24"].includes(String(settings.clockFormat))
      ? String(settings.clockFormat)
      : defaults.clockFormat;
    settings.showSeconds = settings.showSeconds === true;
    settings.timeZones = [...new Set(Array.isArray(settings.timeZones) ? settings.timeZones : defaults.timeZones)]
      .filter((zone) => TIME_ZONES.includes(zone));
    if (!settings.timeZones.length) settings.timeZones = [...defaults.timeZones];
    settings.defaultWebEngine = WEB_ENGINES[settings.defaultWebEngine]
      ? settings.defaultWebEngine
      : defaults.defaultWebEngine;
    settings.defaultAiEngine = AI_ENGINES[settings.defaultAiEngine]
      ? settings.defaultAiEngine
      : defaults.defaultAiEngine;
    settings.defaultFocus = ["web", "ai", "doi", "none"].includes(settings.defaultFocus)
      ? settings.defaultFocus
      : defaults.defaultFocus;
    settings.copyQueryToClipboard = settings.copyQueryToClipboard === true;
    settings.shortcutColumns = clamp(settings.shortcutColumns, 2, 10, defaults.shortcutColumns);
    settings.shortcutSlots = clamp(settings.shortcutSlots, 4, 80, defaults.shortcutSlots);
    settings.shortcutAlign = ["center", "start", "end", "stretch"].includes(settings.shortcutAlign)
      ? settings.shortcutAlign
      : defaults.shortcutAlign;
    settings.categories = Array.isArray(settings.categories)
      ? [...new Set(settings.categories.map((item) => String(item || "").trim()).filter(Boolean))]
      : [...defaults.categories];
    if (!settings.categories.includes("Work")) settings.categories.unshift("Work");
    settings.defaultCategory = settings.defaultCategory === "All" || settings.categories.includes(settings.defaultCategory)
      ? settings.defaultCategory
      : "All";
    settings.shortcuts = (Array.isArray(settings.shortcuts) ? settings.shortcuts : [])
      .map((item, index) => normalizeShortcut(item, index, settings.categories, settings.accent))
      .filter(Boolean)
      .sort((a, b) => a.order - b.order)
      .map((item, index) => ({ ...item, order: index }));
    const launcherSource = Array.isArray(value.launchers) ? value.launchers : defaults.launchers;
    settings.launchers = launcherSource
      .map(normalizeLauncher)
      .filter(Boolean)
      .sort((a, b) => a.order - b.order)
      .map((item, index) => ({ ...item, order: index }));
    settings.layout = {
      clock: normalizePosition(value.layout?.clock),
      search: normalizePosition(value.layout?.search),
      shortcuts: normalizePosition(value.layout?.shortcuts),
      worldClock: normalizePosition(value.layout?.worldClock),
      settingsButton: normalizePosition(value.layout?.settingsButton)
    };

    return settings;
  }

  function normalizeHistory(input) {
    const value = input && typeof input === "object" ? input : {};
    const normalizeList = (list) => (Array.isArray(list) ? list : [])
      .map((item) => String(item || "").trim())
      .filter(Boolean)
      .slice(0, HISTORY_LIMIT);
    return {
      web: normalizeList(value.web),
      ai: normalizeList(value.ai),
      doi: normalizeList(value.doi || value.address)
    };
  }

  function recordHistory(history, kind, value) {
    const clean = String(value || "").trim();
    const next = normalizeHistory(history);
    if (!clean || !Object.hasOwn(next, kind)) return next;
    next[kind] = [
      clean,
      ...next[kind].filter((item) => item.toLocaleLowerCase() !== clean.toLocaleLowerCase())
    ].slice(0, HISTORY_LIMIT);
    return next;
  }

  function historySuggestions(history, kind, query) {
    const clean = String(query || "").trim().toLocaleLowerCase();
    if (!clean) return [];
    return normalizeHistory(history)[kind]
      .filter((item) => item.toLocaleLowerCase().includes(clean))
      .slice(0, SUGGESTION_LIMIT);
  }

  function localSuggestions(query) {
    const clean = String(query || "").trim().toLocaleLowerCase();
    if (!clean) return [];
    return LOCAL_SUGGESTIONS
      .filter((item) => item.includes(clean))
      .sort((a, b) => Number(b.startsWith(clean)) - Number(a.startsWith(clean)))
      .slice(0, SUGGESTION_LIMIT);
  }

  function mergeUniqueLists(...lists) {
    const seen = new Set();
    const result = [];
    for (const list of lists) {
      for (const item of list || []) {
        const clean = String(item || "").trim();
        const key = clean.toLocaleLowerCase();
        if (!clean || seen.has(key)) continue;
        seen.add(key);
        result.push(clean);
        if (result.length >= SUGGESTION_LIMIT) return result;
      }
    }
    return result;
  }

  function hasBlockedScheme(value) {
    const clean = String(value || "").trim();
    const match = clean.match(/^([a-z][a-z0-9+.-]*):/i);
    return Boolean(match && !["http", "https", "doi"].includes(match[1].toLocaleLowerCase()));
  }

  function normalizeHttpUrl(value) {
    const clean = String(value || "").trim();
    if (!clean || /\s/.test(clean) || hasBlockedScheme(clean)) return null;

    const explicitHttp = /^https?:\/\//i.test(clean);
    const candidate = explicitHttp ? clean : `https://${clean}`;
    try {
      const parsed = new URL(candidate);
      if (!["http:", "https:"].includes(parsed.protocol)) return null;
      const hostname = parsed.hostname;
      const isLocalhost = hostname === "localhost";
      const isIpv4 = /^(?:\d{1,3}\.){3}\d{1,3}$/.test(hostname);
      const isIpv6 = hostname.includes(":");
      const isDomain = hostname.includes(".") && !hostname.startsWith(".") && !hostname.endsWith(".");
      if (!isLocalhost && !isIpv4 && !isIpv6 && !isDomain) return null;
      return parsed.href;
    } catch {
      return null;
    }
  }

  function normalizeDoi(value) {
    let clean = String(value || "").trim();
    if (!clean || hasBlockedScheme(clean)) return null;
    clean = clean
      .replace(/^doi:\s*/i, "")
      .replace(/^https?:\/\/(?:dx\.)?doi\.org\//i, "")
      .trim();
    try {
      clean = decodeURIComponent(clean);
    } catch {
      // Keep the original identifier when malformed percent escapes are present.
    }
    if (!/^10\.\d{4,9}\/\S+$/i.test(clean)) return null;
    return clean;
  }

  function buildSearchUrl(template, query) {
    return template.replace("{query}", encodeURIComponent(String(query || "").trim()));
  }

  function routeInput(kind, value, engineKey) {
    const clean = String(value || "").trim();
    if (!clean) return { type: "empty" };
    if (hasBlockedScheme(clean)) {
      return { type: "error", message: "Only safe HTTP(S) destinations are allowed." };
    }

    if (kind === "doi") {
      if (/^https?:\/\//i.test(clean)) {
        const explicitUrl = normalizeHttpUrl(clean);
        if (explicitUrl) return { type: "url", url: explicitUrl };
      }
      const doi = normalizeDoi(clean);
      if (doi) {
        const encodedDoi = doi.split("/").map((part) => encodeURIComponent(part)).join("/");
        return { type: "doi", url: `https://doi.org/${encodedDoi}`, doi };
      }
      const directUrl = normalizeHttpUrl(clean);
      if (directUrl) return { type: "url", url: directUrl };
      return { type: "error", message: "Enter a valid DOI such as 10.1000/xyz123." };
    }

    const directUrl = normalizeHttpUrl(clean);
    if (directUrl) return { type: "url", url: directUrl };

    const engines = kind === "ai" ? AI_ENGINES : WEB_ENGINES;
    const fallbackKey = kind === "ai" ? DEFAULT_SETTINGS.defaultAiEngine : DEFAULT_SETTINGS.defaultWebEngine;
    const engine = engines[engineKey] || engines[fallbackKey];
    return {
      type: "search",
      url: buildSearchUrl(engine.searchUrl, clean),
      query: clean
    };
  }

  function timeZoneCity(zone) {
    return String(zone || "").split("/").pop().replace(/_/g, " ");
  }

  function faviconUrl(value, size = 64) {
    const url = normalizeHttpUrl(value);
    if (!url) return "";
    try {
      return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(new URL(url).hostname)}&sz=${size}`;
    } catch {
      return "";
    }
  }

  function initial(value) {
    return String(value || "?").trim().charAt(0).toLocaleUpperCase() || "?";
  }

  function reorderById(items, fromId, toId) {
    const next = Array.isArray(items) ? clone(items) : [];
    const fromIndex = next.findIndex((item) => item.id === fromId);
    const toIndex = next.findIndex((item) => item.id === toId);
    if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) {
      return next.map((item, index) => ({ ...item, order: index }));
    }
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    return next.map((item, index) => ({ ...item, order: index }));
  }

  function moveById(items, id, delta) {
    const next = Array.isArray(items) ? clone(items) : [];
    const index = next.findIndex((item) => item.id === id);
    const targetIndex = Math.min(next.length - 1, Math.max(0, index + delta));
    if (index < 0 || targetIndex === index) return next;
    const [moved] = next.splice(index, 1);
    next.splice(targetIndex, 0, moved);
    return next.map((item, itemIndex) => ({ ...item, order: itemIndex }));
  }

  function migrateSettings(input) {
    const value = input && typeof input === "object" ? clone(input) : {};
    if (value.defaultSearch && !value.defaultWebEngine) value.defaultWebEngine = value.defaultSearch;
    if (value.defaultAi && !value.defaultAiEngine) value.defaultAiEngine = value.defaultAi;
    if (value.defaultFocusOnLoad && !value.defaultFocus) {
      const focusMap = {
        searchInput: "web",
        aiInput: "ai",
        addressInput: "doi",
        none: "none"
      };
      value.defaultFocus = focusMap[value.defaultFocusOnLoad] || "web";
    }
    if (Array.isArray(value.shortcutGroups) && !Array.isArray(value.categories)) {
      value.categories = value.shortcutGroups;
    }
    if (value.defaultView && !value.defaultCategory) value.defaultCategory = value.defaultView;
    if (value.elementPositions && !value.layout) value.layout = value.elementPositions;
    return normalizeSettings(value);
  }

  function scalarValue(text) {
    const value = String(text || "").trim();
    if (value === "" || value === "null" || value === "~") return null;
    if (value === "true") return true;
    if (value === "false") return false;
    if (/^[-+]?\d+$/.test(value)) return Number.parseInt(value, 10);
    if (/^[-+]?\d*\.\d+$/.test(value)) return Number.parseFloat(value);
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      try {
        return JSON.parse(value);
      } catch {
        return value.slice(1, -1);
      }
    }
    return value;
  }

  function findNextContentLine(lines, start) {
    for (let index = start; index < lines.length; index += 1) {
      if (lines[index].trim() && !lines[index].trim().startsWith("#")) return lines[index];
    }
    return "";
  }

  function parseLegacyYaml(text) {
    const lines = String(text || "").split(/\r?\n/);
    const result = {};
    const stack = [{ value: result, indent: -1 }];
    let activeArray = null;

    for (let index = 0; index < lines.length; index += 1) {
      const raw = lines[index];
      const trimmed = raw.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const indent = raw.search(/\S/);

      if (trimmed.startsWith("- ") && activeArray) {
        const content = trimmed.slice(2).trim();
        const pair = content.match(/^([^:]+):\s*(.*)$/);
        if (pair) {
          const entry = { [pair[1].trim()]: scalarValue(pair[2]) };
          const itemIndent = indent;
          while (index + 1 < lines.length) {
            const next = lines[index + 1];
            if (!next.trim()) {
              index += 1;
              continue;
            }
            const nextIndent = next.search(/\S/);
            if (nextIndent <= itemIndent || next.trim().startsWith("- ")) break;
            const nextPair = next.trim().match(/^([^:]+):\s*(.*)$/);
            if (!nextPair) break;
            entry[nextPair[1].trim()] = scalarValue(nextPair[2]);
            index += 1;
          }
          activeArray.push(entry);
        } else {
          activeArray.push(scalarValue(content));
        }
        continue;
      }

      const pair = trimmed.match(/^([^:]+):\s*(.*)$/);
      if (!pair) continue;
      const key = pair[1].trim();
      const valueText = pair[2].trim();
      while (stack.length > 1 && stack[stack.length - 1].indent >= indent) stack.pop();
      const parent = stack[stack.length - 1].value;
      if (valueText) {
        parent[key] = scalarValue(valueText);
        activeArray = null;
      } else {
        const next = findNextContentLine(lines, index + 1);
        if (next.trim().startsWith("- ")) {
          parent[key] = [];
          activeArray = parent[key];
        } else {
          parent[key] = {};
          stack.push({ value: parent[key], indent });
          activeArray = null;
        }
      }
    }
    return result;
  }

  function parseTomlValue(value) {
    const clean = String(value || "").trim();
    if (clean.startsWith("[") && clean.endsWith("]")) {
      const inner = clean.slice(1, -1).trim();
      if (!inner) return [];
      const items = [];
      let token = "";
      let quote = "";
      for (let index = 0; index < inner.length; index += 1) {
        const char = inner[index];
        if (quote) {
          token += char;
          if (char === quote && inner[index - 1] !== "\\") quote = "";
        } else if (char === '"' || char === "'") {
          quote = char;
          token += char;
        } else if (char === ",") {
          items.push(scalarValue(token));
          token = "";
        } else {
          token += char;
        }
      }
      if (token.trim()) items.push(scalarValue(token));
      return items;
    }
    return scalarValue(clean);
  }

  function parseLegacyToml(text) {
    const result = {};
    let target = result;
    for (const raw of String(text || "").split(/\r?\n/)) {
      const line = raw.trim();
      if (!line || line.startsWith("#")) continue;
      const arrayTable = line.match(/^\[\[([^\]]+)\]\]$/);
      if (arrayTable) {
        const key = arrayTable[1].trim();
        if (!Array.isArray(result[key])) result[key] = [];
        target = {};
        result[key].push(target);
        continue;
      }
      const table = line.match(/^\[([^\]]+)\]$/);
      if (table) {
        const parts = table[1].trim().split(".");
        target = result;
        parts.forEach((part) => {
          if (!target[part] || typeof target[part] !== "object") target[part] = {};
          target = target[part];
        });
        continue;
      }
      const pair = line.match(/^([^=]+?)=(.*)$/);
      if (pair) target[pair[1].trim()] = parseTomlValue(pair[2]);
    }
    return result;
  }

  function setPath(target, path, value) {
    const parts = path.split(".");
    let current = target;
    for (let index = 0; index < parts.length - 1; index += 1) {
      if (!current[parts[index]] || typeof current[parts[index]] !== "object") current[parts[index]] = {};
      current = current[parts[index]];
    }
    current[parts.at(-1)] = value;
  }

  function parseLegacyText(text) {
    const result = {};
    const arrays = {};
    for (const raw of String(text || "").split(/\r?\n/)) {
      const line = raw.trim();
      if (!line || line.startsWith("#") || line.startsWith("//")) continue;
      const separator = line.indexOf("=");
      if (separator < 0) continue;
      const key = line.slice(0, separator).trim();
      const rawValue = line.slice(separator + 1).trim();
      const indexed = key.match(/^(.+?)\[(\d+)\]\.(.+)$/);
      if (indexed) {
        const [, arrayPath, rawIndex, property] = indexed;
        const itemIndex = Number(rawIndex);
        arrays[arrayPath] ||= [];
        arrays[arrayPath][itemIndex] ||= {};
        arrays[arrayPath][itemIndex][property] = scalarValue(rawValue);
      } else {
        const parsed = rawValue.includes(",") && !rawValue.startsWith('"')
          ? rawValue.split(",").map((item) => scalarValue(item))
          : scalarValue(rawValue);
        setPath(result, key, parsed);
      }
    }
    Object.entries(arrays).forEach(([path, value]) => setPath(result, path, value));
    return result;
  }

  const FORMAT_META = Object.freeze({
    json: { extension: "json", mime: "application/json", label: "JSON" },
    yaml: { extension: "yaml", mime: "text/yaml", label: "YAML" },
    toml: { extension: "toml", mime: "application/toml", label: "TOML" },
    text: { extension: "txt", mime: "text/plain", label: "Plain text" }
  });

  function serializeSettings(settings, format = "json") {
    const normalized = migrateSettings(settings);
    const json = JSON.stringify(normalized, null, 2);
    if (format === "json") return json;
    if (format === "yaml") {
      return ["# Browser Start Page V3", "browserStartPageV3: |-", ...json.split("\n").map((line) => `  ${line}`)].join("\n");
    }
    if (format === "toml") {
      return `# Browser Start Page V3\nbrowser_start_page_v3 = ${JSON.stringify(JSON.stringify(normalized))}`;
    }
    if (format === "text") {
      return `# Browser Start Page V3\nbrowser-start-page-v3 = ${JSON.stringify(normalized)}`;
    }
    throw new Error(`Unsupported format: ${format}`);
  }

  function deserializeSettings(text, format = "json") {
    const source = String(text || "").trim();
    if (!source) throw new Error("No settings data was provided.");
    let parsed;
    if (format === "json" || source.startsWith("{")) {
      parsed = JSON.parse(source);
    } else if (format === "yaml") {
      const marker = source.match(/^browserStartPageV3:\s*\|-?\s*$/m);
      if (marker) {
        const payload = source.slice(marker.index + marker[0].length).replace(/^ {2}/gm, "").trim();
        parsed = JSON.parse(payload);
      } else {
        parsed = parseLegacyYaml(source);
      }
    } else if (format === "toml") {
      const payload = source.match(/^browser_start_page_v3\s*=\s*(.+)$/m);
      parsed = payload ? JSON.parse(JSON.parse(payload[1].trim())) : parseLegacyToml(source);
    } else if (format === "text") {
      const payload = source.match(/^browser-start-page-v3\s*=\s*(.+)$/m);
      parsed = payload ? JSON.parse(payload[1].trim()) : parseLegacyText(source);
    } else {
      throw new Error(`Unsupported format: ${format}`);
    }
    return migrateSettings(parsed);
  }

  const core = Object.freeze({
    version: 1,
    SETTINGS_STORAGE_KEY,
    HISTORY_STORAGE_KEY,
    HISTORY_LIMIT,
    SUGGESTION_LIMIT,
    WEB_ENGINES,
    AI_ENGINES,
    TIME_ZONES,
    DEFAULT_LAUNCHERS,
    DEFAULT_SETTINGS,
    clone,
    createId,
    clamp,
    normalizeHexColor,
    hexToRgb,
    normalizeSettings,
    normalizeHistory,
    recordHistory,
    historySuggestions,
    localSuggestions,
    mergeUniqueLists,
    hasBlockedScheme,
    normalizeHttpUrl,
    normalizeDoi,
    buildSearchUrl,
    routeInput,
    timeZoneCity,
    faviconUrl,
    initial,
    reorderById,
    moveById,
    migrateSettings,
    FORMAT_META,
    serializeSettings,
    deserializeSettings
  });

  globalScope.StartPageCore = core;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = core;
  }
})(typeof globalThis !== "undefined" ? globalThis : window);
