import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  FORMATS, clockLabel, clockParts, countItems, firstGraphemes, zoneAbbreviation, zoneFromAbbreviation, defaultSettings, detectFormat, historyMatches, isValidEngineUrl, mergeSettings, moveItem,
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
  assert.deepEqual(settings.clocks.world, [{ city: '', tz: 'Asia/Taipei' }]);
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
    clocks: { world: [{ city: 'Taipei', tz: 'Asia/Taipei' }, { city: 'Eastern', tz: 'America/New_York' }] }
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

test('seconds are on by default and older saves turn them on once', () => {
  assert.equal(defaultSettings().clocks.showSeconds, true);
  const v2 = defaultSettings();
  v2.version = 2;
  v2.clocks.showSeconds = false;
  assert.equal(normalizeSettings(v2).settings.clocks.showSeconds, true);
  const v3 = { ...defaultSettings(), clocks: { ...defaultSettings().clocks, showSeconds: false } };
  assert.equal(normalizeSettings(v3).settings.clocks.showSeconds, false);
});

test('clockParts splits 24- and 12-hour times', () => {
  const date = new Date('2026-10-07T15:04:09Z');
  assert.deepEqual(clockParts(date, 'UTC'), { hm: '15:04', ss: '09', period: '' });
  assert.deepEqual(clockParts(date, 'UTC', true), { hm: '3:04', ss: '09', period: 'PM' });
  assert.equal(clockParts(new Date('2026-10-07T00:30:00Z'), 'UTC').hm, '00:30');
  assert.deepEqual(clockParts(new Date('2026-10-07T00:30:00Z'), 'UTC', true), { hm: '12:30', ss: '00', period: 'AM' });
});

test('world clocks default to UTC, Pacific and Eastern; untouched old defaults move over', () => {
  assert.deepEqual(defaultSettings().clocks.world.map((c) => c.tz), ['UTC', 'America/Los_Angeles', 'America/New_York']);
  const old = [{ city: 'Tokyo', tz: 'Asia/Tokyo' }, { city: 'London', tz: 'Europe/London' }, { city: 'New York', tz: 'America/New_York' }];
  assert.equal(normalizeSettings({ version: 3, clocks: { world: old } }).settings.clocks.world[0].tz, 'UTC');
  assert.equal(normalizeSettings({ version: 3, clocks: { world: old.slice(0, 2) } }).settings.clocks.world[0].tz, 'Asia/Tokyo');
  assert.equal(normalizeSettings({ version: 4, clocks: { world: old } }).settings.clocks.world[0].tz, 'Asia/Tokyo');
});

test('zoneAbbreviation follows daylight saving and skips GMT offsets', () => {
  assert.equal(zoneAbbreviation(new Date('2026-07-01T12:00:00Z'), 'America/Los_Angeles'), 'PDT');
  assert.equal(zoneAbbreviation(new Date('2026-12-01T12:00:00Z'), 'America/Los_Angeles'), 'PST');
  assert.equal(zoneAbbreviation(new Date('2026-12-01T12:00:00Z'), 'America/New_York'), 'EST');
  assert.equal(zoneAbbreviation(new Date(), 'UTC'), 'UTC');
  assert.equal(zoneAbbreviation(new Date(), 'Asia/Tokyo'), 'JST');
  assert.equal(zoneAbbreviation(new Date(), 'Asia/Taipei'), '');
});

test('zoneAbbreviation fills in names Intl lacks, with daylight saving both sides of the equator', () => {
  const july = new Date('2026-07-01T12:00:00Z');
  const december = new Date('2026-12-01T12:00:00Z');
  assert.equal(zoneAbbreviation(july, 'Europe/Paris'), 'CEST');
  assert.equal(zoneAbbreviation(december, 'Europe/Paris'), 'CET');
  assert.equal(zoneAbbreviation(july, 'Europe/London'), 'BST');
  assert.equal(zoneAbbreviation(december, 'Europe/London'), 'GMT');
  assert.equal(zoneAbbreviation(july, 'Australia/Sydney'), 'AEST');
  assert.equal(zoneAbbreviation(december, 'Australia/Sydney'), 'AEDT');
});

