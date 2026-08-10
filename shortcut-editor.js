(function initializeShortcutEditor() {
  "use strict";

  const grid = document.getElementById("shortcutGrid");
  if (!grid) return;

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
