// Local storage key for persisted settings.
const STORAGE_KEY = "custom-start-page-settings-v1";
// Local storage key for search history used in suggestions.
const HISTORY_STORAGE_KEY = "custom-start-page-history-v1";
// Intent: keep suggestions fresh while avoiding runaway storage growth.
const HISTORY_LIMIT = 24;
const SUGGESTION_LIMIT = 8;
// Decision: Datamuse provides CORS-friendly suggestions without API keys.
const SUGGESTION_API_TEMPLATE = "https://api.datamuse.com/sug?s={query}";
const SUGGESTION_MIN_CHARS = 2;
const SUGGESTION_DEBOUNCE_MS = 140;
const PREDICTION_LIMIT = 3;

// Intent: lightweight next-word prediction tables for offline chip + ghost UI.
// Assumption: words are stored in lowercase for fast matching and consistent output.
const BIGRAM_TABLE = {
  this: ["is", "was", "will"],
  how: ["to", "can", "do"],
  what: ["is", "are", "does"],
  where: ["is", "to", "can"],
  when: ["is", "does", "will"],
  who: ["is", "was", "are"],
  why: ["is", "does", "do"],
  i: ["am", "want", "need"],
  you: ["are", "can", "should"],
  we: ["are", "can", "should"],
  they: ["are", "were", "can"],
  can: ["you", "we", "i"],
  learn: ["more", "to", "about"],
  best: ["way", "tools", "practices"],
  machine: ["learning", "vision", "translation"],
  data: ["science", "analysis", "visualization"],
  web: ["development", "design", "apps"],
  open: ["source", "ai", "data"],
  search: ["engine", "tips", "tools"],
  ai: ["tools", "models", "prompts"],
  github: ["copilot", "actions", "pages"],
  google: ["search", "maps", "ai"],
  python: ["tutorial", "examples", "guide"],
  javascript: ["tutorial", "tips", "basics"],
  react: ["tutorial", "hooks", "components"],
  css: ["grid", "flexbox", "animations"],
  node: ["js", "tutorial", "api"]
};

const TRIGRAM_TABLE = {
  "how to": ["make", "build", "learn"],
  "what is": ["the", "ai", "best"],
  "where is": ["the", "my", "best"],
  "when is": ["the", "next", "my"],
  "who is": ["the", "best", "a"],
  "this is": ["a", "the", "not"],
  "machine learning": ["model", "course", "tutorial"],
  "data science": ["course", "jobs", "salary"],
  "open source": ["projects", "tools", "ai"],
  "large language": ["model", "models", "api"],
  "best way": ["to", "for", "forward"],
  "learn to": ["code", "cook", "invest"],
  "react hooks": ["tutorial", "guide", "examples"],
  "css grid": ["tutorial", "layout", "guide"],
  "github copilot": ["review", "pricing", "extensions"],
  "google search": ["console", "tips", "operators"]
};

// Added: local suggestion corpus adapted from the reference search-prediction prototype.
// Intent: provide broad offline matches instead of only matching a few hardcoded prefixes.
const LOCAL_SUGGESTIONS = [
  "this is for you",
  "this is us",
  "this is me",
  "this is fine",
  "this is america",
  "this is where i leave you",
  "this too shall pass",
  "this is paris",
  "this is not a test",
  "this is never that",
  "this is halloween",
  "this is 40",
  "this is spinal tap",
  "that is correct",
  "that sounds good",
  "that 70s show",
  "how to make money",
  "how to lose weight",
  "how to learn javascript",
  "how to meditate",
  "how to draw",
  "how to invest",
  "how to start a business",
  "how to write a resume",
  "how to cook pasta",
  "what is ai",
  "what is machine learning",
  "what is the best",
  "what is love",
  "what is blockchain",
  "what is chatgpt",
  "what is python",
  "what is typescript",
  "best movies 2024",
  "best restaurants near me",
  "best practices javascript",
  "best way to learn",
  "best budget laptop",
  "best vpn service",
  "best free tools",
  "why is the sky blue",
  "why do we dream",
  "why is sleep important",
  "where is the nearest",
  "where to buy",
  "where is my order",
  "where to travel",
  "when does daylight saving end",
  "when is thanksgiving 2024",
  "who invented the internet",
  "who is the richest person",
  "hello world program",
  "hello world python",
  "hello world javascript",
  "hello world in c",
  "hello world react",
  "hello kitty",
  "hello fresh recipes",
  "world war 2 timeline",
  "world population 2024",
  "world cup 2026",
  "world map countries",
  "world history timeline",
  "world news today",
  "learn javascript free",
  "learn python for beginners",
  "learn to code",
  "learn spanish fast",
  "learn guitar online",
  "learn web development",
  "learn machine learning",
  "learn react tutorial",
  "learn css grid",
  "code editor online",
  "code examples",
  "code formatter",
  "code review checklist",
  "python tutorial for beginners",
  "python data science",
  "python machine learning",
  "python vs javascript",
  "python web scraping",
  "python flask tutorial",
  "python django tutorial",
  "python pandas tutorial",
  "machine learning tutorial",
  "machine learning course",
  "machine learning jobs",
  "deep learning paper",
  "deep learning framework",
  "open source projects",
  "open source ai tools",
  "open source software",
  "data science roadmap",
  "data science course",
  "data science salary",
  "natural language processing",
  "large language model",
  "large language model tutorial",
  "javascript async await",
  "javascript promises",
  "javascript frameworks 2024",
  "react vs vue",
  "react hooks tutorial",
  "react native tutorial",
  "css grid tutorial",
  "css flexbox guide",
  "css animations",
  "html5 features",
  "html email template",
  "html css javascript course",
  "node js tutorial",
  "node js rest api",
  "node js vs python",
  "typescript tutorial",
  "typescript vs javascript",
  "typescript best practices",
  "github actions tutorial",
  "github copilot review",
  "github pages hosting",
  "docker tutorial",
  "docker compose example",
  "docker vs kubernetes",
  "aws lambda tutorial",
  "aws s3 tutorial",
  "openai api tutorial",
  "openai playground",
  "tailwind css tutorial",
  "next js tutorial",
  "next js deployment",
  "google maps api",
  "google analytics setup",
  "google search console",
  "weather today",
  "weather forecast",
  "news today",
  "news latest",
  "time zone converter",
  "translate english to spanish",
  "currency converter usd to eur",
  "stock price apple",
  "bitcoin price today",
  "recipe for banana bread",
  "recipe for chocolate cake",
  "youtube to mp3",
  "youtube downloader",
  "netflix shows 2024",
  "amazon return policy",
  "iphone 16 review",
  "iphone vs android",
  "chatgpt login",
  "chatgpt plus price",
  "chatgpt vs gemini",
  "claude ai features",
  "claude vs chatgpt",
  "claude api pricing",
  "ai tools for work",
  "ai prompts for writing",
  "google search tips"
];

// Web search engine catalog.
const searchEngines = {
  bing: {
    label: "Bing",
    url: "https://www.bing.com/search?q={query}"
  },
  google: {
    label: "Google",
    url: "https://www.google.com/search?q={query}"
  }
};

// AI engine catalog.
const aiEngines = {
  googleAi: {
    label: "Google AI",
    url: "https://www.google.com/search?udm=50&q={query}"
  },
  chatgpt: {
    label: "ChatGPT",
    url: "https://chatgpt.com/?q={query}"
  },
  claude: {
    label: "Claude",
    url: "https://claude.ai/new?q={query}"
  },
  gemini: {
    label: "Gemini",
    url: "https://gemini.google.com/app?q={query}"
  }
};

// Curated time zone list for the global clock picker.
const timeZoneOptions = [
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
];

// Default shortcut group label.
const defaultGroup = "Work";

// Baseline settings applied on first load or reset.
const defaultSettings = {
  theme: "dark",
  density: "comfortable",
  accent: "#34d399",
  clockBackground: true,
  editMode: false,
  elementPositions: {
    clock: { x: 0, y: 0 },
    search: { x: 0, y: 0 },
    shortcuts: { x: 0, y: 0 },
    worldClock: { x: 0, y: 0 },
    settingsButton: { x: 0, y: 0 }
  },
  // Modified: migration flag for layout coordinates reset
  layoutAlignedV1: true,
  backgroundType: "solid",
  backgroundValue: "#080b10",
  defaultSearch: "bing",
  defaultAi: "googleAi",
  shortcutColumns: 4,
  shortcutSlots: 12,
  shortcutAlign: "stretch",
  defaultGroupName: defaultGroup,
  shortcutGroups: ["Work", "Shop", "Money", "For Me", "Fun", "News", "Sports", "Travel", "Tools"],
  defaultView: "All",
  clockFormat: "24",
  showSeconds: true,
  timeZones: ["America/New_York", "America/Los_Angeles"],
  shortcuts: [
    { title: "Bing", url: "https://www.bing.com", color: "#0ea5e9", group: "Tools" },
    { title: "Google", url: "https://www.google.com", color: "#22c55e", group: "Tools" },
    { title: "ChatGPT", url: "https://chatgpt.com", color: "#10a37f", group: "Tools" },
    { title: "Claude", url: "https://claude.ai", color: "#d97706", group: "Tools" },
    { title: "Gemini", url: "https://gemini.google.com", color: "#8b5cf6", group: "Tools" },
    { title: "YouTube", url: "https://www.youtube.com", color: "#ef4444", group: "Fun" },
    { title: "GitHub", url: "https://github.com", color: "#64748b", group: "Work" },
    { title: "Outlook", url: "https://outlook.office.com", color: "#2563eb", group: "Work" }
  ]
};

// Mutable runtime state.
let settings = loadSettings();
let queryHistory = loadQueryHistory();
let editorRenderQueued = false;
let shortcutPointerDrag = null;
let suppressShortcutClick = false;
let shortcutEditorPointerDrag = null;
let activeShortcutGroup = "All";
let layoutDrag = null;
let suppressLayoutClick = false;
let layoutDraftPositions = null;

