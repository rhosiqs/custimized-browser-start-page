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

const defaultGroup = "General";

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
  backgroundType: "solid",
  backgroundValue: "#080b10",
  defaultSearch: "bing",
  defaultAi: "googleAi",
  shortcutColumns: 4,
  shortcutSlots: 12,
  shortcutAlign: "stretch",
  defaultGroupName: defaultGroup,
  shortcutGroups: [defaultGroup, "Search", "AI", "Media", "Work"],
  clockFormat: "24",
  showSeconds: true,
  timeZones: ["America/New_York", "America/Los_Angeles"],
  shortcuts: [
    { title: "Bing", url: "https://www.bing.com", color: "#0ea5e9", group: "Search" },
    { title: "Google", url: "https://www.google.com", color: "#22c55e", group: "Search" },
    { title: "ChatGPT", url: "https://chatgpt.com", color: "#10a37f", group: "AI" },
    { title: "Claude", url: "https://claude.ai", color: "#d97706", group: "AI" },
    { title: "Gemini", url: "https://gemini.google.com", color: "#8b5cf6", group: "AI" },
    { title: "YouTube", url: "https://www.youtube.com", color: "#ef4444", group: "Media" },
    { title: "GitHub", url: "https://github.com", color: "#64748b", group: "Work" },
    { title: "Outlook", url: "https://outlook.office.com", color: "#2563eb", group: "Work" }
  ]
};

let settings = loadSettings();
let editorRenderQueued = false;
let shortcutPointerDrag = null;
let suppressShortcutClick = false;
let shortcutEditorPointerDrag = null;
let activeShortcutGroup = "All";
let layoutDrag = null;
let suppressLayoutClick = false;

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
  const baseDefaultGroup = normalizeGroup(value.defaultGroupName, defaultGroup) || defaultGroup;
  const baseGroups =
    Array.isArray(value.shortcutGroups) && value.shortcutGroups.length
      ? normalizeGroupList(value.shortcutGroups, baseDefaultGroup)
      : normalizeGroupList(defaultSettings.shortcutGroups, baseDefaultGroup);

  const merged = {
    ...defaultSettings,
    ...value,
    shortcuts: Array.isArray(value.shortcuts) ? value.shortcuts : defaultSettings.shortcuts,
    timeZones: Array.isArray(value.timeZones)
      ? value.timeZones.filter((zone) => timeZoneOptions.includes(zone))
      : defaultSettings.timeZones,
    defaultGroupName: baseDefaultGroup,
    shortcutGroups: baseGroups,
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
  elements.defaultSearchSetting.value = settings.defaultSearch;
  elements.defaultAiSetting.value = settings.defaultAi;
  elements.shortcutColumnsSetting.value = settings.shortcutColumns;
  elements.shortcutSlotsSetting.value = settings.shortcutSlots;
  elements.shortcutAlignSetting.value = settings.shortcutAlign;
  elements.clockFormatSetting.value = settings.clockFormat;
  elements.showSecondsSetting.value = String(settings.showSeconds);

  elements.body.classList.toggle("edit-mode", settings.editMode);
  elements.localClock?.classList.toggle("clock-transparent", !settings.clockBackground);
  applyLayoutPositions();
  renderShortcutGroups();
  renderGroupEditor();
  renderShortcuts();
  renderShortcutEditor();
  renderTimeZoneOptions();
  updateClocks();
}

function formatBackgroundValue() {
  if (settings.backgroundType === "image") {
    return `url("${settings.backgroundValue}")`;
  }
  return settings.backgroundValue;
}

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

