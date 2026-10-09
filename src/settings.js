// Settings dialog. Edits stay in a draft until Save; appearance changes preview live and revert on Discard or close.
import {
  ACCENTS, BACKGROUND_IMAGE_LIMIT, BLOCKS, FORMATS, PROFILE_NAME_MAX, SEARCH_BOXES,
  ZONE_ABBREVIATION_LIST, blankLauncher, changedSharedItems, clockLabel, clone, createId, hostOf, sharedEditPrompt, profileIcon, isValidEngineUrl, isValidTimeZone, moveItem, normalizeHttpUrl, serialize, zoneFromAbbreviation
} from './core.js';
import { applyAppearance, isDark } from './appearance.js';
import { h, icon, readImageFile, segmented, showModal } from './dom.js';
import { openIconPicker } from './icon-picker.js';
import { pickImportFile } from './import-review.js';
import { openShortcutEditor } from './shortcut-editor.js';
import { activeProfile, clearHistory, createProfile, deleteProfile, renameProfile, setProfileIcon, store, switchProfile, update } from './state.js';
import { badge, colorChoice, iconButton, launcherFaceStyle, launcherMark, sortHandle, toast } from './widgets.js';

const TABS = ['Profiles', 'Appearance', 'Search', 'Clocks', 'Shortcuts', 'Launchers', 'Layout', 'Data'];
// Background presets per theme; the first two are the picker's base colors.
const PRESETS = {
  light: ['#f3f2f2', '#eae9e9', '#fff3e4', '#ffe3bf', '#e8f3ea'],
  dark: ['#1d1c1b', '#282725', '#3a270d', '#2b2117', '#213324']
};

