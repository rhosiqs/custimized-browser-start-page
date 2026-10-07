// Pure logic shared by the new tab page and the Node tests: no DOM, no chrome.* calls.

export const SCHEMA_VERSION = 1;
export const HISTORY_LIMIT = 30;
export const SHORTCUT_IMAGE_LIMIT = 512 * 1024;
export const BACKGROUND_IMAGE_LIMIT = 3 * 1024 * 1024;

// Swatches for shortcut tiles and launchers: [fill, text on fill].
export const SWATCHES = Object.freeze({
  green: { label: 'Green', fill: 'oklch(0.5 0.1 150)', fg: '#f3f2f2' },
  brown: { label: 'Brown', fill: '#7d5411', fg: '#f3f2f2' },
  ink: { label: 'Graphite', fill: '#444141', fg: '#f3f2f2' },
  gold: { label: 'Gold', fill: '#b68235', fg: '#201f1d' },
  mint: { label: 'Mint', fill: 'oklch(0.8 0.06 150)', fg: '#201f1d' },
  beige: { label: 'Sand', fill: '#facb8d', fg: '#201f1d' }
});

export const ACCENTS = Object.freeze({
  green: { label: 'Green', preview: 'oklch(0.5 0.1 150)' },
  brown: { label: 'Brown', preview: '#7d5411' },
  ink: { label: 'Ink', preview: '#201f1d' }
});

export const THEMES = ['light', 'dark', 'system'];
export const BACKGROUNDS = ['solid', 'gradient', 'image'];
export const BLOCKS = Object.freeze({ clocks: 'Clocks', search: 'Search', shortcuts: 'Shortcuts' });
export const ICON_MODES = ['site', 'letter', 'upload'];

export const SEARCH_BOXES = Object.freeze({
  web: { kicker: 'WEB', placeholder: 'Search the web or paste a link' },
  ai: { kicker: 'AI', placeholder: 'Ask an AI assistant' },
  acad: { kicker: 'ACADEMIC', placeholder: 'Search papers and journals, or enter a DOI' }
});

const DEFAULT_ENGINES = {
  web: {
    default: 'google',
    list: [
      { id: 'bing', name: 'Bing', url: 'https://www.bing.com/search?q=%s' },
      { id: 'google', name: 'Google', url: 'https://www.google.com/search?q=%s' },
      { id: 'ddg', name: 'DuckDuckGo', url: 'https://duckduckgo.com/?q=%s' }
    ]
  },
  ai: {
    default: 'claude',
    list: [
      { id: 'gai', name: 'Google AI', url: 'https://www.google.com/search?udm=50&q=%s' },
      { id: 'chatgpt', name: 'ChatGPT', url: 'https://chatgpt.com/?q=%s' },
      { id: 'claude', name: 'Claude', url: 'https://claude.ai/new?q=%s' },
      { id: 'gemini', name: 'Gemini', url: 'https://gemini.google.com/app?q=%s' },
      { id: 'pplx', name: 'Perplexity', url: 'https://www.perplexity.ai/search?q=%s' },
      { id: 'grok', name: 'Grok', url: 'https://grok.com/?q=%s' }
    ]
  },
  acad: {
    default: 'scholar',
    list: [
      { id: 'scholar', name: 'Google Scholar', url: 'https://scholar.google.com/scholar?q=%s' },
      { id: 'pubmed', name: 'PubMed', url: 'https://pubmed.ncbi.nlm.nih.gov/?term=%s' },
      { id: 'pmc', name: 'PMC', url: 'https://pmc.ncbi.nlm.nih.gov/search/?term=%s' },
      { id: 'mjl', name: 'Master Journal List', url: 'https://mjl.clarivate.com/search-results?search=%s' }
    ]
  }
};

