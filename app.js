(function initializeApp() {
  "use strict";

  const Core = window.StartPageCore;
  if (!Core) throw new Error("StartPageCore failed to load.");

  const elements = {
    body: document.body,
    localClock: document.getElementById("localClock"),
    localTime: document.getElementById("localTime"),
    localDate: document.getElementById("localDate"),
    clockPeriod: document.getElementById("clockPeriod"),
    clockSeconds: document.getElementById("clockSeconds"),
    worldClockList: document.getElementById("worldClockList"),
    webForm: document.getElementById("webSearchForm"),
    aiForm: document.getElementById("aiSearchForm"),
    doiForm: document.getElementById("doiSearchForm"),
    webInput: document.getElementById("webSearchInput"),
    aiInput: document.getElementById("aiSearchInput"),
    doiInput: document.getElementById("doiSearchInput"),
    webEngine: document.getElementById("webEngine"),
    aiEngine: document.getElementById("aiEngine"),
    webSuggestions: document.getElementById("webSuggestions"),
    aiSuggestions: document.getElementById("aiSuggestions"),
    doiError: document.getElementById("doiError"),
    toastRegion: document.getElementById("toastRegion"),
    timeZoneSelect: document.getElementById("timeZoneSelect")
  };

  const state = {
    settings: loadSettings(),
    history: loadHistory(),
    settingsSnapshot: null,
    activeCategory: "All",
    shortcutEditMode: false,
    openLauncherId: null,
    pinnedLauncherId: null,
    layoutDraft: null
  };

  function safeJsonParse(value, fallback) {
    try {
      return value ? JSON.parse(value) : fallback;
    } catch {
      return fallback;
    }
  }

  function loadSettings() {
    return Core.normalizeSettings(
      safeJsonParse(localStorage.getItem(Core.SETTINGS_STORAGE_KEY), Core.DEFAULT_SETTINGS)
    );
  }

  function saveSettings() {
    localStorage.setItem(Core.SETTINGS_STORAGE_KEY, JSON.stringify(state.settings));
  }

  function loadHistory() {
    return Core.normalizeHistory(
      safeJsonParse(localStorage.getItem(Core.HISTORY_STORAGE_KEY), {})
    );
  }

  function saveHistory() {
    localStorage.setItem(Core.HISTORY_STORAGE_KEY, JSON.stringify(state.history));
  }

  function recordHistory(kind, value) {
    state.history = Core.recordHistory(state.history, kind, value);
    saveHistory();
  }

  function populateSelect(select, catalog) {
    if (!select) return;
    select.innerHTML = "";
    Object.entries(catalog).forEach(([value, item]) => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = item.label;
      select.appendChild(option);
    });
  }

  function showToast(message, type = "info") {
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.textContent = message;
    elements.toastRegion.appendChild(toast);
    window.setTimeout(() => toast.remove(), 2600);
  }

  function setFieldError(element, message) {
    if (!element) return;
    element.textContent = message || "";
    element.hidden = !message;
  }

  function applyBaseSettings() {
    const { settings } = state;
    elements.body.classList.toggle("theme-light", settings.theme === "light");
    elements.body.classList.toggle("density-compact", settings.density === "compact");
    elements.localClock.classList.toggle("with-background", settings.clockBackground);

    const rgb = Core.hexToRgb(settings.accent);
    document.documentElement.style.setProperty("--accent", settings.accent);
    document.documentElement.style.setProperty("--accent-rgb", rgb.join(", "));

    let background = settings.backgroundValue;
    if (settings.backgroundType === "image") {
      const safeImageUrl = Core.normalizeHttpUrl(background);
      background = safeImageUrl
        ? `linear-gradient(rgba(4, 8, 18, .18), rgba(4, 8, 18, .36)), url("${safeImageUrl.replace(/"/g, "%22")}")`
        : Core.DEFAULT_SETTINGS.backgroundValue;
    }
    document.documentElement.style.setProperty("--background-value", background);

    elements.webEngine.value = settings.defaultWebEngine;
    elements.aiEngine.value = settings.defaultAiEngine;
  }

  function updateClocks() {
    const now = new Date();
    const isTwelveHour = state.settings.clockFormat === "12";
    const parts = new Intl.DateTimeFormat(undefined, {
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
      hour12: isTwelveHour
    }).formatToParts(now);

    const hour = parts.find((part) => part.type === "hour")?.value || "--";
    const minute = parts.find((part) => part.type === "minute")?.value || "--";
    const second = parts.find((part) => part.type === "second")?.value || "--";
    const period = parts.find((part) => part.type === "dayPeriod")?.value || "";

    elements.localTime.textContent = `${hour}:${minute}`;
    elements.clockPeriod.textContent = isTwelveHour ? period : "";
    elements.clockPeriod.hidden = !isTwelveHour;
    elements.clockSeconds.textContent = state.settings.showSeconds ? second : "";
    elements.clockSeconds.hidden = !state.settings.showSeconds;
    elements.localDate.textContent = new Intl.DateTimeFormat(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric"
    }).format(now);

    renderWorldClocks(now);
  }

  function renderWorldClocks(now = new Date()) {
    elements.worldClockList.innerHTML = "";
    state.settings.timeZones.forEach((zone) => {
      const row = document.createElement("div");
      row.className = "world-time-row";
      const label = document.createElement("span");
      const time = document.createElement("strong");
      label.textContent = Core.timeZoneCity(zone);
      try {
        time.textContent = new Intl.DateTimeFormat(undefined, {
          timeZone: zone,
          hour: "numeric",
          minute: "2-digit"
        }).format(now);
      } catch {
        time.textContent = "--:--";
      }
      row.append(label, time);
      elements.worldClockList.appendChild(row);
    });
  }

  async function copyQueryIfEnabled(query) {
    if (!state.settings.copyQueryToClipboard || !query) return;
    try {
      await navigator.clipboard.writeText(query);
      showToast("Query copied to clipboard.");
    } catch {
      // Search remains fully usable if clipboard access is unavailable.
    }
  }

  async function executeInput(kind, input, engineKey) {
    const value = input.value.trim();
    const route = Core.routeInput(kind, value, engineKey);
    if (kind === "doi") setFieldError(elements.doiError, "");
    if (route.type === "empty") return;
    if (route.type === "error") {
      if (kind === "doi") setFieldError(elements.doiError, route.message);
      else showToast(route.message, "error");
      return;
    }

    recordHistory(kind, route.query || route.doi || value);
    await copyQueryIfEnabled(route.query || route.doi || "");
    window.location.assign(route.url);
  }

  function wireSearchForm(form, kind, input, engineSelect) {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      executeInput(kind, input, engineSelect?.value);
    });
  }

  function wireSuggestions(input, list, kind) {
    let items = [];
    let activeIndex = -1;
    let debounceId = 0;
    let requestId = 0;

    function close() {
      items = [];
      activeIndex = -1;
      list.hidden = true;
      list.innerHTML = "";
      input.setAttribute("aria-expanded", "false");
      input.removeAttribute("aria-activedescendant");
    }

    function render() {
      list.innerHTML = "";
      if (!items.length) {
        close();
        return;
      }
      list.hidden = false;
      input.setAttribute("aria-expanded", "true");
      items.forEach((value, index) => {
        const button = document.createElement("button");
        button.type = "button";
        button.id = `${kind}-suggestion-${index}`;
        button.className = "suggestion-item";
        button.setAttribute("role", "option");
        button.setAttribute("aria-selected", String(index === activeIndex));
        button.textContent = value;
        if (index === activeIndex) button.classList.add("active");
        button.addEventListener("pointerdown", (event) => event.preventDefault());
        button.addEventListener("click", () => {
          input.value = value;
          close();
          const engine = kind === "ai" ? elements.aiEngine.value : elements.webEngine.value;
          executeInput(kind, input, engine);
        });
        list.appendChild(button);
      });
      if (activeIndex >= 0) {
        input.setAttribute("aria-activedescendant", `${kind}-suggestion-${activeIndex}`);
      }
    }

    async function refresh() {
      const query = input.value.trim();
      if (query.length < 2) {
        close();
        return;
      }
      const currentRequest = ++requestId;
      const localItems = Core.mergeUniqueLists(
        Core.historySuggestions(state.history, kind, query),
        Core.localSuggestions(query)
      );
      items = localItems;
      activeIndex = -1;
      render();

      try {
        const response = await fetch(`https://api.datamuse.com/sug?s=${encodeURIComponent(query)}`, {
          headers: { Accept: "application/json" }
        });
        if (!response.ok) return;
        const payload = await response.json();
        if (currentRequest !== requestId || input.value.trim() !== query) return;
        const remoteItems = (Array.isArray(payload) ? payload : [])
          .map((entry) => String(entry?.word || "").trim())
          .filter(Boolean);
        items = Core.mergeUniqueLists(
          Core.historySuggestions(state.history, kind, query),
          remoteItems,
          localItems
        );
        render();
      } catch {
        // Local history and static suggestions remain available offline.
      }
    }

    input.addEventListener("input", () => {
      window.clearTimeout(debounceId);
      debounceId = window.setTimeout(refresh, 160);
    });

    input.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        close();
        return;
      }
      if (!items.length || !["ArrowDown", "ArrowUp", "Enter"].includes(event.key)) return;
      if (event.key === "ArrowDown") {
        event.preventDefault();
        activeIndex = (activeIndex + 1) % items.length;
        render();
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        activeIndex = activeIndex <= 0 ? items.length - 1 : activeIndex - 1;
        render();
      } else if (event.key === "Enter" && activeIndex >= 0) {
        event.preventDefault();
        input.value = items[activeIndex];
        close();
        const engine = kind === "ai" ? elements.aiEngine.value : elements.webEngine.value;
        executeInput(kind, input, engine);
      }
    });

    input.addEventListener("blur", () => window.setTimeout(close, 120));
  }

  function populateTimeZoneOptions() {
    if (!elements.timeZoneSelect) return;
    elements.timeZoneSelect.innerHTML = "";
    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = "Add a time zone";
    elements.timeZoneSelect.appendChild(placeholder);
    Core.TIME_ZONES.forEach((zone) => {
      const option = document.createElement("option");
      option.value = zone;
      option.textContent = Core.timeZoneCity(zone);
      option.disabled = state.settings.timeZones.includes(zone);
      elements.timeZoneSelect.appendChild(option);
    });
  }

  function applyDefaultFocus() {
    const targets = {
      web: elements.webInput,
      ai: elements.aiInput,
      doi: elements.doiInput
    };
    const target = targets[state.settings.defaultFocus];
    if (target) target.focus();
  }

  function wireGlobalKeys() {
    document.addEventListener("keydown", (event) => {
      const isTyping = ["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName);
      if (event.key === "/" && !isTyping) {
        event.preventDefault();
        elements.webInput.focus();
      }
    });
  }

  function init() {
    document.documentElement.classList.add("js-ready");
    populateSelect(elements.webEngine, Core.WEB_ENGINES);
    populateSelect(elements.aiEngine, Core.AI_ENGINES);
    applyBaseSettings();
    populateTimeZoneOptions();
    updateClocks();
    window.setInterval(updateClocks, 1000);

    wireSearchForm(elements.webForm, "web", elements.webInput, elements.webEngine);
    wireSearchForm(elements.aiForm, "ai", elements.aiInput, elements.aiEngine);
    wireSearchForm(elements.doiForm, "doi", elements.doiInput, null);
    wireSuggestions(elements.webInput, elements.webSuggestions, "web");
    wireSuggestions(elements.aiInput, elements.aiSuggestions, "ai");
    wireGlobalKeys();
    window.requestAnimationFrame(applyDefaultFocus);
  }

  init();
})();
