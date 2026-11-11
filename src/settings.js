// Settings dialog. Edits stay in a draft until Save; appearance changes preview live and revert on Discard or close.
import {
  ACCENTS, BACKGROUND_IMAGE_LIMIT, BLOCKS, FORMATS, PROFILE_NAME_MAX, SEARCH_BOXES,
  ZONE_ABBREVIATION_LIST, blankLauncher, changedSharedItems, clockLabel, clone, createId, hostOf, sharedEditPrompt, profileIcon, isValidEngineUrl, isValidTimeZone, moveItem, normalizeHttpUrl, backupFileName, serialize, zoneFromAbbreviation
} from './core.js';
import { applyAppearance, isDark } from './appearance.js';
import { h, icon, readImageFile, segmented, showModal } from './dom.js';
import { requestBookmarkAccess } from './bookmarks.js';
import { openIconPicker } from './icon-picker.js';
import { pickImportFile } from './import-review.js';
import { openShortcutEditor } from './shortcut-editor.js';
import { activeProfile, backupOf, clearHistory, createProfile, deleteProfile, renameProfile, setProfileIcon, store, switchProfile, update } from './state.js';
import { badge, colorChoice, iconButton, inlineText, launcherFaceStyle, launcherMark, sortHandle, stepper, toast } from './widgets.js';

// The sections, listed down the left of the dialog. Each groups what used to be separate tabs: Appearance has
// the colors and the page layout, Search the engines and the history, Links the shortcuts and the launchers,
// Profiles the profiles and backups.
const TABS = [
  { name: 'Appearance', icon: 'contrast' },
  { name: 'Search', icon: 'search' },
  { name: 'Clocks', icon: 'clock' },
  { name: 'Links', icon: 'link' },
  { name: 'Profiles', icon: 'user' }
];
// Background presets per theme; the first two are the picker's base colors.
const PRESETS = {
  light: ['#f3f2f2', '#eae9e9', '#fff3e4', '#ffe3bf', '#e8f3ea'],
  dark: ['#1d1c1b', '#282725', '#3a270d', '#2b2117', '#213324']
};

