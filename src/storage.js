// Persistence: chrome.storage.local inside the extension, localStorage when the page is opened as a plain file.
import { defaultSettings, emptyHistory, normalizeHistory, normalizeSettings } from './core.js';

const SETTINGS_KEY = 'startPage:settings';
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

export async function loadSettings() {
  const raw = await readRaw(SETTINGS_KEY);
  return raw ? normalizeSettings(raw).settings : defaultSettings();
}

export function saveSettings(settings) {
  return writeRaw(SETTINGS_KEY, settings);
}

export async function loadHistory() {
  const raw = await readRaw(HISTORY_KEY);
  return raw ? normalizeHistory(raw) : emptyHistory();
}

export function saveHistory(history) {
  return writeRaw(HISTORY_KEY, history);
}

// Calls back when another new tab saves settings, so open tabs stay in sync.
export function onSettingsChanged(callback) {
  if (chromeStore && chrome.storage.onChanged) {
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === 'local' && changes[SETTINGS_KEY]?.newValue) callback(normalizeSettings(changes[SETTINGS_KEY].newValue).settings);
    });
  } else {
    window.addEventListener('storage', (event) => {
      if (event.key !== SETTINGS_KEY || !event.newValue) return;
      try {
        callback(normalizeSettings(JSON.parse(event.newValue)).settings);
      } catch {
        // Ignore malformed values written by other pages.
      }
    });
  }
}

// Website icons come from Chrome's local favicon cache (needs the "favicon" permission).
export function faviconUrl(pageUrl, size = 64) {
  if (typeof chrome === 'undefined' || !chrome.runtime?.getURL) return '';
  const url = new URL(chrome.runtime.getURL('/_favicon/'));
  url.searchParams.set('pageUrl', pageUrl);
  url.searchParams.set('size', String(size));
  return url.href;
}