function renderGroupEditor() {
  if (!elements.groupEditor) return;
  elements.groupEditor.innerHTML = "";
  const groups = getShortcutGroups();
  groups.forEach((group) => {
    const row = document.createElement("div");
    row.className = "group-edit-row";
    row.dataset.group = group;

    const input = document.createElement("input");
    input.type = "text";
    input.value = group;
    input.placeholder = "Group name";
    input.dataset.group = group;

    const remove = document.createElement("button");
    remove.className = "icon-button";
    remove.type = "button";
    remove.title = "Remove group";
    remove.ariaLabel = "Remove group";
    remove.dataset.action = "remove";
    remove.dataset.group = group;
    remove.innerHTML = '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12" /></svg>';
    if (group === settings.defaultGroupName) {
      remove.disabled = true;
      remove.title = "Default group cannot be removed";
      remove.ariaLabel = "Default group cannot be removed";
    }

    row.append(input, remove);
    elements.groupEditor.appendChild(row);
  });
}

function getLayoutItems() {
  return [
    { key: "clock", element: elements.localClock },
    { key: "search", element: elements.searchStack },
    { key: "shortcuts", element: elements.shortcutPanel },
    { key: "worldClock", element: elements.worldClock },
    { key: "settingsButton", element: elements.settingsButton }
  ].filter((item) => item.element);
}

function applyLayoutPositions() {
  getLayoutItems().forEach(({ key, element }) => {
    const position = settings.elementPositions?.[key] || { x: 0, y: 0 };
    element.style.transform = `translate(${position.x}px, ${position.y}px)`;
  });
}

function updateLayoutPosition(key, x, y) {
  const nextPositions = {
    ...settings.elementPositions,
    [key]: { x, y }
  };
  settings = normalizeSettings({ ...settings, elementPositions: nextPositions });
  saveSettings();
  applyLayoutPositions();
}

function handleLayoutPointerDown(event) {
  if (!settings.editMode) return;
  if (event.button && event.button !== 0) return;
  const element = event.currentTarget;
  const key = element.dataset.layoutKey;
  if (!key) return;
  event.preventDefault();
  const position = settings.elementPositions?.[key] || { x: 0, y: 0 };
  layoutDrag = {
    key,
    element,
    startX: event.clientX,
    startY: event.clientY,
    originX: position.x,
    originY: position.y,
    lastX: position.x,
    lastY: position.y,
    moved: false
  };
  element.setPointerCapture(event.pointerId);
}

function handleLayoutPointerMove(event) {
  if (!layoutDrag) return;
  const dx = event.clientX - layoutDrag.startX;
  const dy = event.clientY - layoutDrag.startY;
  const distance = Math.hypot(dx, dy);
  if (!layoutDrag.moved && distance < 4) return;
  event.preventDefault();
  layoutDrag.moved = true;
  layoutDrag.lastX = layoutDrag.originX + dx;
  layoutDrag.lastY = layoutDrag.originY + dy;
  layoutDrag.element.style.transform = `translate(${layoutDrag.lastX}px, ${layoutDrag.lastY}px)`;
}

function handleLayoutPointerUp(event) {
  if (!layoutDrag) return;
  const drag = layoutDrag;
  layoutDrag = null;
  if (drag.element.hasPointerCapture?.(event.pointerId)) {
    drag.element.releasePointerCapture(event.pointerId);
  }
  updateLayoutPosition(drag.key, drag.lastX, drag.lastY);
  if (drag.moved) suppressLayoutClick = true;
}

function handleLayoutPointerCancel(event) {
  if (!layoutDrag) return;
  const drag = layoutDrag;
  layoutDrag = null;
  if (drag.element.hasPointerCapture?.(event.pointerId)) {
    drag.element.releasePointerCapture(event.pointerId);
  }
  applyLayoutPositions();
}

function handleLayoutClick(event) {
  if (!settings.editMode || !suppressLayoutClick) return;
  event.preventDefault();
  event.stopPropagation();
  suppressLayoutClick = false;
}

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

function getLocalZoneLabel(date) {
  const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return zone ? getGmtLabel(zone, date) : "";
}

function getZoneLabel(zone, date) {
  try {
    return `${getZoneAbbreviation(zone, date)} - ${getCityLabel(zone)}`;
  } catch {
    return zone;
  }
}

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