export function openSettings({ tab = 'Appearance', launcherId = null, addLauncher = false } = {}) {
  const ui = { tab, engineBox: 'web', format: 'json', expanded: launcherId, saved: clone(store.settings) };
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
      const tabs = h('div.tabs', { role: 'tablist', 'aria-label': 'Settings sections' });
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
        status.replaceChildren(h('span.dot', { 'aria-hidden': 'true' }), changed ? 'Unsaved changes' : 'All changes saved');
        discard.disabled = !changed;
        save.disabled = !changed || Boolean(problems());
        applyAppearance(draft);
      };

      const problems = () => {
        for (const box of Object.keys(SEARCH_BOXES)) {
          if (draft.engines[box].list.some((e) => !e.name.trim() || !isValidEngineUrl(e.url))) return 'Fix the search engines before saving.';
        }
        for (const group of draft.launchers) {
          if (!group.name.trim()) return 'Every launcher needs a name.';
          if (group.links.some((l) => !l.name.trim() || !normalizeHttpUrl(l.url).ok)) return `Fix the links in ${group.name}.`;
        }
        return '';
      };

      const requestClose = () => {
        if (dirty() && !window.confirm('Discard unsaved settings changes?')) return;
        close();
      };

      const renderTabs = () => {
        tabs.replaceChildren(...TABS.map((name) => h('button.tab', {
          type: 'button', role: 'tab', id: `tab-${name}`, 'aria-selected': String(ui.tab === name), 'aria-controls': 'settings-panel',
          tabindex: ui.tab === name ? '0' : '-1',
          onclick: () => { ui.tab = name; renderTabs(); renderPanel(); },
          onkeydown: (event) => {
            const i = TABS.indexOf(name);
            const next = event.key === 'ArrowRight' ? TABS[(i + 1) % TABS.length] : event.key === 'ArrowLeft' ? TABS[(i - 1 + TABS.length) % TABS.length] : null;
            if (!next) return;
            event.preventDefault();
            ui.tab = next;
            renderTabs();
            renderPanel();
            tabs.querySelector(`#tab-${next}`).focus();
          }
        }, name)));
        panel.setAttribute('aria-labelledby', `tab-${ui.tab}`);
      };

      const renderPanel = () => {
        const builders = { Profiles: profilesTab, Appearance: appearanceTab, Search: searchTab, Clocks: clocksTab, Shortcuts: shortcutsTab, Launchers: launchersTab, Layout: layoutTab, Data: dataTab };
        const scroll = panel.scrollTop;
        panel.replaceChildren(...[builders[ui.tab]()].flat());
        panel.scrollTop = scroll;
        touch();
      };

      // Re-render the panel after a structural change; text edits only call touch().
      const change = (fn) => { fn(); renderPanel(); };

      // ---------- Profiles ----------
      // Profile actions apply at once. Switching or adding one loads its settings into this dialog.
      const loadProfile = async (action) => {
        if (dirty() && !window.confirm('Discard unsaved settings changes?')) return;
        await action();
        ui.saved = clone(store.settings);
        draft = clone(store.settings);
        showProfile();
        renderPanel();
      };

      const profilesTab = () => {
        const { list, active } = store.profiles;
        const items = list.map((profile) => {
          const on = profile.id === active;
          const name = h('input.input.compact', {
            type: 'text', value: profile.name, maxlength: PROFILE_NAME_MAX, 'aria-label': 'Profile name', style: { width: '240px' },
            onchange: () => {
              renameProfile(profile.id, name.value);
              name.value = store.profiles.list.find((p) => p.id === profile.id).name;
              showProfile();
            }
          });
          // The icon is a button: clicking it opens the icon picker. Icon changes apply at once, like the other profile actions.
          const mark = profileIcon(profile);
          const pickIcon = iconButton({
            mark: badge({ name: profile.name, url: '', icon: mark }, `profile${on ? ' on' : ''}`),
            label: `Change icon of the ${profile.name} profile`,
            onclick: () => openIconPicker({
              icon: mark, name: profile.name, allowNone: true, neutral: true, requireUrl: true,
              onApply: (next) => { setProfileIcon(profile.id, next); renderPanel(); document.querySelector(`[data-profile-icon="${profile.id}"]`)?.focus(); },
              onReset: () => { setProfileIcon(profile.id, null); renderPanel(); document.querySelector(`[data-profile-icon="${profile.id}"]`)?.focus(); }
            })
          });
          pickIcon.dataset.profileIcon = profile.id;
          return h('li.profile-row', {},
            pickIcon,
            h('span.grow', {}, name),
            on
              ? h('span.note', {}, 'In use, editing now')
              : h('button.btn.quiet-outline', { type: 'button', 'aria-label': `Use ${profile.name} profile`, onclick: () => loadProfile(() => switchProfile(profile.id)) }, 'Use'),
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
        return [
          h('span.note', {}, 'Each profile has its own appearance, search engines, clocks, shortcuts, launchers and layout. The other tabs edit the profile in use. Search history is shared, and so is any shortcut or launcher set to show on all profiles. Click a profile\'s icon to change it.'),
          h('ul.list', {}, ...items),
          h('div.inline', {},
            h('button.btn.primary', { type: 'button', onclick: () => loadProfile(() => createProfile()) }, 'New profile'),
            h('button.btn.outline', { type: 'button', onclick: () => loadProfile(() => createProfile({ copy: true })) }, 'Duplicate current')),
          h('span.note', {}, 'A new profile starts from the default settings; a duplicate copies the profile in use as it was last saved.')
        ];
      };

      // ---------- Appearance ----------
      const appearanceTab = () => {
        const bg = draft.background;
        const shown = bg[isDark(draft) ? 'dark' : 'light'];
        const grid = h('div.form-grid', {},
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
          grid.append(...colorRow('light', ['solid']), ...colorRow('dark', ['solid']));
        } else if (bg.type === 'gradient') {
          grid.append(...colorRow('light', ['from', 'to']), ...colorRow('dark', ['from', 'to']));
        } else {
          const note = h('span.note', { 'aria-live': 'polite' }, bg.image ? 'Image stored in this browser.' : 'No image yet. JPG, PNG, WebP or GIF up to 3 MB.');
          grid.append(
            h('span.field-label', {}, 'Image'),
            h('div.inline', {},
              h('label.btn.outline.small', { class: 'file-btn', style: { borderRadius: '6px' } }, 'Choose image',
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
        return grid;
      };

      // One row per theme: the solid color, or the gradient's start and end.
      const colorRow = (theme, keys) => {
        const colors = draft.background[theme];
        const name = theme === 'light' ? 'Light' : 'Dark';
        const part = { solid: '', from: ' start', to: ' end' };
        return [
          h('span.field-label', {}, name),
          h('div.inline', {},
            ...keys.map((key) => colorChoice({
              label: `${name} theme${part[key] || ' color'}`, value: colors[key],
              options: PRESETS[theme].map((hex) => ({ value: hex, label: hex, fill: hex })),
              onChange: (value) => change(() => { colors[key] = value; })
            })),
            keys[0] === 'solid' && colors.solid ? h('button.btn.small', { type: 'button', onclick: () => change(() => { colors.solid = ''; }) }, 'Use theme color') : null)
        ];
      };

      // ---------- Search engines ----------
      const searchTab = () => {
        const box = ui.engineBox;
        const group = draft.engines[box];
        const list = group.list;
        const note = h('span.note', { 'aria-live': 'polite' });
        const refreshNote = () => {
          const bad = list.some((e) => !e.name.trim() || !isValidEngineUrl(e.url));
          note.textContent = bad
            ? 'Each engine needs a name, and a URL that starts with http(s):// and contains %s.'
            : 'Links open directly in any box, DOIs open on doi.org, and other schemes are blocked.';
          note.style.color = bad ? 'var(--ink)' : '';
        };
        const rows = list.map((engine, i) => {
          const url = h('input.input.tight', {
            type: 'url', 'aria-label': `${engine.name} URL`, value: engine.url, spellcheck: 'false',
            'aria-invalid': String(!isValidEngineUrl(engine.url)), title: 'Must start with http(s):// and contain %s',
            oninput: () => { engine.url = url.value; url.setAttribute('aria-invalid', String(!isValidEngineUrl(engine.url))); refreshNote(); touch(); }
          });
          const name = h('input.input.tight', {
            type: 'text', 'aria-label': 'Engine name', value: engine.name, style: { fontWeight: 700 },
            oninput: () => { engine.name = name.value; name.setAttribute('aria-invalid', String(!engine.name.trim())); refreshNote(); touch(); }
          });
          return h(`div.engine-row${group.default === engine.id ? '.is-default' : ''}`, { dataset: { sortRow: '' } },
            sortHandle({ item: engine, index: i, count: list.length, label: engine.name, onMove: (from, to) => change(() => { group.list = moveItem(list, from, to); }) }),
            h('input', {
              type: 'radio', name: `default-${box}`, 'aria-label': `Make ${engine.name} the default`, checked: group.default === engine.id,
              onchange: () => change(() => { group.default = engine.id; })
            }),
            name, url,
            h('button.icon-btn.small', {
              type: 'button', 'aria-label': `Remove ${engine.name}`, disabled: list.length === 1,
              onclick: () => change(() => {
                group.list = list.filter((e) => e.id !== engine.id);
                if (group.default === engine.id) group.default = group.list[0].id;
              })
            }, icon('close', 14, 2.2)));
        });
        refreshNote();
        return [
          h('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' } },
            segmented({
              label: 'Search box', value: box,
              options: Object.entries(SEARCH_BOXES).map(([key, meta]) => ({ value: key, label: meta.kicker })),
              onChange: (value) => change(() => { ui.engineBox = value; })
            }),
            h('button.btn.outline.small', {
              type: 'button',
              onclick: () => {
                change(() => { group.list.push({ id: createId('en'), name: 'New engine', url: 'https://' }); });
                panel.querySelector('.engine-row:last-child input[type="text"]')?.select();
              }
            }, icon('plus', 14, 2.2), 'Add engine')),
          h('button.switch', {
            type: 'button', role: 'switch', 'aria-checked': String(Boolean(group.shared)), 'aria-describedby': 'engines-shared-note', style: { alignSelf: 'flex-start' },
            onclick: () => change(() => { if (group.shared) delete group.shared; else group.shared = true; })
          }, h('span.track', { 'aria-hidden': 'true' }, h('span.knob')), `Use these ${SEARCH_BOXES[box].kicker} engines and the default on all profiles`),
          h('span.note', { id: 'engines-shared-note' }, group.shared
            ? 'Every profile uses this list and default for this box. Changes here apply to all of them.'
            : 'Off: this list and default belong to the profile in use only.'),
          h('div.engine-table', {},
            h('div.engine-row.head', { 'aria-hidden': 'true' }, h('span'), h('span', {}, 'DEFAULT'), h('span', {}, 'NAME'), h('span', {}, 'URL · %s = your search'), h('span')),
            ...rows),
          note
        ];
      };

      // ---------- Clocks ----------
      const clocksTab = () => {
        const zones = typeof Intl.supportedValuesOf === 'function' ? Intl.supportedValuesOf('timeZone') : [];
        const add = h('input.input.compact', { id: 'add-tz', type: 'text', placeholder: 'Add a time zone or city, e.g. PDT, CET or Paris', list: 'tz-list', style: { flex: 1, minWidth: 0, height: '44px' } });
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
          h('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', paddingBottom: '14px', borderBottom: '1px solid var(--divider)' } },
            h('span.field-label', {}, 'Main clock'),
            h('button.switch', {
              type: 'button', role: 'switch', 'aria-checked': String(draft.clocks.showSeconds),
              onclick: () => change(() => { draft.clocks.showSeconds = !draft.clocks.showSeconds; })
            }, h('span.track', { 'aria-hidden': 'true' }, h('span.knob')), 'Show seconds on the main clock')),
          h('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', paddingBottom: '14px', borderBottom: '1px solid var(--divider)' } },
            h('span.field-label', { id: 'hour-format' }, 'Time format'),
            segmented({
              labelledBy: 'hour-format', value: draft.clocks.hour12 ? '12' : '24',
              options: [{ value: '24', label: '24-hour' }, { value: '12', label: '12-hour' }],
              onChange: (value) => change(() => { draft.clocks.hour12 = value === '12'; })
            })),
          h('span.field-label', {}, 'World clocks'),
          world.length ? h('ul.list', {}, ...world.map((clock, i) => {
            const shown = clockLabel(clock, new Date());
            const city = h('input.input.tight', {
              type: 'text', value: clock.city, placeholder: clockLabel({ ...clock, city: '' }, new Date()),
              'aria-label': `Label for ${clock.tz}; leave empty to show the zone name`, style: { width: '180px', fontWeight: 700 },
              oninput: () => { clock.city = city.value; touch(); }
            });
            return h('li', { dataset: { sortRow: '' } },
              sortHandle({ item: clock, index: i, count: world.length, label: shown, onMove: (from, to) => change(() => { draft.clocks.world = moveItem(world, from, to); }) }),
              city,
              h('span.sub', { style: { flex: 1, fontSize: '13px', color: 'var(--muted)' } }, clock.tz),
              h('button.icon-btn', { type: 'button', 'aria-label': `Remove ${shown}`, onclick: () => change(() => { draft.clocks.world = world.filter((c) => c !== clock); }) }, icon('close')));
          })) : h('p.note', {}, 'No world clocks. Only the local clock is shown.'),
          h('div', { style: { display: 'flex', gap: '8px' } },
            h('label.sr-only', { for: 'add-tz' }, 'Add a time zone'),
            add,
            h('button.btn.outline', { type: 'button', onclick: addClock }, 'Add')),
          addMsg,
          h('datalist', { id: 'tz-list' },
            ...ZONE_ABBREVIATION_LIST.map(([name, tz]) => h('option', { value: name, label: tz })),
            ...zones.map((z) => h('option', { value: z })))
        ];
      };

      // ---------- Launchers ----------
      // ---------- Shortcuts ----------
      // The shortcut editor opens over Settings and edits the draft, so changes wait for Save.
      const shortcutsTab = () => {
        const list = draft.shortcuts;
        const add = h('button.btn.primary', { type: 'button', style: { alignSelf: 'flex-start' }, onclick: () => edit(null) }, 'Add shortcut');
        const edit = (id) => openShortcutEditor(id, {
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
          h('span.grow', {}, h('span.title', {}, item.name), h('span.sub', {}, `${item.category || 'No category'} · ${hostOf(item.url)}${item.shared ? ' · All profiles' : ''}`)),
          h('button.btn.quiet-outline', { type: 'button', 'aria-label': `Edit ${item.name} shortcut`, dataset: { editId: item.id }, onclick: () => edit(item.id) }, 'Edit'),
          h('button.icon-btn', {
            type: 'button', 'aria-label': `Remove ${item.name} shortcut`, title: 'Remove shortcut',
            onclick: () => {
              if (item.shared && !window.confirm(`${item.name} shows on all profiles. Remove it from every profile?`)) return;
              change(() => { draft.shortcuts = draft.shortcuts.filter((s) => s.id !== item.id); });
            }
          }, icon('trash', 16))));
        return [
          h('span.note', {}, 'Shortcuts show below the search boxes. Edit opens the same editor as the page; changes apply when you save.'),
          list.length ? h('ul.list', {}, ...items) : h('p.note', {}, 'No shortcuts yet.'),
          add
        ];
      };

      const launchersTab = () => {
        const groups = draft.launchers;
        const items = groups.map((group, i) => {
          const expanded = ui.expanded === group.id;
          const row = h(`li${expanded ? '.expanded' : ''}`, { dataset: { sortRow: '' } },
            sortHandle({ item: group, index: i, count: groups.length, label: group.name, onMove: (from, to) => change(() => { draft.launchers = moveItem(groups, from, to); }) }),
            iconButton({
              mark: h('span.badge.launcher-face', { 'aria-hidden': 'true', style: { width: '40px', height: '40px', fontSize: '13px', ...launcherFaceStyle(group.icon) } }, launcherMark(group)),
              label: `Change icon of ${group.name}`,
              onclick: () => openIconPicker({
                icon: group.icon, name: group.name, url: group.links[0]?.url || '',
                onApply: (next) => { change(() => { group.icon = next; }); panel.querySelector(`[data-icon-id="${CSS.escape(group.id)}"]`)?.focus(); }
              })
            }, { dataset: { iconId: group.id } }),
            h('span.grow', {}, h('span.title', {}, group.name), h('span.sub', {}, `${group.links.length} link${group.links.length === 1 ? '' : 's'}${group.shared ? ' · All profiles' : ''}`)),
            h('button.btn.quiet-outline', {
              type: 'button', 'aria-expanded': String(expanded), 'aria-label': `${expanded ? 'Close' : 'Edit'} ${group.name} launcher`,
              onclick: () => change(() => { ui.expanded = expanded ? null : group.id; })
            }, expanded ? 'Close' : 'Edit'),
            expanded ? h('button.icon-btn', {
              type: 'button', 'aria-label': `Remove ${group.name} launcher`, title: 'Remove launcher',
              onclick: () => {
                if (group.shared && !window.confirm(`${group.name} shows on all profiles. Remove it from every profile?`)) return;
                change(() => { draft.launchers = draft.launchers.filter((g) => g.id !== group.id); ui.expanded = null; });
              }
            }, icon('trash', 16)) : null,
            expanded ? launcherEditor(group) : null);
          return row;
        });
        return [
          h('span.note', {}, 'Launchers sit in the bottom dock. Hover or focus one to preview its links; click to pin it open.'),
          groups.length ? h('ul.list', {}, ...items) : h('p.note', {}, 'No launchers yet.'),
          h('button.btn.primary', {
            type: 'button', style: { alignSelf: 'flex-start' },
            onclick: () => change(() => {
              const fresh = blankLauncher();
              draft.launchers.push(fresh);
              ui.expanded = fresh.id;
            })
          }, 'Add launcher')
        ];
      };

      const launcherEditor = (group) => {
        const idBase = `ln-${group.id}`;
        const name = h('input.input.compact', { id: `${idBase}-name`, type: 'text', value: group.name, style: { width: '160px' }, oninput: () => { group.name = name.value; touch(); } });
        const links = group.links.map((link, i) => {
          const linkName = h('input.input.tight', { type: 'text', value: link.name, 'aria-label': 'Link name', oninput: () => { link.name = linkName.value; touch(); } });
          const linkUrl = h('input.input.tight', {
            type: 'url', value: link.url, 'aria-label': `${link.name || 'Link'} URL`, spellcheck: 'false', 'aria-invalid': String(!normalizeHttpUrl(link.url).ok),
            oninput: () => { link.url = linkUrl.value; linkUrl.setAttribute('aria-invalid', String(!normalizeHttpUrl(link.url).ok)); touch(); },
            onchange: () => { const check = normalizeHttpUrl(link.url); if (check.ok) { link.url = check.url; linkUrl.value = check.url; touch(); } }
          });
          return h('div.link-row', { dataset: { sortRow: '' } },
            sortHandle({ item: link, index: i, count: group.links.length, label: link.name || 'link', onMove: (from, to) => change(() => { group.links = moveItem(group.links, from, to); }) }),
            linkName, linkUrl,
            h('button.icon-btn.small', { type: 'button', 'aria-label': `Remove ${link.name}`, onclick: () => change(() => { group.links = group.links.filter((l) => l !== link); }) }, icon('close', 14, 2.2)));
        });
        // The icon is changed by clicking it in the launcher's row above.
        const sharedNote = h('span.note', { id: `${idBase}-shared-note` }, group.shared
          ? 'Appears on every profile. Changes and removing it apply to all of them.'
          : 'Off: this launcher belongs to the profile in use only.');
        return h('div.launcher-editor', {},
          h('div.inline', { style: { gap: '20px' } },
            h('div.inline', {}, h('label.field-label', { for: `${idBase}-name` }, 'Name'), name),
            h('button.switch', {
              type: 'button', role: 'switch', 'aria-checked': String(Boolean(group.shared)), 'aria-describedby': `${idBase}-shared-note`,
              onclick: () => change(() => { if (group.shared) delete group.shared; else group.shared = true; })
            }, h('span.track', { 'aria-hidden': 'true' }, h('span.knob')), 'Show on all profiles')),
          sharedNote,
          h('div.inline', { style: { justifyContent: 'space-between', marginTop: '4px' } },
            h('span.field-label', {}, 'Links'),
            h('button.btn.outline.small', {
              type: 'button',
              onclick: () => {
                change(() => { group.links.push({ name: '', url: '' }); });
                panel.querySelector('.launcher-editor .link-row:last-of-type input')?.focus();
              }
            }, icon('plus', 14, 2.2), 'Add link')),
          ...(links.length ? links : [h('p.note', {}, 'No links yet.')])
        );
      };

      // ---------- Layout ----------
      const layoutTab = () => {
        const blocks = draft.layout.blocks;
        const rows = h('input.input.compact', {
          id: 'g-rows', type: 'number', min: 1, max: 4, value: draft.layout.rows, style: { width: '72px' },
          onchange: () => { const n = Number.parseInt(rows.value, 10); change(() => { if (n >= 1 && n <= 4) draft.layout.rows = n; }); }
        });
        const cols = h('input.input.compact', {
          id: 'g-cols', type: 'number', min: 4, max: 12, value: draft.layout.perRow, style: { width: '72px' },
          onchange: () => { const n = Number.parseInt(cols.value, 10); change(() => { if (n >= 4 && n <= 12) draft.layout.perRow = n; }); }
        });
        return [
          h('span.note', {}, 'Order of blocks in the main column. The launcher dock stays at the bottom.'),
          h('ol.block-list', {}, ...blocks.map((block, i) => h('li', { dataset: { sortRow: '' } },
            sortHandle({ item: block, index: i, count: blocks.length, label: BLOCKS[block], onMove: (from, to) => change(() => { draft.layout.blocks = moveItem(blocks, from, to); }) }),
            h('span.num', {}, String(i + 1).padStart(2, '0')),
            h('span.title', {}, BLOCKS[block])))),
          h('div.form-grid', { style: { gap: '12px 16px', paddingTop: '14px', borderTop: '1px solid var(--divider)' } },
            h('span.field-label', { id: 'lbl-rows' }, 'Shortcut rows'),
            h('div.inline', { style: { gap: '10px' } },
              segmented({
                labelledBy: 'lbl-rows', value: draft.layout.rows,
                options: [{ value: 1, label: '1 row' }, { value: 2, label: '2 rows' }],
                onChange: (value) => change(() => { draft.layout.rows = value; })
              }),
              h('label.note', { for: 'g-rows' }, 'or'),
              rows),
            h('label.field-label', { for: 'g-cols' }, 'Per row'),
            h('div.inline', { style: { gap: '10px' } }, cols, h('span.note', {}, `Up to ${draft.layout.rows * draft.layout.perRow} shortcuts per page`)),
            h('span.field-label', {}, 'Categories'),
            h('button.switch', {
              type: 'button', role: 'switch', 'aria-checked': String(draft.layout.showCategories), style: { justifySelf: 'start' },
              onclick: () => change(() => { draft.layout.showCategories = !draft.layout.showCategories; })
            }, h('span.track', { 'aria-hidden': 'true' }, h('span.knob')), 'Show the category row (with Edit and Add) above shortcuts'))
        ];
      };

      // ---------- Data ----------
      const dataTab = () => {
        const meta = FORMATS[ui.format];
        const fileName = `start-page-${activeProfile().name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'profile'}.${meta.ext}`;
        return [
          h('span.note', {}, `Everything is stored in this browser. Export a backup of the ${activeProfile().name} profile, or import one into it.`),
          h('div', { style: { display: 'flex', flexDirection: 'column', gap: '8px' } },
            h('span.field-label', { id: 'lbl-fmt' }, 'Export format'),
            segmented({
              labelledBy: 'lbl-fmt', value: ui.format, className: 'wide',
              options: Object.entries(FORMATS).map(([key, f]) => ({ value: key, label: f.label })),
              onChange: (value) => change(() => { ui.format = value; })
            })),
          h('div.inline', {},
            h('button.btn.primary', {
              type: 'button',
              onclick: () => {
                const blob = new Blob([serialize(store.settings, ui.format)], { type: meta.mime });
                const link = h('a', { href: URL.createObjectURL(blob), download: fileName });
                document.body.append(link);
                link.click();
                link.remove();
                setTimeout(() => URL.revokeObjectURL(link.href), 1000);
                toast(`Exported ${fileName}`);
              }
            }, `Export ${fileName}`),
            h('button.btn.outline', {
              type: 'button',
              onclick: () => {
                if (dirty() && !window.confirm('Discard unsaved settings changes and import a file?')) return;
                pickImportFile();
              }
            }, 'Import file…')),
          h('span.note', {}, dirty() ? 'Export uses your saved settings. Save first to include unsaved changes.' : 'Imports accept JSON, YAML, TOML or text, and are checked before anything changes.'),
          h('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', paddingTop: '14px', borderTop: '1px solid var(--divider)' } },
            h('span', { style: { display: 'flex', flexDirection: 'column' } }, h('span.field-label', {}, 'Search history'), h('span.note', {}, 'Used for suggestions, kept on this device.')),
            h('button.btn.outline', { type: 'button', onclick: () => { clearHistory(); toast('Search history cleared'); } }, 'Clear history'))
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
        tabs,
        panel,
        h('div.dialog-foot', {}, status, discard, save)
      );
      showProfile();
      renderTabs();
      renderPanel();
      if (ui.expanded) panel.querySelector('.launcher-editor input')?.focus();
    }
  });
}
