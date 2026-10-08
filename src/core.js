// Pure logic shared by the new tab page and the Node tests: no DOM, no chrome.* calls.

export const SCHEMA_VERSION = 9;
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
// Before schema v9 a shortcut chose one of these, and a launcher one of the LEGACY_LAUNCHER_MODES.
const LEGACY_SHORTCUT_ICONS = ['site', 'letter', 'upload'];
const LEGACY_LAUNCHER_MODES = ['label', 'site', 'url', 'upload'];
// Every icon (shortcut, launcher, profile) is one of these kinds; see normalizeIcon.
export const ICON_KINDS = ['site', 'image', 'upload', 'emoji', 'color'];
export const ICON_TEXT_MAX = 3;
// Uploaded icon images are scaled down to this many pixels on the longer side.
export const ICON_IMAGE_SIZE = 128;

export const SEARCH_BOXES = Object.freeze({
  web: { kicker: 'WEB', placeholder: 'Search the web or paste a link' },
  ai: { kicker: 'AI', placeholder: 'Ask an AI assistant' },
  acad: { kicker: 'ACADEMIC', placeholder: 'Search papers and journals, or enter a DOI' }
});

const OLD_MJL_URL = 'https://mjl.clarivate.com/search-results?search=%s';

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
      { id: 'mjl', name: 'Master Journal List', url: 'https://mjl.clarivate.com/search-results?issn=%s' }
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
    // Each theme keeps its own colors; an empty solid follows the theme's page color.
    background: {
      type: 'solid',
      image: '',
      light: { solid: '', from: '#f3f2f2', to: '#e8f3ea' },
      dark: { solid: '#333333', from: '#1d1c1b', to: '#213324' }
    },
    engines: clone(DEFAULT_ENGINES),
    clocks: {
      showSeconds: true,
      hour12: false,
      world: [
        { city: '', tz: 'UTC' },
        { city: '', tz: 'America/Los_Angeles' },
        { city: '', tz: 'America/New_York' }
      ]
    },
    layout: { blocks: ['clocks', 'search', 'shortcuts'], rows: 2, perRow: 8, showCategories: true },
    shortcuts: DEFAULT_SHORTCUTS.map(([name, url, category, color], index) => ({
      id: `sc-${index + 1}`, name, url: new URL(url).href, category, icon: siteIcon(color)
    })),
    launchers: DEFAULT_LAUNCHERS.map(([name, label, color, links], index) => ({
      id: `ln-${index + 1}`, name, icon: colorIcon(color, label),
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

// The first `max` characters as people see them, so an emoji such as 🧑‍🔬 or 🇹🇼 stays whole.
export function firstGraphemes(value, max) {
  const str = String(value ?? '');
  const parts = typeof Intl.Segmenter === 'function' ? Array.from(new Intl.Segmenter().segment(str), (s) => s.segment) : Array.from(str);
  return parts.slice(0, max).join('');
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

// Hours:minutes, seconds and (in 12-hour mode) "AM"/"PM", for clocks that style each part separately.
export function clockParts(date, tz, hour12 = false) {
  const parts = new Intl.DateTimeFormat('en-US', {
    hour: hour12 ? 'numeric' : '2-digit', minute: '2-digit', second: '2-digit', hourCycle: hour12 ? 'h12' : 'h23', timeZone: tz
  }).formatToParts(date);
  const get = (type) => parts.find((p) => p.type === type)?.value || '';
  return { hm: `${get('hour')}:${get('minute')}`, ss: get('second'), period: hour12 ? get('dayPeriod').toUpperCase() : '' };
}

// Zone abbreviations, standard then daylight. Intl's en-US names only cover US zones and UTC (it says
// "GMT+9" for Tokyo), so this table fills in the rest and lets people add a clock by typing "CET".
// Where an abbreviation is shared, the first zone listed wins (CST is US Central, IST is India).
const ZONE_ABBREVIATIONS = Object.freeze({
  UTC: ['UTC'],
  'America/New_York': ['EST', 'EDT'],
  'America/Chicago': ['CST', 'CDT'],
  'America/Denver': ['MST', 'MDT'],
  'America/Phoenix': ['MST'],
  'America/Los_Angeles': ['PST', 'PDT'],
  'America/Anchorage': ['AKST', 'AKDT'],
  'Pacific/Honolulu': ['HST'],
  'America/Halifax': ['AST', 'ADT'],
  'America/St_Johns': ['NST', 'NDT'],
  'America/Sao_Paulo': ['BRT'],
  'America/Argentina/Buenos_Aires': ['ART'],
  'Europe/London': ['GMT', 'BST'],
  'Europe/Lisbon': ['WET', 'WEST'],
  'Europe/Paris': ['CET', 'CEST'],
  'Europe/Athens': ['EET', 'EEST'],
  'Europe/Moscow': ['MSK'],
  'Africa/Lagos': ['WAT'],
  'Africa/Johannesburg': ['SAST'],
  'Africa/Nairobi': ['EAT'],
  'Asia/Dubai': ['GST'],
  'Asia/Karachi': ['PKT'],
  'Asia/Kolkata': ['IST'],
  'Asia/Bangkok': ['ICT'],
  'Asia/Jakarta': ['WIB'],
  'Asia/Singapore': ['SGT'],
  'Asia/Hong_Kong': ['HKT'],
  'Asia/Manila': ['PHT'],
  'Asia/Seoul': ['KST'],
  'Asia/Tokyo': ['JST'],
  'Australia/Perth': ['AWST'],
  'Australia/Adelaide': ['ACST', 'ACDT'],
  'Australia/Sydney': ['AEST', 'AEDT'],
  'Pacific/Auckland': ['NZST', 'NZDT']
});
const ZONE_ALIASES = Object.freeze({
  GMT: 'UTC', Z: 'UTC', ET: 'America/New_York', CT: 'America/Chicago', MT: 'America/Denver', PT: 'America/Los_Angeles'
});

// [abbreviation, zone] pairs for the add-clock suggestions.
export const ZONE_ABBREVIATION_LIST = Object.freeze(Object.entries(ZONE_ABBREVIATIONS)
  .flatMap(([tz, names]) => names.map((name) => [name, tz]))
  .filter(([name], index, list) => list.findIndex(([other]) => other === name) === index && !(name in ZONE_ALIASES)));

// "pdt" → "America/Los_Angeles"; empty when the text is not a known abbreviation.
export function zoneFromAbbreviation(query) {
  const key = String(query ?? '').trim().toUpperCase();
  if (!key) return '';
  return ZONE_ALIASES[key] || ZONE_ABBREVIATION_LIST.find(([name]) => name === key)?.[1] || '';
}

function utcOffsetMinutes(date, tz) {
  return Math.round((wallClock(date, tz) - wallClock(date, 'UTC')) / 6e4);
}

// Short zone name such as "PDT", "CEST" or "UTC" (follows daylight saving); empty when neither Intl nor the table has one.
export function zoneAbbreviation(date, tz) {
  try {
    const name = new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'short' }).formatToParts(date).find((p) => p.type === 'timeZoneName')?.value || '';
    if (/^[A-Z]{2,5}$/.test(name)) return name;
    const names = ZONE_ABBREVIATIONS[tz];
    if (!names) return '';
    if (names.length === 1) return names[0];
    // Daylight time is whichever offset is ahead of the year's standard (smaller) one; this also holds south of the equator.
    const year = date.getUTCFullYear();
    const standard = Math.min(utcOffsetMinutes(new Date(Date.UTC(year, 0, 1)), tz), utcOffsetMinutes(new Date(Date.UTC(year, 6, 1)), tz));
    return utcOffsetMinutes(date, tz) > standard ? names[1] : names[0];
  } catch {
    return '';
  }
}

// What a world clock shows: its label, else the live abbreviation, else the city from the zone name.
export function clockLabel(clock, date) {
  return clock.city || zoneAbbreviation(date, clock.tz) || cityFromTimeZone(clock.tz);
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

// Whether a site icon is all light (white logo for dark tabs) or all dark ink on a transparent
// background, so the badge can put it on a contrasting disc. pixels: RGBA bytes (ImageData.data).
// Returns 'light', 'dark' or '' (colored, mixed, or opaque edge to edge).
export function iconTone(pixels) {
  let opaque = 0, light = 0, dark = 0;
  for (let i = 0; i < pixels.length; i += 4) {
    if (pixels[i + 3] < 128) continue;
    opaque += 1;
    const [r, g, b] = [pixels[i], pixels[i + 1], pixels[i + 2]];
    const luma = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
    if (Math.max(r, g, b) - Math.min(r, g, b) > 48) continue;
    if (luma > 0.82) light += 1;
    else if (luma < 0.25) dark += 1;
  }
  const total = pixels.length / 4;
  if (!opaque || opaque > total * 0.9) return '';
  if (light >= opaque * 0.9) return 'light';
  if (dark >= opaque * 0.9) return 'dark';
  return '';
}

// ---------- Normalization (also the import validator) ----------

const HEX = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;

// Text color for a #rrggbb fill: whichever of the page's ink and paper colors contrasts more (WCAG luminance).
export function readableOn(hex) {
  const lum = luminance(hex);
  // Luminance of #201f1d is 0.0137 and of #f3f2f2 is 0.887.
  return (lum + 0.05) / 0.0637 >= 0.937 / (lum + 0.05) ? '#201f1d' : '#f3f2f2';
}

// WCAG relative luminance of a #rrggbb color.
export function luminance(hex) {
  const channel = (i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5);
}

// Below this luminance readableOn picks light text, so the color belongs to the dark theme.
const DARK_LUMINANCE = 0.1943;

export function isDarkColor(hex) {
  return luminance(hex) < DARK_LUMINANCE;
}

// A tile or launcher color is a SWATCHES key or a custom #rrggbb. Returns { label, fill, fg }.
export function colorOf(color) {
  if (Object.hasOwn(SWATCHES, color)) return SWATCHES[color];
  const hex = normalizeHex(color);
  return hex ? { label: hex, fill: hex, fg: readableOn(hex) } : SWATCHES.green;
}

export function normalizeHex(value) {
  const text = String(value ?? '').trim();
  if (!HEX.test(text)) return '';
  const hex = text.length === 4 ? `#${text.slice(1).split('').map((c) => c + c).join('')}` : text;
  return hex.toLowerCase();
}

// A preset key from allowed, or any #HEX color (stored as #rrggbb).
function pickColor(value, allowed, fallback) {
  return allowed.includes(value) ? value : normalizeHex(value) || fallback;
}

function pick(value, allowed, fallback) {
  return allowed.includes(value) ? value : fallback;
}

function clampInt(value, min, max, fallback) {
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
}

// The whole value must be one base64 data URL, so it can't break out of CSS url("…").
export function isImageDataUrl(value, limit) {
  return typeof value === 'string' && /^data:image\/(png|jpeg|webp|gif|svg\+xml);base64,[A-Za-z0-9+/]+={0,2}$/i.test(value) && value.length <= limit * 1.4;
}

function text(value, max = 120) {
  return typeof value === 'string' ? value.trim().slice(0, max) : typeof value === 'number' ? String(value) : '';
}

// ---------- Icons ----------

// One icon model serves shortcuts, launchers and profiles. Fields by kind:
//   site    { color, text, url }   the website's own logo; url '' means the item's own address
//   image   { color, text, url }   an image from the web
//   upload  { color, text, data }  an uploaded image (data URL)
//   emoji   { text }               an emoji or a few characters on a plain disc
//   color   { color, letter, text } a solid color with a letter (text, else the name's first letter) or none
//   none    { }                    nothing (profiles only)
// color is a SWATCHES key or #rrggbb; for site, image and upload it shows behind the letter shown when the picture can't load.
export function siteIcon(color = 'green') {
  return { kind: 'site', color, text: '', url: '' };
}

export function blankLauncher() {
  return { id: createId('ln'), name: 'New launcher', icon: colorIcon('green'), links: [] };
}

export function colorIcon(color = 'green', text = '') {
  return { kind: 'color', color, letter: true, text };
}

// Returns a valid icon; a kind that lacks what it needs (an image without an address, an emoji without text)
// becomes a color icon. report (optional) gets what was dropped, labelled with label.
export function normalizeIcon(raw, { color = 'green', allowNone = false, requireUrl = false, report = null, label = 'Item' } = {}) {
  const src = raw && typeof raw === 'object' ? raw : {};
  const fill = pickColor(src.color, Object.keys(SWATCHES), color);
  const letters = firstGraphemes(text(src.text, 40), ICON_TEXT_MAX);
  let kind = allowNone && src.kind === 'none' ? 'none' : pick(src.kind, ICON_KINDS, 'site');
  if (kind === 'none') return { kind };
  let url = '';
  if (kind === 'site' || kind === 'image') {
    const rawUrl = String(src.url ?? '').trim();
    const check = rawUrl ? normalizeHttpUrl(rawUrl) : null;
    if (check?.ok) url = check.url;
    else if (rawUrl) report?.skipped.push({ item: `${label} icon address`, reason: 'not an http(s) address' });
    if (!url && (kind === 'image' || requireUrl)) kind = 'color';
  }
  let data = '';
  if (kind === 'upload') {
    if (isImageDataUrl(src.data, SHORTCUT_IMAGE_LIMIT)) data = src.data;
    else {
      if (src.data) report?.skipped.push({ item: `${label} icon image`, reason: 'not an embedded image under 512 KB' });
      kind = 'color';
    }
  }
  if (kind === 'emoji' && !letters) kind = 'color';
  if (kind === 'emoji') return { kind, text: letters };
  if (kind === 'color') return { kind, color: fill, letter: src.letter !== false, text: letters };
  if (kind === 'upload') return { kind, color: fill, text: letters, data };
  return { kind, color: fill, text: letters, url };
}

// The letters an icon shows when it has no picture: its own text, else the name's first character (an emoji stays whole).
export function letterOf(name, letters = '') {
  return firstGraphemes(String(letters ?? '').trim(), ICON_TEXT_MAX) || firstGraphemes(String(name ?? '').trim(), 1).toUpperCase() || '?';
}

// Icons saved before schema v9: a shortcut had icon 'site' | 'letter' | 'upload' (+ image, color); a launcher had a
// label (icon), iconMode 'label' | 'site' | 'url' | 'upload', iconUrl, image and color.
function legacyShortcutIcon(item, color, starterToSite) {
  let mode = pick(item.icon, LEGACY_SHORTCUT_ICONS, 'site');
  // Version 1 shipped the starter shortcuts (ids sc-1, sc-2, …) as letters; they now use website icons.
  if (starterToSite && mode === 'letter' && /^sc-\d+$/.test(String(item.id))) mode = 'site';
  if (mode === 'site') return siteIcon(color);
  if (mode === 'upload' && isImageDataUrl(item.image, SHORTCUT_IMAGE_LIMIT)) return { kind: 'upload', color, text: '', data: item.image };
  return colorIcon(color);
}

function legacyLauncherIcon(group, color, report, label) {
  const letters = firstGraphemes(text(group.icon, 40), ICON_TEXT_MAX);
  const hasImage = isImageDataUrl(group.image, SHORTCUT_IMAGE_LIMIT);
  if (group.image && !hasImage) report.skipped.push({ item: `${label} image`, reason: 'not an embedded image under 512 KB' });
  // Saves from before icon modes show their image when they have one, else the label.
  const mode = pick(group.iconMode, LEGACY_LAUNCHER_MODES, hasImage ? 'upload' : 'label');
  const kind = { label: 'color', site: 'site', url: 'image', upload: 'upload' }[mode];
  return normalizeIcon({ kind, color, text: letters, url: group.iconUrl, data: group.image }, { color, report, label });
}

// Returns { settings, report } where report lists what was repaired or dropped.
export function normalizeSettings(input, { fallback = defaultSettings() } = {}) {
  const report = { fixed: [], skipped: [] };
  const src = input && typeof input === 'object' ? input : {};
  const out = clone(fallback);
  const version = Number(src.version) || 0;
  const legacyStarters = version === 1;

  out.theme = pick(src.theme, THEMES, out.theme);
  out.accent = pickColor(src.accent, Object.keys(ACCENTS), out.accent);

  if (src.background && typeof src.background === 'object') {
    const bg = src.background;
    out.background.type = pick(bg.type, BACKGROUNDS, out.background.type);
    const readColors = (from, slot) => {
      for (const key of ['solid', 'from', 'to']) {
        if (from[key] === '' && key === 'solid') slot.solid = '';
        else if (from[key] !== undefined) {
          const hex = normalizeHex(from[key]);
          if (hex) {
            if (hex !== from[key]) report.fixed.push({ item: `Color “${from[key]}”`, result: hex });
            slot[key] = hex;
          } else {
            report.skipped.push({ item: `Background color “${text(from[key], 40)}”`, reason: 'not a #HEX color' });
          }
        }
      }
    };
    for (const theme of ['light', 'dark']) {
      if (bg[theme] && typeof bg[theme] === 'object') readColors(bg[theme], out.background[theme]);
    }
    // Before v7 one set of colors served both themes. Move a custom solid color, and a changed
    // gradient, to the theme it suits; the other theme keeps its defaults.
    if (version < 7 && !bg.light && !bg.dark) {
      const legacy = { solid: '', from: '#f3f2f2', to: '#e8f3ea' };
      readColors(bg, legacy);
      if (legacy.solid) out.background[isDarkColor(legacy.solid) ? 'dark' : 'light'].solid = legacy.solid;
      if (legacy.from !== '#f3f2f2' || legacy.to !== '#e8f3ea') {
        const slot = out.background[luminance(legacy.from) + luminance(legacy.to) < 2 * DARK_LUMINANCE ? 'dark' : 'light'];
        slot.from = legacy.from;
        slot.to = legacy.to;
      }
    }
    // v8 made #333333 the dark theme's default solid color; saves that followed the theme color take it.
    if (version < 8 && !out.background.dark.solid) out.background.dark.solid = '#333333';
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
        let url = String(engine?.url ?? '').trim();
        // Before version 6 the Master Journal List engine used ?search=, which the site ignores; it reads ?issn=.
        if (version >= 1 && version < 6 && url === OLD_MJL_URL) url = DEFAULT_ENGINES.acad.list.find((e) => e.id === 'mjl').url;
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
    // Before version 3 seconds were off by default; they are now on, so older saves turn them on once.
    out.clocks.showSeconds = version >= 1 && version < 3 ? true : Boolean(src.clocks.showSeconds);
    out.clocks.hour12 = Boolean(src.clocks.hour12);
    // Before version 4 the default world clocks were Tokyo, London and New York; untouched lists move to the new default.
    const oldDefault = JSON.stringify([['Tokyo', 'Asia/Tokyo'], ['London', 'Europe/London'], ['New York', 'America/New_York']]);
    const keptOldDefault = version >= 1 && version < 4 && Array.isArray(src.clocks.world)
      && JSON.stringify(src.clocks.world.map((c) => [c?.city, c?.tz])) === oldDefault;
    // Before version 5 every clock had a label, and the defaults were UTC, Pacific and Eastern. Labels are now
    // optional (an empty one shows the live abbreviation), so untouched defaults drop theirs to read UTC, PDT, EDT.
    const v4Default = JSON.stringify([['UTC', 'UTC'], ['Pacific', 'America/Los_Angeles'], ['Eastern', 'America/New_York']]);
    const keptV4Default = version >= 1 && version < 5 && Array.isArray(src.clocks.world)
      && JSON.stringify(src.clocks.world.map((c) => [c?.city, c?.tz])) === v4Default;
    if (Array.isArray(src.clocks.world) && !keptOldDefault && !keptV4Default) {
      out.clocks.world = [];
      src.clocks.world.forEach((clock) => {
        const tz = text(clock?.tz, 64);
        if (!isValidTimeZone(tz) || !tz) return report.skipped.push({ item: `Clock “${text(clock?.city || tz, 40)}”`, reason: 'unknown time zone' });
        out.clocks.world.push({ city: text(clock.city, 40), tz });
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
    out.layout.showCategories = src.layout.showCategories !== false;
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
      const color = pickColor(item.color, Object.keys(SWATCHES), 'green');
      // Before schema v9 the icon was a mode string with a separate image and color; now it is an icon object.
      const icon = item.icon && typeof item.icon === 'object'
        ? normalizeIcon(item.icon, { color, report, label })
        : legacyShortcutIcon(item, color, legacyStarters);
      out.shortcuts.push({
        id: text(item.id, 60) || createId('sc'),
        name,
        url: url.url,
        category: text(item.category, 30),
        icon,
        ...(item.shared === true ? { shared: true } : {})
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
      const color = pickColor(group.color, Object.keys(SWATCHES), 'green');
      const label = `${name} launcher`;
      const icon = group.icon && typeof group.icon === 'object'
        ? normalizeIcon(group.icon, { color, report, label })
        : legacyLauncherIcon(group, color, report, label);
      out.launchers.push({
        id: text(group.id, 60) || createId('ln'),
        name,
        icon,
        ...(group.shared === true ? { shared: true } : {}),
        links
      });
    });
  }

  out.version = SCHEMA_VERSION;
  return { settings: out, report };
}

// Merge: keep everything the user has and add what is new; a shortcut or launcher in both takes the file's
// version (its icon, image, color and links), so a backup restores fully. Appearance and search come from the file.
export function mergeSettings(current, incoming) {
  const merged = clone(incoming);
  const urlKey = (s) => `${s.name.toLowerCase()}|${s.url}`;
  const fileShortcuts = new Map(incoming.shortcuts.map((s) => [urlKey(s), s]));
  const have = new Set(current.shortcuts.map(urlKey));
  // A shared shortcut or launcher stays shared when the file's version replaces it.
  const keepShared = (from) => (from.shared ? { shared: true } : {});
  merged.shortcuts = current.shortcuts.map((s) => (fileShortcuts.has(urlKey(s)) ? { ...clone(fileShortcuts.get(urlKey(s))), id: s.id, ...keepShared(s) } : s))
    .concat(incoming.shortcuts.filter((s) => !have.has(urlKey(s))).map((s) => ({ ...s, id: createId('sc') })));
  const nameKey = (l) => l.name.toLowerCase();
  const fileLaunchers = new Map(incoming.launchers.map((l) => [nameKey(l), l]));
  const launcherNames = new Set(current.launchers.map(nameKey));
  merged.launchers = current.launchers.map((l) => {
    const file = fileLaunchers.get(nameKey(l));
    if (!file) return l;
    // Links only on this device stay, after the file's links.
    const fileUrls = new Set(file.links.map((link) => link.url));
    return { ...clone(file), id: l.id, ...keepShared(l), links: clone(file.links).concat(l.links.filter((link) => !fileUrls.has(link.url))) };
  }).concat(incoming.launchers.filter((l) => !launcherNames.has(nameKey(l))).map((l) => ({ ...l, id: createId('ln') })));
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

// ---------- Items shown on all profiles ----------

// A shortcut or launcher with shared: true appears on every profile. Its content lives once in the shared store
// (startPage:shared); each profile's own settings keep only a stub { id, shared: true } where it sits in that
// profile's order. The page always works with the joined view, where stubs are replaced by the shared items.
export const SHARED_KINDS = ['shortcuts', 'launchers'];

export function emptyShared() {
  return { shortcuts: [], launchers: [] };
}

// Repairs the stored shared store: arrays of objects with a text id, each flagged shared.
export function normalizeShared(input) {
  const out = emptyShared();
  const src = input && typeof input === 'object' ? input : {};
  for (const kind of SHARED_KINDS) {
    const seen = new Set();
    for (const item of Array.isArray(src[kind]) ? src[kind] : []) {
      if (!item || typeof item !== 'object' || typeof item.id !== 'string' || !item.id || seen.has(item.id)) continue;
      seen.add(item.id);
      out[kind].push({ ...clone(item), shared: true });
    }
  }
  return out;
}

// What makes two items the same one: a shortcut's name and address, a launcher's name.
function itemKey(kind, item) {
  const name = String(item?.name ?? '').trim().toLowerCase();
  return kind === 'shortcuts' ? `${name}|${normalizeHttpUrl(item?.url).url || ''}` : name;
}

// Splits settings (the joined view) into what one profile stores and the shared store.
export function splitShared(settings) {
  const profile = clone(settings);
  const shared = emptyShared();
  for (const kind of SHARED_KINDS) {
    profile[kind] = (settings[kind] || []).map((item) => {
      if (item.shared !== true) return item;
      shared[kind].push(clone(item));
      return { id: item.id, shared: true };
    });
  }
  return { profile, shared };
}

// Builds the page's view from one profile's stored settings (raw, not yet normalized) and the shared store:
// each stub becomes its shared item, a stub whose item is gone is dropped, and shared items missing from the
// profile's order are added at the end. A local item that clashes with a shared one (same id, or the same name and
// address) gives way, so the shared item is never lost to normalization.
export function joinShared(rawSettings, rawShared) {
  const shared = normalizeShared(rawShared);
  const base = rawSettings && typeof rawSettings === 'object' ? clone(rawSettings) : {};
  for (const kind of SHARED_KINDS) {
    if (!Array.isArray(base[kind])) {
      if (!shared[kind].length) continue;
      base[kind] = defaultSettings()[kind];
    }
    const byId = new Map(shared[kind].map((item) => [item.id, item]));
    const byKey = new Map(shared[kind].map((item) => [itemKey(kind, item), item]));
    const seen = new Set();
    const list = [];
    for (const item of base[kind]) {
      if (item && item.shared === true && byId.has(item.id)) {
        if (!seen.has(item.id)) list.push(clone(byId.get(item.id)));
        seen.add(item.id);
      } else if (item && typeof item === 'object') {
        // A stub (no name) whose shared item was deleted elsewhere disappears.
        if (item.shared === true && typeof item.name !== 'string') continue;
        // A local item that is the same one as a shared item (see itemKey) gives its place to it.
        const twin = byKey.get(itemKey(kind, item));
        if (twin) {
          if (!seen.has(twin.id)) list.push(clone(twin));
          seen.add(twin.id);
          continue;
        }
        const local = { ...item };
        delete local.shared;
        list.push(byId.has(local.id) ? { ...local, id: createId(kind === 'shortcuts' ? 'sc' : 'ln') } : local);
      } else {
        list.push(item);
      }
    }
    for (const item of shared[kind]) if (!seen.has(item.id)) list.push(clone(item));
    base[kind] = list;
  }
  return base;
}

// Settings with every shared flag removed (an imported file never changes what is shared).
export function stripShared(settings) {
  const out = clone(settings);
  for (const kind of SHARED_KINDS) out[kind] = (out[kind] || []).map((item) => { const { shared, ...rest } = item; return rest; });
  return out;
}

// Keeps the current shared items in settings that replace the current ones (a Replace import), so they stay on every profile.
export function keepSharedFrom(next, current) {
  const out = clone(next);
  for (const kind of SHARED_KINDS) {
    const kept = (current[kind] || []).filter((item) => item.shared === true);
    const ids = new Set(kept.map((item) => item.id));
    const byKey = new Map(kept.map((item) => [itemKey(kind, item), item]));
    const placed = new Set();
    const list = [];
    for (const item of out[kind]) {
      // An item that is the same one as a shared item (see itemKey) gives its place to it.
      const twin = byKey.get(itemKey(kind, item));
      if (twin) {
        if (!placed.has(twin.id)) list.push(clone(twin));
        placed.add(twin.id);
      } else {
        list.push(ids.has(item.id) ? { ...item, id: createId(kind === 'shortcuts' ? 'sc' : 'ln') } : item);
      }
    }
    out[kind] = list.concat(kept.filter((item) => !placed.has(item.id)).map(clone));
  }
  return out;
}

// ---------- Profiles ----------

// Each profile keeps a whole settings object of its own. The first profile uses the settings key from before
// profiles existed, so nothing moves when they arrive.
export const DEFAULT_PROFILE_ID = 'default';
export const PROFILE_NAME_MAX = 32;

export function defaultProfiles() {
  return { active: DEFAULT_PROFILE_ID, list: [{ id: DEFAULT_PROFILE_ID, name: 'Default' }] };
}

export function profileSettingsKey(id) {
  return id === DEFAULT_PROFILE_ID ? 'startPage:settings' : `startPage:settings:${id}`;
}

// The profile a storage key holds settings for, or '' for any other key.
export function profileOfSettingsKey(key) {
  if (key === 'startPage:settings') return DEFAULT_PROFILE_ID;
  const match = /^startPage:settings:([A-Za-z0-9_-]{1,64})$/.exec(String(key));
  return match ? match[1] : '';
}

// Repairs a stored profile list: unique ids, non-empty names, at least one profile, and an active one in the list.
export function normalizeProfiles(input) {
  const src = input && typeof input === 'object' ? input : {};
  const seen = new Set();
  const list = [];
  for (const item of Array.isArray(src.list) ? src.list : []) {
    const id = typeof item?.id === 'string' && /^[A-Za-z0-9_-]{1,64}$/.test(item.id) ? item.id : '';
    if (!id || seen.has(id)) continue;
    seen.add(id);
    const name = text(item.name, PROFILE_NAME_MAX) || `Profile ${list.length + 1}`;
    list.push({ id, name, ...profileIconOf(item) });
  }
  if (!list.length) return defaultProfiles();
  const active = seen.has(src.active) ? src.active : list[0].id;
  return { active, list };
}

// A profile's icon is an ordinary icon (see normalizeIcon) or nothing stored, which shows the name's first letter
// on the neutral badge; kind 'none' leaves the dock button with the name only. Before the icon picker a profile
// had icon 'custom' with iconText (now an emoji icon) or 'none'.
export function defaultProfileIcon() {
  return { kind: 'color', color: '', letter: true, text: '' };
}

function isDefaultProfileIcon(icon) {
  return icon.kind === 'color' && !icon.color && icon.letter && !icon.text;
}

function profileIconOf(item) {
  if (item.icon && typeof item.icon === 'object') {
    const icon = normalizeIcon(item.icon, { color: '', allowNone: true, requireUrl: true });
    return isDefaultProfileIcon(icon) ? {} : { icon };
  }
  if (item.icon === 'none') return { icon: { kind: 'none' } };
  const letters = firstGraphemes(text(item.iconText, 40), 2);
  if (item.icon === 'custom' && letters) return { icon: { kind: 'emoji', text: letters } };
  return {};
}

// The icon to draw for a profile.
export function profileIcon(profile) {
  return profile?.icon || defaultProfileIcon();
}

// "Profile 2", "Profile 3", … skipping names already taken.
export function nextProfileName(list) {
  const taken = new Set(list.map((p) => p.name.toLowerCase()));
  let n = list.length + 1;
  while (taken.has(`profile ${n}`)) n += 1;
  return `Profile ${n}`;
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