// DOM element references used throughout the UI.
const elements = {
  body: document.body,
  localClock: document.getElementById("localClock"),
  localLabel: document.getElementById("localLabel"),
  localTime: document.getElementById("localTime"),
  localDate: document.getElementById("localDate"),
  worldClock: document.getElementById("worldClock"),
  worldClockList: document.getElementById("worldClockList"),
  searchForm: document.getElementById("searchForm"),
  aiForm: document.getElementById("aiForm"),
  searchStack: document.getElementById("searchStack"),
  searchInput: document.getElementById("searchInput"),
  aiInput: document.getElementById("aiInput"),
  searchSuggestions: document.getElementById("searchSuggestions"),
  aiSuggestions: document.getElementById("aiSuggestions"),
  searchPredictions: document.getElementById("searchPredictions"),
  aiPredictions: document.getElementById("aiPredictions"),
  searchGhost: document.getElementById("searchGhost"),
  aiGhost: document.getElementById("aiGhost"),
  searchEngine: document.getElementById("searchEngine"),
  aiEngine: document.getElementById("aiEngine"),
  shortcutGroupBar: document.getElementById("shortcutGroupBar"),
  shortcutGrid: document.getElementById("shortcutGrid"),
  shortcutPanel: document.getElementById("shortcutPanel"),
  settingsButton: document.getElementById("settingsButton"),
  closeSettings: document.getElementById("closeSettings"),
  drawer: document.getElementById("settingsDrawer"),
  backdrop: document.getElementById("drawerBackdrop"),
  themeSetting: document.getElementById("themeSetting"),
  densitySetting: document.getElementById("densitySetting"),
  backgroundTypeSetting: document.getElementById("backgroundTypeSetting"),
  backgroundColorSetting: document.getElementById("backgroundColorSetting"),
  backgroundValueSetting: document.getElementById("backgroundValueSetting"),
  accentSetting: document.getElementById("accentSetting"),
  accentTextSetting: document.getElementById("accentTextSetting"),
  clockBackgroundSetting: document.getElementById("clockBackgroundSetting"),
  editModeSetting: document.getElementById("editModeSetting"),
  saveLayout: document.getElementById("saveLayout"),
  defaultSearchSetting: document.getElementById("defaultSearchSetting"),
  defaultAiSetting: document.getElementById("defaultAiSetting"),
  shortcutColumnsSetting: document.getElementById("shortcutColumnsSetting"),
  shortcutSlotsSetting: document.getElementById("shortcutSlotsSetting"),
  shortcutAlignSetting: document.getElementById("shortcutAlignSetting"),
  clockFormatSetting: document.getElementById("clockFormatSetting"),
  showSecondsSetting: document.getElementById("showSecondsSetting"),
  groupEditor: document.getElementById("groupEditor"),
  shortcutEditor: document.getElementById("shortcutEditor"),
  addShortcut: document.getElementById("addShortcut"),
  addGroup: document.getElementById("addGroup"),
  timeZoneSelect: document.getElementById("timeZoneSelect"),
  timeZonesSetting: document.getElementById("timeZonesSetting"),
  exportSettings: document.getElementById("exportSettings"),
  importSettings: document.getElementById("importSettings"),
  resetSettings: document.getElementById("resetSettings"),
  settingsJson: document.getElementById("settingsJson"),
  /* Category Manager Addition: Inline elements (rendered into groupEditor) */
  currentDefaultCategoryText: document.getElementById("currentDefaultCategoryText"),
  customCategoriesCount: document.getElementById("customCategoriesCount")
};

// Load settings from localStorage and normalize to a safe shape.
function loadSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    // Modified: reset stored drag positions if they were saved before the desktop layout absolute header update.
    if (saved && saved.elementPositions && !saved.layoutAlignedV1) {
      saved.elementPositions = {
        clock: { x: 0, y: 0 },
        search: { x: 0, y: 0 },
        shortcuts: { x: 0, y: 0 },
        worldClock: { x: 0, y: 0 },
        settingsButton: { x: 0, y: 0 }
      };
      saved.layoutAlignedV1 = true;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
    }
    return normalizeSettings({ ...defaultSettings, ...saved });
  } catch {
    return normalizeSettings(defaultSettings);
  }
}

// Merge raw settings with defaults and coerce values into valid ranges.
function normalizeSettings(value) {
  const baseDefaultGroup = normalizeGroup(value.defaultGroupName, defaultGroup) || defaultGroup;
  const baseGroups =
    Array.isArray(value.shortcutGroups) && value.shortcutGroups.length
      ? normalizeGroupList(value.shortcutGroups, baseDefaultGroup)
      : normalizeGroupList(defaultSettings.shortcutGroups, baseDefaultGroup);
  const baseDefaultView = (typeof value.defaultView === "string" && (value.defaultView === "All" || baseGroups.includes(value.defaultView)))
    ? value.defaultView
    : "All";

  const merged = {
    ...defaultSettings,
    ...value,
    shortcuts: Array.isArray(value.shortcuts) ? value.shortcuts : defaultSettings.shortcuts,
    timeZones: Array.isArray(value.timeZones)
      ? value.timeZones.filter((zone) => timeZoneOptions.includes(zone))
      : defaultSettings.timeZones,
    defaultGroupName: baseDefaultGroup,
    shortcutGroups: baseGroups,
    defaultView: baseDefaultView,
    elementPositions: normalizePositions(value.elementPositions)
  };
  if (!merged.timeZones.length) merged.timeZones = defaultSettings.timeZones;

  merged.shortcutColumns = clampNumber(merged.shortcutColumns, 2, 8, defaultSettings.shortcutColumns);
  merged.shortcutSlots = clampNumber(merged.shortcutSlots, 4, 48, defaultSettings.shortcutSlots);
  merged.shortcuts = merged.shortcuts
    .filter((item) => item && item.url)
    .map((item) => ({
      title: String(item.title || getHostname(item.url) || "Shortcut"),
      url: normalizeUrl(String(item.url || "")),
      color: normalizeHexColor(item.color) || defaultSettings.accent,
      group: normalizeGroup(item.group, baseDefaultGroup) || baseDefaultGroup
    }))
    .filter((item) => item.url);

  merged.shortcuts.forEach((shortcut) => {
    if (!merged.shortcutGroups.includes(shortcut.group)) {
      merged.shortcutGroups.push(shortcut.group);
    }
  });
  merged.shortcutGroups = normalizeGroupList(merged.shortcutGroups, merged.defaultGroupName);

  if (!searchEngines[merged.defaultSearch]) merged.defaultSearch = defaultSettings.defaultSearch;
  if (!aiEngines[merged.defaultAi]) merged.defaultAi = defaultSettings.defaultAi;
  if (!["dark", "light"].includes(merged.theme)) merged.theme = defaultSettings.theme;
  if (!["comfortable", "compact"].includes(merged.density)) merged.density = defaultSettings.density;
  if (!["stretch", "start", "center", "end"].includes(merged.shortcutAlign)) {
    merged.shortcutAlign = defaultSettings.shortcutAlign;
  }
  merged.clockBackground = merged.clockBackground !== false;
  merged.editMode = merged.editMode === true;
  if (!["12", "24"].includes(merged.clockFormat)) merged.clockFormat = defaultSettings.clockFormat;
  merged.showSeconds = merged.showSeconds !== false;
  if (!["solid", "gradient", "image"].includes(merged.backgroundType)) {
    merged.backgroundType = defaultSettings.backgroundType;
  }
  merged.accent = normalizeHexColor(merged.accent) || defaultSettings.accent;
  if (merged.backgroundType === "solid") {
    merged.backgroundValue = normalizeHexColor(merged.backgroundValue) || defaultSettings.backgroundValue;
  }

  return merged;
}

// Intent: keep lightweight local history for autocomplete suggestions only.
function loadQueryHistory() {
  try {
    const saved = JSON.parse(localStorage.getItem(HISTORY_STORAGE_KEY));
    return normalizeQueryHistory(saved);
  } catch {
    return normalizeQueryHistory({});
  }
}

function normalizeQueryHistory(value) {
  return {
    web: normalizeHistoryList(value?.web),
    ai: normalizeHistoryList(value?.ai)
  };
}

function normalizeHistoryList(value) {
  return (Array.isArray(value) ? value : [])
    .map((entry) => String(entry || "").trim())
    .filter(Boolean);
}

function saveQueryHistory() {
  localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(queryHistory));
}

function recordQueryHistory(kind, query) {
  const cleanQuery = String(query || "").trim();
  if (!cleanQuery) return;
  const current = queryHistory[kind] || [];
  const normalized = cleanQuery.toLowerCase();
  // Guardrail: keep only the most recent unique queries.
  const next = [cleanQuery, ...current.filter((item) => item.toLowerCase() !== normalized)].slice(
    0,
    HISTORY_LIMIT
  );
  queryHistory = { ...queryHistory, [kind]: next };
  saveQueryHistory();
}

function getQuerySuggestions(kind, query) {
  const cleanQuery = String(query || "").trim().toLowerCase();
  if (!cleanQuery) return [];
  const list = queryHistory[kind] || [];
  return list.filter((item) => item.toLowerCase().includes(cleanQuery)).slice(0, SUGGESTION_LIMIT);
}

// Added: reference-style local matcher: prefix, word-prefix, then substring fallback.
function getLocalSuggestionMatches(query) {
  const cleanQuery = String(query || "").trim().toLowerCase();
  if (!cleanQuery) return [];
  const prefixMatches = [];
  const wordMatches = [];
  const substringMatches = [];

  LOCAL_SUGGESTIONS.forEach((item) => {
    const normalized = item.toLowerCase();
    if (normalized.startsWith(cleanQuery)) {
      prefixMatches.push(item);
      return;
    }
    if (normalized.split(/\s+/).some((word) => word.startsWith(cleanQuery))) {
      wordMatches.push(item);
      return;
    }
    if (normalized.includes(cleanQuery)) {
      substringMatches.push(item);
    }
  });

  return [...prefixMatches, ...wordMatches, ...substringMatches].slice(0, SUGGESTION_LIMIT);
}

function mergeSuggestions(primary, secondary) {
  const combined = [];
  const seen = new Set();
  [primary, secondary].forEach((list) => {
    list.forEach((item) => {
      const normalized = item.toLowerCase();
      if (seen.has(normalized)) return;
      seen.add(normalized);
      combined.push(item);
    });
  });
  return combined;
}