const DEFAULT_SHORTCUTS = [
  ['Gmail', 'https://mail.google.com', 'Daily', 'green'],
  ['Calendar', 'https://calendar.google.com', 'Daily', 'beige'],
  ['Notion', 'https://www.notion.so', 'Daily', 'ink'],
  ['Google Scholar', 'https://scholar.google.com', 'Research', 'brown'],
  ['PubMed', 'https://pubmed.ncbi.nlm.nih.gov', 'Research', 'green'],
  ['arXiv', 'https://arxiv.org', 'Research', 'gold'],
  ['Zotero', 'https://www.zotero.org', 'Research', 'mint'],
  ['GitHub', 'https://github.com', 'Dev', 'ink'],
  ['Stack Overflow', 'https://stackoverflow.com', 'Dev', 'gold'],
  ['MDN', 'https://developer.mozilla.org', 'Dev', 'brown'],
  ['YouTube', 'https://www.youtube.com', 'Media', 'beige'],
  ['Spotify', 'https://open.spotify.com', 'Media', 'mint']
];

const DEFAULT_LAUNCHERS = [
  ['Google', 'G', 'green', [['Gmail', 'mail.google.com'], ['Drive', 'drive.google.com'], ['Docs', 'docs.google.com'], ['Calendar', 'calendar.google.com'], ['Maps', 'maps.google.com']]],
  ['Microsoft', 'M', 'brown', [['Outlook', 'outlook.office.com'], ['OneDrive', 'onedrive.live.com'], ['Word', 'www.office.com'], ['Teams', 'teams.microsoft.com']]],
  ['AI', 'AI', 'gold', [['Claude', 'claude.ai'], ['ChatGPT', 'chatgpt.com'], ['Gemini', 'gemini.google.com'], ['Perplexity', 'www.perplexity.ai']]],
  ['Developer', '</>', 'ink', [['GitHub', 'github.com'], ['Stack Overflow', 'stackoverflow.com'], ['MDN', 'developer.mozilla.org'], ['npm', 'www.npmjs.com']]]
];

let idCounter = 0;
export function createId(prefix = 'id') {
  idCounter += 1;
  return `${prefix}-${Date.now().toString(36)}-${idCounter.toString(36)}`;
}

export function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

export function defaultSettings() {
  return {
    version: SCHEMA_VERSION,
    theme: 'system',
    accent: 'green',
    background: { type: 'solid', solid: '', from: '#f3f2f2', to: '#e8f3ea', image: '' },
    engines: clone(DEFAULT_ENGINES),
    clocks: {
      showSeconds: false,
      world: [
        { city: 'Tokyo', tz: 'Asia/Tokyo' },
        { city: 'London', tz: 'Europe/London' },
        { city: 'New York', tz: 'America/New_York' }
      ]
    },
    layout: { blocks: ['clocks', 'search', 'shortcuts'], rows: 2, perRow: 8 },
    shortcuts: DEFAULT_SHORTCUTS.map(([name, url, category, color], index) => ({
      id: `sc-${index + 1}`, name, url: new URL(url).href, category, color, icon: 'letter', image: ''
    })),
    launchers: DEFAULT_LAUNCHERS.map(([name, icon, color, links], index) => ({
      id: `ln-${index + 1}`, name, icon, color,
      links: links.map(([linkName, host]) => ({ name: linkName, url: `https://${host}/` }))
    }))
  };
}

// ---------- URLs, DOIs and routing ----------

const SCHEME = /^[a-z][a-z0-9+.-]*:/i;

