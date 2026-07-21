import { reactive, watch } from 'vue';

const DEFAULT_SETTINGS = {
  clock: { format24h: true, showSeconds: false, showDate: true },
  search: { engine: 'google', showAIShortcuts: true },
  theme: { primaryColor: '#6C63FF', accentColor: '#00D9FF' },
  background: { type: 'color', value: '#0a0a1a' },
  widgetVisibility: {
    clock: true, search: true, bookmarks: true,
    weather: true, news: true, notes: true, planner: true, dailyBrief: true
  },
  newsApiKey: ''
};

const STORAGE_KEY = 'BHE_SETTINGS';

// App-wide singleton reactive state
const settings = reactive(JSON.parse(JSON.stringify(DEFAULT_SETTINGS)));
let isInitialized = false;

export function useSettings() {
  const loadSettings = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Deep merge to preserve structure
        Object.assign(settings, {
          ...DEFAULT_SETTINGS,
          ...parsed,
          clock: { ...DEFAULT_SETTINGS.clock, ...(parsed.clock || {}) },
          search: { ...DEFAULT_SETTINGS.search, ...(parsed.search || {}) },
          theme: { ...DEFAULT_SETTINGS.theme, ...(parsed.theme || {}) },
          background: { ...DEFAULT_SETTINGS.background, ...(parsed.background || {}) },
          widgetVisibility: { ...DEFAULT_SETTINGS.widgetVisibility, ...(parsed.widgetVisibility || {}) }
        });
      }
    } catch (e) {
      console.error('Failed to load settings from localStorage', e);
    }
  };

  const saveSettings = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to save settings to localStorage', e);
    }
  };

  const updateSettings = (path, value) => {
    const keys = path.split('.');
    let current = settings;
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) current[keys[i]] = {};
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;
  };

  const resetSettings = () => {
    Object.assign(settings, JSON.parse(JSON.stringify(DEFAULT_SETTINGS)));
    saveSettings();
  };

  // Initialize once
  if (!isInitialized) {
    loadSettings();
    watch(settings, () => {
      saveSettings();
    }, { deep: true });
    isInitialized = true;
  }

  return {
    settings,
    updateSettings,
    resetSettings,
    loadSettings,
    saveSettings
  };
}
