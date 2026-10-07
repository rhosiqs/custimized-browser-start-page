// The single in-memory copy of settings and history; every change goes through update() so it is saved and re-rendered.
import { clone, recordHistory } from './core.js';
import { loadHistory, loadSettings, saveHistory, saveSettings } from './storage.js';

const listeners = new Set();

export const store = {
  settings: null,
  history: null
};

export async function initStore() {
  [store.settings, store.history] = await Promise.all([loadSettings(), loadHistory()]);
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
  saveSettings(next);
  notify();
}

// Settings saved by another tab replace ours without writing back.
export function replaceFromOtherTab(settings) {
  store.settings = settings;
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
