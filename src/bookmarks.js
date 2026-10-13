// Optional bookmarks bar at the top of the page (Settings › Layout): the browser's own bookmarks bar folder,
// read and changed with the optional "bookmarks" permission. It works like Chrome's own bar: pointing at a folder
// opens its menu, items that don't fit go under », a right-click menu edits, adds and deletes (with Undo), and
// bookmarks are dragged to reorder them or move them into folders.
import { bookmarkBarFolder, bookmarkDropPlace, bookmarkDropZone, bookmarkItems, findBookmarkFolder } from './core.js';
import { openBookmarkEditor } from './bookmark-editor.js';
import { h, icon, isModalOpen } from './dom.js';
import { faviconUrl } from './storage.js';
import { toast } from './widgets.js';

export const BOOKMARKS_PERMISSION = { permissions: ['bookmarks'] };
const api = typeof chrome !== 'undefined' ? chrome : null;
const MORE = 'more';
const view = { items: null, barId: '', granted: null, menu: null, context: null, drag: null, listening: false, closeTimer: 0, overflow: [] };
let barEl = null;

// Access granted or removed (here, in another tab or at chrome://extensions): check again.
api?.permissions?.onAdded?.addListener(recheck);
api?.permissions?.onRemoved?.addListener(recheck);
function recheck() {
  view.granted = null;
  view.items = null;
  if (barEl) renderBookmarks(barEl, !barEl.hidden);
}

export async function hasBookmarkAccess() {
  try { return Boolean(api?.permissions?.contains) && await api.permissions.contains(BOOKMARKS_PERMISSION); } catch { return false; }
}

// Must run from a click: Chrome asks the user only during a user gesture.
export async function requestBookmarkAccess() {
  try { return Boolean(api?.permissions?.request) && await api.permissions.request(BOOKMARKS_PERMISSION); } catch { return false; }
}

export function renderBookmarks(nav, show) {
  barEl = nav;
  const stage = document.getElementById('stage');
  stage.classList.toggle('has-bookmarks', show);
  nav.hidden = !show;
  if (!show) { closeBookmarkPopups(); nav.replaceChildren(); return; }
  if (view.granted === null) {
    hasBookmarkAccess().then((granted) => { view.granted = granted; load(); });
    return;
  }
  draw();
}

export function closeBookmarkPopups(keep = '') {
  if (keep === 'bookmarks') return;
  setContext(null);
  if (view.menu) setMenu(null);
}

async function load() {
  if (view.granted && api?.bookmarks?.getTree) {
    try {
      const bar = bookmarkBarFolder(await api.bookmarks.getTree());
      view.barId = bar ? String(bar.id) : '';
      view.items = bookmarkItems(bar);
    } catch {
      view.items = [];
    }
    listen();
  }
  if (barEl && !barEl.hidden) draw();
}

// Follow bookmark changes, made here or anywhere else in the browser, while the page is open.
function listen() {
  if (view.listening || !api?.bookmarks) return;
  view.listening = true;
  for (const event of ['onCreated', 'onRemoved', 'onChanged', 'onMoved', 'onChildrenReordered', 'onImportEnded']) {
    api.bookmarks[event]?.addListener(() => load());
  }
}

