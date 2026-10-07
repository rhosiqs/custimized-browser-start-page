// Import flow: pick a backup file, show what will change and what was repaired or skipped, then merge or replace.
import { FORMATS, countItems, detectFormat, mergeSettings, normalizeSettings, parseBackup } from './core.js';
import { h, icon, showModal } from './dom.js';
import { store, update } from './state.js';
import { toast } from './widgets.js';

export function pickImportFile() {
  const input = h('input', {
    type: 'file', accept: '.json,.yaml,.yml,.toml,.txt,application/json,text/plain', style: { display: 'none' },
    onchange: async () => {
      const file = input.files?.[0];
      input.remove();
      if (!file) return;
      if (file.size > 20 * 1024 * 1024) return toast('That file is too large to import.');
      const source = await file.text();
      reviewImport({ name: file.name, size: file.size, source });
    }
  });
  document.body.append(input);
  input.click();
}

function formatSize(bytes) {
  return bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(1)} KB`;
}

export function reviewImport({ name, size, source }) {
  const format = detectFormat(name, source);
  let raw = null;
  let error = '';
  try {
    raw = parseBackup(source, format);
  } catch (err) {
    error = err.message;
  }
  // Replace starts from defaults; merge starts from the current settings so sections missing from the file stay as they are.
  const replaced = raw ? normalizeSettings(raw) : { settings: null, report: { fixed: [], skipped: [] } };
  const { report } = replaced;
  const incoming = replaced.settings;
  const counts = countItems(raw ? {
    ...raw,
    shortcuts: Array.isArray(raw.shortcuts) ? incoming.shortcuts : undefined,
    launchers: Array.isArray(raw.launchers) ? incoming.launchers : undefined,
    clocks: Array.isArray(raw.clocks?.world) ? incoming.clocks : undefined
  } : {});
  const total = counts.shortcuts + counts.launchers + counts.clocks + counts.settings;
  let mode = 'merge';

  showModal({
    labelledBy: 'imp-title',
    className: 'import',
    build(dialog, close) {
      const reportList = (kind, title, iconName, rows) => rows.length ? h(`div.report.${kind}`, {},
        h('h2', {}, icon(iconName, 16, 2.2), `${title} · ${rows.length}`),
        h('ul.list', {}, ...rows.map((row) => h('li', {}, h('span', {}, row.item), h('span', {}, kind === 'fixed' ? `→ ${row.result}` : row.reason))))) : null;

      const modeOption = (value, title, note) => h('label.mode', {},
        h('input', { type: 'radio', name: 'import-mode', value, checked: mode === value, onchange: () => { mode = value; } }),
        h('span.grow', {}, h('strong', {}, title), h('span.note', {}, note)));

      const body = error
        ? [h('p.msg.bad', { role: 'alert' }, icon('alert', 16, 2.2), error)]
        : [
          h('div.stats', {},
            ...[[counts.shortcuts, 'Shortcuts'], [counts.launchers, 'Launcher groups'], [counts.clocks, 'World clocks'], [counts.settings, 'Settings set']]
              .map(([n, label]) => h('div.stat', {}, h('strong', {}, n), h('span', {}, label)))),
          reportList('fixed', 'Fixed automatically', 'check', report.fixed),
          reportList('skipped', 'Skipped', 'skip', report.skipped),
          h('fieldset.plain', { style: { gap: '8px' } },
            h('legend', {}, 'How to apply'),
            modeOption('merge', 'Merge', 'Add what is new and restore matching shortcuts and launchers from the file; nothing is removed. Appearance and search settings come from the file.'),
            modeOption('replace', 'Replace', 'Clear the page first. Export a backup before you do this.'))
        ];

      const apply = h('button.btn.primary', {
        type: 'button', disabled: Boolean(error) || !total,
        onclick: () => {
          const next = mode === 'replace' ? incoming : mergeSettings(store.settings, normalizeSettings(raw, { fallback: store.settings }).settings);
          update(next);
          close();
          toast(mode === 'replace' ? 'Settings replaced from file' : 'Import merged');
        }
      }, error ? 'Import' : `Import ${total} item${total === 1 ? '' : 's'}`);

      dialog.append(
        h('div.dialog-head', {},
          h('div.titles', {},
            h('span.kicker', {}, 'IMPORT'),
            h('h1', { id: 'imp-title' }, 'Review before importing'),
            h('span.sub', {}, `${name} · read as ${FORMATS[format].label} · ${formatSize(size)}`)),
          h('button.close-btn', { type: 'button', 'aria-label': 'Close', onclick: close }, icon('close'))),
        h('div.dialog-body', {}, ...body),
        h('div.dialog-foot', {}, h('button.btn', { type: 'button', onclick: close }, 'Cancel'), apply)
      );
    }
  });
}
