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
    launchers: [],
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
    settings.shortcuts = Array.isArray(settings.shortcuts) ? clone(settings.shortcuts) : [];
    settings.launchers = Array.isArray(settings.launchers) ? clone(settings.launchers) : [];
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

  const core = Object.freeze({
    version: 1,
    SETTINGS_STORAGE_KEY,
    HISTORY_STORAGE_KEY,
    HISTORY_LIMIT,
    SUGGESTION_LIMIT,
    WEB_ENGINES,
    AI_ENGINES,
    TIME_ZONES,
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
    initial
  });

  globalScope.StartPageCore = core;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = core;
  }
})(typeof globalThis !== "undefined" ? globalThis : window);
