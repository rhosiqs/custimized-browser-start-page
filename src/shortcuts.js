// Shortcut grid: category filter, paging, quick-edit popover, drag reordering, and edit mode with keyboard reordering.
import { categoriesOf, moveItem, normalizeHttpUrl } from './core.js';
import { grip, h, icon } from './dom.js';
import { store, update } from './state.js';
import { openShortcutEditor } from './shortcut-editor.js';
import { badge, dropdown, swatchPicker, toast } from './widgets.js';

const view = { category: 'All', page: 0, editing: false, popoverId: null, focusAfter: null };
let section = null;

export function shortcutsBlock() {
  section ||= h('section.shortcuts', { 'aria-label': 'Shortcuts' });
  render();
  return section;
}

export function closeShortcutPopover(keep) {
  if (view.popoverId && keep !== `tile-${view.popoverId}`) {
    view.popoverId = null;
    render();
  }
}

function render() {
  const { shortcuts, layout } = store.settings;
  const categories = categoriesOf(shortcuts);
  if (view.category !== 'All' && (!layout.showCategories || !categories.includes(view.category))) view.category = 'All';
  const shown = shortcuts.filter((s) => view.category === 'All' || s.category === view.category);
  const perRow = layout.perRow;
  const cap = layout.rows * perRow;
  const pages = Math.max(1, Math.ceil(shown.length / cap));
  view.page = Math.min(view.page, pages - 1);
  const visible = shown.slice(view.page * cap, view.page * cap + cap);

  // With the category row turned off, the empty .chips still pushes the buttons to the right.
  const chips = !layout.showCategories ? h('div.chips') : h('div.chips', { role: 'group', 'aria-label': 'Filter by category' },
    ...['All', ...categories].map((name) => h('button.chip', {
      type: 'button',
      'aria-pressed': String(view.category === name),
      onclick: () => { view.category = name; view.page = 0; render(); }
    }, `${name} `, h('span.count', {}, name === 'All' ? shortcuts.length : shortcuts.filter((s) => s.category === name).length))));

  const pager = pages > 1 ? h('div.pager', { role: 'group', 'aria-label': 'Shortcut pages' },
    h('button.icon-btn.small', { type: 'button', 'aria-label': 'Previous page', disabled: view.page === 0, onclick: () => { view.page -= 1; render(); } }, icon('chevronLeft')),
    h('span', {}, `${view.page + 1} / ${pages}`),
    h('button.icon-btn.small', { type: 'button', 'aria-label': 'Next page', disabled: view.page === pages - 1, onclick: () => { view.page += 1; render(); } }, icon('chevronRight'))
  ) : null;

  const head = h('div.shortcuts-head', {},
    chips,
    pager,
    h('button.pill.small', {
      type: 'button',
      'aria-pressed': String(view.editing),
      onclick: () => { view.editing = !view.editing; view.popoverId = null; render(); }
    }, view.editing ? 'Done' : 'Edit'),
    h('button.pill.primary.small', {
      type: 'button',
      onclick: () => openShortcutEditor(null, { category: view.category === 'All' ? '' : view.category })
    }, icon('plus', 14), 'Add')
  );

  const grid = h('div.grid', { style: { gridTemplateColumns: `repeat(${perRow}, minmax(0, 1fr))` } });
  if (!visible.length) {
    grid.append(h('p.empty', {}, shortcuts.length ? 'No shortcuts in this category.' : 'No shortcuts yet. Use Add to create one.'));
  }
  visible.forEach((item, index) => {
    grid.append(view.editing ? editTile(item, visible) : viewTile(item, index % perRow >= perRow - 3));
  });

  section.replaceChildren(head, grid);
  // The popover opens above its tile; flip it below when that would leave the page.
  const pop = section.querySelector('.popover');
  if (pop && pop.getBoundingClientRect().top < 0) pop.classList.add('below');
  if (view.focusAfter) {
    section.querySelector(view.focusAfter)?.focus();
    view.focusAfter = null;
  }
}