async function fetchRemoteSuggestions(query, signal) {
  const url = SUGGESTION_API_TEMPLATE.replace("{query}", encodeURIComponent(query.trim()));
  const response = await fetch(url, { signal, headers: { Accept: "application/json" } });
  if (!response.ok) {
    throw new Error(`Suggestion fetch failed (${response.status})`);
  }
  const payload = await response.json();
  return (Array.isArray(payload) ? payload : [])
    .map((entry) => String(entry?.word || "").trim())
    .filter(Boolean);
}

// Intent: derive next-word predictions for chip/ghost UI using trigram→bigram back-off.
function getPredictions(text) {
  const raw = String(text || "");
  const endsWithSpace = /\s$/.test(raw);
  const tokens = raw.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (!tokens.length) return [];

  const completed = endsWithSpace ? tokens : tokens.slice(0, -1);
  const partial = endsWithSpace ? "" : tokens[tokens.length - 1] || "";

  let candidates = [];
  if (endsWithSpace) {
    if (completed.length >= 2) {
      candidates = TRIGRAM_TABLE[completed.slice(-2).join(" ")] || [];
    }
    if (!candidates.length && completed.length) {
      candidates = BIGRAM_TABLE[completed.slice(-1)[0]] || [];
    }
    return candidates.slice(0, PREDICTION_LIMIT);
  }

  if (!completed.length) return [];
  if (completed.length >= 2) {
    candidates = TRIGRAM_TABLE[completed.slice(-2).join(" ")] || [];
  }
  if (!candidates.length) {
    candidates = BIGRAM_TABLE[completed.slice(-1)[0]] || [];
  }
  if (!candidates.length) return [];

  // Guardrail: only return words that continue the partial token.
  return candidates.filter((word) => word.startsWith(partial)).slice(0, PREDICTION_LIMIT);
}

// Intent: splice a prediction into the current input while preserving word boundaries.
function buildPredictionValue(text, prediction) {
  const raw = String(text || "");
  const endsWithSpace = /\s$/.test(raw);
  const trimmed = raw.replace(/\s+$/, "");
  const tokens = trimmed.trim().split(/\s+/).filter(Boolean);

  if (!tokens.length) return prediction;
  if (endsWithSpace) {
    return `${trimmed} ${prediction}`.trim();
  }

  const base = tokens.slice(0, -1).join(" ");
  return base ? `${base} ${prediction}` : prediction;
}

function shouldShowGhost(text, prediction) {
  if (!prediction) return false;
  const raw = String(text || "");
  if (!raw.trim()) return false;
  if (/\s$/.test(raw)) return true;
  const partial = raw.trim().split(/\s+/).pop() || "";
  return prediction.toLowerCase().startsWith(partial.toLowerCase());
}

// Intent: wire prediction chips + ghost text to a single input field.
function wirePredictionController({ input, chips, ghost }) {
  if (!input || !chips || !ghost) return;
  let predictions = [];

  function renderChips() {
    chips.innerHTML = "";
    if (!predictions.length) {
      chips.hidden = true;
      return;
    }

    const fragment = document.createDocumentFragment();
    predictions.forEach((word, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "prediction-chip";
      button.dataset.index = String(index);
      button.textContent = word;
      fragment.appendChild(button);
      if (index < predictions.length - 1) {
        const divider = document.createElement("span");
        divider.className = "prediction-divider";
        divider.textContent = "•";
        fragment.appendChild(divider);
      }
    });
    chips.appendChild(fragment);
    chips.hidden = false;
  }

  function renderGhost() {
    const primary = predictions[0];
    if (!shouldShowGhost(input.value, primary)) {
      ghost.textContent = "";
      ghost.hidden = true;
      return;
    }
    ghost.textContent = buildPredictionValue(input.value, primary);
    ghost.hidden = false;
  }

  function refresh() {
    predictions = getPredictions(input.value);
    renderChips();
    renderGhost();
  }

  function applyPrediction(index = 0) {
    const value = predictions[index];
    if (!value) return;
    const nextValue = buildPredictionValue(input.value, value);
    input.value = nextValue;
    input.setSelectionRange(nextValue.length, nextValue.length);
    refresh();
  }

  input.addEventListener("input", refresh);
  input.addEventListener("focus", refresh);
  input.addEventListener("blur", () => {
    // Guardrail: delay hiding so clicks on chips still register.
    window.setTimeout(() => {
      chips.hidden = true;
      ghost.hidden = true;
    }, 120);
  });

  input.addEventListener("keydown", (event) => {
    if (event.key === "Tab" && predictions.length) {
      event.preventDefault();
      applyPrediction(0);
    }
    if (event.key === "Escape") {
      chips.hidden = true;
      ghost.hidden = true;
    }
  });

  chips.addEventListener("mousedown", (event) => {
    event.preventDefault();
  });

  chips.addEventListener("click", (event) => {
    const button = event.target.closest(".prediction-chip");
    if (!button) return;
    const index = Number(button.dataset.index);
    if (Number.isNaN(index)) return;
    applyPrediction(index);
  });
}

// Color, group, and layout normalization helpers.
function isHexColor(value) {
  return /^#[0-9a-f]{6}$/i.test(String(value || ""));
}

function normalizeHexColor(value) {
  const clean = String(value || "").trim().replace(/^#/, "");
  if (/^[0-9a-f]{3}$/i.test(clean)) {
    return `#${clean
      .split("")
      .map((char) => char + char)
      .join("")}`.toLowerCase();
  }
  if (/^[0-9a-f]{6}$/i.test(clean)) {
    return `#${clean}`.toLowerCase();
  }
  return "";
}

function normalizeGroup(value, fallback = defaultGroup) {
  const normalized = String(value || "").trim();
  if (!normalized) return "";
  return normalized.toLowerCase() === "all" ? fallback : normalized;
}

function normalizeGroupList(value, fallback = defaultGroup) {
  const list = Array.isArray(value) ? value : [];
  const groups = [];
  list.forEach((group) => {
    const clean = normalizeGroup(group, fallback) || fallback;
    if (!groups.includes(clean)) groups.push(clean);
  });
  if (!groups.includes(fallback)) groups.unshift(fallback);
  return groups;
}

function getDefaultGroupName() {
  return settings?.defaultGroupName || defaultGroup;
}

function normalizePositionEntry(value) {
  const x = Number(value?.x);
  const y = Number(value?.y);
  return {
    x: Number.isFinite(x) ? x : 0,
    y: Number.isFinite(y) ? y : 0
  };
}

function normalizePositions(value) {
  const result = {};
  Object.keys(defaultSettings.elementPositions).forEach((key) => {
    const entry = value?.[key] ?? defaultSettings.elementPositions[key];
    result[key] = normalizePositionEntry(entry);
  });
  return result;
}

function getUniqueGroupName(base, groups) {
  let candidate = base;
  let index = 2;
  while (groups.includes(candidate) || candidate.toLowerCase() === "all") {
    candidate = `${base} ${index}`;
    index += 1;
  }
  return candidate;
}

function clonePositions(value) {
  const normalized = normalizePositions(value);
  return Object.fromEntries(
    Object.entries(normalized).map(([key, entry]) => [key, { x: entry.x, y: entry.y }])
  );
}

// Persist the current settings snapshot.
function saveSettings() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

// Clamp numeric settings to valid bounds.
function clampNumber(value, min, max, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, Math.round(number)));
}

// Populate a select list from an options map.
function populateSelect(select, options) {
  select.innerHTML = "";
  Object.entries(options).forEach(([value, option]) => {
    const item = document.createElement("option");
    item.value = value;
    item.textContent = option.label;
    select.appendChild(item);
  });
}

// Apply settings to the DOM, CSS variables, and rendered UI.
function applySettings() {
  elements.body.classList.toggle("theme-light", settings.theme === "light");
  elements.body.classList.toggle("density-compact", settings.density === "compact");
  elements.body.classList.toggle("bg-image", settings.backgroundType === "image");
  elements.body.classList.toggle("bg-gradient", settings.backgroundType === "gradient");
  document.documentElement.style.setProperty("--accent", settings.accent);
  document.documentElement.style.setProperty("--accent-strong", settings.accent);
  document.documentElement.style.setProperty("--shortcut-columns", settings.shortcutColumns);
  document.documentElement.style.setProperty("--shortcut-grid-justify", settings.shortcutAlign);
  document.documentElement.style.setProperty(
    "--shortcut-track-size",
    settings.shortcutAlign === "stretch" ? "minmax(0, 1fr)" : "minmax(112px, 166px)"
  );
  document.documentElement.style.setProperty("--background-value", formatBackgroundValue());

  elements.searchEngine.value = settings.defaultSearch;
  elements.aiEngine.value = settings.defaultAi;
  elements.themeSetting.value = settings.theme;
  elements.densitySetting.value = settings.density;
  elements.backgroundTypeSetting.value = settings.backgroundType;
  elements.backgroundColorSetting.hidden = settings.backgroundType !== "solid";
  elements.backgroundColorSetting.value = isHexColor(settings.backgroundValue)
    ? settings.backgroundValue
    : defaultSettings.backgroundValue;
  elements.backgroundValueSetting.placeholder =
    settings.backgroundType === "solid"
      ? "#080b10"
      : settings.backgroundType === "image"
        ? "https://example.com/background.jpg"
        : "linear-gradient(...)";
  elements.backgroundValueSetting.value = settings.backgroundValue;
  elements.accentSetting.value = settings.accent;
  elements.accentTextSetting.value = settings.accent;
  elements.clockBackgroundSetting.value = String(settings.clockBackground);
  elements.editModeSetting.value = String(settings.editMode);
  if (elements.saveLayout) elements.saveLayout.disabled = !settings.editMode;
  elements.defaultSearchSetting.value = settings.defaultSearch;
  elements.defaultAiSetting.value = settings.defaultAi;
  elements.shortcutColumnsSetting.value = settings.shortcutColumns;
  elements.shortcutSlotsSetting.value = settings.shortcutSlots;
  elements.shortcutAlignSetting.value = settings.shortcutAlign;
  elements.clockFormatSetting.value = settings.clockFormat;
  elements.showSecondsSetting.value = String(settings.showSeconds);

  elements.body.classList.toggle("edit-mode", settings.editMode);
  if (settings.editMode) {
    if (!layoutDraftPositions) layoutDraftPositions = clonePositions(settings.elementPositions);
  } else {
    layoutDraftPositions = null;
    elements.body.classList.remove("show-guides");
  }
  elements.localClock?.classList.toggle("clock-transparent", !settings.clockBackground);
  applyLayoutPositions();
  renderShortcutGroups();
  renderGroupEditor();
  renderShortcuts();
  renderShortcutEditor();
  renderTimeZoneOptions();
  updateClocks();
}

