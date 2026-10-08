// Persistence: chrome.storage.local inside the extension, localStorage when the page is opened as a plain file.
import { defaultSettings, emptyHistory, normalizeHistory, normalizeProfiles, normalizeSettings, profileOfSettingsKey, profileSettingsKey } from './core.js';

const PROFILES_KEY = 'startPage:profiles';
const HISTORY_KEY = 'startPage:history';

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

// A profile with nothing saved yet starts from the defaults.
export async function loadSettings(profileId) {
  const raw = await readRaw(profileSettingsKey(profileId));
  return raw ? normalizeSettings(raw).settings : defaultSettings();
}

export function saveSettings(profileId, settings) {
  return writeRaw(profileSettingsKey(profileId), settings);
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

// Calls back when another new tab changes the profile list or saves a profile's settings, so open tabs stay in sync.
// onSettings gets (profileId, settings) for any profile; the caller keeps the one it shows.
export function onStorageChanged({ onProfiles, onSettings }) {
  const handle = (key, value) => {
    if (key === PROFILES_KEY) return onProfiles(normalizeProfiles(value));
    const profileId = profileOfSettingsKey(key);
    if (profileId) onSettings(profileId, normalizeSettings(value).settings);
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
