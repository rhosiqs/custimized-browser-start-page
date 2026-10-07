// Settings dialog. Edits stay in a draft until Save; appearance changes preview live and revert on Discard or close.
import {
  ACCENTS, BACKGROUND_IMAGE_LIMIT, BLOCKS, FORMATS, SEARCH_BOXES, SHORTCUT_IMAGE_LIMIT, SWATCHES,
  ZONE_ABBREVIATION_LIST, clockLabel, clone, createId, firstGraphemes, isValidEngineUrl, isValidTimeZone, moveItem, normalizeHex, normalizeHttpUrl, serialize, zoneFromAbbreviation
} from './core.js';
import { applyAppearance } from './appearance.js';
import { h, icon, readImageFile, segmented, showModal } from './dom.js';
import { pickImportFile } from './import-review.js';
import { clearHistory, store, update } from './state.js';
import { launcherMark, swatchPicker, toast } from './widgets.js';

const TABS = ['Appearance', 'Search', 'Clocks', 'Launchers', 'Layout', 'Data'];
const PRESETS = ['#f3f2f2', '#eae9e9', '#fff3e4', '#ffe3bf', '#e8f3ea', '#1d1c1b'];

export function openSettings({ tab = 'Appearance', launcherId = null, addLauncher = false } = {}) {
  const ui = { tab, engineBox: 'web', format: 'json', expanded: launcherId, saved: clone(store.settings) };
  let draft = clone(store.settings);
  if (addLauncher) {
    const fresh = { id: createId('ln'), name: 'New launcher', icon: 'N', color: 'green', image: '', links: [] };
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
        const builders = { Appearance: appearanceTab, Search: searchTab, Clocks: clocksTab, Launchers: launchersTab, Layout: layoutTab, Data: dataTab };
        const scroll = panel.scrollTop;
        panel.replaceChildren(...[builders[ui.tab]()].flat());
        panel.scrollTop = scroll;
        touch();
      };

      // Re-render the panel after a structural change; text edits only call touch().
      const change = (fn) => { fn(); renderPanel(); };

      // ---------- Appearance ----------
      const appearanceTab = () => {
        const bg = draft.background;
        const grid = h('div.form-grid', {},
          h('span.field-label', { id: 'lbl-theme' }, 'Theme'),
          segmented({
            labelledBy: 'lbl-theme', value: draft.theme,
            options: [{ value: 'light', label: 'Light' }, { value: 'dark', label: 'Dark' }, { value: 'system', label: 'System' }],
            onChange: (value) => change(() => { draft.theme = value; })
          }),
          h('span.field-label', { id: 'lbl-acc' }, 'Accent'),
          h('div.swatches', { role: 'group', 'aria-labelledby': 'lbl-acc' }, ...Object.entries(ACCENTS).map(([key, accent]) => h('button.swatch', {
            type: 'button', 'aria-label': accent.label, 'aria-pressed': String(draft.accent === key),
            onclick: () => change(() => { draft.accent = key; })
          }, h('span', { style: { background: accent.preview } })))),
          h('span.field-label', { id: 'lbl-bg' }, 'Background'),
          segmented({
            labelledBy: 'lbl-bg', value: bg.type,
            options: [
              { value: 'solid', content: [h('span.bg-preview', { 'aria-hidden': 'true', style: { background: bg.solid || 'var(--bg)' } }), 'Solid'] },
              { value: 'gradient', content: [h('span.bg-preview', { 'aria-hidden': 'true', style: { background: `linear-gradient(165deg, ${bg.from}, ${bg.to})` } }), 'Gradient'] },
              { value: 'image', content: [h('span.bg-preview', { 'aria-hidden': 'true', style: { background: 'repeating-linear-gradient(45deg, var(--surface) 0 8px, var(--control) 8px 9px)' } }), 'Image'] }
            ],
            onChange: (value) => change(() => { bg.type = value; })
          })
        );
        if (bg.type === 'solid') {
          grid.append(...colorPicker('solid', 'Color'));
        } else if (bg.type === 'gradient') {
          grid.append(...colorPicker('from', 'Start'), ...colorPicker('to', 'End'));
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

      const colorPicker = (key, label) => {
        const bg = draft.background;
        const id = `hex-${key}`;
        const value = bg[key];
        const msg = h('span.msg.bad', { id: `${id}-msg`, hidden: true, style: { flexBasis: '100%', fontSize: '12px' } }, 'Use #RGB or #RRGGBB, for example #f3f2f2.');
        const text = h('input.input.compact', {
          id, type: 'text', value: value || '', placeholder: key === 'solid' ? 'Theme' : '', maxlength: 7, spellcheck: 'false', autocomplete: 'off',
          'aria-describedby': `${id}-msg`, style: { width: '104px', letterSpacing: '0.06em' },
          oninput: () => {
            let v = text.value.trim();
            if (v && v[0] !== '#') v = `#${v}`;
            const hex = normalizeHex(v);
            const empty = key === 'solid' && !v;
            text.setAttribute('aria-invalid', String(!hex && !empty));
            msg.hidden = Boolean(hex || empty);
            if (hex || empty) { bg[key] = hex; picker.value = hex || '#f3f2f2'; touch(); }
          }
        });
        const picker = h('input.color-input', {
          type: 'color', 'aria-label': `${label} color picker`, value: value || '#f3f2f2',
          oninput: () => { bg[key] = picker.value; text.value = picker.value; touch(); },
          onchange: () => renderPanel()
        });
        return [
          h('label.field-label', { for: id }, label),
          h('div.inline', {},
            picker, text,
            h('div.swatches', { role: 'group', 'aria-label': `${label} suggestions`, style: { marginLeft: '6px', gap: '2px' } },
              ...PRESETS.map((hex) => h('button.swatch.tiny', {
                type: 'button', 'aria-label': hex, 'aria-pressed': String(value === hex),
                onclick: () => change(() => { bg[key] = hex; })
              }, h('span', { style: { background: hex } })))),
            key === 'solid' && value ? h('button.btn.small', { type: 'button', onclick: () => change(() => { bg.solid = ''; }) }, 'Use theme color') : null,
            msg)
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
          return h(`div.engine-row${group.default === engine.id ? '.is-default' : ''}`, {},
            h('div', { style: { display: 'flex' } },
              h('button.icon-btn.small', { type: 'button', 'aria-label': `Move ${engine.name} up`, disabled: i === 0, onclick: () => change(() => { group.list = moveItem(list, i, i - 1); }) }, icon('chevronUp', 14, 2.2)),
              h('button.icon-btn.small', { type: 'button', 'aria-label': `Move ${engine.name} down`, disabled: i === list.length - 1, onclick: () => change(() => { group.list = moveItem(list, i, i + 1); }) }, icon('chevronDown', 14, 2.2))),
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
          h('div.engine-table', {},
            h('div.engine-row.head', { 'aria-hidden': 'true' }, h('span', {}, 'ORDER'), h('span', {}, 'DEFAULT'), h('span', {}, 'NAME'), h('span', {}, 'URL · %s = your search'), h('span')),
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
            return h('li', {},
              h('button.icon-btn.small', { type: 'button', 'aria-label': `Move ${shown} up`, disabled: i === 0, onclick: () => change(() => { draft.clocks.world = moveItem(world, i, i - 1); }) }, icon('chevronUp', 14, 2.2)),
              h('button.icon-btn.small', { type: 'button', 'aria-label': `Move ${shown} down`, disabled: i === world.length - 1, onclick: () => change(() => { draft.clocks.world = moveItem(world, i, i + 1); }) }, icon('chevronDown', 14, 2.2)),
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
      const launchersTab = () => {
        const groups = draft.launchers;
        const items = groups.map((group, i) => {
          const expanded = ui.expanded === group.id;
          const row = h(`li${expanded ? '.expanded' : ''}`, {},
            h('div', { style: { display: 'flex', flexDirection: 'column' } },
              h('button.icon-btn.small', { type: 'button', 'aria-label': `Move ${group.name} up`, disabled: i === 0, onclick: () => change(() => { draft.launchers = moveItem(groups, i, i - 1); }) }, icon('chevronUp', 14, 2.2)),
              h('button.icon-btn.small', { type: 'button', 'aria-label': `Move ${group.name} down`, disabled: i === groups.length - 1, onclick: () => change(() => { draft.launchers = moveItem(groups, i, i + 1); }) }, icon('chevronDown', 14, 2.2))),
            h('span.badge', { 'aria-hidden': 'true', style: { width: '40px', height: '40px', fontSize: '13px', background: SWATCHES[group.color].fill, color: SWATCHES[group.color].fg } }, launcherMark(group)),
            h('span.grow', {}, h('span.title', {}, group.name), h('span.sub', {}, `${group.links.length} link${group.links.length === 1 ? '' : 's'}`)),
            h('button.btn.quiet-outline', {
              type: 'button', 'aria-expanded': String(expanded), 'aria-label': `${expanded ? 'Close' : 'Edit'} ${group.name} launcher`,
              onclick: () => change(() => { ui.expanded = expanded ? null : group.id; })
            }, expanded ? 'Close' : 'Edit'),
            expanded ? launcherEditor(group) : null);
          return row;
        });
        return [
          h('span.note', {}, 'Launchers sit in the bottom dock. Hover or focus one to preview its links; click to pin it open.'),
          groups.length ? h('ul.list', {}, ...items) : h('p.note', {}, 'No launchers yet.'),
          h('button.btn.primary', {
            type: 'button', style: { alignSelf: 'flex-start' },
            onclick: () => change(() => {
              const fresh = { id: createId('ln'), name: 'New launcher', icon: 'N', color: 'green', image: '', links: [] };
              draft.launchers.push(fresh);
              ui.expanded = fresh.id;
            })
          }, 'Add launcher')
        ];
      };

      const launcherEditor = (group) => {
        const idBase = `ln-${group.id}`;
        const name = h('input.input.compact', { id: `${idBase}-name`, type: 'text', value: group.name, oninput: () => { group.name = name.value; touch(); } });
        // Up to 3 characters as people see them, so an emoji counts as one.
        const mark = h('input.input.compact', {
          id: `${idBase}-icon`, type: 'text', value: group.icon, style: { width: '72px' }, 'aria-describedby': `${idBase}-icon-note`,
          oninput: () => { group.icon = firstGraphemes(mark.value.trim(), 3) || group.name.charAt(0).toUpperCase(); touch(); },
          onchange: () => { mark.value = group.icon; }
        });
        const imageMsg = h('span.note', { id: `${idBase}-icon-note`, 'aria-live': 'polite' },
          group.image ? 'The image fills the launcher in place of the label.' : 'Letters or an emoji, up to 3. Or choose an image (up to 512 KB).');
        const imageControls = h('div.inline', { style: { gap: '8px' } },
          h('label.btn.file-btn.round.small', {}, icon('upload', 14, 2.2), group.image ? 'Change image' : 'Choose image',
            h('input', {
              type: 'file', accept: 'image/png,image/jpeg,image/webp,image/svg+xml,image/gif', 'aria-describedby': `${idBase}-icon-note`,
              onchange: async (event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                try {
                  const image = await readImageFile(file, SHORTCUT_IMAGE_LIMIT);
                  change(() => { group.image = image; });
                } catch (error) {
                  imageMsg.textContent = error.message;
                }
              }
            })),
          group.image ? h('button.btn.small', { type: 'button', onclick: () => change(() => { group.image = ''; }) }, icon('trash', 14), 'Remove image') : null);
        const links = group.links.map((link, i) => {
          const linkName = h('input.input.tight', { type: 'text', value: link.name, 'aria-label': 'Link name', oninput: () => { link.name = linkName.value; touch(); } });
          const linkUrl = h('input.input.tight', {
            type: 'url', value: link.url, 'aria-label': `${link.name || 'Link'} URL`, spellcheck: 'false', 'aria-invalid': String(!normalizeHttpUrl(link.url).ok),
            oninput: () => { link.url = linkUrl.value; linkUrl.setAttribute('aria-invalid', String(!normalizeHttpUrl(link.url).ok)); touch(); },
            onchange: () => { const check = normalizeHttpUrl(link.url); if (check.ok) { link.url = check.url; linkUrl.value = check.url; touch(); } }
          });
          return h('div.link-row', {},
            h('div', { style: { display: 'flex' } },
              h('button.icon-btn.small', { type: 'button', 'aria-label': `Move ${link.name} up`, disabled: i === 0, onclick: () => change(() => { group.links = moveItem(group.links, i, i - 1); }) }, icon('chevronUp', 14, 2.2)),
              h('button.icon-btn.small', { type: 'button', 'aria-label': `Move ${link.name} down`, disabled: i === group.links.length - 1, onclick: () => change(() => { group.links = moveItem(group.links, i, i + 1); }) }, icon('chevronDown', 14, 2.2))),
            linkName, linkUrl,
            h('button.icon-btn.small', { type: 'button', 'aria-label': `Remove ${link.name}`, onclick: () => change(() => { group.links = group.links.filter((l) => l !== link); }) }, icon('close', 14, 2.2)));
        });
        return h('div.launcher-editor', {},
          h('div.inline', { style: { gap: '16px' } },
            h('div.field-group', {}, h('label.field-label', { for: `${idBase}-name` }, 'Name'), name),
            h('div.field-group', {}, h('label.field-label', { for: `${idBase}-icon` }, 'Label'), mark),
            h('div.field-group', {}, h('span.field-label', {}, 'Image'), imageControls),
            h('div.field-group', {}, h('span.field-label', {}, 'Color'), swatchPicker({ value: group.color, size: 'small', label: `${group.name} color`, onChange: (color) => change(() => { group.color = color; }) }))),
          imageMsg,
          h('span.field-label', {}, 'Links'),
          ...(links.length ? links : [h('p.note', {}, 'No links yet.')]),
          h('div.inline', {},
            h('button.btn.outline.small', {
              type: 'button',
              onclick: () => {
                change(() => { group.links.push({ name: '', url: '' }); });
                panel.querySelector('.launcher-editor .link-row:last-of-type input')?.focus();
              }
            }, icon('plus', 14, 2.2), 'Add link'),
            h('span', { style: { flex: 1 } }),
            h('button.btn.small', {
              type: 'button',
              onclick: () => change(() => { draft.launchers = draft.launchers.filter((g) => g.id !== group.id); ui.expanded = null; })
            }, icon('trash', 14), 'Remove launcher'))
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
          h('ol.block-list', {}, ...blocks.map((block, i) => h('li', {},
            h('span.num', {}, String(i + 1).padStart(2, '0')),
            h('span.title', {}, BLOCKS[block]),
            h('button.icon-btn', { type: 'button', 'aria-label': `Move ${BLOCKS[block]} up`, disabled: i === 0, onclick: () => change(() => { draft.layout.blocks = moveItem(blocks, i, i - 1); }) }, icon('chevronUp')),
            h('button.icon-btn', { type: 'button', 'aria-label': `Move ${BLOCKS[block]} down`, disabled: i === blocks.length - 1, onclick: () => change(() => { draft.layout.blocks = moveItem(blocks, i, i + 1); }) }, icon('chevronDown'))))),
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
            h('div.inline', { style: { gap: '10px' } }, cols, h('span.note', {}, `Up to ${draft.layout.rows * draft.layout.perRow} shortcuts per page`)))
        ];
      };

      // ---------- Data ----------
      const dataTab = () => {
        const meta = FORMATS[ui.format];
        const fileName = `start-page.${meta.ext}`;
        return [
          h('span.note', {}, 'Everything is stored in this browser. Export a backup or move it to another device.'),
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
          h('div.titles', {}, h('span.kicker', {}, 'START PAGE'), h('h1', { id: 'set-title' }, 'Settings')),
          h('button.close-btn', { type: 'button', 'aria-label': 'Close settings', onclick: requestClose }, icon('close'))),
        tabs,
        panel,
        h('div.dialog-foot', {}, status, discard, save)
      );
      renderTabs();
      renderPanel();
      if (ui.expanded) panel.querySelector('.launcher-editor input')?.focus();
    }
  });
}
