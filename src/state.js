// The single in-memory copy of profiles, the active profile's settings and history; every change goes through
// update() or a profile action so it is saved and re-rendered.
import { PROFILE_NAME_MAX, clone, createId, defaultSettings, nextProfileName, recordHistory } from './core.js';
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

// Settings saved by another tab replace ours without writing back.
export function replaceFromOtherTab(settings) {
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
export function createProfile({ copy = false } = {}) {
  const profile = { id: createId('pf'), name: nextProfileName(store.profiles.list) };
  const settings = copy ? clone(store.settings) : defaultSettings();
  saveSettings(profile.id, settings);
  setProfiles({ active: profile.id, list: [...store.profiles.list, profile] });
  store.settings = settings;
  notify();
  return profile;
}

export function renameProfile(id, name) {
  const clean = String(name ?? '').trim().slice(0, PROFILE_NAME_MAX);
  if (!clean) return;
  setProfiles({ ...store.profiles, list: store.profiles.list.map((p) => (p.id === id ? { ...p, name: clean } : p)) });
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
