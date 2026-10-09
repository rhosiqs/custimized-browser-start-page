// The single in-memory copy of profiles, the active profile's settings and history; every change goes through
// update() or a profile action so it is saved and re-rendered.
import { PROFILE_NAME_MAX, buildBackup, clone, createId, defaultSettings, keepSharedFrom, nextProfileName, normalizeProfiles, recordHistory, uniqueProfileName } from './core.js';
import { loadHistory, loadProfiles, loadSettings, removeSettings, saveHistory, saveProfiles, saveSettings } from './storage.js';

const listeners = new Set();

export const store = {
  profiles: null,
  settings: null,
  history: null
};

export async function initStore() {
  [store.profiles, store.history] = await Promise.all([loadProfiles(), loadHistory()]);
  store.settings = await loadSettings(store.profiles.active);
}

export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notify() {
  listeners.forEach((listener) => listener(store.settings));
}

// update(draft => { draft.x = y }) or update(nextSettings)
export function update(change) {
  let next;
  if (typeof change === 'function') {
    next = clone(store.settings);
    change(next);
  } else {
    next = clone(change);
  }
  store.settings = next;
  saveSettings(store.profiles.active, next);
  notify();
}

// Settings saved by another tab replace ours without writing back. Shared items change in every profile, so a
// change to them reloads the profile in use as well.
export async function reloadFromOtherTab() {
  const settings = await loadSettings(store.profiles.active);
  if (JSON.stringify(settings) === JSON.stringify(store.settings)) return;
  store.settings = settings;
  notify();
}

export function activeProfile() {
  return store.profiles.list.find((p) => p.id === store.profiles.active);
}

function setProfiles(profiles) {
  store.profiles = profiles;
  saveProfiles(profiles);
}

export async function switchProfile(id) {
  if (id === store.profiles.active || !store.profiles.list.some((p) => p.id === id)) return;
  const settings = await loadSettings(id);
  setProfiles({ ...store.profiles, active: id });
  store.settings = settings;
  notify();
}

// A new profile starts from the defaults, or from a copy of the current one; it becomes the active profile.
// Either way it shows the shared shortcuts and launchers.
export function createProfile({ copy = false } = {}) {
  const profile = { id: createId('pf'), name: nextProfileName(store.profiles.list) };
  const settings = copy ? clone(store.settings) : keepSharedFrom(defaultSettings(), store.settings);
  saveSettings(profile.id, settings);
  setProfiles({ active: profile.id, list: [...store.profiles.list, profile] });
  store.settings = settings;
  notify();
  return profile;
}

// A backup of the profile in use or of every profile, as saved (see buildBackup). The profile in use comes from
// memory, the others from storage.
export async function backupOf(scope) {
  const profiles = scope === 'all' ? store.profiles.list : [activeProfile()];
  const entries = [];
  for (const profile of profiles) {
    const settings = profile.id === store.profiles.active ? clone(store.settings) : await loadSettings(profile.id);
    entries.push({ name: profile.name, icon: profile.icon, settings });
  }
  return buildBackup(entries);
}

// Separate import: each entry { name, icon?, settings } (settings already normalized and without shared flags)
// becomes a new profile with its own name, made unique if taken. The profile in use stays active. Like any new
// profile, each one shows the items shown on all profiles. Returns the names given.
export function importProfiles(entries) {
  const list = [...store.profiles.list];
  for (const entry of entries) {
    const profile = { id: createId('pf'), name: uniqueProfileName(entry.name, list.map((p) => p.name)), ...(entry.icon ? { icon: entry.icon } : {}) };
    saveSettings(profile.id, keepSharedFrom(entry.settings, store.settings));
    list.push(profile);
  }
  setProfiles(normalizeProfiles({ ...store.profiles, list }));
  notify();
  return store.profiles.list.slice(store.profiles.list.length - entries.length).map((p) => p.name);
}

export function renameProfile(id, name) {
  const clean = String(name ?? '').trim().slice(0, PROFILE_NAME_MAX);
  if (!clean) return;
  setProfiles({ ...store.profiles, list: store.profiles.list.map((p) => (p.id === id ? { ...p, name: clean } : p)) });
  notify();
}

// icon is an icon object (see normalizeIcon), or null for the default first-letter icon.
export function setProfileIcon(id, icon) {
  const list = store.profiles.list.map((p) => (p.id === id ? { id: p.id, name: p.name, ...(icon ? { icon } : {}) } : p));
  setProfiles(normalizeProfiles({ ...store.profiles, list }));
  notify();
}

// Only a profile that is not in use can be removed, so there is always one left.
export function deleteProfile(id) {
  if (id === store.profiles.active) return;
  setProfiles({ ...store.profiles, list: store.profiles.list.filter((p) => p.id !== id) });
  removeSettings(id);
  notify();
}

// Another tab changed the profile list; follow its active profile unless told to keep ours.
export async function profilesFromOtherTab(profiles, { keepActive = false } = {}) {
  const active = keepActive && profiles.list.some((p) => p.id === store.profiles.active) ? store.profiles.active : profiles.active;
  if (active !== store.profiles.active) store.settings = await loadSettings(active);
  store.profiles = { ...profiles, active };
  notify();
}

export function rememberQuery(box, query) {
  store.history = recordHistory(store.history, box, query);
  saveHistory(store.history);
}

export function clearHistory() {
  store.history = { web: [], ai: [], acad: [] };
  saveHistory(store.history);
}
