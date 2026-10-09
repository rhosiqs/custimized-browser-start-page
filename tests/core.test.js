import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  DEFAULT_PROFILE_ID, FORMATS, backupFileName, buildBackup, readBackup, uniqueProfileName, SWATCHES, changedSharedItems, clone, emptyShared, sharedEditPrompt, colorIcon, defaultProfiles, joinShared, keepSharedFrom, letterOf, nextProfileName, normalizeIcon, normalizeProfiles, normalizeShared, profileIcon, splitShared, stripShared, siteIcon, profileOfSettingsKey, profileSettingsKey, clockLabel, colorOf, iconTone, clockParts, countItems, firstGraphemes, zoneAbbreviation, zoneFromAbbreviation, defaultSettings, detectFormat, historyMatches, isImageDataUrl, isValidEngineUrl, mergeSettings, moveItem,
  nameFromUrl, normalizeDoi, normalizeHex, pageNameFromHtml, normalizeHttpUrl, normalizeSettings, parseBackup, readableOn, recordHistory, relativeZone, routeQuery, serialize
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

test('colorOf resolves presets and custom HEX with readable text', () => {
  assert.equal(colorOf('gold'), SWATCHES.gold);
  assert.deepEqual(colorOf('#ABC'), { label: '#aabbcc', fill: '#aabbcc', fg: '#201f1d' });
  assert.equal(colorOf('#1d3557').fg, '#f3f2f2');
  assert.equal(colorOf('toString'), SWATCHES.green);
  assert.equal(readableOn('#ffffff'), '#201f1d');
  assert.equal(readableOn('#000000'), '#f3f2f2');
});

test('normalizeSettings keeps custom HEX colors for accent, shortcuts and launchers', () => {
  const base = defaultSettings();
  const { settings } = normalizeSettings({
    ...base,
    accent: '#C0FFEE',
    shortcuts: [{ ...base.shortcuts[0], icon: { kind: 'site', color: '#123' } }, { ...base.shortcuts[1], icon: { kind: 'site', color: 'purple' } }],
    launchers: [{ ...base.launchers[0], icon: { kind: 'color', color: '#AbCdEf' } }]
  });
  assert.equal(settings.accent, '#c0ffee');
  assert.deepEqual(settings.shortcuts.map((s) => s.icon.color), ['#112233', 'green']);
  assert.equal(settings.launchers[0].icon.color, '#abcdef');
  assert.equal(normalizeSettings({ ...base, accent: 'teal' }).settings.accent, base.accent);
});

test('relativeZone describes day and offset', () => {
  const date = new Date('2026-01-01T20:00:00Z');
  assert.equal(relativeZone(date, 'Asia/Tokyo', 'UTC'), 'Tomorrow · +9h');
  assert.equal(relativeZone(date, 'UTC', 'UTC'), 'Today · same time');
});

test('v7 moves a shared background color to the theme it suits', () => {
  const dark = normalizeSettings({ version: 6, background: { type: 'solid', solid: '#333333' } }).settings.background;
  assert.equal(dark.dark.solid, '#333333');
  assert.equal(dark.light.solid, '', 'light theme keeps its page color');
  const light = normalizeSettings({ version: 6, background: { type: 'gradient', from: '#fff3e4', to: '#ffe3bf' } }).settings.background;
  assert.deepEqual(light.light, { solid: '', from: '#fff3e4', to: '#ffe3bf' });
  assert.deepEqual(light.dark, defaultSettings().background.dark);
  const kept = normalizeSettings({ version: 7, background: { type: 'solid', light: { solid: '#eae9e9' }, dark: { solid: '#282725' } } }).settings.background;
  assert.equal(kept.light.solid, '#eae9e9');
  assert.equal(kept.dark.solid, '#282725');
});

