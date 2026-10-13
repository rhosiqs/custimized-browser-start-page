// Optional bookmarks bar at the top of the page (Settings › Layout): the browser's own bookmarks bar folder,
// read with the optional "bookmarks" permission. Folders open a menu; items that don't fit go under ».
import { bookmarkBarFolder, bookmarkItems } from './core.js';
import { h, icon } from './dom.js';
import { faviconUrl } from './storage.js';

export const BOOKMARKS_PERMISSION = { permissions: ['bookmarks'] };
const api = typeof chrome !== 'undefined' ? chrome : null;
const view = { items: null, granted: null, menu: null, listening: false };
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
  if (view.menu && keep !== 'bookmarks') setMenu(null);
}

async function load() {
  if (view.granted && api?.bookmarks?.getTree) {
    try {
      view.items = bookmarkItems(bookmarkBarFolder(await api.bookmarks.getTree()));
    } catch {
      view.items = [];
    }
    listen();
  }
  if (barEl && !barEl.hidden) draw();
}

// Follow bookmark changes made in the browser while the page is open.
function listen() {
  if (view.listening || !api?.bookmarks) return;
  view.listening = true;
  for (const event of ['onCreated', 'onRemoved', 'onChanged', 'onMoved', 'onChildrenReordered', 'onImportEnded']) {
    api.bookmarks[event]?.addListener(() => load());
  }
}

function draw() {
  const nav = barEl;
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
    }, icon('folder', 16, 1.8), h('span.bm-title', {}, 'Allow access to bookmarks')));
    return;
  }
  const items = view.items || [];
  if (!items.length) {
    nav.replaceChildren(h('span.bm-note', {}, view.items ? 'Your bookmarks bar is empty.' : ''));
    return;
  }
  const list = h('div.bm-list', {}, ...items.map((item) => itemEl(item)));
  const more = h('button.bm-item.bm-more', {
    type: 'button', 'aria-label': 'More bookmarks', 'aria-haspopup': 'true', 'aria-expanded': 'false', hidden: true,
    onclick: () => toggleMenu(more, { title: 'More', children: overflow })
  }, icon('chevronsRight', 16, 2));
  let overflow = [];
  nav.replaceChildren(list, more);
  nav.dataset.keep = 'bookmarks';
  nav.onkeydown = (event) => {
    if (event.key === 'Escape' && view.menu) {
      event.preventDefault();
      const anchor = view.menu.anchor;
      setMenu(null);
      anchor.focus();
    }
  };
  // Hide what doesn't fit (layout sizes are unscaled, so no stage-scale math is needed) and list it under ».
  const fit = () => {
    const children = [...list.children];
    children.forEach((el) => { el.hidden = false; });
    if (list.scrollWidth <= list.clientWidth) return;
    more.hidden = false;
    const limit = list.clientWidth;
    overflow = [];
    children.forEach((el, i) => {
      if (el.offsetLeft + el.offsetWidth > limit) { el.hidden = true; overflow.push(items[i]); }
    });
  };
  requestAnimationFrame(fit);
}

function itemEl(item) {
  if (item.kind === 'link') {
    return h('a.bm-item', { href: item.url, title: `${item.title}\n${item.url}` }, favicon(item.url), h('span.bm-title', {}, item.title));
  }
  const button = h('button.bm-item', {
    type: 'button', title: item.title, 'aria-haspopup': 'true', 'aria-expanded': 'false',
    onclick: () => toggleMenu(button, item)
  }, h('span.bm-title', {}, item.title));
  return button;
}

function favicon(url) {
  const src = faviconUrl(url, 32);
  return src ? h('img.bm-icon', { src, alt: '', draggable: 'false' }) : icon('globe', 16, 1.8);
}

function toggleMenu(anchor, folder) {
  if (view.menu?.anchor === anchor) setMenu(null);
  else setMenu({ anchor, path: [folder] });
}

// The menu shows one folder at a time; a subfolder opens in place with a Back row.
function setMenu(menu) {
  barEl?.querySelector('.bm-menu')?.remove();
  barEl?.querySelectorAll('[aria-expanded="true"]').forEach((el) => el.setAttribute('aria-expanded', 'false'));
  view.menu = menu;
  if (!menu || !barEl) return;
  menu.anchor.setAttribute('aria-expanded', 'true');
  const folder = menu.path[menu.path.length - 1];
  const rows = folder.children.map((child) => (child.kind === 'link'
    ? h('a.option', { href: child.url, title: child.url }, favicon(child.url), h('span.label', {}, child.title))
    : h('button.option', {
      type: 'button',
      onclick: () => { setMenu({ ...menu, path: [...menu.path, child] }); focusMenu(); }
    }, h('span.label', {}, child.title), icon('chevronRight', 14, 2))));
  const back = menu.path.length > 1
    ? h('button.option', {
      type: 'button',
      onclick: () => { setMenu({ ...menu, path: menu.path.slice(0, -1) }); focusMenu(); }
    }, icon('chevronLeft', 14, 2), h('span.label', {}, 'Back'))
    : null;
  const el = h('div.menu.bm-menu', {},
    back,
    h('div.menu-head', {}, folder.title.toUpperCase()),
    ...(rows.length ? rows : [h('p.bm-empty', {}, 'Empty folder')]));
  // Under its button, kept inside the bar's width.
  const right = barEl.clientWidth - 24 - 280;
  el.style.left = `${Math.max(0, Math.min(menu.anchor.offsetLeft, right))}px`;
  barEl.append(el);
}

function focusMenu() {
  barEl?.querySelector('.bm-menu .option')?.focus();
}
