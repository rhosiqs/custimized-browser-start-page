import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  FORMATS, countItems, defaultSettings, detectFormat, historyMatches, isValidEngineUrl, mergeSettings, moveItem,
  normalizeDoi, normalizeHex, normalizeHttpUrl, normalizeSettings, parseBackup, recordHistory, relativeZone, routeQuery, serialize
} from '../src/core.js';

const google = { id: 'google', name: 'Google', url: 'https://www.google.com/search?q=%s' };

test('normalizeHttpUrl adds https and rejects other schemes', () => {
  assert.deepEqual(normalizeHttpUrl('arxiv.org'), { ok: true, url: 'https://arxiv.org/' });
  assert.equal(normalizeHttpUrl('http://example.com/a?b=1').url, 'http://example.com/a?b=1');
  assert.equal(normalizeHttpUrl('localhost:3000').url, 'https://localhost:3000/');
  assert.equal(normalizeHttpUrl('javascript:alert(1)').ok, false);
  assert.equal(normalizeHttpUrl('data:text/html,hi').ok, false);
  assert.equal(normalizeHttpUrl('').ok, false);
});

test('normalizeDoi accepts raw, doi: and doi.org forms', () => {
  assert.equal(normalizeDoi('10.1038/s41586-020-2649-2'), '10.1038/s41586-020-2649-2');
  assert.equal(normalizeDoi('doi: 10.1126/science.1225829'), '10.1126/science.1225829');
  assert.equal(normalizeDoi('https://doi.org/10.1038/nature12373'), '10.1038/nature12373');
  assert.equal(normalizeDoi('not a doi'), '');
});

test('routeQuery picks DOI, link, blocked scheme or engine search', () => {
  assert.equal(routeQuery('', google).kind, 'empty');
  assert.deepEqual(routeQuery('doi:10.1038/x', google), { kind: 'doi', hint: 'DOI', action: 'Open', dest: 'https://doi.org/10.1038/x' });
  assert.equal(routeQuery('https://github.com/x', google).dest, 'https://github.com/x');
  assert.equal(routeQuery('javascript:alert(1)', google).kind, 'blocked');
  const search = routeQuery('tokyo weather', google);
  assert.equal(search.kind, 'search');
  assert.equal(search.dest, 'https://www.google.com/search?q=tokyo%20weather');
  assert.equal(routeQuery('10:30 meeting', google).kind, 'search');
});

test('engine URLs must be http(s) and contain %s', () => {
  assert.ok(isValidEngineUrl('https://duckduckgo.com/?q=%s'));
  assert.ok(!isValidEngineUrl('https://duckduckgo.com/'));
  assert.ok(!isValidEngineUrl('ftp://x/%s'));
});

test('history keeps recent unique queries per box', () => {
  let history = recordHistory(undefined, 'web', 'nature');
  history = recordHistory(history, 'web', 'github');
  history = recordHistory(history, 'web', 'Nature');
  assert.deepEqual(history.web, ['Nature', 'github']);
  assert.deepEqual(historyMatches(history, 'web', 'nat'), ['Nature']);
  assert.deepEqual(historyMatches(history, 'ai', 'nat'), []);
});

test('moveItem reorders without mutating', () => {
  const list = ['a', 'b', 'c'];
  assert.deepEqual(moveItem(list, 0, 2), ['b', 'c', 'a']);
  assert.deepEqual(list, ['a', 'b', 'c']);
  assert.deepEqual(moveItem(list, 0, 5), list);
});

test('normalizeHex lowercases and expands shorthand', () => {
  assert.equal(normalizeHex('#B68235'), '#b68235');
  assert.equal(normalizeHex('#abc'), '#aabbcc');
  assert.equal(normalizeHex('red'), '');
});

test('relativeZone describes day and offset', () => {
  const date = new Date('2026-01-01T20:00:00Z');
  assert.equal(relativeZone(date, 'Asia/Tokyo', 'UTC'), 'Tomorrow · +9h');
  assert.equal(relativeZone(date, 'UTC', 'UTC'), 'Today · same time');
});

