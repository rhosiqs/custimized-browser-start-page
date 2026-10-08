// Bottom launcher dock: the profile switcher on the left; hover or focus previews a launcher group's links,
// click pins it; plus theme and settings buttons.
import { hostOf, profileIcon } from './core.js';
import { h, icon } from './dom.js';
import { activeProfile, createProfile, store, switchProfile, update } from './state.js';
import { openSettings } from './settings.js';
import { isDark } from './appearance.js';
import { badge, launcherFaceStyle, launcherMark } from './widgets.js';

const view = { open: null, pinned: false, profiles: false };

export function renderDock(nav) {
  const { launchers } = store.settings;
  const dark = isDark(store.settings);
  nav.replaceChildren(
    profileSwitcher(),
    h('span.dock-sep', { 'aria-hidden': 'true' }),
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
  if (view.profiles && keep !== 'profile') setProfilesOpen(false);
}

function setProfilesOpen(open) {
  view.profiles = open;
  const wrap = document.querySelector('.profile-switch');
  if (!wrap) return;
  wrap.querySelector('.profile-btn').setAttribute('aria-expanded', String(open));
  wrap.querySelector('.flyout').hidden = !open;
}

// The current profile's name on the left of the dock; its menu switches, adds or manages profiles.
function profileSwitcher() {
  const current = activeProfile();
  const mark = profileIcon(current);
  const hasMark = mark.kind !== 'none';
  const button = h(`button.profile-btn${hasMark ? '' : '.no-mark'}`, {
    type: 'button',
    'aria-label': `Profile: ${current.name}. Switch profile`,
    'aria-expanded': String(view.profiles),
    'aria-controls': 'profile-menu',
    onclick: () => setProfilesOpen(!view.profiles)
  },
  hasMark ? badge({ name: current.name, url: '', icon: mark }, 'profile-mark') : null,
  h('span.profile-name', {}, current.name),
  icon('chevronUp', 14, 2));

  const pickAndClose = (fn) => () => { setProfilesOpen(false); fn(); button.focus(); };
  const menu = h('div.flyout', { id: 'profile-menu', hidden: !view.profiles },
    h('div.flyout-card', {},
      h('div.flyout-head', {},
        h('strong', {}, 'Profiles'),
        h('button', { type: 'button', onclick: () => { setProfilesOpen(false); openSettings({ tab: 'Profiles' }); } }, 'Manage')),
      ...store.profiles.list.map((profile) => {
        const on = profile.id === store.profiles.active;
        return h('button.flyout-link.profile-item', {
          type: 'button',
          'aria-current': on ? 'true' : null,
          onclick: pickAndClose(() => switchProfile(profile.id))
        },
        badge({ name: profile.name, url: '', icon: profileIcon(profile) }, 'profile'),
        h('span.name', {}, profile.name),
        on ? h('span.host', {}, 'In use') : null);
      }),
      h('button.flyout-link.profile-item', {
        type: 'button',
        onclick: () => { setProfilesOpen(false); createProfile(); openSettings({ tab: 'Profiles' }); }
      },
      h('span.badge', { 'aria-hidden': 'true' }, icon('plus', 16, 2)),
      h('span.name', {}, 'New profile'))));

  return h('div.profile-switch', {
    dataset: { keep: 'profile' },
    onkeydown: (event) => {
      if (event.key === 'Escape' && view.profiles) { event.preventDefault(); setProfilesOpen(false); button.focus(); }
    },
    onfocusout: (event) => {
      if (!event.currentTarget.contains(event.relatedTarget) && view.profiles) setProfilesOpen(false);
    }
  }, button, menu);
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
  const open = view.open === group.id;
  const flyoutId = `flyout-${group.id}`;
  const button = h('button.launcher-btn.launcher-face', {
    type: 'button',
    'aria-label': `${group.name} links`,
    'aria-expanded': String(open),
    'aria-controls': flyoutId,
    style: launcherFaceStyle(group.icon),
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