function draw() {
  const nav = barEl;
  // A redraw (after a bookmark change) reopens the menu that was open, on the same folder.
  const reopen = view.menu ? { anchorId: view.menu.anchor.dataset.id, pathIds: view.menu.path.map((f) => f.id) } : null;
  view.menu = null;
  view.context = null;
  if (!api?.permissions) {
    nav.replaceChildren(h('span.bm-note', {}, 'Bookmarks show when the page runs as the extension.'));
    return;
  }
  if (!view.granted) {
    nav.replaceChildren(h('button.bm-item', {
      type: 'button',
      onclick: async () => {
        view.granted = await requestBookmarkAccess();
        load();
      }
    }, icon('folder', 14, 1.8), h('span.bm-title', {}, 'Allow access to bookmarks')));
    return;
  }
  const items = view.items || [];
  const list = h('div.bm-list', {}, ...items.map((item) => itemEl(item)));
  const more = h('button.bm-item.bm-more', {
    type: 'button', 'aria-label': 'More bookmarks', 'aria-haspopup': 'true', 'aria-expanded': 'false', hidden: true,
    dataset: { id: MORE },
    onclick: (event) => clickMenu(event, more, moreFolder()),
    onmouseenter: () => { if (!view.context) hoverMenu(more, moreFolder()); }
  }, icon('chevronsRight', 14, 2));
  nav.replaceChildren(list, ...(items.length ? [] : [h('span.bm-note', {}, view.items ? 'Your bookmarks bar is empty. Right-click here to add a page.' : '')]), more);
  nav.dataset.keep = 'bookmarks';
  // An open menu closes shortly after the pointer leaves the bar and the menu (not while a right-click menu is up).
  nav.onmouseenter = () => clearTimeout(view.closeTimer);
  nav.onmouseleave = () => {
    if (view.menu && !view.context) view.closeTimer = setTimeout(() => setMenu(null), 300);
  };
  nav.onkeydown = (event) => {
    if (event.key !== 'Escape') return;
    if (view.context) {
      event.preventDefault();
      const back = view.context.from;
      setContext(null);
      back?.focus();
    } else if (view.menu) {
      event.preventDefault();
      const anchor = view.menu.anchor;
      setMenu(null);
      anchor.focus();
    }
  };
  // Right-click on the bar's empty space adds to the end of the bar.
  nav.oncontextmenu = (event) => {
    if (event.target.closest('.bm-item, .bm-menu, .bm-context')) return;
    openContext(event, null);
  };
  nav.onmousedown = (event) => {
    if (view.context && !event.target.closest('.bm-context')) setContext(null);
  };
  // Dropping on the bar's empty space moves to the end of the bar.
  nav.ondragover = (event) => {
    if (!view.drag || event.target.closest('.bm-item, .bm-menu')) return;
    event.preventDefault();
  };
  nav.ondrop = (event) => {
    if (!view.drag || event.target.closest('.bm-item, .bm-menu')) return;
    event.preventDefault();
    move(view.drag, { parentId: view.barId });
  };
  // Hide what doesn't fit (layout sizes are unscaled, so no stage-scale math is needed) and list it under ».
  requestAnimationFrame(() => {
    const children = [...list.children];
    view.overflow = [];
    if (list.scrollWidth > list.clientWidth) {
      more.hidden = false;
      const limit = list.clientWidth;
      children.forEach((el, i) => {
        if (el.offsetLeft + el.offsetWidth > limit) { el.hidden = true; view.overflow.push(items[i]); }
      });
    }
    if (reopen) reopenMenu(reopen);
  });
}

function moreFolder() {
  return { id: MORE, title: 'More', children: view.overflow };
}

function reopenMenu({ anchorId, pathIds }) {
  const anchor = barEl.querySelector(`[data-id="${CSS.escape(anchorId)}"]`);
  if (!anchor || anchor.hidden) return;
  const path = [];
  for (const id of pathIds) {
    const folder = id === MORE ? moreFolder() : findBookmarkFolder(view.items, id);
    if (!folder) break;
    path.push(folder);
  }
  if (path.length) setMenu({ anchor, path });
}

function itemEl(item) {
  const el = item.kind === 'link'
    ? h('a.bm-item', {
      href: item.url, title: `${item.title}\n${item.url}`,
      onmouseenter: () => { if (view.menu && !view.context) setMenu(null); }
    }, favicon(item.url), h('span.bm-title', {}, item.title))
    : h('button.bm-item', {
      type: 'button', title: item.title, 'aria-haspopup': 'true', 'aria-expanded': 'false',
      onclick: (event) => clickMenu(event, el, item),
      onmouseenter: () => { if (!view.context) hoverMenu(el, item); }
    }, h('span.bm-title', {}, item.title));
  el.dataset.id = item.id;
  wireItem(el, item, 'x');
  return el;
}

// Right-click menu and drag and drop, for bar items ('x': dropped on by left/right halves) and menu rows ('y').
function wireItem(el, item, axis) {
  el.oncontextmenu = (event) => openContext(event, item);
  el.draggable = true;
  el.ondragstart = (event) => {
    view.drag = item;
    event.dataTransfer.effectAllowed = 'move';
    if (item.url) event.dataTransfer.setData('text/uri-list', item.url);
    event.dataTransfer.setData('text/plain', item.url || item.title);
    setContext(null);
  };
  el.ondragend = () => { view.drag = null; clearDropMarks(); };
  el.ondragenter = () => {
    // Like Chrome, holding a dragged bookmark over a folder on the bar opens it.
    if (view.drag && item.kind === 'folder' && axis === 'x' && view.drag.id !== item.id) hoverMenu(el, item);
  };
  el.ondragover = (event) => {
    if (!view.drag) return;
    const zone = dropZone(event, el, item, axis);
    if (!bookmarkDropPlace(view.drag, item, zone)) { clearDropMarks(); return; }
    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = 'move';
    if (el.dataset.drop !== zone) { clearDropMarks(); el.dataset.drop = zone; }
  };
  el.ondragleave = (event) => { if (!el.contains(event.relatedTarget)) delete el.dataset.drop; };
  el.ondrop = (event) => {
    if (!view.drag) return;
    const place = bookmarkDropPlace(view.drag, item, dropZone(event, el, item, axis));
    if (!place) return;
    event.preventDefault();
    event.stopPropagation();
    move(view.drag, place);
  };
}