test('normalizeSettings repairs and reports bad imports', () => {
  const { settings, report } = normalizeSettings({
    theme: 'dark',
    background: { type: 'solid', solid: '#B68235' },
    shortcuts: [
      { name: 'arXiv', url: 'arxiv.org', category: 'Research', color: 'gold' },
      { name: 'GitHub', url: 'https://github.com' },
      { name: 'GitHub', url: 'https://github.com' },
      { name: 'Bookmarklet', url: 'javascript:void(0)' },
      { url: 'https://example.com' }
    ],
    clocks: { world: [{ city: 'Mars', tz: 'Mars/Olympus' }, { tz: 'Asia/Taipei' }] }
  });
  assert.equal(settings.theme, 'dark');
  assert.equal(settings.background.solid, '#b68235');
  assert.deepEqual(settings.shortcuts.map((s) => s.url), ['https://arxiv.org/', 'https://github.com/']);
  assert.equal(settings.shortcuts[1].category, 'General');
  assert.deepEqual(settings.clocks.world, [{ city: 'Taipei', tz: 'Asia/Taipei' }]);
  assert.ok(report.fixed.some((f) => f.item.includes('had no scheme')));
  assert.ok(report.fixed.some((f) => f.item.includes('listed twice')));
  assert.ok(report.skipped.some((s) => s.reason.startsWith('javascript:')));
  assert.ok(report.skipped.some((s) => s.reason === 'missing a name'));
  assert.ok(report.skipped.some((s) => s.reason === 'unknown time zone'));
});

test('normalizeSettings keeps defaults for missing sections and valid engines', () => {
  const { settings } = normalizeSettings({ engines: { web: { default: 'nope', list: [{ id: 'x', name: 'X', url: 'https://x.test/?q=%s' }] } } });
  assert.equal(settings.engines.web.default, 'x');
  assert.equal(settings.engines.ai.list.length, defaultSettings().engines.ai.list.length);
  assert.deepEqual(settings.layout.blocks, ['clocks', 'search', 'shortcuts']);
});

test('every export format round-trips', () => {
  const settings = defaultSettings();
  for (const format of Object.keys(FORMATS)) {
    const text = serialize(settings, format);
    assert.equal(detectFormat(`backup.${FORMATS[format].ext}`, text), format);
    assert.deepEqual(parseBackup(text, format), settings);
  }
});

test('parseBackup reports unreadable files', () => {
  assert.throws(() => parseBackup('', 'json'), /empty/);
  assert.throws(() => parseBackup('just words', 'text'), /could not be read/);
});

test('mergeSettings adds new items and keeps existing ones', () => {
  const current = defaultSettings();
  const incoming = normalizeSettings({
    shortcuts: [{ name: 'GitHub', url: 'https://github.com' }, { name: 'Lobsters', url: 'https://lobste.rs' }],
    clocks: { world: [{ city: 'Taipei', tz: 'Asia/Taipei' }, { city: 'Tokyo', tz: 'Asia/Tokyo' }] }
  }).settings;
  const merged = mergeSettings(current, incoming);
  assert.equal(merged.shortcuts.length, current.shortcuts.length + 1);
  assert.equal(merged.shortcuts.at(-1).name, 'Lobsters');
  assert.equal(merged.clocks.world.length, current.clocks.world.length + 1);
});

test('countItems summarises an import', () => {
  assert.deepEqual(countItems({ shortcuts: [1, 2], launchers: [1], clocks: { world: [] }, theme: 'dark' }), { shortcuts: 2, launchers: 1, clocks: 0, settings: 1 });
});

test('version 1 starter shortcuts move from letters to website icons', () => {
  const v1 = defaultSettings();
  v1.version = 1;
  v1.shortcuts.forEach((s) => { s.icon = 'letter'; });
  v1.shortcuts.push({ id: 'sc-lx2k-1', name: 'Mine', url: 'https://example.com/', category: 'General', color: 'green', icon: 'letter', image: '' });
  const { settings } = normalizeSettings(v1);
  assert.ok(settings.shortcuts.slice(0, -1).every((s) => s.icon === 'site'));
  assert.equal(settings.shortcuts.at(-1).icon, 'letter');
  assert.equal(normalizeSettings({ ...settings, shortcuts: [{ ...settings.shortcuts[0], icon: 'letter' }] }).settings.shortcuts[0].icon, 'letter');
});