// Convert background settings into a CSS-ready value.
function formatBackgroundValue() {
  if (settings.backgroundType === "image") {
    return `url("${settings.backgroundValue}")`;
  }
  return settings.backgroundValue;
}

// Shortcut group and editor rendering.
function getShortcutGroups() {
  return normalizeGroupList(settings.shortcutGroups, getDefaultGroupName());
}

function renderShortcutGroups() {
  if (!elements.shortcutGroupBar) return;
  const groups = ["All", ...getShortcutGroups()];
  if (!groups.includes(activeShortcutGroup)) {
    activeShortcutGroup = "All";
  }
  elements.shortcutGroupBar.innerHTML = "";
  groups.forEach((group) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "group-button";
    if (group === activeShortcutGroup) button.classList.add("is-active");
    button.dataset.group = group;
    button.textContent = group;
    button.setAttribute("role", "tab");
    button.setAttribute("aria-selected", String(group === activeShortcutGroup));
    elements.shortcutGroupBar.appendChild(button);
  });
}

// Render the editable shortcut group list inside settings.
function renderGroupEditor() {
  if (!elements.groupEditor) return;
  elements.groupEditor.innerHTML = "";

  const groups = getShortcutGroups();
  const defaultGroupName = getDefaultGroupName();
  const defaultView = settings.defaultView || "All";

  // Update the inline note and custom count labels
  if (elements.currentDefaultCategoryText) {
    elements.currentDefaultCategoryText.textContent = defaultView;
  }

  const builtinGroups = ["Work", "Shop", "Money", "For Me", "Fun", "News", "Sports", "Travel", "Tools"];
  const customGroups = groups.filter((g) => !builtinGroups.includes(g));
  const customCount = customGroups.length;
  if (elements.customCategoriesCount) {
    elements.customCategoriesCount.textContent = `(${customCount}/5 custom)`;
  }

  // Populate styled category rows
  groups.forEach((group, index) => {
    const row = document.createElement("div");
    row.className = "category-edit-row";
    row.draggable = true;
    row.dataset.index = String(index);
    row.dataset.group = group;

    // Drag ⋮ handle
    const handle = document.createElement("div");
    handle.className = "category-drag-handle";
    handle.textContent = "⋮";
    handle.title = "Drag to reorder";

    // Colored tag icon wrapper
    const tagWrap = document.createElement("div");
    tagWrap.className = "category-tag-icon-wrap";
    tagWrap.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
        <line x1="7" y1="7" x2="7.01" y2="7" stroke-width="2" />
      </svg>
    `;

    // Editable text input for category renaming
    const input = document.createElement("input");
    input.type = "text";
    input.className = "category-name-input";
    input.value = group;
    input.placeholder = "Category name";
    input.dataset.group = group;

    // Star icon button for toggling default load view
    const starBtn = document.createElement("button");
    starBtn.type = "button";
    starBtn.className = "category-star-btn";
    starBtn.title = "Set as default view on page load";
    starBtn.ariaLabel = `Set ${group} as default view on page load`;
    if (defaultView === group) {
      starBtn.classList.add("is-default");
      starBtn.innerHTML = "★";
    } else {
      starBtn.innerHTML = "☆";
    }
    starBtn.dataset.action = "set-default";
    starBtn.dataset.group = group;

    // Delete trash bin button
    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "category-delete-btn";
    deleteBtn.title = "Delete category";
    deleteBtn.ariaLabel = `Delete category ${group}`;
    deleteBtn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:16px; height:16px;">
        <polyline points="3 6 5 6 21 6"></polyline>
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
      </svg>
    `;
    deleteBtn.dataset.action = "delete";
    deleteBtn.dataset.group = group;

    // The default group cannot be deleted
    if (group === defaultGroupName) {
      deleteBtn.disabled = true;
      deleteBtn.title = "Default category cannot be removed";
      deleteBtn.ariaLabel = "Default category cannot be removed";
    }

    row.append(handle, tagWrap, input, starBtn, deleteBtn);
    elements.groupEditor.appendChild(row);
  });
}

// Rename category in settings database and migrate existing shortcut references
function handleCategoryManagerRename(previousGroup, nextGroup) {
  if (!previousGroup || !nextGroup || previousGroup === nextGroup) return;

  const nextShortcuts = settings.shortcuts.map((shortcut) =>
    (shortcut.group || getDefaultGroupName()) === previousGroup ? { ...shortcut, group: nextGroup } : shortcut
  );
  
  const nextDefaultGroup =
    previousGroup === settings.defaultGroupName ? nextGroup : settings.defaultGroupName;
    
  const nextGroups = normalizeGroupList(
    settings.shortcutGroups.map((group) => (group === previousGroup ? nextGroup : group)),
    nextDefaultGroup
  );

  let nextDefaultView = settings.defaultView;
  if (settings.defaultView === previousGroup) {
    nextDefaultView = nextGroup;
  }

  settings = normalizeSettings({
    ...settings,
    shortcuts: nextShortcuts,
    shortcutGroups: nextGroups,
    defaultGroupName: nextDefaultGroup,
    defaultView: nextDefaultView
  });

  if (activeShortcutGroup === previousGroup) {
    activeShortcutGroup = nextGroup;
  }

  saveSettings();
  applySettings();
  renderGroupEditor();
}

// Remove category and shift shortcuts into General/default category group
function handleCategoryManagerDelete(group) {
  if (!group || group === settings.defaultGroupName) return;

  const nextShortcuts = settings.shortcuts.map((shortcut) =>
    (shortcut.group || getDefaultGroupName()) === group
      ? { ...shortcut, group: getDefaultGroupName() }
      : shortcut
  );

  const nextGroups = normalizeGroupList(
    settings.shortcutGroups.filter((entry) => entry !== group),
    settings.defaultGroupName
  );

  let nextDefaultView = settings.defaultView;
  if (settings.defaultView === group) {
    nextDefaultView = "All";
  }

  settings = normalizeSettings({
    ...settings,
    shortcuts: nextShortcuts,
    shortcutGroups: nextGroups,
    defaultGroupName: settings.defaultGroupName,
    defaultView: nextDefaultView
  });

  if (activeShortcutGroup === group) {
    activeShortcutGroup = "All";
  }

  saveSettings();
  applySettings();
  renderGroupEditor();
}

// Set default tab view loaded when visiting start page
function handleCategoryManagerSetDefault(group) {
  if (!group) return;

  // Toggle behaviour: clicking the default one resets it to load "All"
  const nextDefaultView = settings.defaultView === group ? "All" : group;

  settings = normalizeSettings({
    ...settings,
    defaultView: nextDefaultView
  });

  saveSettings();
  applySettings();
  renderGroupEditor();
}

// Layout drag/drop helpers for movable sections.
function getLayoutItems() {
  return [
    { key: "clock", element: elements.localClock },
    { key: "search", element: elements.searchStack },
    { key: "shortcuts", element: elements.shortcutPanel },
    { key: "worldClock", element: elements.worldClock },
    { key: "settingsButton", element: elements.settingsButton }
  ].filter((item) => item.element);
}

// Apply stored layout offsets to draggable elements.
function applyLayoutPositions() {
  const positions =
    settings.editMode && layoutDraftPositions ? layoutDraftPositions : settings.elementPositions;
  getLayoutItems().forEach(({ key, element }) => {
    const position = positions?.[key] || { x: 0, y: 0 };
    element.style.transform = `translate(${position.x}px, ${position.y}px)`;
  });
}

// Track draft layout positions while dragging.
function updateLayoutDraftPosition(key, x, y) {
  layoutDraftPositions = {
    ...(layoutDraftPositions || clonePositions(settings.elementPositions)),
    [key]: { x, y }
  };
  applyLayoutPositions();
}

// Enable layout edit mode and snapshot positions.
function enterEditMode() {
  if (settings.editMode) return;
  layoutDraftPositions = clonePositions(settings.elementPositions);
  settings = normalizeSettings({ ...settings, editMode: true });
  saveSettings();
  applySettings();
}

// Commit layout edits and exit edit mode.
function saveLayoutChanges() {
  if (!settings.editMode) return;
  const committed = layoutDraftPositions || clonePositions(settings.elementPositions);
  settings = normalizeSettings({ ...settings, editMode: false, elementPositions: committed });
  layoutDraftPositions = null;
  saveSettings();
  applySettings();
}

// Compute snap guide positions for alignment aids.
function getGuidePositions() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const points = [0.25, 0.5, 0.75];
  return {
    x: points.map((value) => width * value),
    y: points.map((value) => height * value)
  };
}

// Determine best snap offset for a set of candidate positions.
function getSnapOffset(values, guides, threshold) {
  let bestOffset = 0;
  let bestDistance = threshold + 1;
  guides.forEach((guide) => {
    values.forEach((value) => {
      const offset = guide - value;
      const distance = Math.abs(offset);
      if (distance < bestDistance) {
        bestDistance = distance;
        bestOffset = offset;
      }
    });
  });
  return bestDistance <= threshold ? bestOffset : 0;
}

// Begin dragging a layout element.
function handleLayoutPointerDown(event) {
  if (!settings.editMode) return;
  if (event.button && event.button !== 0) return;
  const element = event.currentTarget;
  const key = element.dataset.layoutKey;
  if (!key) return;
  event.preventDefault();
  const positions =
    settings.editMode && layoutDraftPositions ? layoutDraftPositions : settings.elementPositions;
  const position = positions?.[key] || { x: 0, y: 0 };
  const rect = element.getBoundingClientRect();
  layoutDrag = {
    key,
    element,
    startX: event.clientX,
    startY: event.clientY,
    originX: position.x,
    originY: position.y,
    lastX: position.x,
    lastY: position.y,
    baseRect: rect,
    moved: false
  };
  element.setPointerCapture(event.pointerId);
}