function viewTile(item, alignRight) {
  const open = view.popoverId === item.id;
  const link = h('a.tile', { href: item.url, title: item.url, draggable: 'false' }, badge(item), h('span.tile-name', {}, item.name));
  const edit = h('button.tile-edit', {
    type: 'button',
    'aria-label': `Edit ${item.name}`,
    'aria-expanded': String(open),
    dataset: { edit: item.id },
    onclick: () => {
      view.popoverId = open ? null : item.id;
      render();
      if (!open) section.querySelector('.popover input')?.focus();
    }
  }, icon('pencil', 14));
  const wrap = h('div.tile-wrap', { dataset: { keep: `tile-${item.id}`, id: item.id } }, link, edit, open ? popover(item, alignRight) : null);
  makeDraggable(wrap, item);
  return wrap;
}

function removeShortcut(item) {
  update((settings) => { settings.shortcuts = settings.shortcuts.filter((s) => s.id !== item.id); });
  toast(`Removed ${item.name}`);
}

// Moves one shortcut before or after another in the full list (so hidden categories keep their order).
function reorder(draggedId, targetId, after) {
  if (draggedId === targetId) return;
  update((settings) => {
    const list = settings.shortcuts;
    const from = list.findIndex((s) => s.id === draggedId);
    if (from < 0) return;
    const [dragged] = list.splice(from, 1);
    const target = list.findIndex((s) => s.id === targetId);
    list.splice(target < 0 ? from : target + (after ? 1 : 0), 0, dragged);
  });
}

// Pointer dragging (mouse, pen or touch) reorders tiles in both view and edit mode.
// A press that moves less than a few pixels stays an ordinary click.
const DRAG_THRESHOLD = 6;
function makeDraggable(wrap, item) {
  wrap.addEventListener('pointerdown', (event) => {
    if (event.button !== 0 || !event.isPrimary) return;
    if (event.target.closest('.tile-edit, .remove, .popover')) return;
    const startX = event.clientX;
    const startY = event.clientY;
    // The stage is scaled to the window; convert screen pixels back to design pixels for the ghost.
    const scale = wrap.getBoundingClientRect().width / wrap.offsetWidth || 1;
    let dragging = false;
    let target = null;
    let after = false;

    const clearTarget = () => target?.classList.remove('drop-before', 'drop-after');
    const onMove = (e) => {
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      if (!dragging) {
        if (Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
        dragging = true;
        wrap.classList.add('dragging');
      }
      e.preventDefault();
      wrap.style.transform = `translate(${dx / scale}px, ${dy / scale}px)`;
      const under = document.elementFromPoint(e.clientX, e.clientY)?.closest('.tile-wrap[data-id]');
      clearTarget();
      target = under && under !== wrap && section.contains(under) ? under : null;
      if (target) {
        const rect = target.getBoundingClientRect();
        after = e.clientX > rect.left + rect.width / 2;
        target.classList.add(after ? 'drop-after' : 'drop-before');
      }
    };
    const finish = (commit) => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onCancel);
      if (!dragging) return;
      // Swallow the click that follows a drop so the tile doesn't open.
      const swallow = (e) => { e.preventDefault(); e.stopPropagation(); };
      window.addEventListener('click', swallow, { capture: true, once: true });
      setTimeout(() => window.removeEventListener('click', swallow, { capture: true }), 0);
      wrap.classList.remove('dragging');
      wrap.style.transform = '';
      clearTarget();
      if (commit && target) {
        if (view.editing) view.focusAfter = `[data-move="${item.id}"]`;
        reorder(item.id, target.dataset.id, after);
      }
    };
    const onUp = () => finish(true);
    const onCancel = () => finish(false);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onCancel);
  });
}