function getCityLabel(zone) {
  return zone.split("/").pop().replace(/_/g, " ");
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

  if (target.id === "timeZoneSelect") {
    if (!target.value || settings.timeZones.includes(target.value)) return;
    updateSetting("timeZones", [...settings.timeZones, target.value]);
    return;
  }

  const map = {
    themeSetting: ["theme", target.value],
    densitySetting: ["density", target.value],
    clockBackgroundSetting: ["clockBackground", target.value === "true"],
    editModeSetting: ["editMode", target.value === "true"],
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

function handleTimeZoneRemove(event) {
  if (!(event.target instanceof Element)) return;
  const button = event.target.closest("[data-time-zone]");
  if (!button) return;
  updateSetting(
    "timeZones",
    settings.timeZones.filter((zone) => zone !== button.dataset.timeZone)
  );
}

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

function getShortcutTileFromPoint(x, y) {
  return document.elementFromPoint(x, y)?.closest(".shortcut-tile:not(.shortcut-empty)");
}

function getShortcutEditorRowFromPoint(x, y) {
  return document.elementFromPoint(x, y)?.closest(".shortcut-edit-row");
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

function handleGroupEditorInput(event) {
  const target = event.target;
  if (!(target instanceof HTMLInputElement)) return;
  const row = target.closest(".group-edit-row");
  const previousGroup = row?.dataset.group;
  if (!previousGroup) return;
  const nextGroup = normalizeGroup(target.value, getDefaultGroupName()) || getDefaultGroupName();
  if (nextGroup === previousGroup) return;

  const nextShortcuts = settings.shortcuts.map((shortcut) =>
    (shortcut.group || getDefaultGroupName()) === previousGroup ? { ...shortcut, group: nextGroup } : shortcut
  );
  const nextDefaultGroup =
    previousGroup === settings.defaultGroupName ? nextGroup : settings.defaultGroupName;
  const nextGroups = normalizeGroupList(
    settings.shortcutGroups.map((group) => (group === previousGroup ? nextGroup : group)),
    nextDefaultGroup
  );
  settings = normalizeSettings({
    ...settings,
    shortcuts: nextShortcuts,
    shortcutGroups: nextGroups,
    defaultGroupName: nextDefaultGroup
  });
  if (activeShortcutGroup === previousGroup) activeShortcutGroup = nextGroup;
  saveSettings();
  applySettings();
}

function handleGroupEditorClick(event) {
  const button = event.target.closest("[data-action='remove']");
  if (!button) return;
  const group = button.dataset.group;
  if (!group) return;
  if (group === settings.defaultGroupName) return;
  const nextShortcuts = settings.shortcuts.map((shortcut) =>
    (shortcut.group || getDefaultGroupName()) === group
      ? { ...shortcut, group: getDefaultGroupName() }
      : shortcut
  );
  const nextGroups = normalizeGroupList(
    settings.shortcutGroups.filter((entry) => entry !== group),
    settings.defaultGroupName
  );
  settings = normalizeSettings({
    ...settings,
    shortcuts: nextShortcuts,
    shortcutGroups: nextGroups,
    defaultGroupName: settings.defaultGroupName
  });
  if (activeShortcutGroup === group) activeShortcutGroup = "All";
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
  elements.timeZonesSetting.addEventListener("click", handleTimeZoneRemove);
  elements.groupEditor?.addEventListener("change", handleGroupEditorInput);
  elements.groupEditor?.addEventListener("click", handleGroupEditorClick);
  elements.addGroup?.addEventListener("click", () => {
    const groups = getShortcutGroups();
    const name = getUniqueGroupName("New Group", groups);
    const nextGroups = normalizeGroupList([...settings.shortcutGroups, name], settings.defaultGroupName);
    settings = normalizeSettings({ ...settings, shortcutGroups: nextGroups });
    activeShortcutGroup = name;
    saveSettings();
    applySettings();
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
  registerLayoutDraggables();
  wireEvents();
  applySettings();
  setInterval(updateClocks, 1000);
}

init();