// Update layout element position while dragging.
function handleLayoutPointerMove(event) {
  if (!layoutDrag) return;
  const dx = event.clientX - layoutDrag.startX;
  const dy = event.clientY - layoutDrag.startY;
  const distance = Math.hypot(dx, dy);
  if (!layoutDrag.moved && distance < 4) return;
  event.preventDefault();
  layoutDrag.moved = true;
  const rect = layoutDrag.baseRect;
  const centerX = rect.left + rect.width / 2 + dx;
  const centerY = rect.top + rect.height / 2 + dy;
  const proposedRect = {
    left: rect.left + dx,
    right: rect.right + dx,
    top: rect.top + dy,
    bottom: rect.bottom + dy,
    centerX,
    centerY
  };
  const guides = getGuidePositions();
  const snapX = getSnapOffset(
    [proposedRect.left, proposedRect.centerX, proposedRect.right],
    guides.x,
    10
  );
  const snapY = getSnapOffset(
    [proposedRect.top, proposedRect.centerY, proposedRect.bottom],
    guides.y,
    10
  );
  layoutDrag.lastX = layoutDrag.originX + dx + snapX;
  layoutDrag.lastY = layoutDrag.originY + dy + snapY;
  layoutDrag.element.style.transform = `translate(${layoutDrag.lastX}px, ${layoutDrag.lastY}px)`;
  updateLayoutDraftPosition(layoutDrag.key, layoutDrag.lastX, layoutDrag.lastY);
  elements.body.classList.add("show-guides");
}

// Finish a drag and store the final position.
function handleLayoutPointerUp(event) {
  if (!layoutDrag) return;
  const drag = layoutDrag;
  layoutDrag = null;
  if (drag.element.hasPointerCapture?.(event.pointerId)) {
    drag.element.releasePointerCapture(event.pointerId);
  }
  updateLayoutDraftPosition(drag.key, drag.lastX, drag.lastY);
  if (drag.moved) suppressLayoutClick = true;
  elements.body.classList.remove("show-guides");
}

// Cancel a drag and reset visual guides.
function handleLayoutPointerCancel(event) {
  if (!layoutDrag) return;
  const drag = layoutDrag;
  layoutDrag = null;
  if (drag.element.hasPointerCapture?.(event.pointerId)) {
    drag.element.releasePointerCapture(event.pointerId);
  }
  applyLayoutPositions();
  elements.body.classList.remove("show-guides");
}

// Suppress click navigation after a drag ends.
function handleLayoutClick(event) {
  if (!settings.editMode || !suppressLayoutClick) return;
  event.preventDefault();
  event.stopPropagation();
  suppressLayoutClick = false;
}

// Register pointer handlers for draggable layout items.
function registerLayoutDraggables() {
  getLayoutItems().forEach(({ key, element }) => {
    element.dataset.layoutKey = key;
    element.classList.add("draggable");
    element.addEventListener("pointerdown", handleLayoutPointerDown);
    element.addEventListener("pointermove", handleLayoutPointerMove);
    element.addEventListener("pointerup", handleLayoutPointerUp);
    element.addEventListener("pointercancel", handleLayoutPointerCancel);
    element.addEventListener("click", handleLayoutClick, true);
  });
}

// Render the shortcut grid for the active group.
function renderShortcuts() {
  elements.shortcutGrid.innerHTML = "";
  const entries = settings.shortcuts.map((shortcut, index) => ({ shortcut, index }));
  const isAllGroups = activeShortcutGroup === "All";
  const filtered = isAllGroups
    ? entries
    : entries.filter((entry) => entry.shortcut.group === activeShortcutGroup);
  const visible = isAllGroups ? filtered.slice(0, settings.shortcutSlots) : filtered;

  visible.forEach((entry) => {
    const shortcut = entry.shortcut;
    const tile = document.createElement("a");
    tile.className = "shortcut-tile";
    tile.href = shortcut.url;
    tile.title = shortcut.url;
    tile.draggable = isAllGroups;
    tile.dataset.index = String(entry.index);
    tile.style.setProperty("--tile-color", shortcut.color || settings.accent);

    const icon = document.createElement("span");
    icon.className = "shortcut-icon";
    const img = document.createElement("img");
    img.alt = "";
    img.src = getFaviconUrl(shortcut.url);
    img.loading = "lazy";
    img.onerror = () => {
      img.remove();
      icon.textContent = getInitial(shortcut.title);
    };
    icon.appendChild(img);

    const title = document.createElement("span");
    title.className = "shortcut-title";
    title.textContent = shortcut.title;

    tile.append(icon, title);
    elements.shortcutGrid.appendChild(tile);
  });

  if (isAllGroups) {
    for (let i = visible.length; i < settings.shortcutSlots; i += 1) {
      const empty = document.createElement("button");
      empty.className = "shortcut-tile shortcut-empty";
      empty.type = "button";
      empty.title = "Add shortcut";
      empty.innerHTML = '<span class="shortcut-icon">+</span><span class="shortcut-title">Add</span>';
      empty.addEventListener("click", openSettings);
      elements.shortcutGrid.appendChild(empty);
    }
  }
}

// Render the shortcut editor list in settings.
function renderShortcutEditor() {
  if (editorRenderQueued) return;
  editorRenderQueued = true;
  requestAnimationFrame(() => {
    editorRenderQueued = false;
    elements.shortcutEditor.innerHTML = "";
    settings.shortcuts.forEach((shortcut, index) => {
      const row = document.createElement("div");
      row.className = "shortcut-edit-row";
      row.dataset.index = String(index);

      const dragButton = document.createElement("button");
      dragButton.className = "icon-button drag-handle";
      dragButton.type = "button";
      dragButton.draggable = true;
      dragButton.title = "Drag to reorder";
      dragButton.ariaLabel = "Drag to reorder shortcut";
      dragButton.dataset.action = "drag";
      dragButton.innerHTML =
        '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M9 6h.01M15 6h.01M9 12h.01M15 12h.01M9 18h.01M15 18h.01" /></svg>';

      const titleInput = document.createElement("input");
      titleInput.type = "text";
      titleInput.value = shortcut.title;
      titleInput.placeholder = "Title";
      titleInput.dataset.field = "title";

      const urlInput = document.createElement("input");
      urlInput.type = "url";
      urlInput.value = shortcut.url;
      urlInput.placeholder = "https://example.com";
      urlInput.dataset.field = "url";

      const groupInput = document.createElement("input");
      groupInput.type = "text";
      groupInput.value = shortcut.group || getDefaultGroupName();
      groupInput.placeholder = "Group";
      groupInput.dataset.field = "group";

      const removeButton = document.createElement("button");
      removeButton.className = "icon-button";
      removeButton.type = "button";
      removeButton.title = "Remove";
      removeButton.ariaLabel = "Remove shortcut";
      removeButton.dataset.action = "remove";
      removeButton.innerHTML = '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12" /></svg>';

      row.append(dragButton, titleInput, urlInput, groupInput, removeButton);
      elements.shortcutEditor.appendChild(row);
    });
  });
}

// Render time zone options and selected list.
function renderTimeZoneOptions() {
  const now = new Date();
  elements.timeZoneSelect.innerHTML = "";
  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = "Add time zone";
  elements.timeZoneSelect.appendChild(placeholder);

  timeZoneOptions.forEach((zone) => {
    const option = document.createElement("option");
    option.value = zone;
    option.textContent = `${getGmtLabel(zone, now)} - ${getCityLabel(zone)}`;
    option.disabled = settings.timeZones.includes(zone);
    elements.timeZoneSelect.appendChild(option);
  });
  elements.timeZoneSelect.value = "";

  elements.timeZonesSetting.innerHTML = "";
  settings.timeZones.forEach((zone) => {
    const item = document.createElement("div");
    item.className = "time-zone-selected-item";

    const text = document.createElement("span");
    text.textContent = `${getGmtLabel(zone, now)} - ${getCityLabel(zone)}`;

    const remove = document.createElement("button");
    remove.className = "icon-button";
    remove.type = "button";
    remove.title = "Remove";
    remove.ariaLabel = `Remove ${getCityLabel(zone)}`;
    remove.dataset.timeZone = zone;
    remove.innerHTML = '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12" /></svg>';

    item.append(text, remove);
    elements.timeZonesSetting.appendChild(item);
  });
}

// Utility helpers for shortcut display and URL normalization.
function getFaviconUrl(url) {
  const host = getHostname(url);
  return host ? `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=64` : "";
}