// Accepts "example.com" or "https://example.com/x"; only http(s) results are allowed.
export function normalizeHttpUrl(raw) {
  const value = String(raw ?? '').trim();
  if (!value) return { ok: false, msg: 'Enter a web address.' };
  const looksLikeHostPort = /^[^\s/:]+\.[^\s/:]+:\d+/.test(value) || /^localhost:\d+/i.test(value);
  const full = SCHEME.test(value) && !looksLikeHostPort ? value : `https://${value}`;
  if (!/^https?:\/\//i.test(full)) return { ok: false, msg: 'Only http and https links are allowed.' };
  try {
    const url = new URL(full);
    if (!url.hostname) return { ok: false, msg: 'This is not a valid web address.' };
    return { ok: true, url: url.href };
  } catch {
    return { ok: false, msg: 'This is not a valid web address.' };
  }
}

export function hostOf(url) {
  try {
    return new URL(url).host.replace(/^www\./, '');
  } catch {
    return '';
  }
}

export function normalizeDoi(raw) {
  const match = String(raw ?? '').trim().match(/^(?:doi:\s*|(?:https?:\/\/)?(?:dx\.)?doi\.org\/)?(10\.\d{4,9}\/\S+)$/i);
  return match ? match[1] : '';
}

export function buildSearchUrl(template, query) {
  return template.split('%s').join(encodeURIComponent(query));
}

export function isValidEngineUrl(url) {
  return /^https?:\/\/\S+$/i.test(String(url ?? '').trim()) && String(url).includes('%s');
}

// Decide what pressing Enter in a search box does.
export function routeQuery(raw, engine) {
  const query = String(raw ?? '').trim();
  if (!query) return { kind: 'empty', action: 'Search' };
  const doi = normalizeDoi(query);
  if (doi) return { kind: 'doi', hint: 'DOI', action: 'Open', dest: `https://doi.org/${doi}` };
  if (/^https?:\/\//i.test(query)) {
    try {
      const url = new URL(query);
      return { kind: 'url', hint: `Link · ${url.host}`, action: 'Open', dest: url.href };
    } catch {
      return { kind: 'blocked', hint: 'Invalid URL', action: 'Open' };
    }
  }
  if (/^[a-z][a-z0-9+.-]*:(?:\/\/|[^\s\d])/i.test(query)) {
    return { kind: 'blocked', hint: `${query.split(':')[0].toLowerCase()}: blocked`, action: 'Open' };
  }
  if (!engine) return { kind: 'blocked', hint: 'No engine', action: 'Search' };
  return { kind: 'search', hint: engine.name, action: 'Search', dest: buildSearchUrl(engine.url, query) };
}

export function initialOf(name) {
  return (String(name ?? '').trim().charAt(0) || '?').toUpperCase();
}

// ---------- Search history ----------

export function emptyHistory() {
  return { web: [], ai: [], acad: [] };
}

export function normalizeHistory(input) {
  const history = emptyHistory();
  if (!input || typeof input !== 'object') return history;
  for (const key of Object.keys(history)) {
    if (Array.isArray(input[key])) {
      history[key] = [...new Set(input[key].filter((item) => typeof item === 'string' && item.trim()).map((item) => item.trim()))].slice(0, HISTORY_LIMIT);
    }
  }
  return history;
}

export function recordHistory(history, box, query) {
  const next = normalizeHistory(history);
  const value = String(query ?? '').trim();
  if (!value || !next[box]) return next;
  next[box] = [value, ...next[box].filter((item) => item.toLowerCase() !== value.toLowerCase())].slice(0, HISTORY_LIMIT);
  return next;
}

export function historyMatches(history, box, query, limit = 4) {
  const q = String(query ?? '').trim().toLowerCase();
  if (!q) return [];
  return (history[box] || []).filter((item) => item.toLowerCase().includes(q)).slice(0, limit);
}

// ---------- Clocks ----------

export function cityFromTimeZone(tz) {
  return String(tz).split('/').pop().replace(/_/g, ' ');
}

export function isValidTimeZone(tz) {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

function wallClock(date, tz) {
  return new Date(date.toLocaleString('en-US', { timeZone: tz }));
}

function ymd(date, tz) {
  return new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: tz }).format(date);
}

export function formatTime(date, tz, withSeconds = false) {
  return new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit', minute: '2-digit', second: withSeconds ? '2-digit' : undefined, hour12: false, timeZone: tz
  }).format(date);
}

// "Tomorrow · +8h" relative to the local zone.
export function relativeZone(date, tz, localTz) {
  const diff = Math.round(((wallClock(date, tz) - wallClock(date, localTz)) / 36e5) * 2) / 2;
  const a = ymd(date, tz);
  const b = ymd(date, localTz);
  const day = a > b ? 'Tomorrow' : a < b ? 'Yesterday' : 'Today';
  const offset = diff === 0 ? 'same time' : `${diff > 0 ? '+' : '−'}${Math.abs(diff)}h`;
  return `${day} · ${offset}`;
}