test('normalizeSettings repairs and reports bad imports', () => {
  const { settings, report } = normalizeSettings({
    theme: 'dark',
    background: { type: 'solid', dark: { solid: '#B68235' } },
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
  assert.equal(settings.background.dark.solid, '#b68235');
  assert.deepEqual(settings.shortcuts.map((s) => s.url), ['https://arxiv.org/', 'https://github.com/']);
  assert.equal(settings.shortcuts[1].category, '', 'category is optional');
  assert.deepEqual(settings.clocks.world, [{ city: '', tz: 'Asia/Taipei' }]);
  assert.ok(report.fixed.some((f) => f.item.includes('had no scheme')));
  assert.ok(report.fixed.some((f) => f.item.includes('listed twice')));
  assert.ok(report.skipped.some((s) => s.reason.startsWith('javascript:')));
  assert.ok(report.skipped.some((s) => s.reason === 'missing a name'));
  assert.ok(report.skipped.some((s) => s.reason === 'unknown time zone'));
});

test('background images must be a whole base64 data URL', () => {
  const valid = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  const breakout = 'data:image/png;base64,AA"), url("https://attacker.example/beacon';
  assert.equal(isImageDataUrl(valid, 1024), true);
  assert.equal(isImageDataUrl(breakout, 1024), false);
  assert.equal(isImageDataUrl('data:image/png;base64,', 1024), false);
  assert.equal(isImageDataUrl('data:image/png;base64,AA AA', 1024), false);
  assert.equal(normalizeSettings({ background: { type: 'image', image: valid } }).settings.background.image, valid);
  const { settings, report } = normalizeSettings({ background: { type: 'image', image: breakout } });
  assert.notEqual(settings.background.image, breakout);
  assert.ok(!settings.background.image.includes('attacker'));
  assert.ok(report.skipped.some((s) => s.item === 'Background image'));
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

test('mergeSettings adds new items and keeps items only on this device', () => {
  const current = defaultSettings();
  const incoming = normalizeSettings({
    shortcuts: [{ name: 'YouTube', url: 'https://www.youtube.com' }, { name: 'Lobsters', url: 'https://lobste.rs' }],
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
  const v1 = { version: 1, shortcuts: defaultSettings().shortcuts.map((s) => ({ id: s.id, name: s.name, url: s.url, category: s.category, color: 'green', icon: 'letter', image: '' })) };
  v1.shortcuts.push({ id: 'sc-lx2k-1', name: 'Mine', url: 'https://example.com/', category: 'General', color: 'gold', icon: 'letter', image: '' });
  const { settings } = normalizeSettings(v1);
  assert.ok(settings.shortcuts.slice(0, -1).every((s) => s.icon.kind === 'site'));
  assert.deepEqual(settings.shortcuts.at(-1).icon, { kind: 'color', color: 'gold', letter: true, text: '' });
  const again = normalizeSettings({ ...settings, shortcuts: [{ ...settings.shortcuts[0], icon: colorIcon('ink') }] }).settings;
  assert.equal(again.shortcuts[0].icon.kind, 'color');
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

test('launcher labels, images and modes saved before schema v9 become icon objects', () => {
  const png = 'data:image/png;base64,iVBORw0KGgo=';
  const { settings, report } = normalizeSettings({
    version: 8,
    launchers: [
      { name: 'Lab', icon: '🧑‍🔬', color: 'ink', image: png, links: [] },
      { name: 'Web', icon: 'W', image: 'https://example.com/x.png', links: [] },
      { name: 'Old label', icon: 'L', links: [] },
      { name: 'Site', icon: 'S', iconMode: 'site', iconUrl: 'github.com', color: 'gold', links: [] },
      { name: 'Link', icon: 'K', iconMode: 'url', iconUrl: 'https://example.com/logo.png', links: [] },
      { name: 'Empty link', icon: 'E', iconMode: 'url', iconUrl: '', links: [] },
      { name: 'Bad link', icon: 'B', iconMode: 'url', iconUrl: 'javascript:alert(1)', links: [] },
      { name: 'Up', icon: 'U', iconMode: 'upload', image: png, links: [] },
      { name: 'No image', icon: 'N', iconMode: 'upload', links: [] }
    ]
  });
  const icons = settings.launchers.map((l) => l.icon);
  assert.deepEqual(icons[0], { kind: 'upload', color: 'ink', text: '🧑‍🔬', data: png }, 'a saved image wins when there is no mode');
  assert.deepEqual(icons[1], { kind: 'color', color: 'green', letter: true, text: 'W' });
  assert.deepEqual(icons[2], { kind: 'color', color: 'green', letter: true, text: 'L' });
  assert.deepEqual(icons[3], { kind: 'site', color: 'gold', text: 'S', url: 'https://github.com/' });
  assert.deepEqual(icons[4], { kind: 'image', color: 'green', text: 'K', url: 'https://example.com/logo.png' });
  assert.equal(icons[5].kind, 'color', 'an image link needs an address');
  assert.equal(icons[6].kind, 'color');
  assert.equal(icons[7].kind, 'upload');
  assert.equal(icons[8].kind, 'color');
  assert.ok(report.skipped.some((s) => s.item === 'Web launcher image'));
  assert.ok(report.skipped.some((s) => s.item === 'Bad link launcher icon address'));
  assert.ok(settings.launchers.every((l) => !('iconMode' in l) && !('color' in l) && !('image' in l)));
});

test('shortcut icons saved before schema v9 keep their mode, image and color', () => {
  const png = 'data:image/png;base64,iVBORw0KGgo=';
  const { settings } = normalizeSettings({
    version: 8,
    shortcuts: [
      { id: 'a', name: 'Site', url: 'https://a.example/', icon: 'site', color: 'brown' },
      { id: 'b', name: 'Letter', url: 'https://b.example/', icon: 'letter', color: 'gold' },
      { id: 'c', name: 'Upload', url: 'https://c.example/', icon: 'upload', image: png, color: 'ink' },
      { id: 'd', name: 'Lost', url: 'https://d.example/', icon: 'upload', image: '', color: 'mint' },
      { id: 'e', name: 'Odd', url: 'https://e.example/', icon: 'weird' }
    ]
  });
  assert.deepEqual(settings.shortcuts.map((s) => s.icon), [
    { kind: 'site', color: 'brown', text: '', url: '' },
    { kind: 'color', color: 'gold', letter: true, text: '' },
    { kind: 'upload', color: 'ink', text: '', data: png },
    { kind: 'color', color: 'mint', letter: true, text: '' },
    { kind: 'site', color: 'green', text: '', url: '' }
  ]);
  assert.ok(settings.shortcuts.every((s) => !('image' in s) && !('color' in s) && typeof s.icon === 'object'));
});

test('normalizeIcon stores a chosen picture background and never invents one', () => {
  const png = 'data:image/png;base64,iVBORw0KGgo=';
  assert.equal('bg' in normalizeIcon({ kind: 'upload', data: png }), false);
  assert.equal('bg' in normalizeIcon({ kind: 'site', url: 'github.com', bg: '' }), false);
  assert.equal(normalizeIcon({ kind: 'upload', data: png, bg: '#ABC' }).bg, '#aabbcc');
  assert.equal(normalizeIcon({ kind: 'image', url: 'https://x.example/a.svg', bg: 'mint' }).bg, 'mint');
  assert.equal('bg' in normalizeIcon({ kind: 'upload', data: png, bg: 'nonsense' }), false);
  assert.equal('bg' in normalizeIcon({ kind: 'color', bg: 'mint' }), false);
  assert.equal('bg' in normalizeIcon({ kind: 'emoji', text: 'x', bg: 'mint' }), false);
});

test('normalizeIcon keeps each kind\'s fields and falls back to a color icon when one is missing', () => {
  const png = 'data:image/png;base64,iVBORw0KGgo=';
  assert.deepEqual(normalizeIcon({ kind: 'site', url: 'github.com', color: '#ABC', text: 'abcd' }), { kind: 'site', color: '#aabbcc', text: 'abc', url: 'https://github.com/' });
  assert.deepEqual(normalizeIcon({ kind: 'image', url: 'https://x.example/a.png', data: png }), { kind: 'image', color: 'green', text: '', url: 'https://x.example/a.png' });
  assert.equal(normalizeIcon({ kind: 'image', url: 'javascript:alert(1)' }).kind, 'color');
  assert.equal(normalizeIcon({ kind: 'image' }).kind, 'color');
  assert.deepEqual(normalizeIcon({ kind: 'upload', data: png, url: 'https://x.example/' }), { kind: 'upload', color: 'green', text: '', data: png });
  assert.equal(normalizeIcon({ kind: 'upload', data: 'https://x.example/a.png' }).kind, 'color');
  assert.equal(normalizeIcon({ kind: 'upload', data: `${png}"); background: url("x` }).kind, 'color', 'text after the data would break out of CSS url()');
  assert.deepEqual(normalizeIcon({ kind: 'emoji', text: '🧑‍🔬📚✨🎵', color: 'ink' }), { kind: 'emoji', text: '🧑‍🔬📚✨' });
  assert.equal(normalizeIcon({ kind: 'emoji', text: '  ' }).kind, 'color');
  assert.deepEqual(normalizeIcon({ kind: 'color', letter: false, text: 'x' }), { kind: 'color', color: 'green', letter: false, text: 'x' });
  assert.equal(normalizeIcon({ kind: 'color' }).letter, true);
  assert.equal(normalizeIcon({ kind: 'none' }).kind, 'site', 'none is only for profiles');
  assert.deepEqual(normalizeIcon({ kind: 'none' }, { allowNone: true }), { kind: 'none' });
  assert.equal(normalizeIcon({ kind: 'site' }, { requireUrl: true }).kind, 'color');
  assert.equal(normalizeIcon('nonsense').kind, 'site');
  assert.equal(normalizeIcon({ kind: 'color', color: 'purple' }).color, 'green');
  assert.equal(normalizeIcon({ kind: 'color', color: 'purple' }, { color: '' }).color, '');
});

test('normalizeIcon reports a bad address or image', () => {
  const report = { fixed: [], skipped: [] };
  normalizeIcon({ kind: 'site', url: 'ftp://x' }, { report, label: 'Mail' });
  normalizeIcon({ kind: 'upload', data: 'nope' }, { report, label: 'Mail' });
  assert.deepEqual(report.skipped.map((s) => s.item), ['Mail icon address', 'Mail icon image']);
});

test('letterOf uses the custom letters, else the name\'s first character', () => {
  assert.equal(letterOf('gmail'), 'G');
  assert.equal(letterOf('Gmail', 'abcd'), 'abc');
  assert.equal(letterOf('🧑‍🔬 Lab'), '🧑‍🔬');
  assert.equal(letterOf(''), '?');
});

test('icons of every kind survive every export format', () => {
  const png = 'data:image/png;base64,iVBORw0KGgo=';
  const settings = defaultSettings();
  settings.shortcuts.push({ id: 'sc-3', name: 'Third', url: 'https://third.example/', category: '', icon: siteIcon() }, { id: 'sc-4', name: 'Fourth', url: 'https://fourth.example/', category: '', icon: siteIcon() });
  settings.shortcuts[0].icon = { kind: 'upload', color: 'ink', text: '', data: png };
  settings.shortcuts[1].icon = { kind: 'emoji', text: '📅' };
  settings.shortcuts[2].icon = { kind: 'image', color: 'gold', text: '', url: 'https://example.com/logo.png' };
  settings.shortcuts[3].icon = { kind: 'color', color: '#112233', letter: false, text: '' };
  settings.launchers[0].icon = { kind: 'site', color: 'green', text: 'G', url: 'https://github.com/' };
  settings.launchers.push({ id: 'ln-2', name: 'Lab', icon: { kind: 'emoji', text: '🧑‍🔬📚' }, links: [{ name: 'Lab', url: 'https://lab.example/' }] });
  for (const format of Object.keys(FORMATS)) {
    const text = serialize(settings, format);
    assert.deepEqual(normalizeSettings(parseBackup(text, detectFormat(`x.${FORMATS[format].ext}`, text))).settings, settings, format);
  }
});

test('merging a backup restores matching launchers and shortcuts from the file', () => {
  const current = defaultSettings();
  current.launchers[0].links.push({ name: 'Local only', url: 'https://local.example/' });
  const backup = defaultSettings();
  backup.launchers[0] = { ...backup.launchers[0], icon: { kind: 'site', color: 'ink', text: '🔍', url: 'https://google.com/' } };
  backup.shortcuts[0] = { ...backup.shortcuts[0], icon: colorIcon('gold') };
  const merged = mergeSettings(current, normalizeSettings(backup).settings);
  assert.equal(merged.launchers.length, current.launchers.length);
  assert.equal(merged.launchers[0].id, current.launchers[0].id);
  assert.deepEqual(merged.launchers[0].icon, { kind: 'site', color: 'ink', text: '🔍', url: 'https://google.com/' });
  assert.equal(merged.launchers[0].links.at(-1).name, 'Local only');
  assert.deepEqual(merged.shortcuts[0].icon, colorIcon('gold'));
  assert.equal(merged.shortcuts.length, current.shortcuts.length);
});

test('iconTone flags all-light and all-dark icons on transparent backgrounds', () => {
  // 4×4 icon: the first n pixels opaque in rgb, the rest transparent.
  const icon = (rgb, n = 8) => Array.from({ length: 16 }, (_, i) => (i < n ? [...rgb, 255] : [0, 0, 0, 0])).flat();
  assert.equal(iconTone(icon([255, 255, 255])), 'light');
  assert.equal(iconTone(icon([24, 23, 23])), 'dark');
  assert.equal(iconTone(icon([217, 119, 87])), '');
  assert.equal(iconTone(icon([255, 255, 255], 16)), '', 'opaque squares keep their own background');
  assert.equal(iconTone(icon([0, 0, 0], 0)), '');
});

test('layout.showCategories defaults on and keeps an explicit off', () => {
  assert.equal(normalizeSettings({}).settings.layout.showCategories, true);
  assert.equal(normalizeSettings({ layout: { rows: 2 } }).settings.layout.showCategories, true);
  assert.equal(normalizeSettings({ layout: { showCategories: false } }).settings.layout.showCategories, false);
});

test('profiles: the first keeps the old settings key, others get their own', () => {
  assert.equal(profileSettingsKey(DEFAULT_PROFILE_ID), 'startPage:settings');
  assert.equal(profileSettingsKey('pf-abc'), 'startPage:settings:pf-abc');
  assert.equal(profileOfSettingsKey('startPage:settings'), DEFAULT_PROFILE_ID);
  assert.equal(profileOfSettingsKey('startPage:settings:pf-abc'), 'pf-abc');
  assert.equal(profileOfSettingsKey('startPage:history'), '');
});

test('normalizeProfiles repairs ids, names and the active profile', () => {
  assert.deepEqual(normalizeProfiles(undefined), defaultProfiles());
  assert.deepEqual(normalizeProfiles({ list: [] }), defaultProfiles());
  const fixed = normalizeProfiles({
    active: 'gone',
    list: [{ id: 'work', name: '  Work  ' }, { id: 'work', name: 'Dup' }, { id: 'bad id!', name: 'X' }, { id: 'home', name: '' }]
  });
  assert.deepEqual(fixed, { active: 'work', list: [{ id: 'work', name: 'Work' }, { id: 'home', name: 'Profile 2' }] });
  assert.equal(normalizeProfiles({ active: 'home', list: fixed.list }).active, 'home');
  assert.equal(normalizeProfiles({ list: [{ id: 'a', name: 'x'.repeat(80) }] }).list[0].name.length, 32);
});

test('a profile without an icon shows its first letter on the neutral badge', () => {
  assert.deepEqual(profileIcon({ name: 'Work' }), { kind: 'color', color: '', letter: true, text: '' });
  assert.equal(letterOf('🧑‍🔬 Lab'), '🧑‍🔬');
});

test('normalizeProfiles turns the v1.9.1 letter, custom and none icons into icon objects', () => {
  const { list } = normalizeProfiles({
    list: [
      { id: 'a', name: 'A', icon: 'custom', iconText: '🏠🏠🏠' },
      { id: 'b', name: 'B', icon: 'none', iconText: 'x' },
      { id: 'c', name: 'C', icon: 'custom', iconText: '  ' },
      { id: 'd', name: 'D', icon: 'weird' },
      { id: 'e', name: 'E', icon: 'letter' }
    ]
  });
  assert.deepEqual(list, [
    { id: 'a', name: 'A', icon: { kind: 'emoji', text: '🏠🏠' } },
    { id: 'b', name: 'B', icon: { kind: 'none' } },
    { id: 'c', name: 'C' },
    { id: 'd', name: 'D' },
    { id: 'e', name: 'E' }
  ]);
});

test('normalizeProfiles keeps valid icon objects, drops the default one and repairs the rest', () => {
  const { list } = normalizeProfiles({
    list: [
      { id: 'a', name: 'A', icon: { kind: 'color', color: 'ink', letter: false } },
      { id: 'b', name: 'B', icon: { kind: 'color', color: '', letter: true, text: '' } },
      { id: 'c', name: 'C', icon: { kind: 'site', url: 'github.com' } },
      { id: 'd', name: 'D', icon: { kind: 'site' } },
      { id: 'e', name: 'E', icon: { kind: 'emoji', text: '' } },
      { id: 'f', name: 'F', icon: { kind: 'none' } }
    ]
  });
  assert.deepEqual(list, [
    { id: 'a', name: 'A', icon: { kind: 'color', color: 'ink', letter: false, text: '' } },
    { id: 'b', name: 'B' },
    { id: 'c', name: 'C', icon: { kind: 'site', color: '', text: '', url: 'https://github.com/' } },
    { id: 'd', name: 'D' },
    { id: 'e', name: 'E' },
    { id: 'f', name: 'F', icon: { kind: 'none' } }
  ]);
});

test('nextProfileName skips names in use', () => {
  assert.equal(nextProfileName(defaultProfiles().list), 'Profile 2');
  assert.equal(nextProfileName([{ id: 'a', name: 'Default' }, { id: 'b', name: 'Profile 3' }]), 'Profile 4');
});

test('v8 gives the dark theme #333333 unless a later save chose the theme color', () => {
  assert.equal(defaultSettings().background.dark.solid, '#333333');
  const old = normalizeSettings({ version: 7, background: { type: 'solid', light: { solid: '' }, dark: { solid: '' } } }).settings.background;
  assert.equal(old.dark.solid, '#333333');
  assert.equal(old.light.solid, '');
  const custom = normalizeSettings({ version: 7, background: { type: 'solid', dark: { solid: '#282725' } } }).settings.background;
  assert.equal(custom.dark.solid, '#282725');
  const chosen = normalizeSettings({ version: 8, background: { type: 'solid', dark: { solid: '' } } }).settings.background;
  assert.equal(chosen.dark.solid, '');
});

// ---------- Items shown on all profiles ----------

const sharedSample = () => {
  const settings = defaultSettings();
  settings.shortcuts[1].shared = true;
  settings.launchers[0].shared = true;
  return settings;
};

test('changedSharedItems names shared items whose content or flag changed, not removed or local ones', () => {
  const prev = sharedSample();
  assert.deepEqual(changedSharedItems(prev, clone(prev)), []);
  const next = clone(prev);
  next.shortcuts[0].name = 'Local edit';
  next.launchers[0].links.push({ name: 'Maps', url: 'https://maps.google.com/' });
  delete next.shortcuts[1].shared;
  assert.deepEqual(changedSharedItems(prev, next), ['YouTube', 'Google']);
  const removed = clone(prev);
  removed.shortcuts.splice(1, 1);
  assert.deepEqual(changedSharedItems(prev, removed), []);
  assert.equal(sharedEditPrompt(['YouTube']), '"YouTube" shows on all profiles. Save the changes for every profile?');
});

test('a fresh install has only the Google launcher', () => {
  assert.deepEqual(defaultSettings().launchers.map((l) => l.name), ['Google']);
});

test('normalizeSettings keeps the shared flag on shortcuts and launchers only when true', () => {
  const { settings } = normalizeSettings({ ...defaultSettings(), shortcuts: [{ ...defaultSettings().shortcuts[0], shared: true }, { ...defaultSettings().shortcuts[1], shared: 'yes' }] });
  assert.equal(settings.shortcuts[0].shared, true);
  assert.ok(!('shared' in settings.shortcuts[1]));
  assert.ok(defaultSettings().shortcuts.every((s) => !('shared' in s)));
});

test('splitShared leaves a stub in the profile and moves the content to the shared store', () => {
  const settings = sharedSample();
  const { profile, shared } = splitShared(settings);
  assert.deepEqual(profile.shortcuts[1], { id: 'sc-2', shared: true });
  assert.deepEqual(profile.launchers[0], { id: 'ln-1', shared: true });
  assert.equal(profile.shortcuts.length, settings.shortcuts.length, 'order is kept');
  assert.deepEqual(shared.shortcuts, [settings.shortcuts[1]]);
  assert.deepEqual(shared.launchers, [settings.launchers[0]]);
  assert.equal(settings.shortcuts[1].name, 'YouTube', 'the input is not changed');
});

test('joinShared puts the shared content back at the profile\'s own position', () => {
  const settings = sharedSample();
  const { profile, shared } = splitShared(settings);
  assert.deepEqual(joinShared(profile, shared), settings);
  assert.deepEqual(normalizeSettings(joinShared(profile, shared)).settings, settings);
});

test('an edit to a shared item is seen by every profile', () => {
  const { profile: workProfile, shared } = splitShared(sharedSample());
  const home = splitShared(normalizeSettings({ ...defaultSettings(), shortcuts: [] }).settings).profile;
  const work = joinShared(workProfile, shared);
  work.shortcuts[1].name = 'Renamed';
  work.shortcuts[1].icon = { kind: 'emoji', text: '📅' };
  const saved = splitShared(work);
  const reopenedHome = normalizeSettings(joinShared(home, saved.shared)).settings;
  assert.deepEqual(reopenedHome.shortcuts.map((s) => s.name), ['Renamed']);
  assert.deepEqual(reopenedHome.shortcuts[0].icon, { kind: 'emoji', text: '📅' });
  assert.equal(reopenedHome.shortcuts[0].shared, true);
});

test('deleting a shared item removes it from every profile', () => {
  const full = sharedSample();
  const { profile: otherProfile, shared } = splitShared(full);
  const edited = clone(full);
  edited.shortcuts = edited.shortcuts.filter((s) => s.id !== 'sc-2');
  const saved = splitShared(edited);
  assert.deepEqual(saved.shared.shortcuts, []);
  const other = joinShared(otherProfile, saved.shared);
  assert.ok(!other.shortcuts.some((s) => s.id === 'sc-2'), 'the stub in another profile is dropped');
  assert.equal(other.shortcuts.length, full.shortcuts.length - 1);
  assert.equal(shared.shortcuts.length, 1);
});

test('turning sharing off keeps the item here and removes it from the other profiles', () => {
  const full = sharedSample();
  const { profile: otherProfile } = splitShared(full);
  const edited = clone(full);
  delete edited.shortcuts[1].shared;
  const saved = splitShared(edited);
  assert.deepEqual(saved.shared.shortcuts, []);
  assert.equal(saved.profile.shortcuts[1].name, 'YouTube');
  assert.ok(!joinShared(otherProfile, saved.shared).shortcuts.some((s) => s.id === 'sc-2'));
});

test('a new shared item is added at the end of profiles that have no place for it yet', () => {
  const shared = normalizeShared({ shortcuts: [{ id: 'sc-new', name: 'Shared', url: 'https://shared.example/', category: '', icon: siteIcon() }], launchers: [] });
  const joined = normalizeSettings(joinShared(defaultSettings(), shared)).settings;
  assert.equal(joined.shortcuts.at(-1).name, 'Shared');
  assert.equal(joined.shortcuts.at(-1).shared, true);
  assert.equal(joined.shortcuts.length, defaultSettings().shortcuts.length + 1);
  const empty = normalizeSettings(joinShared({ version: 9, theme: 'dark' }, shared)).settings;
  assert.equal(empty.shortcuts.at(-1).name, 'Shared', 'a profile saved without shortcuts gets the starter ones plus the shared item');
});

test('a local item that clashes with a shared one gives way instead of the shared item being lost', () => {
  const sharedItem = { id: 'sc-3', name: 'Mine', url: 'https://mine.example/', category: '', icon: siteIcon(), shared: true };
  const local = defaultSettings();
  local.shortcuts.push({ id: 'x', name: 'mine', url: 'https://mine.example/', category: '', icon: siteIcon() });
  const joined = normalizeSettings(joinShared(local, { shortcuts: [sharedItem], launchers: [] })).settings;
  assert.equal(joined.shortcuts.filter((s) => s.name.toLowerCase() === 'mine').length, 1);
  assert.ok(joined.shortcuts.find((s) => s.name === 'Mine').shared);
  const sameId = joinShared(defaultSettings(), { shortcuts: [sharedItem], launchers: [] });
  assert.equal(sameId.shortcuts.filter((s) => s.id === 'sc-3').length, 1, 'the starter with the shared item\'s id gets a new id');
  assert.equal(sameId.shortcuts.find((s) => s.id === 'sc-3').shared, true);
});

test('a starter launcher with the same name as a shared launcher gives way to it', () => {
  const sharedGoogle = { ...defaultSettings().launchers[0], icon: colorIcon('ink', '🔍'), shared: true };
  const joined = normalizeSettings(joinShared(defaultSettings(), { shortcuts: [], launchers: [sharedGoogle] })).settings;
  assert.equal(joined.launchers.filter((l) => l.name === 'Google').length, 1);
  assert.equal(joined.launchers[0].shared, true, 'in the starter\'s place');
  assert.equal(joined.launchers[0].icon.text, '🔍');
  const replaced = keepSharedFrom(defaultSettings(), joined);
  assert.equal(replaced.launchers.filter((l) => l.name === 'Google').length, 1);
});

test('normalizeShared repairs the stored shared items', () => {
  assert.deepEqual(normalizeShared(undefined), { shortcuts: [], launchers: [], engines: {} });
  const fixed = normalizeShared({ shortcuts: [{ id: 'a', name: 'A' }, { id: 'a', name: 'dup' }, null, { name: 'no id' }], launchers: 'x' });
  assert.deepEqual(fixed, { shortcuts: [{ id: 'a', name: 'A', shared: true }], launchers: [], engines: {} });
});

test('imported files never change what is shared: stripShared, merge and replace', () => {
  const current = sharedSample();
  const file = normalizeSettings(sharedSample()).settings;
  assert.ok(stripShared(file).shortcuts.every((s) => !('shared' in s)));
  const merged = mergeSettings(current, stripShared(file));
  assert.equal(merged.shortcuts.find((s) => s.id === 'sc-2').shared, true, 'a replaced shortcut stays shared');
  assert.equal(merged.launchers.find((l) => l.id === 'ln-1').shared, true);
  const replacement = stripShared(defaultSettings());
  replacement.shortcuts = [replacement.shortcuts[0]];
  const replaced = keepSharedFrom(replacement, current);
  assert.deepEqual(replaced.shortcuts.map((s) => s.id), ['sc-1', 'sc-2']);
  assert.equal(replaced.shortcuts[1].shared, true);
  assert.equal(replaced.launchers.filter((l) => l.shared).length, 1);
  const clash = defaultSettings();
  const kept = keepSharedFrom(clash, current);
  assert.equal(new Set(kept.shortcuts.map((s) => s.id)).size, kept.shortcuts.length, 'ids stay unique');
  assert.equal(kept.shortcuts.filter((s) => s.shared).length, 1);
  assert.equal(kept.shortcuts.length, clash.shortcuts.length, 'the starter twin of a shared shortcut gives way');
  assert.equal(kept.shortcuts[1].shared, true, 'and the shared one takes its place');
});

test('a search box marked shared keeps its engines in the shared store and follows every profile', () => {
  const a = defaultSettings();
  a.engines.web.shared = true;
  a.engines.web.default = 'ddg';
  const { profile, shared } = splitShared(a);
  assert.deepEqual(profile.engines.web, { shared: true });
  assert.equal(shared.engines.web.default, 'ddg');
  assert.equal(profile.engines.ai.default, 'claude');
  // Another profile with its own engines takes the shared box; the flag survives normalization.
  const other = normalizeSettings(joinShared(defaultSettings(), shared)).settings;
  assert.equal(other.engines.web.default, 'ddg');
  assert.equal(other.engines.web.shared, true);
  assert.equal(other.engines.ai.default, 'claude');
  assert.equal('shared' in other.engines.ai, false);
  // The saving profile gets the same view back.
  assert.deepEqual(normalizeSettings(joinShared(profile, shared)).settings.engines.web, shared.engines.web);
});

test('a shared flag whose engines are gone falls back to the defaults', () => {
  const raw = defaultSettings();
  raw.engines.web = { shared: true };
  const view = normalizeSettings(joinShared(raw, emptyShared())).settings;
  assert.equal(view.engines.web.default, 'google');
  assert.equal(view.engines.web.list.length, 3);
  assert.equal('shared' in view.engines.web, false);
});

test('changes to shared engines are named; imports leave them alone', () => {
  const prev = defaultSettings();
  prev.engines.ai.shared = true;
  const next = clone(prev);
  assert.deepEqual(changedSharedItems(prev, next), []);
  next.engines.ai.default = 'gemini';
  assert.deepEqual(changedSharedItems(prev, next), ['AI search engines']);
  const off = clone(prev);
  delete off.engines.ai.shared;
  assert.deepEqual(changedSharedItems(prev, off), ['AI search engines']);
  // stripShared, keepSharedFrom and mergeSettings never change what is shared.
  assert.equal('shared' in stripShared(prev).engines.ai, false);
  const incoming = stripShared(defaultSettings());
  assert.equal(keepSharedFrom(incoming, prev).engines.ai.shared, true);
  assert.equal(mergeSettings(prev, incoming).engines.ai.shared, true);
});

test('pageNameFromHtml prefers og:site_name, then the title, and decodes entities', () => {
  assert.equal(pageNameFromHtml('<head><title>Dogs &amp; Cats | Home</title><meta property="og:site_name" content="Pets Inc"></head>'), 'Pets Inc');
  assert.equal(pageNameFromHtml("<meta content='Site &#39;X&#39;' name=\"og:site_name\">"), "Site 'X'");
  assert.equal(pageNameFromHtml('<TITLE lang="en">\n  Dogs &amp; Cats\n  &#x1F600;  </TITLE>'), 'Dogs & Cats 😀');
  assert.equal(pageNameFromHtml('<meta name="description" content="x"><p>no title</p>'), '');
  assert.equal(pageNameFromHtml(undefined), '');
  assert.equal(pageNameFromHtml(`<title>${'a'.repeat(100)}</title>`).length, 60);
});

test('nameFromUrl derives a readable name from the host', () => {
  assert.equal(nameFromUrl('https://www.github.com/x'), 'Github');
  assert.equal(nameFromUrl('https://calendar.google.com/'), 'Google');
  assert.equal(nameFromUrl('https://www.bbc.co.uk/news'), 'Bbc');
  assert.equal(nameFromUrl('http://localhost:3000'), 'Localhost');
  assert.equal(nameFromUrl('not a url'), '');
});

test('backupFileName is <date>-<profile name or all>.<extension> with a file-safe name', () => {
  const date = new Date(2026, 9, 9, 23, 59);
  assert.equal(backupFileName({ date, profileName: 'Work', extension: 'json' }), '2026-10-09-Work.json');
  assert.equal(backupFileName({ date, profileName: null, extension: 'yaml' }), '2026-10-09-all.yaml');
  assert.equal(backupFileName({ date, profileName: 'My: Home / Lab?', extension: 'txt' }), '2026-10-09-My-Home-Lab.txt');
  assert.equal(backupFileName({ date, profileName: '  ..  ', extension: 'toml' }), '2026-10-09-profile.toml');
  assert.equal(backupFileName({ date: new Date(2026, 0, 5), profileName: '工作' }), '2026-01-05-工作.json');
  assert.ok(backupFileName({ date, profileName: 'x'.repeat(80) }).length <= '2026-10-09-.json'.length + 40);
});

test('buildBackup and readBackup round-trip profiles and read a bare settings file as one profile', () => {
  const work = defaultSettings();
  work.theme = 'dark';
  const icon = { kind: 'emoji', text: 'W' };
  const bundle = buildBackup([{ name: 'Work', icon, settings: work }, { name: 'Home', settings: defaultSettings() }]);
  const parsed = parseBackup(serialize(bundle, 'yaml'), 'yaml');
  const read = readBackup(parsed);
  assert.deepEqual(read.map((p) => p.name), ['Work', 'Home']);
  assert.deepEqual(read[0].icon, icon);
  assert.equal('icon' in read[1], false);
  assert.equal(read[0].raw.theme, 'dark');
  // A file from before profiles is a single profile named after the fallback.
  const bare = readBackup(defaultSettings(), 'old-backup');
  assert.equal(bare.length, 1);
  assert.equal(bare[0].name, 'old-backup');
  assert.equal(bare[0].raw.version, defaultSettings().version);
  // Broken entries are skipped; unnamed ones are numbered.
  const odd = readBackup({ startPageBundle: 1, profiles: [null, { name: 'A' }, { settings: {} }, { name: 'B', settings: [] }] });
  assert.deepEqual(odd.map((p) => p.name), ['Profile 1']);
});

test('uniqueProfileName adds a number only when the name is taken', () => {
  assert.equal(uniqueProfileName('Work', ['Home']), 'Work');
  assert.equal(uniqueProfileName('Work', ['work']), 'Work (2)');
  assert.equal(uniqueProfileName('Work', ['Work', 'Work (2)']), 'Work (3)');
  const long = 'x'.repeat(40);
  const name = uniqueProfileName(long, ['x'.repeat(32)]);
  assert.equal(name.length, 32);
  assert.ok(name.endsWith(' (2)'));
});
