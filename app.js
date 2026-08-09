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
    timeZoneSelect: document.getElementById("timeZoneSelect"),
    categoryTabs: document.getElementById("categoryTabs"),
    shortcutGrid: document.getElementById("shortcutGrid"),
    shortcutEmptyState: document.getElementById("shortcutEmptyState"),
    editShortcutsButton: document.getElementById("editShortcutsButton"),
    addShortcutButton: document.getElementById("addShortcutButton"),
    emptyAddShortcutButton: document.getElementById("emptyAddShortcutButton"),
    settingsAddShortcutButton: document.getElementById("settingsAddShortcutButton"),
    shortcutManager: document.getElementById("shortcutManager"),
    categoryManager: document.getElementById("categoryManager"),
    addCategoryButton: document.getElementById("addCategoryButton"),
    shortcutDialog: document.getElementById("shortcutDialog"),
    shortcutForm: document.getElementById("shortcutForm"),
    shortcutDialogTitle: document.getElementById("shortcutDialogTitle"),
    shortcutIdInput: document.getElementById("shortcutIdInput"),
    shortcutTitleInput: document.getElementById("shortcutTitleInput"),
    shortcutUrlInput: document.getElementById("shortcutUrlInput"),
    shortcutGroupInput: document.getElementById("shortcutGroupInput"),
    shortcutColorInput: document.getElementById("shortcutColorInput"),
    shortcutColorTextInput: document.getElementById("shortcutColorTextInput"),
    shortcutFormError: document.getElementById("shortcutFormError"),
    deleteShortcutButton: document.getElementById("deleteShortcutButton"),
    categoryDialog: document.getElementById("categoryDialog"),
    categoryForm: document.getElementById("categoryForm"),
    categoryDialogTitle: document.getElementById("categoryDialogTitle"),
    categoryOriginalNameInput: document.getElementById("categoryOriginalNameInput"),
    categoryNameInput: document.getElementById("categoryNameInput"),
    categoryDefaultInput: document.getElementById("categoryDefaultInput"),
    categoryFormError: document.getElementById("categoryFormError"),
    deleteCategoryButton: document.getElementById("deleteCategoryButton"),
    launcherDock: document.getElementById("launcherDock"),
    launcherManager: document.getElementById("launcherManager"),
    addLauncherButton: document.getElementById("addLauncherButton"),
    launcherDialog: document.getElementById("launcherDialog"),
    launcherForm: document.getElementById("launcherForm"),
    launcherDialogTitle: document.getElementById("launcherDialogTitle"),
    launcherIdInput: document.getElementById("launcherIdInput"),
    launcherNameInput: document.getElementById("launcherNameInput"),
    launcherIconInput: document.getElementById("launcherIconInput"),
    launcherColorInput: document.getElementById("launcherColorInput"),
    launcherColorTextInput: document.getElementById("launcherColorTextInput"),
    launcherFormError: document.getElementById("launcherFormError"),
    launcherLinksEditor: document.getElementById("launcherLinksEditor"),
    launcherLinkManager: document.getElementById("launcherLinkManager"),
    addLauncherLinkButton: document.getElementById("addLauncherLinkButton"),
    deleteLauncherButton: document.getElementById("deleteLauncherButton"),
    linkDialog: document.getElementById("linkDialog"),
    linkForm: document.getElementById("linkForm"),
    linkDialogTitle: document.getElementById("linkDialogTitle"),
    linkIdInput: document.getElementById("linkIdInput"),
    linkLabelInput: document.getElementById("linkLabelInput"),
    linkUrlInput: document.getElementById("linkUrlInput"),
    linkFormError: document.getElementById("linkFormError"),
    deleteLinkButton: document.getElementById("deleteLinkButton")
  };

  const state = {
    settings: loadSettings(),
    history: loadHistory(),
    settingsSnapshot: null,
    activeCategory: "All",
    shortcutEditMode: false,
    openLauncherId: null,
    pinnedLauncherId: null,
    layoutDraft: null,
    launcherDraft: null,
    shortcutTouchDrag: null
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

  function persistCustomization() {
    state.settings = Core.normalizeSettings(state.settings);
    saveSettings();
    renderCustomization();
  }

  function syncShortcutLayout() {
    const { shortcutColumns, shortcutAlign } = state.settings;
    document.documentElement.style.setProperty("--shortcut-columns", shortcutColumns);
    document.documentElement.style.setProperty(
      "--shortcut-justify",
      shortcutAlign === "start" ? "start" : shortcutAlign === "end" ? "end" : "center"
    );
    document.documentElement.style.setProperty(
      "--shortcut-track",
      shortcutAlign === "stretch" ? "minmax(68px, 1fr)" : "76px"
    );
  }

  function categoryNamesForHome() {
    const populated = state.settings.categories.filter((group) =>
      state.settings.shortcuts.some((shortcut) => shortcut.group === group)
    );
    return state.shortcutEditMode ? state.settings.categories : populated;
  }

  function renderCategoryTabs() {
    const groups = ["All", ...categoryNamesForHome()];
    if (!groups.includes(state.activeCategory)) state.activeCategory = "All";
    elements.categoryTabs.innerHTML = "";

    groups.forEach((group) => {
      const wrap = document.createElement("span");
      wrap.className = "category-tab-wrap";
      const button = document.createElement("button");
      button.type = "button";
      button.className = "category-tab";
      if (group === state.activeCategory) button.classList.add("active");
      button.textContent = group;
      button.setAttribute("role", "tab");
      button.setAttribute("aria-selected", String(group === state.activeCategory));
      button.addEventListener("click", () => {
        state.activeCategory = group;
        renderCategoryTabs();
        renderShortcutGrid();
      });
      wrap.appendChild(button);

      if (state.shortcutEditMode && group !== "All") {
        const edit = document.createElement("button");
        edit.type = "button";
        edit.className = "category-tab-edit";
        edit.textContent = "✎";
        edit.title = `Edit ${group}`;
        edit.setAttribute("aria-label", `Edit category ${group}`);
        edit.addEventListener("click", () => openCategoryDialog(group));
        wrap.appendChild(edit);
      }
      elements.categoryTabs.appendChild(wrap);
    });

    if (state.shortcutEditMode) {
      const add = document.createElement("button");
      add.type = "button";
      add.className = "category-tab category-add-tab";
      add.textContent = "+ Category";
      add.addEventListener("click", () => openCategoryDialog());
      elements.categoryTabs.appendChild(add);
    }
  }

  function visibleShortcuts() {
    const shortcuts = state.activeCategory === "All"
      ? state.settings.shortcuts
      : state.settings.shortcuts.filter((shortcut) => shortcut.group === state.activeCategory);
    return shortcuts.slice(0, state.settings.shortcutSlots);
  }

  function addFaviconContent(container, url, label, size = 128) {
    const fallback = document.createElement("span");
    fallback.textContent = Core.initial(label);
    container.appendChild(fallback);
    const favicon = Core.faviconUrl(url, size);
    if (!favicon) return;
    const image = document.createElement("img");
    image.src = favicon;
    image.alt = "";
    image.addEventListener("load", () => fallback.remove(), { once: true });
    image.addEventListener("error", () => image.remove(), { once: true });
    container.appendChild(image);
  }

  function reorderShortcuts(fromId, toId) {
    state.settings.shortcuts = Core.reorderById(state.settings.shortcuts, fromId, toId);
    persistCustomization();
  }

  function attachShortcutDrag(tile, shortcut) {
    tile.draggable = state.shortcutEditMode;
    tile.addEventListener("dragstart", (event) => {
      if (!state.shortcutEditMode) {
        event.preventDefault();
        return;
      }
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", shortcut.id);
      tile.classList.add("dragging");
    });
    tile.addEventListener("dragend", () => {
      tile.classList.remove("dragging");
      document.querySelectorAll(".shortcut-tile.drop-target").forEach((item) => item.classList.remove("drop-target"));
    });
    tile.addEventListener("dragover", (event) => {
      if (!state.shortcutEditMode) return;
      event.preventDefault();
      tile.classList.add("drop-target");
    });
    tile.addEventListener("dragleave", () => tile.classList.remove("drop-target"));
    tile.addEventListener("drop", (event) => {
      if (!state.shortcutEditMode) return;
      event.preventDefault();
      tile.classList.remove("drop-target");
      reorderShortcuts(event.dataTransfer.getData("text/plain"), shortcut.id);
    });

    tile.addEventListener("pointerdown", (event) => {
      if (!state.shortcutEditMode || event.pointerType === "mouse" || event.target.closest(".shortcut-edit-button")) return;
      state.shortcutTouchDrag = {
        pointerId: event.pointerId,
        fromId: shortcut.id,
        startX: event.clientX,
        startY: event.clientY,
        moved: false,
        tile
      };
      tile.setPointerCapture(event.pointerId);
    });
    tile.addEventListener("pointermove", (event) => {
      const drag = state.shortcutTouchDrag;
      if (!drag || drag.pointerId !== event.pointerId) return;
      if (!drag.moved && Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) < 10) return;
      drag.moved = true;
      event.preventDefault();
      drag.tile.classList.add("dragging");
      document.querySelectorAll(".shortcut-tile.drop-target").forEach((item) => item.classList.remove("drop-target"));
      document.elementFromPoint(event.clientX, event.clientY)?.closest(".shortcut-tile")?.classList.add("drop-target");
    });
    tile.addEventListener("pointerup", (event) => {
      const drag = state.shortcutTouchDrag;
      if (!drag || drag.pointerId !== event.pointerId) return;
      state.shortcutTouchDrag = null;
      drag.tile.classList.remove("dragging");
      const target = document.elementFromPoint(event.clientX, event.clientY)?.closest(".shortcut-tile");
      document.querySelectorAll(".shortcut-tile.drop-target").forEach((item) => item.classList.remove("drop-target"));
      if (drag.moved && target?.dataset.shortcutId) {
        tile.dataset.suppressClick = "true";
        reorderShortcuts(drag.fromId, target.dataset.shortcutId);
      }
    });
    tile.addEventListener("pointercancel", () => {
      state.shortcutTouchDrag = null;
      tile.classList.remove("dragging");
    });
  }

  function renderShortcutGrid() {
    syncShortcutLayout();
    const shortcuts = visibleShortcuts();
    elements.shortcutGrid.innerHTML = "";
    elements.shortcutGrid.classList.toggle("editing", state.shortcutEditMode);
    elements.shortcutEmptyState.hidden = shortcuts.length > 0;

    shortcuts.forEach((shortcut) => {
      const tile = document.createElement("button");
      tile.type = "button";
      tile.className = "shortcut-tile";
      tile.dataset.shortcutId = shortcut.id;
      tile.title = state.shortcutEditMode ? `Edit ${shortcut.title}` : shortcut.url;
      tile.setAttribute("aria-label", state.shortcutEditMode ? `Edit shortcut ${shortcut.title}` : `Open ${shortcut.title}`);

      const icon = document.createElement("span");
      icon.className = "shortcut-icon-box";
      icon.style.background = `color-mix(in srgb, ${shortcut.color}, rgba(255,255,255,.1) 58%)`;
      addFaviconContent(icon, shortcut.url, shortcut.title);
      const label = document.createElement("span");
      label.className = "shortcut-label";
      label.textContent = shortcut.title;
      tile.append(icon, label);

      if (state.shortcutEditMode) {
        const edit = document.createElement("span");
        edit.className = "shortcut-edit-button";
        edit.textContent = "✎";
        edit.setAttribute("aria-hidden", "true");
        tile.appendChild(edit);
      }

      tile.addEventListener("click", () => {
        if (tile.dataset.suppressClick === "true") {
          delete tile.dataset.suppressClick;
          return;
        }
        if (state.shortcutEditMode) openShortcutDialog(shortcut.id);
        else window.location.assign(shortcut.url);
      });
      tile.addEventListener("contextmenu", (event) => {
        event.preventDefault();
        openShortcutDialog(shortcut.id);
      });
      attachShortcutDrag(tile, shortcut);
      elements.shortcutGrid.appendChild(tile);
    });
  }

  function fillGroupSelect(selected) {
    elements.shortcutGroupInput.innerHTML = "";
    state.settings.categories.forEach((group) => {
      const option = document.createElement("option");
      option.value = group;
      option.textContent = group;
      elements.shortcutGroupInput.appendChild(option);
    });
    elements.shortcutGroupInput.value = state.settings.categories.includes(selected) ? selected : "Work";
  }

  function openShortcutDialog(id = "") {
    const shortcut = state.settings.shortcuts.find((item) => item.id === id);
    elements.shortcutDialogTitle.textContent = shortcut ? "Edit shortcut" : "Add shortcut";
    elements.shortcutIdInput.value = shortcut?.id || "";
    elements.shortcutTitleInput.value = shortcut?.title || "";
    elements.shortcutUrlInput.value = shortcut?.url || "";
    fillGroupSelect(shortcut?.group || (state.activeCategory === "All" ? "Work" : state.activeCategory));
    const color = shortcut?.color || state.settings.accent;
    elements.shortcutColorInput.value = color;
    elements.shortcutColorTextInput.value = color;
    elements.deleteShortcutButton.hidden = !shortcut;
    setFieldError(elements.shortcutFormError, "");
    elements.shortcutDialog.showModal();
    elements.shortcutTitleInput.focus();
  }

  function saveShortcutFromDialog(event) {
    event.preventDefault();
    const title = elements.shortcutTitleInput.value.trim();
    const url = Core.normalizeHttpUrl(elements.shortcutUrlInput.value);
    if (!title) {
      setFieldError(elements.shortcutFormError, "Enter a shortcut name.");
      return;
    }
    if (!url) {
      setFieldError(elements.shortcutFormError, "Enter a safe HTTP(S) URL.");
      return;
    }
    const id = elements.shortcutIdInput.value || Core.createId("shortcut");
    const existingIndex = state.settings.shortcuts.findIndex((item) => item.id === id);
    const shortcut = {
      id,
      title,
      url,
      group: elements.shortcutGroupInput.value || "Work",
      color: Core.normalizeHexColor(elements.shortcutColorTextInput.value, state.settings.accent),
      order: existingIndex >= 0 ? state.settings.shortcuts[existingIndex].order : state.settings.shortcuts.length
    };
    if (existingIndex >= 0) state.settings.shortcuts.splice(existingIndex, 1, shortcut);
    else state.settings.shortcuts.push(shortcut);
    elements.shortcutDialog.close();
    persistCustomization();
    showToast(existingIndex >= 0 ? "Shortcut updated." : "Shortcut added.");
  }

  function deleteShortcutFromDialog() {
    const id = elements.shortcutIdInput.value;
    const shortcut = state.settings.shortcuts.find((item) => item.id === id);
    if (!shortcut || !window.confirm(`Delete “${shortcut.title}”?`)) return;
    state.settings.shortcuts = state.settings.shortcuts.filter((item) => item.id !== id);
    elements.shortcutDialog.close();
    persistCustomization();
    showToast("Shortcut deleted.");
  }

  function openCategoryDialog(name = "") {
    const exists = state.settings.categories.includes(name);
    elements.categoryDialogTitle.textContent = exists ? "Edit category" : "Add category";
    elements.categoryOriginalNameInput.value = exists ? name : "";
    elements.categoryNameInput.value = exists ? name : "";
    elements.categoryNameInput.disabled = name === "Work";
    elements.categoryDefaultInput.checked = state.settings.defaultCategory === name;
    elements.deleteCategoryButton.hidden = !exists || name === "Work";
    setFieldError(elements.categoryFormError, "");
    elements.categoryDialog.showModal();
    if (name !== "Work") elements.categoryNameInput.focus();
  }

  function saveCategoryFromDialog(event) {
    event.preventDefault();
    const original = elements.categoryOriginalNameInput.value;
    const nextName = elements.categoryNameInput.value.trim();
    if (!nextName) {
      setFieldError(elements.categoryFormError, "Enter a category name.");
      return;
    }
    const duplicate = state.settings.categories.some((name) => name === nextName && name !== original);
    if (duplicate || nextName === "All") {
      setFieldError(elements.categoryFormError, "Use a unique name other than All.");
      return;
    }
    if (original && original !== nextName) {
      state.settings.categories = state.settings.categories.map((name) => name === original ? nextName : name);
      state.settings.shortcuts.forEach((shortcut) => {
        if (shortcut.group === original) shortcut.group = nextName;
      });
      if (state.settings.defaultCategory === original) state.settings.defaultCategory = nextName;
      if (state.activeCategory === original) state.activeCategory = nextName;
    } else if (!original) {
      state.settings.categories.push(nextName);
    }
    if (elements.categoryDefaultInput.checked) state.settings.defaultCategory = nextName;
    else if (state.settings.defaultCategory === nextName) state.settings.defaultCategory = "All";
    elements.categoryDialog.close();
    persistCustomization();
    showToast(original ? "Category updated." : "Category added.");
  }

  function deleteCategoryFromDialog() {
    const name = elements.categoryOriginalNameInput.value;
    if (!name || name === "Work" || !window.confirm(`Delete “${name}” and move its shortcuts to Work?`)) return;
    state.settings.categories = state.settings.categories.filter((item) => item !== name);
    state.settings.shortcuts.forEach((shortcut) => {
      if (shortcut.group === name) shortcut.group = "Work";
    });
    if (state.settings.defaultCategory === name) state.settings.defaultCategory = "All";
    if (state.activeCategory === name) state.activeCategory = "All";
    elements.categoryDialog.close();
    persistCustomization();
    showToast("Category deleted.");
  }

  function createMoveButtons(id, moveCallback) {
    const wrap = document.createElement("span");
    wrap.className = "manager-actions";
    [-1, 1].forEach((delta) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "manager-action";
      button.textContent = delta < 0 ? "↑" : "↓";
      button.title = delta < 0 ? "Move up" : "Move down";
      button.addEventListener("click", () => moveCallback(id, delta));
      wrap.appendChild(button);
    });
    return wrap;
  }

  function createManagerRow({ id, title, subtitle, onEdit, onMove, onDrop, draggable = true }) {
    const row = document.createElement("div");
    row.className = "manager-row";
    row.dataset.itemId = id;
    row.draggable = draggable;
    const handle = document.createElement("span");
    handle.className = "drag-handle";
    handle.textContent = "⋮⋮";
    handle.setAttribute("aria-hidden", "true");
    const main = document.createElement("div");
    main.className = "manager-row-main";
    const strong = document.createElement("strong");
    strong.textContent = title;
    main.appendChild(strong);
    if (subtitle) {
      const small = document.createElement("small");
      small.textContent = subtitle;
      main.appendChild(small);
    }
    const actions = createMoveButtons(id, onMove);
    const edit = document.createElement("button");
    edit.type = "button";
    edit.className = "manager-action";
    edit.textContent = "Edit";
    edit.addEventListener("click", onEdit);
    actions.appendChild(edit);
    row.append(handle, main, actions);

    if (draggable) {
      row.addEventListener("dragstart", (event) => {
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", id);
        row.classList.add("dragging");
      });
      row.addEventListener("dragend", () => row.classList.remove("dragging"));
      row.addEventListener("dragover", (event) => {
        event.preventDefault();
        row.classList.add("drop-target");
      });
      row.addEventListener("dragleave", () => row.classList.remove("drop-target"));
      row.addEventListener("drop", (event) => {
        event.preventDefault();
        row.classList.remove("drop-target");
        onDrop(event.dataTransfer.getData("text/plain"), id);
      });
    }
    return row;
  }

  function moveCategory(name, delta) {
    const index = state.settings.categories.indexOf(name);
    const target = Math.min(state.settings.categories.length - 1, Math.max(0, index + delta));
    if (index < 0 || target === index) return;
    const [moved] = state.settings.categories.splice(index, 1);
    state.settings.categories.splice(target, 0, moved);
    persistCustomization();
  }

  function reorderCategory(fromName, toName) {
    const fromIndex = state.settings.categories.indexOf(fromName);
    const toIndex = state.settings.categories.indexOf(toName);
    if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) return;
    const [moved] = state.settings.categories.splice(fromIndex, 1);
    state.settings.categories.splice(toIndex, 0, moved);
    persistCustomization();
  }

  function renderShortcutManagers() {
    elements.categoryManager.innerHTML = "";
    state.settings.categories.forEach((name) => {
      elements.categoryManager.appendChild(createManagerRow({
        id: name,
        title: name,
        subtitle: state.settings.defaultCategory === name ? "Default view" : `${state.settings.shortcuts.filter((item) => item.group === name).length} shortcuts`,
        onEdit: () => openCategoryDialog(name),
        onMove: moveCategory,
        onDrop: reorderCategory,
        draggable: name !== "Work"
      }));
    });

    elements.shortcutManager.innerHTML = "";
    state.settings.shortcuts.forEach((shortcut) => {
      elements.shortcutManager.appendChild(createManagerRow({
        id: shortcut.id,
        title: shortcut.title,
        subtitle: `${shortcut.group} · ${shortcut.url}`,
        onEdit: () => openShortcutDialog(shortcut.id),
        onMove: (id, delta) => {
          state.settings.shortcuts = Core.moveById(state.settings.shortcuts, id, delta);
          persistCustomization();
        },
        onDrop: reorderShortcuts
      }));
    });
  }

  let launcherCloseTimer = 0;

  function closeLauncherFlyout(force = false) {
    if (!force && state.pinnedLauncherId) return;
    state.openLauncherId = null;
    document.querySelector(".launcher-flyout")?.remove();
    elements.launcherDock.querySelectorAll(".launcher-button").forEach((button) => button.setAttribute("aria-expanded", "false"));
  }

  function scheduleLauncherClose() {
    window.clearTimeout(launcherCloseTimer);
    launcherCloseTimer = window.setTimeout(() => closeLauncherFlyout(), 150);
  }

  function renderLauncherFlyout(launcher, anchor) {
    window.clearTimeout(launcherCloseTimer);
    document.querySelector(".launcher-flyout")?.remove();
    state.openLauncherId = launcher.id;
    elements.launcherDock.querySelectorAll(".launcher-button").forEach((button) => {
      button.setAttribute("aria-expanded", String(button.dataset.launcherId === launcher.id));
    });

    const flyout = document.createElement("div");
    flyout.className = "launcher-flyout";
    flyout.dataset.launcherId = launcher.id;
    const anchorRect = anchor.getBoundingClientRect();
    flyout.style.left = `${Math.min(window.innerWidth - 278, Math.max(12, anchorRect.left))}px`;
    flyout.style.bottom = `${Math.max(70, window.innerHeight - anchorRect.top + 8)}px`;

    const header = document.createElement("div");
    header.className = "launcher-flyout-header";
    const title = document.createElement("strong");
    title.textContent = launcher.name;
    const edit = document.createElement("button");
    edit.type = "button";
    edit.className = "small-button";
    edit.textContent = "Edit";
    edit.addEventListener("click", () => openLauncherDialog(launcher.id));
    header.append(title, edit);
    flyout.appendChild(header);

    const links = document.createElement("div");
    links.className = "launcher-link-list";
    if (!launcher.links.length) {
      const empty = document.createElement("p");
      empty.className = "launcher-empty-message";
      empty.textContent = "No service links yet.";
      links.appendChild(empty);
    }
    launcher.links.forEach((link) => {
      const anchorLink = document.createElement("a");
      anchorLink.className = "launcher-link";
      anchorLink.href = link.url;
      const icon = document.createElement("span");
      icon.className = "launcher-link-icon";
      addFaviconContent(icon, link.url, link.label, 64);
      const label = document.createElement("span");
      label.textContent = link.label;
      anchorLink.append(icon, label);
      links.appendChild(anchorLink);
    });
    flyout.appendChild(links);
    flyout.addEventListener("mouseenter", () => window.clearTimeout(launcherCloseTimer));
    flyout.addEventListener("mouseleave", scheduleLauncherClose);
    document.body.appendChild(flyout);
  }

  function renderLauncherDock() {
    closeLauncherFlyout(true);
    state.pinnedLauncherId = null;
    elements.launcherDock.innerHTML = "";
    state.settings.launchers.forEach((launcher) => {
      const item = document.createElement("div");
      item.className = "launcher-item";
      const button = document.createElement("button");
      button.type = "button";
      button.className = "launcher-button";
      button.dataset.launcherId = launcher.id;
      button.textContent = launcher.icon;
      button.title = launcher.name;
      button.setAttribute("aria-label", `Open ${launcher.name} services`);
      button.setAttribute("aria-expanded", "false");
      button.style.setProperty("--launcher-rgb", Core.hexToRgb(launcher.color).join(", "));
      button.addEventListener("mouseenter", () => renderLauncherFlyout(launcher, button));
      button.addEventListener("focus", () => renderLauncherFlyout(launcher, button));
      button.addEventListener("click", (event) => {
        event.stopPropagation();
        if (state.pinnedLauncherId === launcher.id) {
          state.pinnedLauncherId = null;
          closeLauncherFlyout(true);
        } else {
          state.pinnedLauncherId = launcher.id;
          renderLauncherFlyout(launcher, button);
        }
      });
      item.addEventListener("mouseleave", scheduleLauncherClose);
      item.appendChild(button);
      elements.launcherDock.appendChild(item);
    });

    const add = document.createElement("button");
    add.type = "button";
    add.className = "launcher-button launcher-add-button";
    add.textContent = "+";
    add.title = "Add launcher";
    add.setAttribute("aria-label", "Add launcher");
    add.addEventListener("click", () => openLauncherDialog());
    elements.launcherDock.appendChild(add);
  }

  function openLauncherDialog(id = "") {
    const existing = state.settings.launchers.find((item) => item.id === id);
    state.launcherDraft = existing
      ? Core.clone(existing)
      : { id: Core.createId("launcher"), name: "", icon: "", color: state.settings.accent, order: state.settings.launchers.length, links: [] };
    elements.launcherDialogTitle.textContent = existing ? "Edit launcher" : "Add launcher";
    elements.launcherIdInput.value = state.launcherDraft.id;
    elements.launcherNameInput.value = state.launcherDraft.name;
    elements.launcherIconInput.value = state.launcherDraft.icon;
    elements.launcherColorInput.value = state.launcherDraft.color;
    elements.launcherColorTextInput.value = state.launcherDraft.color;
    elements.deleteLauncherButton.hidden = !existing;
    elements.launcherLinksEditor.hidden = false;
    setFieldError(elements.launcherFormError, "");
    renderLauncherLinkManager();
    closeLauncherFlyout(true);
    elements.launcherDialog.showModal();
    elements.launcherNameInput.focus();
  }

  function saveLauncherFromDialog(event) {
    event.preventDefault();
    const name = elements.launcherNameInput.value.trim();
    const icon = elements.launcherIconInput.value.trim();
    if (!name || !icon) {
      setFieldError(elements.launcherFormError, "Enter a name and a short icon.");
      return;
    }
    Object.assign(state.launcherDraft, {
      name,
      icon: icon.slice(0, 4),
      color: Core.normalizeHexColor(elements.launcherColorTextInput.value, state.settings.accent)
    });
    const index = state.settings.launchers.findIndex((item) => item.id === state.launcherDraft.id);
    if (index >= 0) state.settings.launchers.splice(index, 1, state.launcherDraft);
    else state.settings.launchers.push(state.launcherDraft);
    elements.launcherDialog.close();
    state.launcherDraft = null;
    persistCustomization();
    showToast(index >= 0 ? "Launcher updated." : "Launcher added.");
  }

  function deleteLauncherFromDialog() {
    const id = state.launcherDraft?.id;
    const launcher = state.settings.launchers.find((item) => item.id === id);
    if (!launcher || !window.confirm(`Delete “${launcher.name}”?`)) return;
    state.settings.launchers = state.settings.launchers.filter((item) => item.id !== id);
    elements.launcherDialog.close();
    state.launcherDraft = null;
    persistCustomization();
    showToast("Launcher deleted.");
  }

  function openLinkDialog(id = "") {
    if (!state.launcherDraft) return;
    const link = state.launcherDraft.links.find((item) => item.id === id);
    elements.linkDialogTitle.textContent = link ? "Edit service link" : "Add service link";
    elements.linkIdInput.value = link?.id || "";
    elements.linkLabelInput.value = link?.label || "";
    elements.linkUrlInput.value = link?.url || "";
    elements.deleteLinkButton.hidden = !link;
    setFieldError(elements.linkFormError, "");
    elements.linkDialog.showModal();
    elements.linkLabelInput.focus();
  }

  function saveLinkFromDialog(event) {
    event.preventDefault();
    const label = elements.linkLabelInput.value.trim();
    const url = Core.normalizeHttpUrl(elements.linkUrlInput.value);
    if (!label || !url) {
      setFieldError(elements.linkFormError, "Enter a name and a safe HTTP(S) URL.");
      return;
    }
    const id = elements.linkIdInput.value || Core.createId("link");
    const index = state.launcherDraft.links.findIndex((item) => item.id === id);
    const link = { id, label, url, order: index >= 0 ? state.launcherDraft.links[index].order : state.launcherDraft.links.length };
    if (index >= 0) state.launcherDraft.links.splice(index, 1, link);
    else state.launcherDraft.links.push(link);
    elements.linkDialog.close();
    renderLauncherLinkManager();
  }

  function deleteLinkFromDialog() {
    const id = elements.linkIdInput.value;
    const link = state.launcherDraft?.links.find((item) => item.id === id);
    if (!link || !window.confirm(`Delete “${link.label}”?`)) return;
    state.launcherDraft.links = state.launcherDraft.links.filter((item) => item.id !== id)
      .map((item, index) => ({ ...item, order: index }));
    elements.linkDialog.close();
    renderLauncherLinkManager();
  }

  function renderLauncherLinkManager() {
    elements.launcherLinkManager.innerHTML = "";
    if (!state.launcherDraft) return;
    state.launcherDraft.links.forEach((link) => {
      elements.launcherLinkManager.appendChild(createManagerRow({
        id: link.id,
        title: link.label,
        subtitle: link.url,
        onEdit: () => openLinkDialog(link.id),
        onMove: (id, delta) => {
          state.launcherDraft.links = Core.moveById(state.launcherDraft.links, id, delta);
          renderLauncherLinkManager();
        },
        onDrop: (fromId, toId) => {
          state.launcherDraft.links = Core.reorderById(state.launcherDraft.links, fromId, toId);
          renderLauncherLinkManager();
        }
      }));
    });
  }

  function renderLauncherManager() {
    elements.launcherManager.innerHTML = "";
    state.settings.launchers.forEach((launcher) => {
      elements.launcherManager.appendChild(createManagerRow({
        id: launcher.id,
        title: `${launcher.icon}  ${launcher.name}`,
        subtitle: `${launcher.links.length} service links`,
        onEdit: () => openLauncherDialog(launcher.id),
        onMove: (id, delta) => {
          state.settings.launchers = Core.moveById(state.settings.launchers, id, delta);
          persistCustomization();
        },
        onDrop: (fromId, toId) => {
          state.settings.launchers = Core.reorderById(state.settings.launchers, fromId, toId);
          persistCustomization();
        }
      }));
    });
  }

  function renderCustomization() {
    renderCategoryTabs();
    renderShortcutGrid();
    renderShortcutManagers();
    renderLauncherDock();
    renderLauncherManager();
  }

  function wireCustomizationEvents() {
    [elements.addShortcutButton, elements.emptyAddShortcutButton, elements.settingsAddShortcutButton]
      .forEach((button) => button.addEventListener("click", () => openShortcutDialog()));
    elements.editShortcutsButton.addEventListener("click", () => {
      state.shortcutEditMode = !state.shortcutEditMode;
      elements.editShortcutsButton.setAttribute("aria-pressed", String(state.shortcutEditMode));
      elements.editShortcutsButton.textContent = state.shortcutEditMode ? "Done" : "Edit";
      renderCategoryTabs();
      renderShortcutGrid();
    });
    elements.addCategoryButton.addEventListener("click", () => openCategoryDialog());
    elements.addLauncherButton.addEventListener("click", () => openLauncherDialog());
    elements.addLauncherLinkButton.addEventListener("click", () => openLinkDialog());

    elements.shortcutForm.addEventListener("submit", saveShortcutFromDialog);
    elements.deleteShortcutButton.addEventListener("click", deleteShortcutFromDialog);
    elements.categoryForm.addEventListener("submit", saveCategoryFromDialog);
    elements.deleteCategoryButton.addEventListener("click", deleteCategoryFromDialog);
    elements.launcherForm.addEventListener("submit", saveLauncherFromDialog);
    elements.deleteLauncherButton.addEventListener("click", deleteLauncherFromDialog);
    elements.linkForm.addEventListener("submit", saveLinkFromDialog);
    elements.deleteLinkButton.addEventListener("click", deleteLinkFromDialog);

    const syncColorPair = (picker, text) => {
      picker.addEventListener("input", () => { text.value = picker.value; });
      text.addEventListener("input", () => {
        const normalized = Core.normalizeHexColor(text.value, "");
        if (normalized) picker.value = normalized;
      });
    };
    syncColorPair(elements.shortcutColorInput, elements.shortcutColorTextInput);
    syncColorPair(elements.launcherColorInput, elements.launcherColorTextInput);

    document.addEventListener("click", (event) => {
      if (!event.target.closest(".launcher-dock") && !event.target.closest(".launcher-flyout")) {
        state.pinnedLauncherId = null;
        closeLauncherFlyout(true);
      }
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        state.pinnedLauncherId = null;
        closeLauncherFlyout(true);
      }
    });
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
    renderCustomization();
    wireCustomizationEvents();
    wireGlobalKeys();
    window.requestAnimationFrame(applyDefaultFocus);
  }

  init();
})();