// ---------- Ordering ----------

export function moveItem(list, from, to) {
  const next = list.slice();
  if (from < 0 || from >= next.length || to < 0 || to >= next.length || from === to) return next;
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

export function categoriesOf(shortcuts) {
  return [...new Set(shortcuts.map((item) => item.category).filter(Boolean))];
}

// ---------- Normalization (also the import validator) ----------

const HEX = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;

export function normalizeHex(value) {
  const text = String(value ?? '').trim();
  if (!HEX.test(text)) return '';
  const hex = text.length === 4 ? `#${text.slice(1).split('').map((c) => c + c).join('')}` : text;
  return hex.toLowerCase();
}

function pick(value, allowed, fallback) {
  return allowed.includes(value) ? value : fallback;
}

function clampInt(value, min, max, fallback) {
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
}

function isImageDataUrl(value, limit) {
  return typeof value === 'string' && /^data:image\/(png|jpeg|webp|gif|svg\+xml);base64,/i.test(value) && value.length <= limit * 1.4;
}

function text(value, max = 120) {
  return typeof value === 'string' ? value.trim().slice(0, max) : typeof value === 'number' ? String(value) : '';
}

// Returns { settings, report } where report lists what was repaired or dropped.
export function normalizeSettings(input, { fallback = defaultSettings() } = {}) {
  const report = { fixed: [], skipped: [] };
  const src = input && typeof input === 'object' ? input : {};
  const out = clone(fallback);

  out.theme = pick(src.theme, THEMES, out.theme);
  out.accent = pick(src.accent, Object.keys(ACCENTS), out.accent);

  if (src.background && typeof src.background === 'object') {
    const bg = src.background;
    out.background.type = pick(bg.type, BACKGROUNDS, out.background.type);
    for (const key of ['solid', 'from', 'to']) {
      if (bg[key] === '' && key === 'solid') out.background.solid = '';
      else if (bg[key] !== undefined) {
        const hex = normalizeHex(bg[key]);
        if (hex) {
          if (hex !== bg[key]) report.fixed.push({ item: `Color “${bg[key]}”`, result: hex });
          out.background[key] = hex;
        } else {
          report.skipped.push({ item: `Background color “${text(bg[key], 40)}”`, reason: 'not a #HEX color' });
        }
      }
    }
    if (bg.image) {
      if (isImageDataUrl(bg.image, BACKGROUND_IMAGE_LIMIT)) out.background.image = bg.image;
      else report.skipped.push({ item: 'Background image', reason: 'not an embedded image under 3 MB' });
    } else if (bg.image === '') {
      out.background.image = '';
    }
  }

  if (src.engines && typeof src.engines === 'object') {
    for (const box of Object.keys(SEARCH_BOXES)) {
      const group = src.engines[box];
      if (!group || !Array.isArray(group.list)) continue;
      const list = [];
      const seen = new Set();
      group.list.forEach((engine, index) => {
        const name = text(engine?.name, 40);
        const url = String(engine?.url ?? '').trim();
        if (!name) return report.skipped.push({ item: `${SEARCH_BOXES[box].kicker} engine #${index + 1}`, reason: 'missing a name' });
        if (!isValidEngineUrl(url)) return report.skipped.push({ item: `Engine “${name}”`, reason: 'URL must be http(s) and contain %s' });
        let id = text(engine.id, 40) || createId('en');
        if (seen.has(id)) id = createId('en');
        seen.add(id);
        list.push({ id, name, url });
      });
      if (list.length) {
        out.engines[box].list = list;
        out.engines[box].default = list.some((e) => e.id === group.default) ? group.default : list[0].id;
      }
    }
  }

  if (src.clocks && typeof src.clocks === 'object') {
    out.clocks.showSeconds = Boolean(src.clocks.showSeconds);
    if (Array.isArray(src.clocks.world)) {
      out.clocks.world = [];
      src.clocks.world.forEach((clock) => {
        const tz = text(clock?.tz, 64);
        if (!isValidTimeZone(tz) || !tz) return report.skipped.push({ item: `Clock “${text(clock?.city || tz, 40)}”`, reason: 'unknown time zone' });
        out.clocks.world.push({ city: text(clock.city, 40) || cityFromTimeZone(tz), tz });
      });
    }
  }

  if (src.layout && typeof src.layout === 'object') {
    const blocks = Array.isArray(src.layout.blocks) ? src.layout.blocks.filter((b) => b in BLOCKS) : [];
    const unique = [...new Set(blocks)];
    for (const block of Object.keys(BLOCKS)) if (!unique.includes(block)) unique.push(block);
    out.layout.blocks = unique;
    out.layout.rows = clampInt(src.layout.rows, 1, 4, out.layout.rows);
    out.layout.perRow = clampInt(src.layout.perRow, 4, 12, out.layout.perRow);
  }

  if (Array.isArray(src.shortcuts)) {
    out.shortcuts = [];
    const seenUrls = new Map();
    src.shortcuts.forEach((item, index) => {
      const name = text(item?.name, 60);
      const label = name ? `Shortcut “${name}”` : `Shortcut #${index + 1}`;
      if (!name) return report.skipped.push({ item: label, reason: 'missing a name' });
      const rawUrl = String(item.url ?? '').trim();
      const url = normalizeHttpUrl(rawUrl);
      if (!url.ok) return report.skipped.push({ item: label, reason: SCHEME.test(rawUrl) && !/^https?:/i.test(rawUrl) ? `${rawUrl.split(':')[0].toLowerCase()}: links are not allowed` : url.msg.replace(/\.$/, '').toLowerCase() });
      if (!/^https?:\/\//i.test(rawUrl)) report.fixed.push({ item: `“${rawUrl}” had no scheme`, result: url.url });
      const key = `${name.toLowerCase()}|${url.url}`;
      if (seenUrls.has(key)) {
        report.fixed.push({ item: `“${name}” listed twice`, result: 'merged into one' });
        return;
      }
      seenUrls.set(key, true);
      const icon = pick(item.icon, ICON_MODES, 'site');
      const image = icon === 'upload' && isImageDataUrl(item.image, SHORTCUT_IMAGE_LIMIT) ? item.image : '';
      out.shortcuts.push({
        id: text(item.id, 60) || createId('sc'),
        name,
        url: url.url,
        category: text(item.category, 30) || 'General',
        color: pick(item.color, Object.keys(SWATCHES), 'green'),
        icon: icon === 'upload' && !image ? 'letter' : icon,
        image
      });
    });
    const ids = new Set();
    out.shortcuts.forEach((s) => { if (ids.has(s.id)) s.id = createId('sc'); ids.add(s.id); });
  }

  if (Array.isArray(src.launchers)) {
    out.launchers = [];
    src.launchers.forEach((group, index) => {
      const name = text(group?.name, 40);
      if (!name) return report.skipped.push({ item: `Launcher #${index + 1}`, reason: 'missing a name' });
      const links = [];
      (Array.isArray(group.links) ? group.links : []).forEach((link, linkIndex) => {
        const linkName = text(link?.name, 60);
        const url = normalizeHttpUrl(link?.url);
        if (!linkName || !url.ok) {
          report.skipped.push({ item: `${name} link “${linkName || `#${linkIndex + 1}`}”`, reason: linkName ? url.msg.replace(/\.$/, '').toLowerCase() : 'missing a name' });
          return;
        }
        links.push({ name: linkName, url: url.url });
      });
      out.launchers.push({
        id: text(group.id, 60) || createId('ln'),
        name,
        icon: text(group.icon, 3) || initialOf(name),
        color: pick(group.color, Object.keys(SWATCHES), 'green'),
        links
      });
    });
  }

  out.version = SCHEMA_VERSION;
  return { settings: out, report };
}

// Merge: keep everything the user has, add new shortcuts/launchers/clocks, take imported appearance.
export function mergeSettings(current, incoming) {
  const merged = clone(incoming);
  const urlKey = (s) => `${s.name.toLowerCase()}|${s.url}`;
  const have = new Set(current.shortcuts.map(urlKey));
  merged.shortcuts = current.shortcuts.concat(incoming.shortcuts.filter((s) => !have.has(urlKey(s))).map((s) => ({ ...s, id: createId('sc') })));
  const launcherNames = new Set(current.launchers.map((l) => l.name.toLowerCase()));
  merged.launchers = current.launchers.concat(incoming.launchers.filter((l) => !launcherNames.has(l.name.toLowerCase())).map((l) => ({ ...l, id: createId('ln') })));
  const zones = new Set(current.clocks.world.map((c) => c.tz));
  merged.clocks.world = current.clocks.world.concat(incoming.clocks.world.filter((c) => !zones.has(c.tz)));
  return merged;
}

export function countItems(source) {
  const s = source && typeof source === 'object' ? source : {};
  return {
    shortcuts: Array.isArray(s.shortcuts) ? s.shortcuts.length : 0,
    launchers: Array.isArray(s.launchers) ? s.launchers.length : 0,
    clocks: Array.isArray(s.clocks?.world) ? s.clocks.world.length : 0,
    settings: ['theme', 'accent', 'background', 'engines', 'layout'].some((k) => k in s) ? 1 : 0
  };
}

// ---------- Import / export ----------

export const FORMATS = Object.freeze({
  json: { label: 'JSON', ext: 'json', mime: 'application/json' },
  yaml: { label: 'YAML', ext: 'yaml', mime: 'text/yaml' },
  toml: { label: 'TOML', ext: 'toml', mime: 'application/toml' },
  text: { label: 'Text', ext: 'txt', mime: 'text/plain' }
});

const HEADER = '# Start Page new tab extension backup';

// YAML, TOML and text wrap the JSON payload so every format round-trips exactly.
export function serialize(settings, format = 'json') {
  const json = JSON.stringify(settings, null, 2);
  if (format === 'json') return `${json}\n`;
  if (format === 'yaml') return `${HEADER}\nstartPage: |-\n${json.split('\n').map((line) => `  ${line}`).join('\n')}\n`;
  if (format === 'toml') return `${HEADER}\nstart_page = ${JSON.stringify(JSON.stringify(settings))}\n`;
  if (format === 'text') return `${HEADER}\nstart-page = ${JSON.stringify(settings)}\n`;
  throw new Error(`Unsupported format: ${format}`);
}

export function detectFormat(fileName = '', source = '') {
  const ext = String(fileName).toLowerCase().split('.').pop();
  if (ext === 'json' || source.trim().startsWith('{')) return 'json';
  if (ext === 'yaml' || ext === 'yml') return 'yaml';
  if (ext === 'toml') return 'toml';
  if (/^startPage:\s*\|/m.test(source)) return 'yaml';
  if (/^start_page\s*=/m.test(source)) return 'toml';
  return 'text';
}

// Parses an export from any format into a plain object (not yet normalized).
export function parseBackup(source, format) {
  const body = String(source ?? '').trim();
  if (!body) throw new Error('The file is empty.');
  try {
    if (format === 'json' || body.startsWith('{')) return JSON.parse(body);
    if (format === 'yaml') {
      const marker = body.match(/^startPage:\s*\|-?\s*$/m);
      if (!marker) throw new Error('marker');
      return JSON.parse(body.slice(marker.index + marker[0].length).replace(/^ {2}/gm, '').trim());
    }
    if (format === 'toml') {
      const line = body.match(/^start_page\s*=\s*(.+)$/m);
      if (!line) throw new Error('marker');
      return JSON.parse(JSON.parse(line[1].trim()));
    }
    const line = body.match(/^start-page\s*=\s*(.+)$/m);
    if (!line) throw new Error('marker');
    return JSON.parse(line[1].trim());
  } catch {
    throw new Error(`This file could not be read as ${FORMATS[format]?.label ?? format}. Use a backup exported from this page.`);
  }
}
