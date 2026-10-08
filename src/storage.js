// Persistence: chrome.storage.local inside the extension, localStorage when the page is opened as a plain file.
import {
  defaultSettings, emptyHistory, emptyShared, joinShared, normalizeHistory, normalizeProfiles, normalizeSettings, normalizeShared, profileOfSettingsKey, profileSettingsKey, splitShared
} from './core.js';

const PROFILES_KEY = 'startPage:profiles';
const HISTORY_KEY = 'startPage:history';
// Shortcuts and launchers shown on all profiles; each profile keeps only stubs that give their place (see joinShared).
const SHARED_KEY = 'startPage:shared';

const chromeStore = typeof chrome !== 'undefined' && chrome.storage?.local ? chrome.storage.local : null;

async function readRaw(key) {
  if (chromeStore) return (await chromeStore.get(key))[key];
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : undefined;
  } catch {
    return undefined;
  }
}

async function writeRaw(key, value) {
  if (chromeStore) return chromeStore.set({ [key]: value });
  localStorage.setItem(key, JSON.stringify(value));
}

async function removeRaw(key) {
  if (chromeStore) return chromeStore.remove(key);
  localStorage.removeItem(key);
}

export async function loadProfiles() {
  return normalizeProfiles(await readRaw(PROFILES_KEY));
}

export function saveProfiles(profiles) {
  return writeRaw(PROFILES_KEY, profiles);
}

// What this page last read or wrote of the shared store, so a save writes it only when it changed.
let lastShared = JSON.stringify(emptyShared());

async function loadShared() {
  const shared = normalizeShared(await readRaw(SHARED_KEY));
  lastShared = JSON.stringify(shared);
  return shared;
}

// A profile with nothing saved yet starts from the defaults. Shared items are joined in before normalizing.
export async function loadSettings(profileId) {
  const [raw, shared] = await Promise.all([readRaw(profileSettingsKey(profileId)), loadShared()]);
  return normalizeSettings(joinShared(raw || defaultSettings(), shared)).settings;
}

// Splits shared items out: the profile keeps stubs, the shared store keeps the items.
export async function saveSettings(profileId, settings) {
  const { profile, shared } = splitShared(settings);
  const json = JSON.stringify(shared);
  // Both writes start at once, so quick saves keep their order.
  const writes = [];
  if (json !== lastShared) {
    lastShared = json;
    writes.push(writeRaw(SHARED_KEY, shared));
  }
  writes.push(writeRaw(profileSettingsKey(profileId), profile));
  return Promise.all(writes);
}

export function removeSettings(profileId) {
  return removeRaw(profileSettingsKey(profileId));
}

export async function loadHistory() {
  const raw = await readRaw(HISTORY_KEY);
  return raw ? normalizeHistory(raw) : emptyHistory();
}

export function saveHistory(history) {
  return writeRaw(HISTORY_KEY, history);
}

// Calls back when another new tab changes the profile list, saves a profile's settings or changes the shared items,
// so open tabs stay in sync. onSettings gets the profile id; the caller reloads the one it shows.
export function onStorageChanged({ onProfiles, onSettings, onShared }) {
  const handle = (key, value) => {
    if (key === PROFILES_KEY) return onProfiles(normalizeProfiles(value));
    if (key === SHARED_KEY) return onShared();
    const profileId = profileOfSettingsKey(key);
    if (profileId) onSettings(profileId);
  };
  if (chromeStore && chrome.storage.onChanged) {
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== 'local') return;
      for (const [key, change] of Object.entries(changes)) if (change.newValue) handle(key, change.newValue);
    });
  } else {
    window.addEventListener('storage', (event) => {
      if (!event.key || !event.newValue) return;
      try {
        handle(event.key, JSON.parse(event.newValue));
      } catch {
        // Ignore malformed values written by other pages.
      }
    });
  }
}

// Chrome's local favicon cache (needs the "favicon" permission). For pages it has no icon for,
// Chrome returns a generic globe rather than an error, so callers compare against that globe.
export function faviconUrl(pageUrl, size = 64) {
  if (typeof chrome === 'undefined' || !chrome.runtime?.getURL) return '';
  const url = new URL(chrome.runtime.getURL('/_favicon/'));
  url.searchParams.set('pageUrl', pageUrl);
  url.searchParams.set('size', String(size));
  return url.href;
}

// Where to look for a website icon, in order: Chrome's cache, then the site's own well-known icon files.
export function siteIconSources(pageUrl) {
  let origin = '';
  try {
    const parsed = new URL(pageUrl);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') origin = parsed.origin;
  } catch {
    return [];
  }
  const sources = [];
  const cached = faviconUrl(pageUrl, 64);
  if (cached) sources.push({ src: cached, chromeCache: true });
  if (origin) sources.push({ src: `${origin}/favicon.ico` }, { src: `${origin}/apple-touch-icon.png` });
  return sources;
}