function getHostname(url) {
  try {
    return new URL(normalizeUrl(url)).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function getInitial(value) {
  return String(value || "?").trim().charAt(0).toUpperCase() || "?";
}

function normalizeUrl(url) {
  const trimmed = url.trim();
  if (!trimmed) return "";
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function buildUrl(template, query) {
  return template.replace("{query}", encodeURIComponent(query.trim()));
}

// Route a query to the selected engine (with optional clipboard copy).
async function openQuery(engine, query) {
  const cleanQuery = query.trim();
  if (!cleanQuery) return;

  try {
    await navigator.clipboard.writeText(cleanQuery);
  } catch {
    // Clipboard access is optional. URL routing still works without it.
  }

  window.location.href = buildUrl(engine.url, cleanQuery);
}

// Intent: shared autocomplete controller for both search rows.
function wireSuggestionController({ input, list, kind, onSelect }) {
  if (!input || !list) return;
  let items = [];
  let activeIndex = -1;
  let debounceId = 0;
  let requestId = 0;
  let activeController = null;

  function closeList() {
    if (debounceId) {
      window.clearTimeout(debounceId);
      debounceId = 0;
    }
    // Guardrail: invalidate any in-flight requests to avoid reopening on blur.
    requestId += 1;
    if (activeController) {
      activeController.abort();
      activeController = null;
    }
    items = [];
    activeIndex = -1;
    list.innerHTML = "";
    list.hidden = true;
    input.setAttribute("aria-expanded", "false");
    input.removeAttribute("aria-activedescendant");
  }

  // Added: build the Google-style prediction row shown in the requested reference.
  function appendSuggestionIcon(option) {
    const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    icon.classList.add("suggestion-icon");
    icon.setAttribute("viewBox", "0 0 24 24");
    icon.setAttribute("aria-hidden", "true");

    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("cx", "11");
    circle.setAttribute("cy", "11");
    circle.setAttribute("r", "7");
    circle.setAttribute("fill", "none");
    circle.setAttribute("stroke", "currentColor");
    circle.setAttribute("stroke-width", "2");

    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", "16.5");
    line.setAttribute("y1", "16.5");
    line.setAttribute("x2", "21");
    line.setAttribute("y2", "21");
    line.setAttribute("stroke", "currentColor");
    line.setAttribute("stroke-width", "2");
    line.setAttribute("stroke-linecap", "round");

    icon.append(circle, line);
    option.appendChild(icon);
  }

  // Added: mirror the reference highlighting: bold completion for prefixes, or the matched text inside a result.
  function appendSuggestionLabel(option, value) {
    const label = document.createElement("span");
    label.className = "suggestion-label";

    const query = input.value.trim();
    const lowerValue = value.toLowerCase();
    const lowerQuery = query.toLowerCase();
    if (query && lowerValue.startsWith(lowerQuery)) {
      label.append(document.createTextNode(value.slice(0, query.length)));
      const completion = document.createElement("strong");
      completion.className = "suggestion-completion";
      completion.textContent = value.slice(query.length);
      label.appendChild(completion);
    } else {
      const matchIndex = lowerQuery ? lowerValue.indexOf(lowerQuery) : -1;
      if (matchIndex >= 0) {
        label.append(document.createTextNode(value.slice(0, matchIndex)));
        const match = document.createElement("strong");
        match.className = "suggestion-completion";
        match.textContent = value.slice(matchIndex, matchIndex + query.length);
        label.appendChild(match);
        label.append(document.createTextNode(value.slice(matchIndex + query.length)));
      } else {
        const completion = document.createElement("strong");
        completion.className = "suggestion-completion";
        completion.textContent = value;
        label.appendChild(completion);
      }
    }

    option.appendChild(label);
  }

  function renderList() {
    list.innerHTML = "";
    if (!items.length) {
      closeList();
      return;
    }

    list.hidden = false;
    input.setAttribute("aria-expanded", "true");
    items.forEach((item, index) => {
      const option = document.createElement("button");
      option.type = "button";
      option.className = "suggestion-item";
      option.role = "option";
      option.id = `${list.id}-option-${index}`;
      option.dataset.index = String(index);
      option.setAttribute("aria-selected", index === activeIndex ? "true" : "false");
      // Modified: render prediction rows with icon + highlighted completion instead of plain text.
      appendSuggestionIcon(option);
      appendSuggestionLabel(option, item);
      if (index === activeIndex) {
        option.classList.add("is-active");
        input.setAttribute("aria-activedescendant", option.id);
      }
      list.appendChild(option);
    });

    if (activeIndex < 0) {
      input.removeAttribute("aria-activedescendant");
    }
  }

  async function refreshItems(query) {
    const cleanQuery = String(query || "").trim();
    if (cleanQuery.length < SUGGESTION_MIN_CHARS) {
      closeList();
      return;
    }

    const currentRequest = (requestId += 1);
    // Modified: show reference-style local matches first so any common word can open the dropdown.
    const localDatasetMatches = getLocalSuggestionMatches(cleanQuery);
    const localMatches = getQuerySuggestions(kind, cleanQuery);
    items = mergeSuggestions(localDatasetMatches, localMatches).slice(0, SUGGESTION_LIMIT);
    activeIndex = -1;
    renderList();

    if (activeController) activeController.abort();
    activeController = new AbortController();

    let remoteMatches = [];
    try {
      remoteMatches = await fetchRemoteSuggestions(cleanQuery, activeController.signal);
    } catch (error) {
      // Guardrail: log fetch issues while keeping local suggestions available.
      if (error?.name !== "AbortError") {
        console.warn("Suggestion fetch failed:", error);
      }
    }

    if (currentRequest !== requestId) return;
    // Modified: keep local dataset matches ahead of history and remote autocomplete matches.
    items = mergeSuggestions(mergeSuggestions(localDatasetMatches, localMatches), remoteMatches).slice(0, SUGGESTION_LIMIT);
    activeIndex = -1;
    renderList();
  }

  function scheduleRefresh(immediate = false) {
    const query = input.value;
    if (immediate) {
      if (debounceId) window.clearTimeout(debounceId);
      refreshItems(query);
      return;
    }
    if (debounceId) window.clearTimeout(debounceId);
    debounceId = window.setTimeout(() => refreshItems(query), SUGGESTION_DEBOUNCE_MS);
  }

  function selectItem(index) {
    const value = items[index];
    if (!value) return;
    input.value = value;
    closeList();
    onSelect(value);
  }

  input.addEventListener("input", () => {
    activeIndex = -1;
    scheduleRefresh();
  });

  input.addEventListener("focus", () => {
    scheduleRefresh(true);
  });

  input.addEventListener("blur", () => {
    // Guardrail: delay closing to allow click selection.
    window.setTimeout(closeList, 120);
  });

  input.addEventListener("keydown", (event) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (!items.length) {
        scheduleRefresh(true);
        return;
      }
      activeIndex = activeIndex < 0 ? 0 : Math.min(activeIndex + 1, items.length - 1);
      renderList();
      return;
    }
    if (event.key === "ArrowUp") {
      if (!items.length) return;
      event.preventDefault();
      activeIndex = Math.max(activeIndex - 1, 0);
      renderList();
      return;
    }
    if (event.key === "Enter" && activeIndex >= 0) {
      event.preventDefault();
      selectItem(activeIndex);
      return;
    }
    if (event.key === "Escape") {
      closeList();
    }
  });

  list.addEventListener("mousedown", (event) => {
    event.preventDefault();
  });

  list.addEventListener("click", (event) => {
    const button = event.target.closest(".suggestion-item");
    if (!button) return;
    const index = Number(button.dataset.index);
    if (Number.isNaN(index)) return;
    selectItem(index);
  });
}

// Update local and global clocks.
function updateClocks() {
  const now = new Date();
  elements.localLabel.textContent = `Local Time (${getLocalZoneLabel(now)})`;
  elements.localTime.innerHTML = formatLocalTime(now);

  elements.localDate.textContent = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric"
  }).format(now);

  elements.worldClockList.innerHTML = "";
  settings.timeZones.forEach((zone) => {
    const item = document.createElement("div");
    item.className = "world-time";
    item.innerHTML = `<span>${getZoneLabel(zone, now)}</span><strong>${formatZoneTime(zone, now)}</strong>`;
    elements.worldClockList.appendChild(item);
  });
}

// Format local time with optional seconds and day period.
function formatLocalTime(date) {
  const isTwelveHour = settings.clockFormat === "12";
  const parts = new Intl.DateTimeFormat(isTwelveHour ? "en-US" : [], {
    hour: isTwelveHour ? "numeric" : "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: isTwelveHour
  }).formatToParts(date);
  const hour = parts.find((part) => part.type === "hour")?.value || "--";
  const minute = parts.find((part) => part.type === "minute")?.value || "--";
  const second = parts.find((part) => part.type === "second")?.value || "--";
  const dayPeriod = parts.find((part) => part.type === "dayPeriod")?.value || "";
  const suffixes = [
    isTwelveHour ? `<span class="day-period day-period-${dayPeriod.toLowerCase()}">${dayPeriod}</span>` : "",
    settings.showSeconds ? `<span class="clock-seconds">${second}</span>` : ""
  ].join("");

  return `<span class="clock-main">${hour}:${minute}</span>${suffixes}`;
}

// Resolve local time zone label for display.
function getLocalZoneLabel(date) {
  const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return zone ? getGmtLabel(zone, date) : "";
}

// Build a readable label for a given time zone.
function getZoneLabel(zone, date) {
  try {
    return `${getZoneAbbreviation(zone, date)} - ${getCityLabel(zone)}`;
  } catch {
    return zone;
  }
}

// Compute a time zone abbreviation with fallbacks.
function getZoneAbbreviation(zone, date) {
  if (["Asia/Taipei", "Asia/Shanghai"].includes(zone)) return "CST";
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: zone,
      timeZoneName: "short"
    }).formatToParts(date);
    return parts.find((part) => part.type === "timeZoneName")?.value || getGmtLabel(zone, date);
  } catch {
    return getGmtLabel(zone, date);
  }
}

// Compute GMT offset label for a time zone.
function getGmtLabel(zone, date) {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: zone,
      timeZoneName: "shortOffset"
    }).formatToParts(date);
    return parts.find((part) => part.type === "timeZoneName")?.value || "GMT";
  } catch {
    return "GMT";
  }
}

// Extract the city segment of an IANA time zone.
function getCityLabel(zone) {
  return zone.split("/").pop().replace(/_/g, " ");
}

// Format a time for a specific time zone.
function formatZoneTime(zone, date) {
  try {
    return new Intl.DateTimeFormat([], {
      timeZone: zone,
      hour: "2-digit",
      minute: "2-digit"
    }).format(date);
  } catch {
    return "--:--";
  }
}

// Drawer open/close helpers.
function openSettings() {
  elements.drawer.classList.add("open");
  elements.drawer.setAttribute("aria-hidden", "false");
  elements.backdrop.hidden = false;
}

function closeSettings() {
  elements.drawer.classList.remove("open");
  elements.drawer.setAttribute("aria-hidden", "true");
  elements.backdrop.hidden = true;
}

// Update a single setting and re-render.
function updateSetting(key, value) {
  settings = normalizeSettings({ ...settings, [key]: value });
  saveSettings();
  applySettings();
}