test('zoneFromAbbreviation finds a zone by abbreviation, either season', () => {
  assert.equal(zoneFromAbbreviation('pdt'), 'America/Los_Angeles');
  assert.equal(zoneFromAbbreviation('PST'), 'America/Los_Angeles');
  assert.equal(zoneFromAbbreviation(' EDT '), 'America/New_York');
  assert.equal(zoneFromAbbreviation('CST'), 'America/Chicago');
  assert.equal(zoneFromAbbreviation('UTC'), 'UTC');
  assert.equal(zoneFromAbbreviation('GMT'), 'UTC');
  assert.equal(zoneFromAbbreviation('CEST'), 'Europe/Paris');
  assert.equal(zoneFromAbbreviation('Paris'), '');
  assert.equal(zoneFromAbbreviation(''), '');
});

test('clockLabel shows the label, else the live abbreviation, else the city', () => {
  const july = new Date('2026-07-01T12:00:00Z');
  assert.equal(clockLabel({ city: 'Home', tz: 'America/Los_Angeles' }, july), 'Home');
  assert.equal(clockLabel({ city: '', tz: 'America/Los_Angeles' }, july), 'PDT');
  assert.equal(clockLabel({ city: '', tz: 'Asia/Taipei' }, july), 'Taipei');
});

test('untouched v4 default clocks drop their labels; renamed ones keep them', () => {
  assert.ok(defaultSettings().clocks.world.every((c) => c.city === ''));
  const v4 = [{ city: 'UTC', tz: 'UTC' }, { city: 'Pacific', tz: 'America/Los_Angeles' }, { city: 'Eastern', tz: 'America/New_York' }];
  assert.ok(normalizeSettings({ version: 4, clocks: { world: v4 } }).settings.clocks.world.every((c) => c.city === ''));
  assert.equal(normalizeSettings({ version: 5, clocks: { world: v4 } }).settings.clocks.world[1].city, 'Pacific');
  const renamed = [v4[0], { city: 'West coast', tz: 'America/Los_Angeles' }, v4[2]];
  assert.equal(normalizeSettings({ version: 4, clocks: { world: renamed } }).settings.clocks.world[1].city, 'West coast');
});

test('v5 Master Journal List engine moves from ?search= to ?issn=', () => {
  const old = 'https://mjl.clarivate.com/search-results?search=%s';
  const engines = { acad: { default: 'mjl', list: [{ id: 'mjl', name: 'Master Journal List', url: old }] } };
  assert.equal(normalizeSettings({ version: 5, engines }).settings.engines.acad.list[0].url, 'https://mjl.clarivate.com/search-results?issn=%s');
  assert.equal(normalizeSettings({ version: 6, engines }).settings.engines.acad.list[0].url, old);
});

test('firstGraphemes keeps emoji whole', () => {
  assert.equal(firstGraphemes('🧑‍🔬', 3), '🧑‍🔬');
  assert.equal(firstGraphemes('🇹🇼📚✨🎵', 3), '🇹🇼📚✨');
  assert.equal(firstGraphemes('ABCD', 3), 'ABC');
});

test('launchers keep emoji labels and valid images, and drop bad images', () => {
  const png = 'data:image/png;base64,iVBORw0KGgo=';
  const { settings, report } = normalizeSettings({
    launchers: [
      { name: 'Lab', icon: '🧑‍🔬', image: png, links: [] },
      { name: 'Web', icon: 'W', image: 'https://example.com/x.png', links: [] }
    ]
  });
  assert.equal(settings.launchers[0].icon, '🧑‍🔬');
  assert.equal(settings.launchers[0].image, png);
  assert.equal(settings.launchers[1].image, '');
  assert.ok(report.skipped.some((s) => s.item === 'Web launcher image'));
  assert.ok(defaultSettings().launchers.every((l) => l.image === ''));
});
