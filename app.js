const STORAGE_KEY = "custom-start-page-settings-v1";

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

const defaultSettings = {
  theme: "dark",
  density: "comfortable",
  accent: "#34d399",
  backgroundType: "solid",
  backgroundValue: "#080b10",
  defaultSearch: "bing",
  defaultAi: "googleAi",
  shortcutColumns: 4,
  shortcutSlots: 12,
  timeZones: ["America/New_York", "America/Los_Angeles"],
  shortcuts: [
    { title: "Bing", url: "https://www.bing.com", color: "#0ea5e9" },
    { title: "Google", url: "https://www.google.com", color: "#22c55e" },
    { title: "ChatGPT", url: "https://chatgpt.com", color: "#10a37f" },
    { title: "Claude", url: "https://claude.ai", color: "#d97706" },
    { title: "Gemini", url: "https://gemini.google.com", color: "#8b5cf6" },
    { title: "YouTube", url: "https://www.youtube.com", color: "#ef4444" },
    { title: "GitHub", url: "https://github.com", color: "#64748b" },
    { title: "Outlook", url: "https://outlook.office.com", color: "#2563eb" }
  ]
};

let settings = loadSettings();
let editorRenderQueued = false;

const elements = {
  body: document.body,
  localLabel: document.getElementById("localLabel"),
  localTime: document.getElementById("localTime"),
  localDate: document.getElementById("localDate"),
  worldClockList: document.getElementById("worldClockList"),
  searchForm: document.getElementById("searchForm"),
  aiForm: document.getElementById("aiForm"),
  searchInput: document.getElementById("searchInput"),
  aiInput: document.getElementById("aiInput"),
  searchEngine: document.getElementById("searchEngine"),
  aiEngine: document.getElementById("aiEngine"),
  shortcutGrid: document.getElementById("shortcutGrid"),
  settingsButton: document.getElementById("settingsButton"),
  closeSettings: document.getElementById("closeSettings"),
  drawer: document.getElementById("settingsDrawer"),
  backdrop: document.getElementById("drawerBackdrop"),
  themeSetting: document.getElementById("themeSetting"),
  densitySetting: document.getElementById("densitySetting"),
  backgroundTypeSetting: document.getElementById("backgroundTypeSetting"),
  backgroundValueSetting: document.getElementById("backgroundValueSetting"),
  accentSetting: document.getElementById("accentSetting"),
  defaultSearchSetting: document.getElementById("defaultSearchSetting"),
  defaultAiSetting: document.getElementById("defaultAiSetting"),
  shortcutColumnsSetting: document.getElementById("shortcutColumnsSetting"),
  shortcutSlotsSetting: document.getElementById("shortcutSlotsSetting"),
  shortcutEditor: document.getElementById("shortcutEditor"),
  addShortcut: document.getElementById("addShortcut"),
  timeZonesSetting: document.getElementById("timeZonesSetting"),
  exportSettings: document.getElementById("exportSettings"),
  importSettings: document.getElementById("importSettings"),
  resetSettings: document.getElementById("resetSettings"),
  settingsJson: document.getElementById("settingsJson")
};

function loadSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return normalizeSettings({ ...defaultSettings, ...saved });
  } catch {
    return normalizeSettings(defaultSettings);
  }
}

function normalizeSettings(value) {
  const merged = {
    ...defaultSettings,
    ...value,
    shortcuts: Array.isArray(value.shortcuts) ? value.shortcuts : defaultSettings.shortcuts,
    timeZones: Array.isArray(value.timeZones) ? value.timeZones : defaultSettings.timeZones
  };

  merged.shortcutColumns = clampNumber(merged.shortcutColumns, 2, 8, defaultSettings.shortcutColumns);
  merged.shortcutSlots = clampNumber(merged.shortcutSlots, 4, 48, defaultSettings.shortcutSlots);
  merged.shortcuts = merged.shortcuts
    .filter((item) => item && item.url)
    .map((item) => ({
      title: String(item.title || getHostname(item.url) || "Shortcut"),
      url: normalizeUrl(String(item.url || "")),
      color: String(item.color || defaultSettings.accent)
    }))
    .filter((item) => item.url);

  if (!searchEngines[merged.defaultSearch]) merged.defaultSearch = defaultSettings.defaultSearch;
  if (!aiEngines[merged.defaultAi]) merged.defaultAi = defaultSettings.defaultAi;
  if (!["dark", "light"].includes(merged.theme)) merged.theme = defaultSettings.theme;
  if (!["comfortable", "compact"].includes(merged.density)) merged.density = defaultSettings.density;
  if (!["solid", "gradient", "image"].includes(merged.backgroundType)) {
    merged.backgroundType = defaultSettings.backgroundType;
  }

  return merged;
}

function saveSettings() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

function clampNumber(value, min, max, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, Math.round(number)));
}

function populateSelect(select, options) {
  select.innerHTML = "";
  Object.entries(options).forEach(([value, option]) => {
    const item = document.createElement("option");
    item.value = value;
    item.textContent = option.label;
    select.appendChild(item);
  });
}

