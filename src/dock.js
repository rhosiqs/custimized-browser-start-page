// Bottom launcher dock: hover or focus previews a group's links, click pins it; plus theme and settings buttons.
import { colorOf, hostOf } from './core.js';
import { h, icon } from './dom.js';
import { store, update } from './state.js';
import { openSettings } from './settings.js';
import { isDark } from './appearance.js';
import { badge, launcherMark } from './widgets.js';

const view = { open: null, pinned: false };

export function renderDock(nav) {
  const { launchers } = store.settings;
  const dark = isDark(store.settings);
  nav.replaceChildren(
    ...launchers.map((group) => launcher(group)),
    h('button.launcher-add', { type: 'button', 'aria-label': 'Add launcher', onclick: () => openSettings({ tab: 'Launchers', addLauncher: true }) }, icon('plus', 18)),
    h('span.dock-sep', { 'aria-hidden': 'true' }),
    h('button.icon-btn', {
      type: 'button',
      'aria-label': dark ? 'Switch to light theme' : 'Switch to dark theme',
      onclick: () => update((settings) => { settings.theme = dark ? 'light' : 'dark'; })
    }, icon(dark ? 'sun' : 'moon', 20, 1.8)),
    h('button.icon-btn', { type: 'button', 'aria-label': 'Settings', onclick: () => openSettings() }, icon('sliders', 20, 1.8))
  );
}

export function closeDockPopups(keep) {
  if (view.open && keep !== 'launcher') setOpen(null, false);
}

function setOpen(id, pinned) {
  view.open = id;
  view.pinned = pinned;
  document.querySelectorAll('.launcher').forEach((el) => {
    const on = el.dataset.id === id;
    el.querySelector('.launcher-btn').setAttribute('aria-expanded', String(on));
    el.querySelector('.flyout').hidden = !on;
  });
}

function launcher(group) {
  const swatch = colorOf(group.color);
  const open = view.open === group.id;
  const flyoutId = `flyout-${group.id}`;
  const button = h('button.launcher-btn', {
    type: 'button',
    'aria-label': `${group.name} links`,
    'aria-expanded': String(open),
    'aria-controls': flyoutId,
    style: { background: swatch.fill, color: swatch.fg },
    onmouseenter: () => { if (!view.pinned) setOpen(group.id, false); },
    onfocus: () => { if (!view.pinned) setOpen(group.id, false); },
    onclick: () => (view.open === group.id && view.pinned ? setOpen(null, false) : setOpen(group.id, true))
  }, launcherMark(group));

  const links = group.links.length
    ? group.links.map((link) => h('a.flyout-link', { href: link.url },
      badge({ name: link.name, url: link.url, color: null }),
      h('span.name', {}, link.name),
      h('span.host', {}, hostOf(link.url))))
    : [h('p.flyout-empty', {}, 'No links yet.')];

  const flyout = h('div.flyout', { id: flyoutId, hidden: !open },
    h('div.flyout-card', {},
      h('div.flyout-head', {},
        h('strong', {}, group.name),
        h('button', { type: 'button', onclick: () => { setOpen(null, false); openSettings({ tab: 'Launchers', launcherId: group.id }); } }, 'Edit')),
      ...links));

  return h('div.launcher', {
    dataset: { keep: 'launcher', id: group.id },
    onmouseleave: () => { if (!view.pinned && view.open === group.id) setOpen(null, false); },
    onkeydown: (event) => {
      if (event.key === 'Escape' && view.open) { event.preventDefault(); setOpen(null, false); button.focus(); }
    },
    onfocusout: (event) => {
      const wrap = event.currentTarget;
      if (!wrap.contains(event.relatedTarget) && view.open === group.id) setOpen(null, false);
    }
  }, button, flyout);
}