export function openSettings({ tab = 'Appearance', launcherId = null, addLauncher = false } = {}) {
  const ui = { tab: TABS.some((t) => t.name === tab) ? tab : 'Appearance', links: launcherId || addLauncher ? 'launchers' : 'shortcuts', engineBox: 'web', format: 'json', scope: 'current', expanded: launcherId, saved: clone(store.settings) };
  let draft = clone(store.settings);
  if (addLauncher) {
    const fresh = blankLauncher();
    draft.launchers.push(fresh);
    ui.expanded = fresh.id;
  }

  const dirty = () => JSON.stringify(draft) !== JSON.stringify(ui.saved);

  showModal({
    labelledBy: 'set-title',
    className: 'settings',
    onClose: () => applyAppearance(store.settings),
    build(dialog, close) {
      const tabs = h('div.tabs', { role: 'tablist', 'aria-label': 'Settings sections', 'aria-orientation': 'vertical' });
      const panel = h('div.dialog-body', { role: 'tabpanel', id: 'settings-panel', tabindex: '-1' });
      const status = h('span.status', { role: 'status' });
      // Names the profile these settings belong to.
      const kicker = h('span.kicker');
      const showProfile = () => { kicker.textContent = `${activeProfile().name.toUpperCase()} PROFILE`; };
      const discard = h('button.btn.outline', { type: 'button' }, 'Discard');
      const save = h('button.btn.primary', { type: 'button' }, 'Save');

      const touch = () => {
        const changed = dirty();
        status.className = `status${changed ? ' dirty' : ''}`;
        // What stops Save is said here, next to the button it disables.
        const problem = changed ? problems() : '';
        status.replaceChildren(h('span.dot', { 'aria-hidden': 'true' }), problem || (changed ? 'Unsaved changes' : 'All changes saved'));
        discard.disabled = !changed;
        save.disabled = !changed || Boolean(problem);
        applyAppearance(draft);
      };

      const problems = () => {
        for (const box of Object.keys(SEARCH_BOXES)) {
          if (draft.engines[box].list.some((e) => !e.name.trim() || !isValidEngineUrl(e.url))) return 'Every search engine needs a name and an address with %s.';
        }
        for (const group of draft.launchers) {
          if (!group.name.trim()) return 'Every launcher needs a name.';
          if (group.links.some((l) => !l.name.trim() || !normalizeHttpUrl(l.url).ok)) return `Every link in ${group.name} needs a name and an address.`;
        }
        return '';
      };

      const requestClose = () => {
        if (dirty() && !window.confirm('Discard unsaved settings changes?')) return;
        close();
      };

      const renderTabs = () => {
        const names = TABS.map((t) => t.name);
        tabs.replaceChildren(...TABS.map(({ name, icon: mark }) => h('button.tab', {
          type: 'button', role: 'tab', id: `tab-${name}`, 'aria-selected': String(ui.tab === name), 'aria-controls': 'settings-panel',
          tabindex: ui.tab === name ? '0' : '-1',
          onclick: () => { ui.tab = name; renderTabs(); renderPanel(); panel.scrollTop = 0; },
          onkeydown: (event) => {
            const i = names.indexOf(name);
            const next = event.key === 'ArrowDown' ? names[(i + 1) % names.length] : event.key === 'ArrowUp' ? names[(i - 1 + names.length) % names.length] : null;
            if (!next) return;
            event.preventDefault();
            ui.tab = next;
            renderTabs();
            renderPanel();
            panel.scrollTop = 0;
            tabs.querySelector(`#tab-${next}`).focus();
          }
        }, icon(mark, 18), name)));
        panel.setAttribute('aria-labelledby', `tab-${ui.tab}`);
      };

      const renderPanel = () => {
        const builders = { Appearance: appearanceSection, Search: searchSection, Clocks: clocksSection, Links: linksSection, Profiles: profilesSection };
        const scroll = panel.scrollTop;
        // A control that re-renders the panel (a switch, a stepper, Make default) keeps focus through its data-focus-key.
        const focusKey = panel.contains(document.activeElement) ? document.activeElement.dataset.focusKey : '';
        panel.replaceChildren(...builders[ui.tab]().flat().filter(Boolean));
        panel.scrollTop = scroll;
        if (focusKey) panel.querySelector(`[data-focus-key="${CSS.escape(focusKey)}"]`)?.focus();
        touch();
      };

      // Re-render the panel after a structural change; text edits only call touch().
      const change = (fn) => { fn(); renderPanel(); };
      // A name or address edited in place. Re-rendering would drop a click that ended the edit on another
      // control, so the panel is rebuilt only when the edit ended on empty space.
      const editText = (fn) => (value, how) => { fn(value); if (how === 'blank') renderPanel(); else touch(); };
      const checkUrl = (value) => { const check = normalizeHttpUrl(value); return check.ok ? { ok: true, value: check.url } : { ok: false, msg: check.msg }; };

      // The pieces every section is built from.
      const groupHead = (title, ...actions) => h('div.group-head', {}, h('h2', {}, title), actions.length ? h('div.inline', {}, ...actions) : null);
      const addButton = (label, onclick, primary = false) => h(`button.btn.small.${primary ? 'primary' : 'outline'}`, { type: 'button', onclick }, icon('plus', 14, 2.2), label);
      const toggle = ({ on, label, key, describedBy = null, onclick }) => h('button.switch', {
        type: 'button', role: 'switch', 'aria-checked': String(Boolean(on)), 'aria-describedby': describedBy, dataset: { focusKey: key }, onclick
      }, h('span.track', { 'aria-hidden': 'true' }, h('span.knob')), label);
      const removeButton = (label, onclick, props = {}) => h('button.icon-btn', { type: 'button', 'aria-label': label, title: 'Remove', onclick, ...props }, icon('trash', 16));
      // A warning on the row it is about; sync() shows or hides it after an edit in place.
      const rowWarning = (text, isBad) => {
        const el = h('span.row-msg', { hidden: !isBad() }, icon('alert', 14, 2.2), text);
        el.sync = () => { el.hidden = !isBad(); };
        return el;
      };
      // Starts editing the text at `selector` (a new row's name), as if it had been clicked.
      const startEdit = (selector) => panel.querySelector(selector)?.click();

      // ---------- Appearance: colors, then the page layout ----------
      const appearanceSection = () => {
        const bg = draft.background;
        const shown = bg[isDark(draft) ? 'dark' : 'light'];
        const colors = h('div.form-grid', {},
          h('span.field-label', { id: 'lbl-theme' }, 'Theme'),
          segmented({
            labelledBy: 'lbl-theme', value: draft.theme,
            options: [{ value: 'light', label: 'Light' }, { value: 'dark', label: 'Dark' }, { value: 'system', label: 'System' }],
            onChange: (value) => change(() => { draft.theme = value; })
          }),
          h('span.field-label', { id: 'lbl-acc' }, 'Accent'),
          colorChoice({
            label: 'Accent', value: draft.accent,
            options: Object.entries(ACCENTS).map(([key, accent]) => ({ value: key, label: accent.label, fill: accent.preview, fg: '#f3f2f2' })),
            onChange: (value) => change(() => { draft.accent = value; })
          }),
          h('span.field-label', { id: 'lbl-bg' }, 'Background'),
          segmented({
            labelledBy: 'lbl-bg', value: bg.type,
            options: [
              { value: 'solid', content: [h('span.bg-preview', { 'aria-hidden': 'true', style: { background: shown.solid || 'var(--bg)' } }), 'Solid'] },
              { value: 'gradient', content: [h('span.bg-preview', { 'aria-hidden': 'true', style: { background: `linear-gradient(165deg, ${shown.from}, ${shown.to})` } }), 'Gradient'] },
              { value: 'image', content: [h('span.bg-preview', { 'aria-hidden': 'true', style: { background: 'repeating-linear-gradient(45deg, var(--surface) 0 8px, var(--control) 8px 9px)' } }), 'Image'] }
            ],
            onChange: (value) => change(() => { bg.type = value; })
          })
        );
        if (bg.type === 'solid') {
          colors.append(...colorRow('light', ['solid']), ...colorRow('dark', ['solid']));
        } else if (bg.type === 'gradient') {
          colors.append(...colorRow('light', ['from', 'to']), ...colorRow('dark', ['from', 'to']));
        } else {
          const note = h('span.note', { 'aria-live': 'polite' }, bg.image ? 'Image stored in this browser.' : 'No image yet. JPG, PNG, WebP or GIF up to 3 MB.');
          colors.append(
            h('span.field-label.sub', {}, 'Image'),
            h('div.inline', {},
              h('label.btn.outline.small', { class: 'file-btn' }, 'Choose image',
                h('input', {
                  type: 'file', accept: 'image/png,image/jpeg,image/webp,image/gif',
                  onchange: async (event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;
                    try {
                      const image = await readImageFile(file, BACKGROUND_IMAGE_LIMIT);
                      change(() => { bg.image = image; });
                    } catch (error) {
                      note.textContent = error.message;
                    }
                  }
                })),
              bg.image ? h('button.btn.small', { type: 'button', onclick: () => change(() => { bg.image = ''; }) }, 'Remove image') : null,
              note)
          );
        }

        const blocks = draft.layout.blocks;
        const { rows, perRow } = draft.layout;
        const layout = h('div.form-grid', {},
          h('span.field-label.top', {}, 'Block order'),
          h('ol.block-list', {}, ...blocks.map((block, i) => h('li', { dataset: { sortRow: '' } },
            sortHandle({ item: block, index: i, count: blocks.length, label: BLOCKS[block], onMove: (from, to) => change(() => { draft.layout.blocks = moveItem(blocks, from, to); }) }),
            h('span.num', {}, String(i + 1).padStart(2, '0')),
            h('span.title', {}, BLOCKS[block])))),
          h('span.field-label', {}, 'Shortcut grid'),
          h('div.inline', { style: { gap: '10px' } },
            stepper({ value: rows, min: 1, max: 4, label: 'rows', focusKey: 'rows', onChange: (n) => change(() => { draft.layout.rows = n; }) }),
            h('span.note', {}, rows === 1 ? 'row of' : 'rows of'),
            stepper({ value: perRow, min: 4, max: 12, label: 'shortcuts per row', focusKey: 'per-row', onChange: (n) => change(() => { draft.layout.perRow = n; }) }),
            h('span.note', {}, `Up to ${rows * perRow} per page`)),
          h('span.field-label', {}, 'Category row'),
          toggle({
            on: draft.layout.showCategories, key: 'categories', label: 'Show categories, Edit and Add above shortcuts',
            onclick: () => change(() => { draft.layout.showCategories = !draft.layout.showCategories; })
          }),
          h('span.field-label.top', {}, 'Bookmarks bar'),
          h('div.stack', {},
            toggle({
              on: draft.layout.showBookmarks, key: 'bookmarks', label: 'Show browser bookmarks at the top',
              onclick: async () => {
                // Turning it on asks Chrome for access to bookmarks (once); without it the bar stays off.
                if (!draft.layout.showBookmarks && !await requestBookmarkAccess()) {
                  toast('The bookmarks bar needs access to your bookmarks.');
                  return;
                }
                change(() => { draft.layout.showBookmarks = !draft.layout.showBookmarks; });
              }
            }),
            h('span.note', {}, 'Chrome’s own bar can’t be hidden from here: Ctrl+Shift+B (⌘+Shift+B on Mac).')));
        return [groupHead('Colors'), colors, groupHead('Layout'), layout];
      };

      // One row per theme: the solid color, or the gradient's start and end.
      const colorRow = (theme, keys) => {
        const colors = draft.background[theme];
        const name = theme === 'light' ? 'Light theme' : 'Dark theme';
        const part = { solid: ' color', from: ' start', to: ' end' };
        return [
          h('span.field-label.sub', {}, name),
          h('div.inline', {},
            ...keys.map((key) => colorChoice({
              label: `${name}${part[key]}`, value: colors[key],
              options: PRESETS[theme].map((hex) => ({ value: hex, label: hex, fill: hex })),
              onChange: (value) => change(() => { colors[key] = value; })
            })),
            keys[0] === 'solid' && colors.solid ? h('button.btn.small', { type: 'button', onclick: () => change(() => { colors.solid = ''; }) }, 'Use theme color') : null)
        ];
      };

      // ---------- Search: engines per box, then the history ----------
      const searchSection = () => {
        const box = ui.engineBox;
        const group = draft.engines[box];
        const list = group.list;
        const checkEngineUrl = (value) => (isValidEngineUrl(value.trim())
          ? { ok: true, value: value.trim() }
          : { ok: false, msg: 'The address must start with http(s):// and contain %s.' });
        const rows = list.map((engine, i) => {
          const isDefault = group.default === engine.id;
          const warning = rowWarning('Needs http(s):// and %s where the search goes.', () => !engine.name.trim() || !isValidEngineUrl(engine.url));
          const edited = (fn) => (value, how) => { fn(value); warning.sync(); if (how === 'blank') renderPanel(); else touch(); };
          return h('li', { dataset: { sortRow: '', engineId: engine.id } },
            sortHandle({ item: engine, index: i, count: list.length, label: engine.name, onMove: (from, to) => change(() => { group.list = moveItem(list, from, to); }) }),
            h('span.grow', {},
              inlineText({ value: engine.name, label: `Name of ${engine.name}: click to rename`, className: 'title', onCommit: edited((value) => { engine.name = value; }) }),
              h('span.sub', {},
                inlineText({ value: engine.url, type: 'url', check: checkEngineUrl, label: `Address of ${engine.name}: click to change`, onCommit: edited((value) => { engine.url = value; }) })),
              warning),
            h('button.pill', {
              type: 'button', 'aria-pressed': String(isDefault), dataset: { focusKey: `default-${engine.id}` },
              'aria-label': isDefault ? `${engine.name} is the default` : `Make ${engine.name} the default`,
              onclick: () => change(() => { group.default = engine.id; })
            }, isDefault ? 'Default' : 'Make default'),
            removeButton(`Remove ${engine.name}`, () => change(() => {
              group.list = list.filter((e) => e.id !== engine.id);
              if (group.default === engine.id) group.default = group.list[0].id;
            }), { disabled: list.length === 1 }));
        });
        return [
          groupHead('Engines', addButton('Add engine', () => {
            const fresh = { id: createId('en'), name: 'New engine', url: 'https://' };
            change(() => { group.list.push(fresh); });
            startEdit(`[data-engine-id="${CSS.escape(fresh.id)}"] .title .inline-text`);
          })),
          segmented({
            label: 'Search box', value: box,
            options: Object.entries(SEARCH_BOXES).map(([key, meta]) => ({ value: key, label: meta.kicker })),
            onChange: (value) => change(() => { ui.engineBox = value; })
          }),
          h('ul.list', {}, ...rows),
          h('span.note', {}, 'Click a name or address to change it. %s marks where your search goes.'),
          h('div.stack', {},
            toggle({
              on: group.shared, key: 'engines-shared', describedBy: 'engines-shared-note', label: `Same ${SEARCH_BOXES[box].kicker} engines on all profiles`,
              onclick: () => change(() => { if (group.shared) delete group.shared; else group.shared = true; })
            }),
            h('span.note', { id: 'engines-shared-note' }, group.shared
              ? 'Changes to this list and its default apply to every profile.'
              : 'Off: this list and its default belong to the profile in use only.')),
          groupHead('History'),
          h('div.between', {},
            h('span.note', {}, 'Past searches are used for suggestions and kept on this device, for all profiles.'),
            h('button.btn.outline.small', { type: 'button', onclick: () => { clearHistory(); toast('Search history cleared'); } }, 'Clear history'))
        ];
      };

      // ---------- Clocks ----------
      const clocksSection = () => {
        const zones = typeof Intl.supportedValuesOf === 'function' ? Intl.supportedValuesOf('timeZone') : [];
        const add = h('input.input.compact', { id: 'add-tz', type: 'text', placeholder: 'Add a city or time zone, e.g. Paris, PDT or CET', list: 'tz-list', style: { flex: 1, minWidth: 0, height: '44px' } });
        const addMsg = h('span.msg.bad', { 'aria-live': 'polite' });
        const addClock = () => {
          const query = add.value.trim();
          if (!query) return;
          const needle = query.toLowerCase().replace(/\s+/g, '_');
          const tz = zoneFromAbbreviation(query) || (isValidTimeZone(query) && query.includes('/') ? query
            : zones.find((z) => z.toLowerCase() === needle) || zones.find((z) => z.toLowerCase().split('/').pop() === needle));
          if (!tz) { addMsg.textContent = `No time zone found for “${query}”. Try an abbreviation like PDT, a capital city, or a zone like Asia/Taipei.`; return; }
          const listed = draft.clocks.world.find((c) => c.tz === tz);
          if (listed) { addMsg.textContent = `${clockLabel(listed, new Date())} (${tz}) is already listed.`; return; }
          // No label: the clock shows its live abbreviation (or city), which the user can rename in the list.
          change(() => { draft.clocks.world.push({ city: '', tz }); });
          panel.querySelector('#add-tz')?.focus();
        };
        add.addEventListener('keydown', (event) => { if (event.key === 'Enter') { event.preventDefault(); addClock(); } });
        const world = draft.clocks.world;
        return [
          groupHead('Main clock'),
          h('div.form-grid', {},
            h('span.field-label', { id: 'hour-format' }, 'Time format'),
            segmented({
              labelledBy: 'hour-format', value: draft.clocks.hour12 ? '12' : '24',
              options: [{ value: '24', label: '24-hour' }, { value: '12', label: '12-hour' }],
              onChange: (value) => change(() => { draft.clocks.hour12 = value === '12'; })
            }),
            h('span.field-label', {}, 'Seconds'),
            toggle({ on: draft.clocks.showSeconds, key: 'seconds', label: 'Show seconds', onclick: () => change(() => { draft.clocks.showSeconds = !draft.clocks.showSeconds; }) })),
          groupHead('World clocks'),
          h('div', { style: { display: 'flex', gap: '8px' } },
            h('label.sr-only', { for: 'add-tz' }, 'Add a time zone'),
            add,
            h('button.btn.outline', { type: 'button', onclick: addClock }, icon('plus', 14, 2.2), 'Add clock')),
          addMsg,
          world.length ? h('ul.list', {}, ...world.map((clock, i) => {
            const zoneName = () => clockLabel({ ...clock, city: '' }, new Date());
            const shown = clockLabel(clock, new Date());
            return h('li', { dataset: { sortRow: '' } },
              sortHandle({ item: clock, index: i, count: world.length, label: shown, onMove: (from, to) => change(() => { draft.clocks.world = moveItem(world, from, to); }) }),
              h('span.grow', {},
                // An emptied name goes back to the zone's own name.
                inlineText({
                  value: clock.city, display: (value) => value || zoneName(), check: (value) => ({ ok: true, value: value.trim() }), className: 'title',
                  label: `Name of the ${clock.tz} clock: click to rename`, onCommit: editText((value) => { clock.city = value; })
                }),
                h('span.sub', {}, clock.tz)),
              removeButton(`Remove ${shown}`, () => change(() => { draft.clocks.world = world.filter((c) => c !== clock); })));
          })) : h('p.note', {}, 'No world clocks. Only the local clock is shown.'),
          world.length ? h('span.note', {}, 'Click a name to rename it; clear it to show the zone’s own name.') : null,
          h('datalist', { id: 'tz-list' },
            ...ZONE_ABBREVIATION_LIST.map(([name, tz]) => h('option', { value: name, label: tz })),
            ...zones.map((z) => h('option', { value: z })))
        ];
      };

      // ---------- Links: shortcuts and launchers, one list at a time ----------
      const linksSection = () => {
        const launchers = ui.links === 'launchers';
        const kinds = segmented({
          label: 'Kind of link', value: ui.links,
          options: [{ value: 'shortcuts', label: `Shortcuts (${draft.shortcuts.length})` }, { value: 'launchers', label: `Launchers (${draft.launchers.length})` }],
          onChange: (value) => { ui.links = value; renderPanel(); panel.scrollTop = 0; panel.querySelector('.seg[aria-pressed="true"]')?.focus(); }
        });
        const { actions, body } = launchers ? launcherList() : shortcutList();
        return [h('div.between', {}, kinds, h('div.inline', {}, ...actions)), ...body];
      };

      // The shortcut editor opens over Settings and edits the draft, so changes wait for Save.
      const shortcutList = () => {
        const list = draft.shortcuts;
        const edit = (id, newGroup = false) => openShortcutEditor(id, {
          newGroup,
          shortcuts: draft.shortcuts,
          commit: (fn) => {
            change(() => fn(draft.shortcuts));
            // The editor closes right after; then put focus back on the edited row.
            const target = id || draft.shortcuts[draft.shortcuts.length - 1]?.id;
            queueMicrotask(() => (panel.querySelector(`[data-edit-id="${CSS.escape(target || '')}"]`) || panel.querySelector('.btn.primary'))?.focus());
          }
        });
        const items = list.map((item, i) => h('li', { dataset: { sortRow: '' } },
          sortHandle({ item, index: i, count: list.length, label: item.name, onMove: (from, to) => change(() => { draft.shortcuts = moveItem(list, from, to); }) }),
          // Clicking the icon opens the icon picker; the change waits for Save like the rest of the draft.
          iconButton({
            mark: badge(item),
            label: `Change icon of ${item.name}`,
            onclick: () => openIconPicker({
              icon: item.icon, name: item.name, url: item.url,
              onApply: (next) => { change(() => { item.icon = next; }); panel.querySelector(`[data-icon-id="${CSS.escape(item.id)}"]`)?.focus(); }
            })
          }, { dataset: { iconId: item.id } }),
          h('span.grow', {},
            inlineText({ value: item.name, label: `Name of ${item.name}: click to rename`, className: 'title', onCommit: editText((value) => { item.name = value; }) }),
            h('span.sub', {}, `${item.category || 'No category'} · `,
              inlineText({ value: item.url, type: 'url', display: hostOf, check: checkUrl, label: `Address of ${item.name}: click to change`, onCommit: editText((value) => { item.url = value; }) }),
              item.shared ? ' · All profiles' : '')),
          h('button.btn.small.quiet-outline', { type: 'button', 'aria-label': `Edit ${item.name} shortcut`, dataset: { editId: item.id }, onclick: () => edit(item.id) }, 'Edit'),
          removeButton(`Remove ${item.name} shortcut`, () => {
            if (item.shared && !window.confirm(`${item.name} shows on all profiles. Remove it from every profile?`)) return;
            change(() => { draft.shortcuts = draft.shortcuts.filter((s) => s.id !== item.id); });
          })));
        return {
          // A group is a category: it exists once a shortcut is saved into it, so Add group starts with its first shortcut.
          actions: [addButton('Add group', () => edit(null, true)), addButton('Add shortcut', () => edit(null), true)],
          body: [
            h('span.note', {}, 'Tiles under the search boxes. Click an icon, name or address to change it; Edit has the group and sharing.'),
            list.length ? h('ul.list', {}, ...items) : h('p.note', {}, 'No shortcuts yet.')
          ]
        };
      };

      const launcherList = () => {
        const groups = draft.launchers;
        const items = groups.map((group, i) => {
          const expanded = ui.expanded === group.id;
          // The whole row opens the links, not just the arrow button; its own controls keep their jobs.
          const toggleLinks = () => change(() => { ui.expanded = expanded ? null : group.id; });
          return h(`li.opens${expanded ? '.expanded' : ''}`, {
            dataset: { sortRow: '', launcherId: group.id },
            onclick: (event) => { if (!event.target.closest('button, input, a, .inline-edit, .launcher-editor')) toggleLinks(); }
          },
            sortHandle({ item: group, index: i, count: groups.length, label: group.name, onMove: (from, to) => change(() => { draft.launchers = moveItem(groups, from, to); }) }),
            iconButton({
              mark: h('span.badge.launcher-face', { 'aria-hidden': 'true', style: { width: '40px', height: '40px', fontSize: '13px', ...launcherFaceStyle(group.icon) } }, launcherMark(group)),
              label: `Change icon of ${group.name}`,
              onclick: () => openIconPicker({
                icon: group.icon, name: group.name, url: group.links[0]?.url || '',
                onApply: (next) => { change(() => { group.icon = next; }); panel.querySelector(`[data-icon-id="${CSS.escape(group.id)}"]`)?.focus(); }
              })
            }, { dataset: { iconId: group.id } }),
            h('span.grow', {},
              inlineText({ value: group.name, label: `Name of ${group.name}: click to rename`, className: 'title', onCommit: editText((value) => { group.name = value; }) }),
              h('span.sub', {}, `${group.links.length} link${group.links.length === 1 ? '' : 's'}${group.shared ? ' · All profiles' : ''}`)),
            h('button.icon-btn.fold', {
              type: 'button', 'aria-expanded': String(expanded), 'aria-label': `${expanded ? 'Hide' : 'Show'} the links of ${group.name}`,
              title: expanded ? 'Hide links' : 'Show links', dataset: { focusKey: `links-${group.id}` },
              onclick: toggleLinks
            }, icon('chevronDown', 16, 2.2)),
            removeButton(`Remove ${group.name} launcher`, () => {
              if (group.shared && !window.confirm(`${group.name} shows on all profiles. Remove it from every profile?`)) return;
              change(() => { draft.launchers = draft.launchers.filter((g) => g.id !== group.id); if (expanded) ui.expanded = null; });
            }),
            expanded ? launcherLinks(group) : null);
        });
        return {
          actions: [addButton('Add launcher', () => {
            const fresh = blankLauncher();
            change(() => { draft.launchers.push(fresh); ui.expanded = fresh.id; });
            startEdit(`[data-launcher-id="${CSS.escape(fresh.id)}"] .title .inline-text`);
          }, true)],
          body: [
            h('span.note', {}, 'Buttons in the bottom dock; each opens a list of links. Click a launcher to edit its links; click its icon or name to change those.'),
            groups.length ? h('ul.list', {}, ...items) : h('p.note', {}, 'No launchers yet.')
          ]
        };
      };

      // A launcher's links, under its row: each a name and an address edited in place, plus the sharing switch.
      const launcherLinks = (group) => {
        const links = group.links.map((link, i) => {
          const warning = rowWarning('Needs a name and an address', () => !link.name.trim() || !normalizeHttpUrl(link.url).ok);
          const edited = (fn) => (value, how) => { fn(value); warning.sync(); if (how === 'blank') renderPanel(); else touch(); };
          return h('div.link-row', { dataset: { sortRow: '', linkIndex: i } },
            sortHandle({ item: link, index: i, count: group.links.length, label: link.name || 'link', onMove: (from, to) => change(() => { group.links = moveItem(group.links, from, to); }) }),
            h('span.link-name', {}, inlineText({ value: link.name, placeholder: 'Name', label: `Name of link ${i + 1}: click to change`, onCommit: edited((value) => { link.name = value; }) })),
            h('span.link-url', {}, inlineText({ value: link.url, placeholder: 'example.com', type: 'url', check: checkUrl, label: `Address of ${link.name || `link ${i + 1}`}: click to change`, onCommit: edited((value) => { link.url = value; }) })),
            warning,
            h('button.icon-btn.small', { type: 'button', 'aria-label': `Remove ${link.name || `link ${i + 1}`}`, title: 'Remove', onclick: () => change(() => { group.links = group.links.filter((l) => l !== link); }) }, icon('close', 14, 2.2)));
        });
        return h('div.launcher-editor', {},
          ...(links.length ? links : [h('p.note', { style: { margin: 0 } }, 'No links yet.')]),
          h('div.between', {},
            h('button.btn.outline.small', {
              type: 'button',
              onclick: () => {
                change(() => { group.links.push({ name: '', url: '' }); });
                startEdit(`.launcher-editor [data-link-index="${group.links.length - 1}"] .link-name .inline-text`);
              }
            }, icon('plus', 14, 2.2), 'Add link'),
            toggle({
              on: group.shared, key: `shared-${group.id}`, label: 'Show on all profiles',
              onclick: () => change(() => { if (group.shared) delete group.shared; else group.shared = true; })
            })));
      };

      // ---------- Profiles, then backups ----------
      // Profile actions apply at once. Switching or adding one loads its settings into this dialog.
      const loadProfile = async (action) => {
        if (dirty() && !window.confirm('Discard unsaved settings changes?')) return;
        await action();
        ui.saved = clone(store.settings);
        draft = clone(store.settings);
        showProfile();
        renderPanel();
      };

      const profilesSection = () => {
        const { list, active } = store.profiles;
        const items = list.map((profile) => {
          const on = profile.id === active;
          // The icon is a button: clicking it opens the icon picker. Icon changes apply at once, like the other profile actions.
          const mark = profileIcon(profile);
          const refocus = () => { renderPanel(); panel.querySelector(`[data-profile-icon="${profile.id}"]`)?.focus(); };
          const pickIcon = iconButton({
            mark: badge({ name: profile.name, url: '', icon: mark }, `profile${on ? ' on' : ''}`),
            label: `Change icon of the ${profile.name} profile`,
            onclick: () => openIconPicker({
              icon: mark, name: profile.name, allowNone: true, neutral: true, requireUrl: true,
              onApply: (next) => { setProfileIcon(profile.id, next); refocus(); },
              onReset: () => { setProfileIcon(profile.id, null); refocus(); }
            })
          });
          pickIcon.dataset.profileIcon = profile.id;
          return h('li', {},
            pickIcon,
            h('span.grow', {},
              inlineText({
                value: profile.name, maxlength: PROFILE_NAME_MAX, className: 'title', label: `Name of the ${profile.name} profile: click to rename`,
                onCommit: (value, how) => {
                  renameProfile(profile.id, value);
                  showProfile();
                  // The stored name can differ from what was typed (a name already in use gets a number).
                  const stored = store.profiles.list.find((p) => p.id === profile.id).name;
                  if (how === 'blank' || stored !== value) renderPanel();
                }
              })),
            on
              ? h('span.tag', {}, 'In use')
              : h('button.btn.small.quiet-outline', { type: 'button', 'aria-label': `Use ${profile.name} profile`, onclick: () => loadProfile(() => switchProfile(profile.id)) }, 'Use'),
            on ? null : h('button.icon-btn', {
              type: 'button', 'aria-label': `Delete ${profile.name} profile`, title: 'Delete profile',
              onclick: () => {
                if (!window.confirm(`Delete the ${profile.name} profile and all its settings?`)) return;
                deleteProfile(profile.id);
                renderPanel();
                toast(`Deleted ${profile.name}`);
              }
            }, icon('trash', 16)));
        });

        const meta = FORMATS[ui.format];
        const all = ui.scope === 'all' && list.length > 1;
        const fileName = backupFileName({ profileName: all ? null : activeProfile().name, extension: meta.ext });
        return [
          groupHead('Profiles',
            h('button.btn.small.outline', { type: 'button', onclick: () => loadProfile(() => createProfile({ copy: true })) }, 'Duplicate current'),
            addButton('New profile', () => loadProfile(() => createProfile()), true)),
          h('span.note', {}, 'Each profile keeps its own settings; the other sections edit the one in use. Switching, renaming and deleting apply right away.'),
          h('ul.list', {}, ...items),
          groupHead('Backup'),
          h('div.form-grid', {},
            h('span.field-label', { id: 'lbl-scope' }, 'Export'),
            segmented({
              labelledBy: 'lbl-scope', value: all ? 'all' : 'current',
              options: [{ value: 'current', label: `This profile (${activeProfile().name})` }, { value: 'all', label: `All profiles (${list.length})` }],
              onChange: (value) => change(() => { ui.scope = value; })
            }),
            h('span.field-label', { id: 'lbl-fmt' }, 'Format'),
            segmented({
              labelledBy: 'lbl-fmt', value: ui.format,
              options: Object.entries(FORMATS).map(([key, f]) => ({ value: key, label: f.label })),
              onChange: (value) => change(() => { ui.format = value; })
            }),
            h('span'),
            h('div.stack', {},
              h('button.btn.primary', {
                type: 'button',
                onclick: async () => {
                  const blob = new Blob([serialize(await backupOf(all ? 'all' : 'current'), ui.format)], { type: meta.mime });
                  const link = h('a', { href: URL.createObjectURL(blob), download: fileName });
                  document.body.append(link);
                  link.click();
                  link.remove();
                  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
                  toast(`Exported ${fileName}`);
                }
              }, `Export ${fileName}`),
              dirty() ? h('span.note', {}, 'Export uses your saved settings. Save first to include unsaved changes.') : null),
            h('span.field-label.top', {}, 'Import'),
            h('div.stack', {},
              h('button.btn.outline', {
                type: 'button',
                onclick: () => {
                  if (dirty() && !window.confirm('Discard unsaved settings changes and import a file?')) return;
                  pickImportFile();
                }
              }, 'Import file…'),
              h('span.note', {}, 'JSON, YAML, TOML or text. You review the file before anything changes, and choose which of its profiles to import.')))
        ];
      };

      discard.addEventListener('click', () => { draft = clone(ui.saved); renderPanel(); });
      save.addEventListener('click', () => {
        if (problems()) return;
        // Launcher links typed without a scheme are stored as full https URLs.
        draft.launchers.forEach((g) => { g.links = g.links.map((l) => ({ name: l.name.trim(), url: normalizeHttpUrl(l.url).url })); g.name = g.name.trim(); });
        // Changes to items shown on all profiles reach every profile, so ask first (removals asked when clicked).
        const sharedNames = changedSharedItems(ui.saved, draft);
        if (sharedNames.length && !window.confirm(sharedEditPrompt(sharedNames))) return;
        update(draft);
        ui.saved = clone(store.settings);
        draft = clone(store.settings);
        renderPanel();
        toast('Settings saved');
      });

      // Escape and the scrim go through the unsaved-changes check.
      dialog.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && !event.defaultPrevented) {
          event.preventDefault();
          event.stopPropagation();
          requestClose();
        }
      });
      const scrim = dialog.parentElement;
      scrim.addEventListener('mousedown', (event) => {
        if (event.target !== scrim) return;
        event.stopImmediatePropagation();
        requestClose();
      }, true);

      dialog.append(
        h('div.dialog-head', {},
          h('div.titles', {}, kicker, h('h1', { id: 'set-title' }, 'Settings')),
          h('button.close-btn', { type: 'button', 'aria-label': 'Close settings', onclick: requestClose }, icon('close'))),
        h('div.settings-main', {}, tabs, panel),
        h('div.dialog-foot', {}, status, discard, save)
      );
      showProfile();
      renderTabs();
      renderPanel();
      // Opened for one launcher: a new one starts with its name being edited, an existing one with its links open.
      if (addLauncher) startEdit('.list li.expanded .title .inline-text');
      else if (ui.expanded) panel.querySelector('.list li.expanded [aria-expanded]')?.focus();
    }
  });
}