function dropZone(event, el, item, axis) {
  const rect = el.getBoundingClientRect();
  const ratio = axis === 'x' ? (event.clientX - rect.left) / rect.width : (event.clientY - rect.top) / rect.height;
  return bookmarkDropZone(ratio, item.kind === 'folder');
}

function clearDropMarks() {
  barEl?.querySelectorAll('[data-drop]').forEach((el) => { delete el.dataset.drop; });
}

async function move(item, place) {
  view.drag = null;
  clearDropMarks();
  try {
    await api.bookmarks.move(item.id, place);
  } catch {
    toast(`Couldn't move ${item.title}`);
  }
}

function favicon(url) {
  const src = faviconUrl(url, 32);
  return src ? h('img.bm-icon', { src, alt: '', draggable: 'false' }) : icon('globe', 14, 1.8);
}

// Hovering a folder opens its menu, so a mouse click only makes sure it is open; Enter or Space (a click
// with detail 0) toggles it for keyboard users.
function clickMenu(event, anchor, folder) {
  const open = view.menu?.anchor === anchor;
  if (open && event.detail === 0) setMenu(null);
  else if (!open) setMenu({ anchor, path: [folder] });
}

function hoverMenu(anchor, folder) {
  clearTimeout(view.closeTimer);
  if (view.menu?.anchor !== anchor) setMenu({ anchor, path: [folder] });
}

// The menu shows one folder at a time; a subfolder opens in place with a Back row.
function setMenu(menu) {
  setContext(null);
  barEl?.querySelector('.bm-menu')?.remove();
  barEl?.querySelectorAll('.bm-item[aria-expanded="true"]').forEach((el) => el.setAttribute('aria-expanded', 'false'));
  view.menu = menu;
  if (!menu || !barEl) return;
  menu.anchor.setAttribute('aria-expanded', 'true');
  const folder = menu.path[menu.path.length - 1];
  const rows = folder.children.map((child) => {
    const row = child.kind === 'link'
      ? h('a.option', { href: child.url, title: child.url }, favicon(child.url), h('span.label', {}, child.title))
      : h('button.option', {
        type: 'button',
        onclick: () => { setMenu({ ...menu, path: [...menu.path, child] }); focusMenu(); }
      }, h('span.label', {}, child.title), icon('chevronRight', 14, 2));
    wireItem(row, child, 'y');
    return row;
  });
  const back = menu.path.length > 1
    ? h('button.option', {
      type: 'button',
      onclick: () => { setMenu({ ...menu, path: menu.path.slice(0, -1) }); focusMenu(); }
    }, icon('chevronLeft', 14, 2), h('span.label', {}, 'Back'))
    : null;
  const empty = h('p.bm-empty', {}, 'Empty folder');
  // An empty folder (not ») takes a drop into it.
  if (folder.id !== MORE) {
    empty.ondragover = (event) => { if (view.drag && bookmarkDropPlace(view.drag, folder, 'into')) event.preventDefault(); };
    empty.ondrop = (event) => {
      const place = view.drag && bookmarkDropPlace(view.drag, folder, 'into');
      if (place) { event.preventDefault(); move(view.drag, place); }
    };
  }
  const el = h('div.menu.bm-menu', {
    // Right-click in the menu's empty space adds to this folder.
    oncontextmenu: (event) => {
      if (event.target.closest('.option')) return;
      if (folder.id === MORE) event.preventDefault();
      else openContext(event, folder, { inside: true });
    }
  },
  back,
  h('div.menu-head', {}, folder.title.toUpperCase()),
  ...(rows.length ? rows : [empty]));
  // Under its button, kept inside the bar's width.
  const right = barEl.clientWidth - 16 - 260;
  el.style.left = `${Math.max(0, Math.min(menu.anchor.offsetLeft, right))}px`;
  barEl.append(el);
}

function focusMenu() {
  barEl?.querySelector('.bm-menu .option')?.focus();
}

