(function initializeShortcutEditor() {
  "use strict";

  const grid = document.getElementById("shortcutGrid");
  if (!grid) return;

  const style = document.createElement("style");
  style.textContent = `
    .shortcut-grid.editing { gap: 18px 14px; }
    .shortcut-grid.editing .shortcut-tile {
      min-height: 92px;
      padding: 9px 7px 8px;
      border: 1px solid rgba(255,255,255,.08);
      border-radius: 16px;
      background: rgba(255,255,255,.025);
      cursor: default;
      transition: background 140ms ease, border-color 140ms ease, box-shadow 140ms ease;
    }
    .shortcut-grid.editing .shortcut-tile:hover {
      background: rgba(255,255,255,.05);
      border-color: rgba(255,255,255,.13);
    }
    .shortcut-grid.editing .shortcut-icon-box {
      animation: none !important;
      transform: none !important;
    }
    .shortcut-grid.editing .shortcut-edit-button,
    .shortcut-grid.editing .shortcut-drag-handle {
      position: absolute;
      top: -8px;
      width: 25px;
      height: 25px;
      display: grid;
      place-items: center;
      color: rgba(245,248,255,.92);
      background: rgba(17,25,43,.98);
      border: 1px solid rgba(255,255,255,.14);
      border-radius: 8px;
      box-shadow: 0 7px 18px rgba(0,0,0,.28);
      font-size: .7rem;
      line-height: 1;
      z-index: 3;
    }
    .shortcut-grid.editing .shortcut-edit-button {
      right: -5px;
      cursor: pointer;
    }
    .shortcut-grid.editing .shortcut-drag-handle {
      left: -5px;
      cursor: grab;
      letter-spacing: -2px;
      touch-action: none;
      user-select: none;
    }
    .shortcut-grid.editing .shortcut-drag-handle:active { cursor: grabbing; }
    .shortcut-grid.editing .shortcut-edit-button:hover,
    .shortcut-grid.editing .shortcut-edit-button:focus-visible,
    .shortcut-grid.editing .shortcut-drag-handle:hover {
      color: #fff;
      border-color: rgba(var(--accent-rgb),.48);
      background: rgba(var(--accent-rgb),.22);
    }
    .shortcut-grid.editing .shortcut-tile.dragging {
      opacity: .48;
      transform: scale(.96);
    }
    .shortcut-grid.editing .shortcut-tile.drop-target {
      background: rgba(var(--accent-rgb),.10);
      border-color: rgba(var(--accent-rgb),.58);
      box-shadow: 0 0 0 3px rgba(var(--accent-rgb),.09);
    }
    .shortcut-grid.editing .shortcut-tile.drop-target .shortcut-icon-box {
      box-shadow: none;
    }
    body.theme-light .shortcut-grid.editing .shortcut-tile {
      background: rgba(15,23,42,.025);
      border-color: rgba(15,23,42,.09);
    }
    body.theme-light .shortcut-grid.editing .shortcut-edit-button,
    body.theme-light .shortcut-grid.editing .shortcut-drag-handle {
      color: #25324a;
      background: rgba(255,255,255,.98);
      border-color: rgba(15,23,42,.12);
    }
  `;
  document.head.appendChild(style);

  let activePointerId = null;
  let activeTile = null;

  function isEditing() {
    return grid.classList.contains("editing");
  }

  function enhanceTile(tile) {
    if (!(tile instanceof HTMLElement) || tile.dataset.shortcutEditorEnhanced === "true") return;
    tile.dataset.shortcutEditorEnhanced = "true";

    const editControl = tile.querySelector(".shortcut-edit-button");
    if (editControl) {
      editControl.setAttribute("role", "button");
      editControl.setAttribute("tabindex", "0");
      editControl.setAttribute("aria-label", `Edit ${tile.querySelector(".shortcut-label")?.textContent || "shortcut"}`);
      editControl.setAttribute("title", "Edit shortcut");
    }

    if (!tile.querySelector(".shortcut-drag-handle")) {
      const handle = document.createElement("span");
      handle.className = "shortcut-drag-handle";
      handle.setAttribute("aria-hidden", "true");
      handle.setAttribute("title", "Drag to reorder");
      handle.textContent = "⋮⋮";
      tile.appendChild(handle);
    }
  }

  function syncTiles() {
    const editing = isEditing();
    grid.querySelectorAll(".shortcut-tile").forEach((tile) => {
      if (editing) {
        enhanceTile(tile);
        tile.setAttribute("aria-disabled", "true");
        tile.tabIndex = -1;
      } else {
        tile.removeAttribute("aria-disabled");
        tile.removeAttribute("data-shortcut-editor-enhanced");
        tile.tabIndex = 0;
        tile.querySelector(".shortcut-drag-handle")?.remove();
      }
    });
  }

  function resetDragGuard() {
    if (activeTile) delete activeTile.dataset.shortcutDragReady;
    activeTile = null;
    activePointerId = null;
  }

  grid.addEventListener("pointerdown", (event) => {
    if (!isEditing()) return;
    const tile = event.target.closest(".shortcut-tile");
    if (!tile) return;

    const handle = event.target.closest(".shortcut-drag-handle");
    if (!handle) {
      if (!event.target.closest(".shortcut-edit-button")) event.stopPropagation();
      return;
    }

    activeTile = tile;
    activePointerId = event.pointerId;
    tile.dataset.shortcutDragReady = "true";
  }, true);

  grid.addEventListener("pointerup", (event) => {
    if (event.pointerId === activePointerId) window.setTimeout(resetDragGuard, 0);
  }, true);

  grid.addEventListener("pointercancel", resetDragGuard, true);

  grid.addEventListener("dragstart", (event) => {
    if (!isEditing()) return;
    const tile = event.target.closest(".shortcut-tile");
    if (tile && tile.dataset.shortcutDragReady !== "true") {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }, true);

  grid.addEventListener("dragend", resetDragGuard, true);

  grid.addEventListener("click", (event) => {
    if (!isEditing()) return;
    const tile = event.target.closest(".shortcut-tile");
    if (!tile) return;
    if (event.target.closest(".shortcut-edit-button")) return;
    event.preventDefault();
    event.stopImmediatePropagation();
  }, true);

  grid.addEventListener("keydown", (event) => {
    if (!isEditing()) return;
    const editControl = event.target.closest(".shortcut-edit-button");
    if (!editControl || !["Enter", " "].includes(event.key)) return;
    event.preventDefault();
    editControl.click();
  });

  const observer = new MutationObserver(syncTiles);
  observer.observe(grid, { childList: true, subtree: true, attributes: true, attributeFilter: ["class"] });
  syncTiles();
})();