function applySettings() {
  elements.body.classList.toggle("theme-light", settings.theme === "light");
  elements.body.classList.toggle("density-compact", settings.density === "compact");
  elements.body.classList.toggle("bg-image", settings.backgroundType === "image");
  elements.body.classList.toggle("bg-gradient", settings.backgroundType === "gradient");
  document.documentElement.style.setProperty("--accent", settings.accent);
  document.documentElement.style.setProperty("--accent-strong", settings.accent);
  document.documentElement.style.setProperty("--shortcut-columns", settings.shortcutColumns);
  document.documentElement.style.setProperty("--background-value", formatBackgroundValue());

  elements.searchEngine.value = settings.defaultSearch;
  elements.aiEngine.value = settings.defaultAi;
  elements.themeSetting.value = settings.theme;
  elements.densitySetting.value = settings.density;
  elements.backgroundTypeSetting.value = settings.backgroundType;
  elements.backgroundValueSetting.value = settings.backgroundValue;
  elements.accentSetting.value = settings.accent;
  elements.defaultSearchSetting.value = settings.defaultSearch;
  elements.defaultAiSetting.value = settings.defaultAi;
  elements.shortcutColumnsSetting.value = settings.shortcutColumns;
  elements.shortcutSlotsSetting.value = settings.shortcutSlots;
  elements.timeZonesSetting.value = settings.timeZones.join(", ");

  renderShortcuts();
  renderShortcutEditor();
  updateClocks();
}

function formatBackgroundValue() {
  if (settings.backgroundType === "image") {
    return `url("${settings.backgroundValue}")`;
  }
  return settings.backgroundValue;
}

function renderShortcuts() {
  elements.shortcutGrid.innerHTML = "";
  const visible = settings.shortcuts.slice(0, settings.shortcutSlots);

  visible.forEach((shortcut) => {
    const tile = document.createElement("a");
    tile.className = "shortcut-tile";
    tile.href = shortcut.url;
    tile.title = shortcut.url;
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

      const removeButton = document.createElement("button");
      removeButton.className = "icon-button";
      removeButton.type = "button";
      removeButton.title = "Remove";
      removeButton.ariaLabel = "Remove shortcut";
      removeButton.dataset.action = "remove";
      removeButton.innerHTML = '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12" /></svg>';

      row.append(titleInput, urlInput, removeButton);
      elements.shortcutEditor.appendChild(row);
    });
  });
}

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

function updateClocks() {
  const now = new Date();
  elements.localLabel.textContent = `Local Time (${getLocalZoneLabel(now)})`;
  elements.localTime.textContent = new Intl.DateTimeFormat([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  }).format(now);

  elements.localDate.textContent = new Intl.DateTimeFormat([], {
    weekday: "long",
    year: "numeric",
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

function getLocalZoneLabel(date) {
  const parts = new Intl.DateTimeFormat([], {
    timeZoneName: "short"
  }).formatToParts(date);
  return parts.find((part) => part.type === "timeZoneName")?.value || "";
}

function getZoneLabel(zone, date) {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: zone,
      timeZoneName: "short"
    }).formatToParts(date);
    return parts.find((part) => part.type === "timeZoneName")?.value || zone;
  } catch {
    return zone;
  }
}

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

function updateSetting(key, value) {
  settings = normalizeSettings({ ...settings, [key]: value });
  saveSettings();
  applySettings();
}

function handleSettingsInput(event) {
  const target = event.target;
  if (!(target instanceof HTMLInputElement || target instanceof HTMLSelectElement)) return;

  const map = {
    themeSetting: ["theme", target.value],
    densitySetting: ["density", target.value],
    backgroundTypeSetting: ["backgroundType", target.value],
    backgroundValueSetting: ["backgroundValue", target.value],
    accentSetting: ["accent", target.value],
    defaultSearchSetting: ["defaultSearch", target.value],
    defaultAiSetting: ["defaultAi", target.value],
    shortcutColumnsSetting: ["shortcutColumns", target.value],
    shortcutSlotsSetting: ["shortcutSlots", target.value],
    timeZonesSetting: [
      "timeZones",
      target.value
        .split(",")
        .map((zone) => zone.trim())
        .filter(Boolean)
    ]
  };

  const update = map[target.id];
  if (update) updateSetting(update[0], update[1]);
}

function handleShortcutEditorInput(event) {
  const target = event.target;
  if (!(target instanceof HTMLInputElement)) return;
  const row = target.closest(".shortcut-edit-row");
  if (!row) return;

  const index = Number(row.dataset.index);
  const field = target.dataset.field;
  if (!Number.isInteger(index) || !field || !settings.shortcuts[index]) return;

  const nextShortcuts = [...settings.shortcuts];
  nextShortcuts[index] = {
    ...nextShortcuts[index],
    [field]: field === "url" ? normalizeUrl(target.value) : target.value
  };
  settings = normalizeSettings({ ...settings, shortcuts: nextShortcuts });
  saveSettings();
  renderShortcuts();
}

function handleShortcutEditorClick(event) {
  const target = event.target.closest("[data-action='remove']");
  if (!target) return;

  const row = target.closest(".shortcut-edit-row");
  const index = Number(row?.dataset.index);
  if (!Number.isInteger(index)) return;

  settings.shortcuts.splice(index, 1);
  settings = normalizeSettings(settings);
  saveSettings();
  applySettings();
}

function wireEvents() {
  elements.searchForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const engine = searchEngines[elements.searchEngine.value] || searchEngines[settings.defaultSearch];
    openQuery(engine, elements.searchInput.value);
  });

  elements.aiForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const engine = aiEngines[elements.aiEngine.value] || aiEngines[settings.defaultAi];
    openQuery(engine, elements.aiInput.value);
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

  elements.addShortcut.addEventListener("click", () => {
    settings.shortcuts.push({
      title: "New Shortcut",
      url: "https://example.com",
      color: settings.accent
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
    if (event.key === "Escape") closeSettings();
    if (event.key === "/" && document.activeElement === document.body) {
      event.preventDefault();
      elements.searchInput.focus();
    }
  });
}

function init() {
  populateSelect(elements.searchEngine, searchEngines);
  populateSelect(elements.defaultSearchSetting, searchEngines);
  populateSelect(elements.aiEngine, aiEngines);
  populateSelect(elements.defaultAiSetting, aiEngines);
  wireEvents();
  applySettings();
  setInterval(updateClocks, 1000);
}

init();