// Quick edit: name, URL, category and color without leaving the grid.
function popover(item, alignRight) {
  const draft = { ...item };
  const titleId = `pop-${item.id}`;
  const preview = h('span', {});
  const refreshPreview = () => preview.replaceChildren(badge({ ...draft, icon: draft.icon === 'site' ? 'letter' : draft.icon }));
  const name = h('input.input.compact', { type: 'text', value: item.name, oninput: () => { draft.name = name.value; refreshPreview(); validate(); } });
  const url = h('input.input.compact', { type: 'url', value: item.url, oninput: () => { draft.url = url.value; validate(); } });
  const msg = h('span.msg.bad', { hidden: true, 'aria-live': 'polite' });
  const save = h('button.btn.primary.round.small', { type: 'button' }, 'Save');
  const cancel = () => { view.popoverId = null; view.focusAfter = `[data-edit="${item.id}"]`; render(); };

  const validate = () => {
    const check = normalizeHttpUrl(draft.url);
    const problem = !draft.name.trim() ? 'Enter a name.' : !check.ok ? check.msg : '';
    msg.hidden = !problem;
    msg.textContent = problem;
    url.setAttribute('aria-invalid', String(!check.ok));
    save.disabled = Boolean(problem);
    return check;
  };

  const categoryLabel = `${titleId}-cat`;
  const categories = categoriesOf(store.settings.shortcuts);
  const category = dropdown({
    labelId: categoryLabel,
    value: draft.category,
    align: 'start',
    options: [{ value: '', label: 'No category' }, ...categories.map((c) => ({ value: c, label: c }))],
    onChange: (value) => { draft.category = value; }
  });

  save.addEventListener('click', () => {
    const check = validate();
    if (save.disabled) return;
    update((settings) => {
      const target = settings.shortcuts.find((s) => s.id === item.id);
      if (target) Object.assign(target, { name: draft.name.trim(), url: check.url, category: draft.category, color: draft.color });
    });
    view.popoverId = null;
    view.focusAfter = `[data-edit="${item.id}"]`;
    render();
  });

  refreshPreview();
  const el = h(`div.popover.${alignRight ? 'right' : 'left'}`, {
    role: 'dialog', 'aria-labelledby': titleId,
    onkeydown: (event) => {
      if (event.key === 'Escape' && !event.defaultPrevented) { event.preventDefault(); cancel(); }
      if (event.key === 'Enter' && event.target.tagName === 'INPUT') { event.preventDefault(); save.click(); }
    }
  },
    h('div.popover-head', {}, preview, h('strong', { id: titleId }, 'Edit shortcut')),
    h('label', {}, 'Name', name),
    h('label', {}, 'URL', url),
    msg,
    h('div', { style: { display: 'flex', flexDirection: 'column', gap: '4px' } }, h('span.field-label', { id: categoryLabel, style: { fontSize: '13px' } }, 'Category'), category.el),
    swatchPicker({ value: draft.color, size: 'small', onChange: (color) => { draft.color = color; refreshPreview(); } }),
    h('div.actions', {},
      h('button.icon-btn.small', { type: 'button', 'aria-label': `Delete ${item.name}`, title: 'Delete', onclick: () => { view.popoverId = null; removeShortcut(item); } }, icon('trash', 16)),
      h('button.btn.small', { type: 'button', style: { marginRight: 'auto' }, onclick: () => { view.popoverId = null; render(); openShortcutEditor(item.id); } }, 'More…'),
      h('button.btn.round.small', { type: 'button', onclick: cancel }, 'Cancel'),
      save)
  );
  validate();
  return el;
}

function editTile(item, visible) {
  const move = (delta) => {
    const all = store.settings.shortcuts;
    const at = visible.indexOf(item);
    const neighbour = visible[at + delta];
    if (!neighbour) return;
    const from = all.findIndex((s) => s.id === item.id);
    const to = all.findIndex((s) => s.id === neighbour.id);
    view.focusAfter = `[data-move="${item.id}"]`;
    update((settings) => { settings.shortcuts = moveItem(settings.shortcuts, from, to); });
  };

  const wrap = h('div.tile-wrap.editing', { dataset: { id: item.id } });
  const handle = h('button.drag', {
    type: 'button',
    'aria-label': `Reorder ${item.name}: drag, or use arrow keys`,
    dataset: { move: item.id },
    onkeydown: (event) => {
      if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') { event.preventDefault(); move(-1); }
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') { event.preventDefault(); move(1); }
    }
  }, grip());
  const remove = h('button.remove', {
    type: 'button',
    'aria-label': `Remove ${item.name}`,
    onclick: () => removeShortcut(item)
  }, icon('close'));

  wrap.append(
    h('div.tile-tools', {}, handle, remove),
    h('button.tile', { type: 'button', 'aria-label': `Edit ${item.name}`, onclick: () => openShortcutEditor(item.id) }, badge(item), h('span.tile-name', {}, item.name))
  );

  makeDraggable(wrap, item);
  return wrap;
}