// ---------- Right-click menu ----------

// target: a link or folder, or null for the bar itself. inside: the folder's own menu was right-clicked, so
// "Add" goes into it rather than next to it.
function openContext(event, target, { inside = false } = {}) {
  if (!api?.bookmarks || isModalOpen()) return;
  event.preventDefault();
  event.stopPropagation();
  clearTimeout(view.closeTimer);
  // New items go after the right-clicked one, into the folder whose menu was right-clicked, or at the bar's end.
  const addTo = target && !inside ? { parentId: target.parentId, index: target.index + 1 } : { parentId: inside ? target.id : view.barId };
  const close = (fn) => () => { setContext(null); setMenu(null); fn(); };
  const row = (label, fn, props = {}) => h('button.option', { type: 'button', role: 'menuitem', onclick: close(fn), ...props }, h('span.label', {}, label));
  const sep = () => h('hr.bm-sep');
  const links = target?.kind === 'folder' ? target.children.filter((c) => c.kind === 'link') : [];
  const rows = [];
  if (target?.kind === 'link') {
    rows.push(
      row('Open in new tab', () => openTab(target.url)),
      row('Open in new window', () => openWindow([target.url])),
      sep(),
      row('Edit…', () => openBookmarkEditor({ item: target })),
      row('Delete', () => remove(target)));
  } else if (target?.kind === 'folder') {
    rows.push(
      row(`Open all (${links.length})`, () => links.forEach((l) => openTab(l.url)), { disabled: !links.length }),
      row('Open all in new window', () => openWindow(links.map((l) => l.url)), { disabled: !links.length }),
      sep(),
      row('Rename…', () => openBookmarkEditor({ item: target })),
      row('Delete', () => remove(target)));
  }
  if (rows.length) rows.push(sep());
  rows.push(
    row('Add page…', () => openBookmarkEditor({ kind: 'link', place: addTo })),
    row('Add folder…', () => openBookmarkEditor({ kind: 'folder', place: addTo })),
    sep(),
    row('Bookmark manager', () => openTab('chrome://bookmarks/', true)));
  const menu = h('div.menu.bm-context', { role: 'menu', 'aria-label': target ? `${target.title} options` : 'Bookmarks bar options' }, ...rows);
  // At the pointer, in stage units (the stage is scaled), kept inside the bar's width. From the keyboard
  // (context-menu key, Shift+F10) it opens under the focused item.
  const navRect = barEl.getBoundingClientRect();
  const scale = navRect.width / barEl.offsetWidth || 1;
  const from = event.target.closest('a, button');
  const fromRect = from?.getBoundingClientRect();
  const pointer = event.clientX || event.clientY;
  const x = pointer ? (event.clientX - navRect.left) / scale : fromRect ? (fromRect.left - navRect.left) / scale : 16;
  const y = pointer ? (event.clientY - navRect.top) / scale : fromRect ? (fromRect.bottom - navRect.top) / scale : barEl.offsetHeight;
  setContext({ el: menu, from });
  menu.style.left = `${Math.max(0, Math.min(x, barEl.offsetWidth - 240))}px`;
  menu.style.top = `${y + 2}px`;
  barEl.append(menu);
  menu.querySelector('.option:not(:disabled)')?.focus();
}

function setContext(context) {
  view.context?.el.remove();
  view.context = context;
}

function openTab(url, active = false) {
  if (api?.tabs?.create) api.tabs.create({ url, active });
  else window.open(url, '_blank', 'noopener');
}

function openWindow(urls) {
  if (!urls.length) return;
  if (api?.windows?.create) api.windows.create({ url: urls });
  else urls.forEach((url) => window.open(url, '_blank', 'noopener'));
}

// Deletes at once, like Chrome, with Undo in the toast: the removed bookmark (or folder with its contents)
// is recreated at its old place.
async function remove(item) {
  try {
    const [tree] = await api.bookmarks.getSubTree(item.id);
    if (tree.children) await api.bookmarks.removeTree(item.id);
    else await api.bookmarks.remove(item.id);
    toast(`Deleted ${item.title}`, { label: 'Undo', run: () => restore(tree, tree.parentId, tree.index) });
  } catch {
    toast(`Couldn't delete ${item.title}`);
  }
}

async function restore(node, parentId, index) {
  const made = await api.bookmarks.create({ parentId, index, title: node.title, ...(node.url ? { url: node.url } : {}) });
  for (const child of node.children || []) await restore(child, made.id, undefined);
}