// Handle settings input changes with special-case rules.
function handleSettingsInput(event) {
  const target = event.target;
  if (!(target instanceof HTMLInputElement || target instanceof HTMLSelectElement)) return;

  if (target.id === "backgroundTypeSetting") {
    updateSetting("backgroundType", target.value);
    if (target.value === "solid" && !isHexColor(settings.backgroundValue)) {
      updateSetting("backgroundValue", defaultSettings.backgroundValue);
    }
    return;
  }

  if (target.id === "backgroundColorSetting") {
    updateSetting("backgroundValue", target.value);
    return;
  }

  if (target.id === "backgroundValueSetting" && settings.backgroundType === "solid") {
    const color = normalizeHexColor(target.value);
    if (color) updateSetting("backgroundValue", color);
    return;
  }

  if (target.id === "accentSetting" || target.id === "accentTextSetting") {
    const color = normalizeHexColor(target.value);
    if (color) updateSetting("accent", color);
    return;
  }

  if (target.id === "editModeSetting") {
    if (target.value === "true") {
      enterEditMode();
      target.value = "true";
    } else {
      if (settings.editMode) {
        target.value = "true";
      } else {
        updateSetting("editMode", false);
      }
    }
    return;
  }

  if (target.id === "timeZoneSelect") {
    if (!target.value || settings.timeZones.includes(target.value)) return;
    updateSetting("timeZones", [...settings.timeZones, target.value]);
    return;
  }

  const map = {
    themeSetting: ["theme", target.value],
    densitySetting: ["density", target.value],
    clockBackgroundSetting: ["clockBackground", target.value === "true"],
    backgroundValueSetting: ["backgroundValue", target.value],
    defaultSearchSetting: ["defaultSearch", target.value],
    defaultAiSetting: ["defaultAi", target.value],
    shortcutColumnsSetting: ["shortcutColumns", target.value],
    shortcutSlotsSetting: ["shortcutSlots", target.value],
    shortcutAlignSetting: ["shortcutAlign", target.value],
    clockFormatSetting: ["clockFormat", target.value],
    showSecondsSetting: ["showSeconds", target.value === "true"]
  };

  const update = map[target.id];
  if (update) updateSetting(update[0], update[1]);
}

// Remove a selected time zone.
function handleTimeZoneRemove(event) {
  if (!(event.target instanceof Element)) return;
  const button = event.target.closest("[data-time-zone]");
  if (!button) return;
  updateSetting(
    "timeZones",
    settings.timeZones.filter((zone) => zone !== button.dataset.timeZone)
  );
}

// Reorder shortcuts within the "All" group.
function reorderShortcut(fromIndex, toIndex) {
  if (activeShortcutGroup !== "All") return;
  if (
    !Number.isInteger(fromIndex) ||
    !Number.isInteger(toIndex) ||
    fromIndex === toIndex ||
    !settings.shortcuts[fromIndex] ||
    !settings.shortcuts[toIndex]
  ) {
    return;
  }

  const nextShortcuts = [...settings.shortcuts];
  const [moved] = nextShortcuts.splice(fromIndex, 1);
  nextShortcuts.splice(toIndex, 0, moved);
  settings = normalizeSettings({ ...settings, shortcuts: nextShortcuts });
  saveSettings();
  renderShortcuts();
  renderShortcutEditor();
}

// Hit-testing helpers for drag/drop reordering.
function getShortcutTileFromPoint(x, y) {
  return document.elementFromPoint(x, y)?.closest(".shortcut-tile:not(.shortcut-empty)");
}

function getShortcutEditorRowFromPoint(x, y) {
  return document.elementFromPoint(x, y)?.closest(".shortcut-edit-row");
}

// Handle edits to shortcut rows.
function handleShortcutEditorInput(event) {
  const target = event.target;
  if (!(target instanceof HTMLInputElement)) return;
  const row = target.closest(".shortcut-edit-row");
  if (!row) return;

  const index = Number(row.dataset.index);
  const field = target.dataset.field;
  if (!Number.isInteger(index) || !field || !settings.shortcuts[index]) return;

  const nextShortcuts = [...settings.shortcuts];
  const nextValue =
    field === "url"
      ? normalizeUrl(target.value)
      : field === "group"
        ? normalizeGroup(target.value, getDefaultGroupName()) || getDefaultGroupName()
        : target.value;
  nextShortcuts[index] = {
    ...nextShortcuts[index],
    [field]: nextValue
  };
  const nextGroups =
    field === "group"
      ? normalizeGroupList([...settings.shortcutGroups, nextValue], getDefaultGroupName())
      : settings.shortcutGroups;
  settings = normalizeSettings({ ...settings, shortcuts: nextShortcuts, shortcutGroups: nextGroups });
  saveSettings();
  renderShortcutGroups();
  renderGroupEditor();
  renderShortcuts();
}

// Handle remove actions in the shortcut editor.
function handleShortcutEditorClick(event) {
  const target = event.target.closest("[data-action]");
  if (!target) return;

  const row = target.closest(".shortcut-edit-row");
  const index = Number(row?.dataset.index);
  if (!Number.isInteger(index)) return;

  if (target.dataset.action !== "remove") return;

  settings.shortcuts.splice(index, 1);
  settings = normalizeSettings(settings);
  saveSettings();
  applySettings();
}


// Wire up all DOM event listeners.
function wireEvents() {
  elements.searchForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const engine = searchEngines[elements.searchEngine.value] || searchEngines[settings.defaultSearch];
    recordQueryHistory("web", elements.searchInput.value);
    openQuery(engine, elements.searchInput.value);
  });

  elements.aiForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const engine = aiEngines[elements.aiEngine.value] || aiEngines[settings.defaultAi];
    recordQueryHistory("ai", elements.aiInput.value);
    openQuery(engine, elements.aiInput.value);
  });

  wireSuggestionController({
    input: elements.searchInput,
    list: elements.searchSuggestions,
    kind: "web",
    onSelect: (value) => {
      const engine = searchEngines[elements.searchEngine.value] || searchEngines[settings.defaultSearch];
      recordQueryHistory("web", value);
      openQuery(engine, value);
    }
  });

  wireSuggestionController({
    input: elements.aiInput,
    list: elements.aiSuggestions,
    kind: "ai",
    onSelect: (value) => {
      const engine = aiEngines[elements.aiEngine.value] || aiEngines[settings.defaultAi];
      recordQueryHistory("ai", value);
      openQuery(engine, value);
    }
  });

  wirePredictionController({
    input: elements.searchInput,
    chips: elements.searchPredictions,
    ghost: elements.searchGhost
  });

  wirePredictionController({
    input: elements.aiInput,
    chips: elements.aiPredictions,
    ghost: elements.aiGhost
  });

  elements.searchEngine.addEventListener("change", () => updateSetting("defaultSearch", elements.searchEngine.value));
  elements.aiEngine.addEventListener("change", () => updateSetting("defaultAi", elements.aiEngine.value));
  elements.settingsButton.addEventListener("click", openSettings);
  elements.closeSettings.addEventListener("click", closeSettings);
  elements.backdrop.addEventListener("click", closeSettings);

  elements.drawer.addEventListener("input", handleSettingsInput);
  elements.drawer.addEventListener("change", handleSettingsInput);
  elements.shortcutEditor.addEventListener("change", handleShortcutEditorInput);
  elements.shortcutEditor.addEventListener("click", handleShortcutEditorClick);
  elements.timeZonesSetting.addEventListener("click", handleTimeZoneRemove);
  // Inline Category Manager: rename via category-name-input change
  elements.groupEditor?.addEventListener("change", (event) => {
    const target = event.target;
    if (target && target.classList.contains("category-name-input")) {
      const previousGroup = target.dataset.group;
      const nextGroup = normalizeGroup(target.value, getDefaultGroupName()) || getDefaultGroupName();
      handleCategoryManagerRename(previousGroup, nextGroup);
    }
  });

  // Inline Category Manager: star and delete button actions
  elements.groupEditor?.addEventListener("click", (event) => {
    const btn = event.target.closest(".category-edit-row button");
    if (!btn) return;
    const action = btn.dataset.action;
    const group = btn.dataset.group;
    if (action === "set-default") {
      handleCategoryManagerSetDefault(group);
    } else if (action === "delete") {
      handleCategoryManagerDelete(group);
    }
  });

  // Inline Category Manager: CREATE CATEGORY button
  elements.addGroup?.addEventListener("click", () => {
    const groups = getShortcutGroups();
    const builtinGroups = ["Work", "Shop", "Money", "For Me", "Fun", "News", "Sports", "Travel", "Tools"];
    const customGroups = groups.filter((g) => !builtinGroups.includes(g));
    if (customGroups.length >= 5) {
      alert("Maximum of 5 custom categories reached.");
      return;
    }
    const name = getUniqueGroupName("New Category", groups);
    const nextGroups = normalizeGroupList([...settings.shortcutGroups, name], settings.defaultGroupName);
    settings = normalizeSettings({ ...settings, shortcutGroups: nextGroups });
    activeShortcutGroup = name;
    saveSettings();
    applySettings();
    setTimeout(() => {
      const inputs = elements.groupEditor ? elements.groupEditor.querySelectorAll(".category-name-input") : [];
      const lastInput = inputs[inputs.length - 1];
      if (lastInput) {
        lastInput.focus();
        lastInput.select();
      }
    }, 50);
  });
  elements.saveLayout?.addEventListener("click", () => {
    saveLayoutChanges();
  });
  elements.shortcutGroupBar?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-group]");
    if (!button) return;
    activeShortcutGroup = button.dataset.group || "All";
    renderShortcutGroups();
    renderShortcuts();
  });

  elements.shortcutEditor.addEventListener("dragstart", (event) => {
    const row = event.target.closest(".shortcut-edit-row");
    if (!row) return;
    if (!event.target.closest("[data-action='drag']")) {
      event.preventDefault();
      return;
    }
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", row.dataset.index);
    requestAnimationFrame(() => row.classList.add("is-dragging"));
  });

  elements.shortcutEditor.addEventListener("dragend", (event) => {
    event.target.closest(".shortcut-edit-row")?.classList.remove("is-dragging");
    elements.shortcutEditor.querySelectorAll(".is-drop-target").forEach((row) => {
      row.classList.remove("is-drop-target");
    });
  });

  elements.shortcutEditor.addEventListener("dragover", (event) => {
    const row = event.target.closest(".shortcut-edit-row");
    if (!row) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    elements.shortcutEditor.querySelectorAll(".is-drop-target").forEach((item) => {
      if (item !== row) item.classList.remove("is-drop-target");
    });
    row.classList.add("is-drop-target");
  });

  elements.shortcutEditor.addEventListener("dragleave", (event) => {
    const row = event.target.closest(".shortcut-edit-row");
    if (!row || row.contains(event.relatedTarget)) return;
    row.classList.remove("is-drop-target");
  });

  elements.shortcutEditor.addEventListener("drop", (event) => {
    const row = event.target.closest(".shortcut-edit-row");
    if (!row) return;
    event.preventDefault();
    const fromIndex = Number(event.dataTransfer.getData("text/plain"));
    reorderShortcut(fromIndex, Number(row.dataset.index));
  });

  elements.shortcutEditor.addEventListener("pointerdown", (event) => {
    const handle = event.target.closest("[data-action='drag']");
    const row = handle?.closest(".shortcut-edit-row");
    if (!row) return;
    event.preventDefault();
    shortcutEditorPointerDrag = {
      fromIndex: Number(row.dataset.index),
      startX: event.clientX,
      startY: event.clientY,
      handle,
      targetRow: row,
      moved: false
    };
    handle.setPointerCapture(event.pointerId);
  });

  elements.shortcutEditor.addEventListener("pointermove", (event) => {
    if (!shortcutEditorPointerDrag) return;
    const distance = Math.hypot(
      event.clientX - shortcutEditorPointerDrag.startX,
      event.clientY - shortcutEditorPointerDrag.startY
    );
    if (distance < 8 && !shortcutEditorPointerDrag.moved) return;

    event.preventDefault();
    shortcutEditorPointerDrag.moved = true;
    shortcutEditorPointerDrag.targetRow.classList.add("is-dragging");

    const row = getShortcutEditorRowFromPoint(event.clientX, event.clientY);
    elements.shortcutEditor.querySelectorAll(".is-drop-target").forEach((item) => {
      if (item !== row) item.classList.remove("is-drop-target");
    });
    row?.classList.add("is-drop-target");
  });

  elements.shortcutEditor.addEventListener("pointerup", (event) => {
    if (!shortcutEditorPointerDrag) return;
    const drag = shortcutEditorPointerDrag;
    shortcutEditorPointerDrag = null;
    if (drag.handle.hasPointerCapture?.(event.pointerId)) {
      drag.handle.releasePointerCapture(event.pointerId);
    }
    drag.targetRow.classList.remove("is-dragging");

    const row = getShortcutEditorRowFromPoint(event.clientX, event.clientY);
    elements.shortcutEditor.querySelectorAll(".is-drop-target").forEach((item) => {
      item.classList.remove("is-drop-target");
    });

    if (drag.moved) {
      event.preventDefault();
      reorderShortcut(drag.fromIndex, Number(row?.dataset.index));
    }
  });

  elements.shortcutEditor.addEventListener("pointercancel", () => {
    if (!shortcutEditorPointerDrag) return;
    shortcutEditorPointerDrag.targetRow.classList.remove("is-dragging");
    shortcutEditorPointerDrag = null;
    elements.shortcutEditor.querySelectorAll(".is-drop-target").forEach((item) => {
      item.classList.remove("is-drop-target");
    });
  });

  elements.shortcutGrid.addEventListener("dragstart", (event) => {
    if (activeShortcutGroup !== "All") return;
    const tile = event.target.closest(".shortcut-tile:not(.shortcut-empty)");
    if (!tile) return;
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", tile.dataset.index);
    requestAnimationFrame(() => tile.classList.add("is-dragging"));
  });

  elements.shortcutGrid.addEventListener("dragend", (event) => {
    event.target.closest(".shortcut-tile")?.classList.remove("is-dragging");
    elements.shortcutGrid.querySelectorAll(".is-drop-target").forEach((tile) => {
      tile.classList.remove("is-drop-target");
    });
  });

  elements.shortcutGrid.addEventListener("dragover", (event) => {
    if (activeShortcutGroup !== "All") return;
    const tile = event.target.closest(".shortcut-tile:not(.shortcut-empty)");
    if (!tile) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    elements.shortcutGrid.querySelectorAll(".is-drop-target").forEach((item) => {
      if (item !== tile) item.classList.remove("is-drop-target");
    });
    tile.classList.add("is-drop-target");
  });

  elements.shortcutGrid.addEventListener("dragleave", (event) => {
    const tile = event.target.closest(".shortcut-tile:not(.shortcut-empty)");
    if (!tile || tile.contains(event.relatedTarget)) return;
    tile.classList.remove("is-drop-target");
  });

  elements.shortcutGrid.addEventListener("drop", (event) => {
    if (activeShortcutGroup !== "All") return;
    const tile = event.target.closest(".shortcut-tile:not(.shortcut-empty)");
    if (!tile) return;
    event.preventDefault();
    reorderShortcut(Number(event.dataTransfer.getData("text/plain")), Number(tile.dataset.index));
  });

  elements.shortcutGrid.addEventListener(
    "click",
    (event) => {
      if (!suppressShortcutClick) return;
      event.preventDefault();
      suppressShortcutClick = false;
    },
    true
  );

  elements.shortcutGrid.addEventListener("pointerdown", (event) => {
    if (activeShortcutGroup !== "All") return;
    const tile = event.target.closest(".shortcut-tile:not(.shortcut-empty)");
    if (!tile || event.pointerType === "mouse") return;
    shortcutPointerDrag = {
      fromIndex: Number(tile.dataset.index),
      startX: event.clientX,
      startY: event.clientY,
      targetTile: tile,
      moved: false
    };
    tile.setPointerCapture(event.pointerId);
  });

  elements.shortcutGrid.addEventListener("pointermove", (event) => {
    if (!shortcutPointerDrag) return;
    const distance = Math.hypot(event.clientX - shortcutPointerDrag.startX, event.clientY - shortcutPointerDrag.startY);
    if (distance < 10 && !shortcutPointerDrag.moved) return;

    event.preventDefault();
    shortcutPointerDrag.moved = true;
    shortcutPointerDrag.targetTile.classList.add("is-dragging");

    const tile = getShortcutTileFromPoint(event.clientX, event.clientY);
    elements.shortcutGrid.querySelectorAll(".is-drop-target").forEach((item) => {
      if (item !== tile) item.classList.remove("is-drop-target");
    });
    tile?.classList.add("is-drop-target");
  });

  elements.shortcutGrid.addEventListener("pointerup", (event) => {
    if (!shortcutPointerDrag) return;
    const drag = shortcutPointerDrag;
    shortcutPointerDrag = null;
    drag.targetTile.releasePointerCapture(event.pointerId);
    drag.targetTile.classList.remove("is-dragging");

    const tile = getShortcutTileFromPoint(event.clientX, event.clientY);
    elements.shortcutGrid.querySelectorAll(".is-drop-target").forEach((item) => {
      item.classList.remove("is-drop-target");
    });

    if (drag.moved) {
      event.preventDefault();
      suppressShortcutClick = true;
      reorderShortcut(drag.fromIndex, Number(tile?.dataset.index));
    }
  });

  elements.addShortcut.addEventListener("click", () => {
    const group = activeShortcutGroup === "All" ? getDefaultGroupName() : activeShortcutGroup;
    settings.shortcuts.push({
      title: "New Shortcut",
      url: "https://example.com",
      color: settings.accent,
      group
    });
    settings = normalizeSettings(settings);
    saveSettings();
    applySettings();
  });

  elements.exportSettings.addEventListener("click", () => {
    elements.settingsJson.value = JSON.stringify(settings, null, 2);
    elements.settingsJson.focus();
  });

  elements.importSettings.addEventListener("click", () => {
    if (!elements.settingsJson.value.trim()) return;
    try {
      settings = normalizeSettings(JSON.parse(elements.settingsJson.value));
      saveSettings();
      applySettings();
    } catch {
      elements.settingsJson.value = "Invalid JSON. Please check the imported settings.";
    }
  });

  elements.resetSettings.addEventListener("click", () => {
    settings = normalizeSettings(defaultSettings);
    saveSettings();
    applySettings();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeSettings();
    }
    if (event.key === "/" && document.activeElement === document.body) {
      event.preventDefault();
      elements.searchInput.focus();
    }
  });



  // Drag and drop delegated listeners
  document.addEventListener("dragstart", (event) => {
    const row = event.target.closest(".category-edit-row");
    if (!row) return;
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", row.dataset.index);
    requestAnimationFrame(() => row.classList.add("is-dragging"));
  });

  document.addEventListener("dragend", (event) => {
    const row = event.target.closest(".category-edit-row");
    if (!row) return;
    row.classList.remove("is-dragging");
    document.querySelectorAll(".category-edit-row.is-drop-target").forEach((item) => {
      item.classList.remove("is-drop-target");
    });
  });

  document.addEventListener("dragover", (event) => {
    const row = event.target.closest(".category-edit-row");
    if (!row) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    document.querySelectorAll(".category-edit-row.is-drop-target").forEach((item) => {
      if (item !== row) item.classList.remove("is-drop-target");
    });
    row.classList.add("is-drop-target");
  });

  document.addEventListener("dragleave", (event) => {
    const row = event.target.closest(".category-edit-row");
    if (!row || row.contains(event.relatedTarget)) return;
    row.classList.remove("is-drop-target");
  });

  document.addEventListener("drop", (event) => {
    const row = event.target.closest(".category-edit-row");
    if (!row) return;
    event.preventDefault();
    const fromIndex = Number(event.dataTransfer.getData("text/plain"));
    const toIndex = Number(row.dataset.index);
    if (fromIndex !== toIndex && !Number.isNaN(fromIndex) && !Number.isNaN(toIndex)) {
      const groups = getShortcutGroups();
      const [movedGroup] = groups.splice(fromIndex, 1);
      groups.splice(toIndex, 0, movedGroup);
      settings = normalizeSettings({ ...settings, shortcutGroups: groups });
      saveSettings();
      applySettings();
      renderGroupEditor();
    }
  });
}

// Bootstrap the page once DOM is ready.
function init() {
  /* Category Manager Addition: Load saved default view on page load */
  if (settings.defaultView) {
    activeShortcutGroup = settings.defaultView;
  }
  populateSelect(elements.searchEngine, searchEngines);
  populateSelect(elements.defaultSearchSetting, searchEngines);
  populateSelect(elements.aiEngine, aiEngines);
  populateSelect(elements.defaultAiSetting, aiEngines);
  registerLayoutDraggables();
  wireEvents();
  applySettings();
  setInterval(updateClocks, 1000);
}

init();
